import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib

import torch
from torch.utils.data import Dataset, DataLoader

df_white = pd.read_csv("./backend/db/chess/db_white_processed.csv")
df_black = pd.read_csv("./backend/db/chess/db_black_processed.csv")

user_df = pd.read_csv("./backend/datasets/chess/user_features.csv")
inter_df = pd.read_csv("./backend/datasets/chess/interactions.csv")

user_le = LabelEncoder()
item_le = LabelEncoder()
inter_df['user_idx'] = user_le.fit_transform(inter_df['user_id'])
inter_df['item_id'] = inter_df['color'] + '_' + inter_df['opening_id'].astype(str)
inter_df['item_idx'] = item_le.fit_transform(inter_df['item_id'])
inter_df['interaction_score'] = inter_df['interaction_score'] / 0.8 + 0.2


# get user / item style tensor
user_style_arr = []
user_style_map = user_df.set_index('user_id')[['popularity', 'sharpness']].to_dict('index')
for u_id in user_le.classes_:
    style = user_style_map.get(u_id)
    user_style_arr.append([style['popularity'], style['sharpness']])
user_style_tensor = torch.tensor(user_style_arr, dtype=torch.float)

item_style_arr = []
item_style_map = {}
for i_id in item_le.classes_:
    color, id = i_id.split('_')
    id = int(id)
    if color == "white": op = df_white[df_white["id"] == id].iloc[0].to_dict()
    else: op = df_black[df_black["id"] == id].iloc[0].to_dict()
    item_style_map[i_id] = [op['popularity'], op['sharpness']]
    item_style_arr.append([op['popularity'], op['sharpness']])
item_style_tensor = torch.tensor(item_style_arr, dtype=torch.float)


# negative sampling
def get_negative_samples(inter_df, n_neg=4):
    user_item_set = inter_df.groupby('user_idx')['item_idx'].apply(set).to_dict()
    all_items = inter_df['item_idx'].unique()
    
    neg_data = []
    for u_idx, pos_items in user_item_set.items():
        count = 0
        while count < len(pos_items) * n_neg:
            neg_item = np.random.choice(all_items)
            if neg_item not in pos_items:
                neg_data.append([u_idx, neg_item, 0.0])
                count += 1
    
    return pd.DataFrame(neg_data, columns=['user_idx', 'item_idx', 'interaction_score'])

neg_df = get_negative_samples(inter_df)
full_df = pd.concat([inter_df[['user_idx', 'item_idx', 'interaction_score']], neg_df], ignore_index=True)
user_item_matrix = inter_df.pivot(index='user_idx', columns='item_idx', values='interaction_score').fillna(0)

class ChessDataset(Dataset):
    def __init__(self, df, user_item_matrix, user_style, item_style):
        self.df = df
        self.matrix = torch.tensor(user_item_matrix.values, dtype=torch.float32)
        self.user_style = user_style
        self.item_style = item_style

    def __len__(self): return len(self.df)
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        u_idx = int(row['user_idx'])
        i_idx = int(row['item_idx'])
        y = torch.tensor(row['interaction_score'], dtype=torch.float32)

        u_hist = self.matrix[u_idx].clone()
        u_hist[i_idx] = 0

        return u_hist, i_idx, self.user_style[u_idx], self.item_style[i_idx], y
    
train_df, val_df = train_test_split(full_df, test_size=0.2, random_state=42)
train_dataloader = DataLoader(
    ChessDataset(train_df, user_item_matrix, user_style_tensor, item_style_tensor), 
    batch_size=64, shuffle=True
)

val_dataloader = DataLoader(
    ChessDataset(val_df, user_item_matrix, user_style_tensor, item_style_tensor), 
    batch_size=64, shuffle=False
)

joblib.dump(item_le, "./backend/db/chess/item_le.pkl")
torch.save(item_style_tensor, "./backend/db/chess/item_style_tensor.pt")
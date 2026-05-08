import requests
import json
import time
import pandas as pd
import numpy as np
import chess
from tqdm import tqdm

import os
from dotenv import load_dotenv
load_dotenv("./backend/dev/chess/.env.chess")
TOKEN = os.environ.get("API_TOKEN")

def get_data(url, header={"Accept": "application/x-ndjson", "Authorization": f"Bearer {TOKEN}"}):
    res = requests.get(url, headers=header)
    t = 0
    while res.status_code == 429:
        time.sleep(1)
        res = requests.get(url, headers=header)
        t += 1
        if t > 60:
            break
    return res


df_white = pd.read_csv("./backend/db/chess/db_white_processed.csv")
df_black = pd.read_csv("./backend/db/chess/db_black_processed.csv")
with open("./backend/db/chess/stats_white.json", "r") as f:
    stats_white = json.load(f)
with open("./backend/db/chess/stats_black.json", "r") as f:
    stats_black = json.load(f) 


def get_high_rated_users(seed_username, min_rating=2000):
    url = f"https://lichess.org/api/games/user/{seed_username}?max=300&perfType=blitz,rapid,classical"
    res = get_data(url)
    
    users = set()
    for line in res.iter_lines():
        if line:
            game = json.loads(line)
            for color in ['white', 'black']:
                user_info = game['players'][color]
                if user_info['user']['id'] != seed_username and user_info.get('rating', 0) >= min_rating:
                    users.add(user_info['user']['id'])
    return list(users)


def analyze_user_for_dataset(username, max_games=200):
    url = f"https://lichess.org/api/games/user/{username}?max={max_games}&rated=true&perfType=blitz,rapid,classical"
    res = get_data(url)
    
    opening_stats = {"white": {}, "black": {}}
    popularity_scores = []
    sharpness_scores = []
    analyzed_count = 0

    for line in res.iter_lines():
        if not line: continue
        data = json.loads(line)
        
        my_color = "white" if data["players"]["white"]["user"]["id"].lower() == username.lower() else "black"
        winner = data.get("winner", "draws")
        score = 1 if winner == my_color else (0.5 if winner == "draws" else 0)

        search_df = df_white if my_color == "white" else df_black
        ss = stats_white if my_color == "white" else stats_black
        
        moves_list = data["moves"].split()
        board = chess.Board()
        found_openings = []
        try:
            for depth in range(min(12, len(moves_list))):
                board.push_san(moves_list[depth])
                if (depth % 2 == 0 and my_color == "white") or (depth % 2 == 1 and my_color == "black"):
                    fen = board.fen()
                    match = search_df[search_df["fen"] == fen]
                    if not match.empty:
                        op_info = match.iloc[0]
                        found_openings.append(op_info)
        except: continue

        if found_openings:
            valid_ops = [o for o in found_openings if o["unshow"] != 1]
            if valid_ops:
                main_op = valid_ops[0]
                op_id = main_op["id"]
                
                # Popularity Z-score
                pop_z = sum((o["popularity"] - ss["popularity_ss"][0]) / ss["popularity_ss"][1] for o in found_openings) / len(found_openings)
                popularity_scores.append(pop_z)
                
                # Sharpness Z-score
                last_op = found_openings[-1]
                sharp_z = (last_op["sharpness"] - ss["sharpness_ss"][0]) / ss["sharpness_ss"][1]
                sharpness_scores.append(sharp_z)
                
                if op_id not in opening_stats[my_color]:
                    opening_stats[my_color][op_id] = {"count": 0, "score_sum": 0}
                opening_stats[my_color][op_id]["count"] += 1
                opening_stats[my_color][op_id]["score_sum"] += score
                
                analyzed_count += 1

    if analyzed_count == 0: return None, None

    user_style = {
        "popularity": sum(popularity_scores) / (analyzed_count ** 0.84),
        "sharpness": sum(sharpness_scores) / (analyzed_count ** 0.73)
    }
    
    return user_style, opening_stats


def collect_ncf_dataset(seed_users, target_count):
    
    processed_users = set()
    user_features = []
    interactions = []

    target = set()
    for seed in seed_users:
        opponents = get_high_rated_users(seed, min_rating=2000)
        target.update(opponents)
    
    print("target collected:", len(target))

    pbar = tqdm(total=min(target_count, len(target)))
    for username in list(target):
        if len(processed_users) >= target_count:
            break

        try:   
            style, stats = analyze_user_for_dataset(username, max_games=200)
            if style and stats:
                # user_features.csv
                user_features.append({
                    "user_id": username,
                    "popularity": style["popularity"],
                    "sharpness": style["sharpness"],
                    "games_count": sum(opt["count"] for color in stats for opt in stats[color].values())
                })

                # interactions.csv
                for color in ["white", "black"]:
                    search_df = df_white if color=="white" else df_black
                    for op_id, opt in stats[color].items():

                        if opt["count"] >= 3:
                            win_rate = opt["score_sum"] / opt["count"]
                            sr = search_df[search_df["id"] == op_id].iloc[0]["selection_rate"]
                            score = np.log1p(opt["count"] / (sr + 0.0001)) * (win_rate + 0.5)
                            
                            interactions.append({
                                "user_id": username,
                                "opening_id": op_id,
                                "color": color,
                                "play_count": opt["count"],
                                "win_rate": win_rate,
                                "interaction_score": score
                            })
                
                processed_users.add(username)
                pbar.update(1)
        except Exception as e:
            continue

    pbar.close()

    df_u = pd.DataFrame(user_features)
    df_i = pd.DataFrame(interactions)
    df_i['interaction_score'] = df_i.groupby('user_id')['interaction_score'].transform(lambda x: x / x.max())
    
    df_u.to_csv("./backend/datasets/chess/user_features.csv", index=False)
    df_i.to_csv("./backend/datasets/chess/interactions.csv", index=False)
    
    print("data collected successfully")


seeds = ["rebeccaharris", "kimchimaster", "remit_01", "haridaskesavan", "muhiborj"]
collect_ncf_dataset(seeds, target_count=1000)
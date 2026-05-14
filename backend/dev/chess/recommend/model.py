import torch
import torch.nn as nn

class ChessNCF(nn.Module):
    def __init__(self, num_items, style_dim=2, factor_num=32, alpha=0.6):
        super(ChessNCF, self).__init__()

        self.user_encoder_GMF = nn.Sequential(
            nn.Linear(num_items, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, factor_num)
        )
        self.user_encoder_MLP = nn.Sequential(
            nn.Linear(num_items, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, factor_num)
        )
        
        self.embed_item_GMF = nn.Embedding(num_items, factor_num)
        self.embed_item_MLP = nn.Embedding(num_items, factor_num)
        
        mlp_input_dim = (factor_num * 2) + (style_dim * 2)
        self.mlp_layers = nn.Sequential(
            nn.Linear(mlp_input_dim, 64, bias=False),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Linear(64, 16, bias=False),
            nn.BatchNorm1d(16),
            nn.ReLU(),
        )
        self.prediction_layer = nn.Linear(factor_num + 16, 1)
        self.sigmoid = nn.Sigmoid()
        self.alpha = alpha

    def forward(self, user_hist, item_indices, user_style, item_style):
        u_gmf = self.user_encoder_GMF(user_hist)
        u_mlp = self.user_encoder_MLP(user_hist)

        i_gmf = self.embed_item_GMF(item_indices)
        i_mlp = self.embed_item_MLP(item_indices)

        # GMF Path
        gmf_output = u_gmf * i_gmf
        
        # MLP Path
        mlp_input = torch.cat([u_mlp, i_mlp, user_style, item_style], dim=-1)
        mlp_output = self.mlp_layers(mlp_input)
        
        # concat
        combined = torch.cat([self.alpha*gmf_output, (1-self.alpha)*mlp_output], dim=-1)
        prediction = self.prediction_layer(combined)
        return self.sigmoid(prediction).view(-1)
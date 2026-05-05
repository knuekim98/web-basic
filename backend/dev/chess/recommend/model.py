import torch
import torch.nn as nn

class ChessNCF(nn.Module):
    def __init__(self, num_items, style_dim=2, factor_num=32):
        super(ChessNCF, self).__init__()

        self.user_encoder = nn.Sequential(
            nn.Linear(num_items, 128),
            nn.ReLU(),
            nn.Linear(128, factor_num)
        )
        
        self.embed_item_GMF = nn.Embedding(num_items, factor_num)
        self.embed_item_MLP = nn.Embedding(num_items, factor_num)
        
        mlp_input_dim = (factor_num * 2) + (style_dim * 2)
        self.mlp_layers = nn.Sequential(
            nn.Linear(mlp_input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, user_hist, item_indices, user_style, item_style):
        u_latent = self.user_encoder(user_hist)

        i_gmf = self.embed_item_GMF(item_indices)
        i_mlp = self.embed_item_MLP(item_indices)

        # GMF Path
        gmf_output = u_latent * i_gmf
        
        # MLP Path
        mlp_input = torch.cat([u_latent, i_mlp, user_style, item_style], dim=-1)
        mlp_output = self.mlp_layers(mlp_input)
        
        # concat
        prediction = gmf_output.sum(dim=-1, keepdim=True) + mlp_output
        return prediction.view(-1)
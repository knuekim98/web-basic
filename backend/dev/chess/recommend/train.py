import torch
import torch.nn as nn

from model import ChessNCF
from dataloader import item_le, train_dataloader

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ChessNCF(num_items=len(item_le.classes_))
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

for epoch in range(20):
    model.train()
    epoch_loss = 0
    for u, i, u_style, i_style, y in train_dataloader:
        u, i, u_style, i_style, y = u.to(device), i.to(device), u_style.to(device), i_style.to(device), y.to(device)
        
        optimizer.zero_grad()
        prediction = model(u, i, u_style, i_style)
        loss = criterion(prediction, y)
        loss.backward()
        optimizer.step()
        
        epoch_loss += loss.item()
    
    print(f"Epoch {epoch+1}: Loss = {epoch_loss/len(train_dataloader):.4f}")

torch.save(model.state_dict(), "./backend/models/chess_ncf.pth")
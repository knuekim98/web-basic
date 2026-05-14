import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import numpy as np

from model import ChessNCF
from dataloader import item_le, train_dataloader, val_dataloader

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ChessNCF(num_items=len(item_le.classes_))
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)

train_losses = []
val_losses = []

for epoch in range(15):
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
    avg_train_loss = epoch_loss / len(train_dataloader)
    train_losses.append(avg_train_loss)

    model.eval()
    running_val_loss = 0
    with torch.no_grad():
        for u, i, u_style, i_style, y in val_dataloader:
            u, i, u_style, i_style, y = u.to(device), i.to(device), u_style.to(device), i_style.to(device), y.to(device).float()
            
            prediction = model(u, i, u_style, i_style)
            v_loss = criterion(prediction, y)
            running_val_loss += v_loss.item()
            
    avg_val_loss = running_val_loss / len(val_dataloader)
    val_losses.append(avg_val_loss)

    print(f"Epoch {epoch+1}: Train Loss={avg_train_loss:.4f}, Val Loss={avg_val_loss:.4f}")

torch.save(model.state_dict(), "./backend/models/chess_ncf.pth")
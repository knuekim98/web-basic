import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F

from model import CNN
from dataloader import train_dataloader, test_dataloader


def accuracy(predictions, truth):
    predicted_labels = torch.argmax(predictions, axis=1)
    correct = (predicted_labels == truth).float()
    accuracy = correct.mean().item()
    return accuracy


LR = 0.005
BATCH_SIZE = 64
EPOCHS = 10
PATH = "./backend/models/mnist.pth"

model = CNN()
lossfunc = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)

loss_values = []
acc_values = []
for epoch in range(EPOCHS):
    for i, train_data in enumerate(train_dataloader):
        img, label = train_data
        pred = model(img)

        loss = lossfunc(pred, label)
        optimizer.zero_grad()
        loss.backward()

        optimizer.step()
        acc = accuracy(F.softmax(pred, dim = 1), label)
    
    loss_values.append(loss.detach().clone().numpy())
    acc_values.append(acc)
    print(f"Epoch {epoch+1}----------------------------")
    print(f"loss: {loss.item():.6f}")
    print(f"acc: {acc:.6f}")


torch.save(model.state_dict(), PATH)
import torch.nn as nn


class CNN(nn.Module):
    def __init__(self): 
        super(CNN, self).__init__()

        self.conv1 = nn.Conv2d(in_channels = 1, out_channels = 20, kernel_size = (5, 5), stride = 1)
        self.conv2 = nn.Conv2d(in_channels = 20, out_channels = 10, kernel_size = (5, 5), stride = 1)
        self.pool = nn.MaxPool2d(kernel_size = (2, 2), stride = 2)
        self.fc1 = nn.Linear(160, 40)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(40, 10)


    def forward(self, x):

        x = self.conv1(x)
        x = self.relu(x)
        x = self.pool(x)
        x = self.conv2(x)
        x = self.relu(x)
        x = self.pool(x)
        x = x.view(x.shape[0],-1)
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)

        return x
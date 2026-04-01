from torchvision import datasets
from torchvision.transforms import ToTensor

from torch.utils.data import Dataset
from torch.utils.data import DataLoader

train_data = datasets.MNIST(
    root="./backend/datasets/",
    train=True,
    download=True,
    transform=ToTensor()
)
test_data = datasets.MNIST(
    root="./backend/datasets/",
    train=False,
    download=True,
    transform=ToTensor()
)

train_dataloader = DataLoader(train_data, batch_size=64, shuffle=True)
test_dataloader = DataLoader(test_data, batch_size=64, shuffle=True)

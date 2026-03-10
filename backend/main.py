import base64
import io
import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware

from mnist.model import CNN


# load models
mnist = CNN()
mnist.load_state_dict(torch.load("./models/mnist.pth"))
mnist.eval()


app = FastAPI()
origins = [
    "http://localhost:5173",
    "https://knuekim98.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}

@app.post("/predict/mnist")
async def predict_mnist(data: dict = Body(...)):
    image_data = data['image'].split(',')[1]
    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))

    img = img.convert('L').resize((28, 28))
    
    img_array = np.array(img) / 255.0
    img_array = img_array.reshape(1, 1, 28, 28)
    x = torch.from_numpy(img_array).to(torch.float32)

    with torch.no_grad():
        prediction = mnist(x)
        digit = int(np.argmax(prediction))
    return {"digit": digit, "confidence": float(torch.max(prediction))}
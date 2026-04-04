import base64
import io
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from PIL import Image
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Union

from dev.mnist.model import CNN
df_chess_white = pd.read_csv("./db/chess/db_white_processed.csv")
df_chess_black = None #pd.read_csv("./db/chess/db_black_processed.csv")

# load models
mnist = CNN()
mnist.load_state_dict(torch.load("./models/mnist.pth", weights_only=True))
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
    return {"digit": digit, "prob": F.softmax(prediction, dim=1).squeeze().tolist()}


@app.post("/api/chess/query")
async def query_chess_data(
    columns: Union[List[str], str] = Body(default=["name", "ECO", "white", "draws", "black"]),
    limit: int = Body(default=50),
    offset: int = Body(default=0),
    sortby: str = Body(default="games"),
    ascending: bool = Body(default=True),
    color: str = Body(default="white"),
    search: str = Body(default="")
):
    df = df_chess_white if color=="white" else df_chess_black
    if isinstance(columns, str):
        if columns == "all": columns = df.columns
        else: raise HTTPException(status_code=400, detail="Invalid columns requested")
    elif any(col not in list(df.columns) for col in columns) or sortby not in list(df.columns):
        raise HTTPException(status_code=400, detail="Invalid columns requested")
    
    if search:
        search_mask = (
            df['name'].str.contains(search, case=False, na=False) | 
            df['moves'].str.contains(search, case=False, na=False)
        )
        df = df[search_mask]

    sorted_df = df.sort_values(by=sortby, ascending=ascending)
    result_df = sorted_df.iloc[offset : offset+limit]
    data = result_df[columns].to_dict(orient="records")

    return {
        "total_count": len(df),
        "data": data
    }
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
from pydantic import BaseModel

import os
from dotenv import load_dotenv
import httpx
load_dotenv("./dev/chess/.env.chess")
TOKEN = os.environ.get("API_TOKEN")


import json
df_chess_white = pd.read_csv("./db/chess/db_white_processed.csv")
df_chess_black = pd.read_csv("./db/chess/db_black_processed.csv")
with open("./db/chess/trie_white.json", "r") as f:
    trie_white = json.load(f)
with open("./db/chess/trie_black.json", "r") as f:
    trie_black = json.load(f) 
with open("./db/chess/stats_white.json", "r") as f:
    stats_white = json.load(f)
with open("./db/chess/stats_black.json", "r") as f:
    stats_black = json.load(f) 

def moves_formatting(moves_list):
    moves_formatted  = []
    for i, move in enumerate(moves_list):
        if i&1==0: moves_formatted.append(f"{(i//2)+1}.{move}")
        else: moves_formatted.append(move)
    moves_formatted = " ".join(moves_formatted)
    return moves_formatted


# load models
from dev.mnist.model import CNN
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
def get_root():
    return {"message": "FastAPI server is running!"}

@app.post("/api/mnist")
async def mnist_predict(data: dict = Body(...)):
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
async def chess_query(
    columns: Union[List[str], str] = Body(default="all"),
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


@app.post("/api/chess/opening")
async def chess_opening(opening_id: int = Body(...), color: str = Body(default="white")):
    df = df_chess_white if color=="white" else df_chess_black
    res = df[df["id"] == opening_id]
    if res.empty: raise HTTPException(status_code=404, detail="Opening not found")
    return res.iloc[0].to_dict()


@app.get("/api/chess/stats")
async def chess_stats():
    return {
        "white": stats_white,
        "black": stats_black
    }


class AnalyzeRequest(BaseModel):
    username: str
    games: List[dict]

@app.post("/api/chess/analyze")
async def chess_analyze(request_data: AnalyzeRequest):
    username = request_data.username
    games = request_data.games

    processed_games = []
    for data in games:
        if data.get("variant") != "standard": continue
        game = {
            "speed": data["perf"],
            "result": data.get("winner", "draws"),
            "me": "white" if data["players"]["white"]["user"]["name"] == username else "black",
        }
        
        search_df = df_chess_white if game["me"] == "white" else df_chess_black
        game["opening"] = []
        moves_list = data["moves"].split()
        depth_max = 11 if game["me"] == "white" else 12
        
        for depth in range(depth_max, 4, -2):
            target = moves_formatting(moves_list[:depth])
            match = search_df[search_df["moves"] == target]
            if not match.empty:
                game["opening"].append(match.iloc[0].to_dict())
        processed_games.append(game)
    
    opening_result = {"white": {}, "black": {}}
    for game in processed_games:
        for opening in game["opening"]:
            me = game["me"]
            opening_id = opening["id"]
            if opening_id not in opening_result[me]:
                opening_result[me][opening_id] = {"name": opening["name"], "white": 0, "draws": 0, "black": 0}
            opening_result[me][opening_id][game["result"]] += 1
            
    return {"opening_result": opening_result}
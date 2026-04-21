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
import chess

import os
from dotenv import load_dotenv
load_dotenv("./dev/chess/.env.chess")
TOKEN = os.environ.get("API_TOKEN")


import json
df_chess_white = pd.read_csv("./db/chess/db_white_processed.csv")
df_chess_black = pd.read_csv("./db/chess/db_black_processed.csv")
with open("./db/chess/stats_white.json", "r") as f:
    stats_white = json.load(f)
with open("./db/chess/stats_black.json", "r") as f:
    stats_black = json.load(f) 


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
    search: str = Body(default=""),
    unshow: bool = Body(default=True)
):
    df = df_chess_white if color=="white" else df_chess_black
    if unshow: df = df[df["unshow"] != 1]
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
    return res.fillna('null').iloc[0].to_dict()


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

    analyzed_count = 0
    opening_result = {"white": {}, "black": {}}
    speed_count = {"bullet":0, "blitz":0, "rapid":0, "classical":0}
    
    sharpness = []
    popularity = []

    games_processed = []
    for data in games:
        game = {
            "speed": data["perf"],
            "result": data.get("winner", "draws"),
            "me": "white" if data["players"]["white"]["user"]["id"] == username else "black",
        }
        if game["me"] == game["result"]: game["score"] = 1
        elif game["result"] == "draws": game["score"] = 0.5
        else: game["score"] = 0
        rd = data["players"]["white"]["rating"] - data["players"]["black"]["rating"]
        if game["me"] == "black": rd = -rd
        game["rating_diff"] = rd

        speed_count[game["speed"]] += 1
        search_df = df_chess_white if game["me"] == "white" else df_chess_black

        # get opening
        game["opening"] = []
        moves_list = data["moves"].split()
        board = chess.Board()
        try:
            for depth in range(12):
                if depth >= len(moves_list): break
                board.push_san(moves_list[depth])
                if depth&1 == (game["me"]=="white"): continue

                fen = board.fen()
                match = search_df[search_df["fen"] == fen]
                if not match.empty:
                    game["opening"].append(match.iloc[0].to_dict())
        except chess.IllegalMoveError: continue
        
        if game["opening"]:
            me = game["me"]
            result = game["result"]
            ss = stats_white if me == "white" else stats_black

            # construct opening_result
            main_idx = -1
            for i, opening in enumerate(game["opening"]):
                if opening["unshow"] != 1: 
                    main_idx = i
                    break
            
            if main_idx != -1:
                main_opening = game["opening"][main_idx]
                main_opening_id = main_opening["id"]
                if main_opening_id not in opening_result[me]:
                    opening_result[me][main_opening_id] = {"name": main_opening["name"], "white": 0, "draws": 0, "black": 0, "variations":{}}
                opening_result[me][main_opening_id][result] += 1
                
                for opening in game["opening"][(main_idx+1):]:
                    opening_id = opening["id"]
                    if opening_id not in opening_result[me][main_opening_id]["variations"]:
                        opening_result[me][main_opening_id]["variations"][opening_id] = {"name": opening["name"], "white": 0, "draws": 0, "black": 0}
                    opening_result[me][main_opening_id]["variations"][opening_id][result] += 1
                    
            # measure popularity
            pop_z = sum((o["popularity"] - ss["popularity_ss"][0]) / ss["popularity_ss"][1] for o in game["opening"]) / len(game["opening"])
            popularity.append(pop_z)

            # measure sharpness
            last_opening = game["opening"][-1]
            sharp_z = (last_opening["sharpness"] - ss["sharpness_ss"][0]) / ss["sharpness_ss"][1]
            sharpness.append(sharp_z)
            
        analyzed_count += 1
        games_processed.append(game)

    
    # emphirical scaling
    A1 = 0.84
    A2 = 0.73
    user_popularity = sum(popularity)/(analyzed_count ** A1)
    user_sharpness = sum(sharpness)/(analyzed_count ** A2)

    def get_metric_stats(metric_key, threshold):
        high_score = 0
        high_weight = 0
        low_score = 0
        low_weight = 0
        
        high_op_counts = {}
        low_op_counts = {}

        for game in games_processed:
            n = sum(o["unshow"] != 1 for o in game["opening"])
            if n == 0: continue
            weight = 1.0 / n
            for op in game["opening"]:
                if op["unshow"] == 1: continue
                val = op[metric_key]
                op_info = (op["id"], op["name"], game["me"])
                
                if val > threshold:
                    high_score += game["score"] * weight
                    high_weight += weight
                    high_op_counts[op_info] = high_op_counts.get(op_info, 0) + 1
                else:
                    low_score += game["score"] * weight
                    low_weight += weight
                    low_op_counts[op_info] = low_op_counts.get(op_info, 0) + 1
        
        print(metric_key, threshold, sum(low_op_counts.values()), sum(high_op_counts.values()))

        def get_top(counts):
            sorted_ops = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]
            return [{"id": k[0], "name": k[1], "color": k[2]} for k, _ in sorted_ops]

        return {
            "win_rate_high": round((high_score / high_weight * 100), 1) if high_weight > 0 else 0,
            "win_rate_low": round((low_score / low_weight * 100), 1) if low_weight > 0 else 0,
            "openings_high": get_top(high_op_counts),
            "openings_low": get_top(low_op_counts)
        }

    stats_popularity = get_metric_stats("popularity", user_popularity)
    stats_sharpness = get_metric_stats("sharpness", user_sharpness)
            
    return {
        "total_count": analyzed_count,
        "speed_count": speed_count,
        "insight": {
            "popularity": user_popularity, 
            "sharpness": user_sharpness
        },
        "insight_stats": {
            "popularity": stats_popularity,
            "sharpness": stats_sharpness
        },
        "opening_result": opening_result
    }
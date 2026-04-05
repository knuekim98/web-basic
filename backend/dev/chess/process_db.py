import pandas as pd
import numpy as np

RATINGS = [0,1000,1200,1400,1600,1800,2000,2200,2500]
SPEEDS = ["bullet","blitz","rapid","classical"]

def preprocess(fn):
    df = pd.read_csv(f"./backend/db/chess/db_{fn}_selected.csv", encoding="utf-8")

    df["games"] = df["white"] + df["draws"] + df["black"]
    df["white_rate"] = df["white"] / df["games"] * 100
    df["draws_rate"] = df["draws"] / df["games"] * 100
    df["black_rate"] = df["black"] / df["games"] * 100

    for r in RATINGS:
        df[f"{r}_games"] = df[f"{r}_white"] + df[f"{r}_draws"] + df[f"{r}_black"]
        df[f"{r}_{fn}_rate"] = df[f"{r}_{fn}"] / df[f"{r}_games"] * 100
        df[f"{r}_draws_rate"] = df[f"{r}_draws"] / df[f"{r}_games"] * 100
        df[f"{r}_score_rate"] = (df[f"{r}_{fn}"] + df[f"{r}_draws"]/2) / df[f"{r}_games"] * 100
    
    for s in SPEEDS:
        df[f"{s}_games"] = df[f"{s}_white"] + df[f"{s}_draws"] + df[f"{s}_black"]
        df[f"{s}_{fn}_rate"] = df[f"{s}_{fn}"] / df[f"{s}_games"] * 100
        df[f"{s}_draws_rate"] = df[f"{s}_draws"] / df[f"{s}_games"] * 100
        df[f"{s}_score_rate"] = (df[f"{s}_{fn}"] + df[f"{s}_draws"]/2) / df[f"{s}_games"] * 100
    

    df["score_rate"] = (df[fn] + df["draws"]/2) / df["games"] * 100
    df["score_rate_rank"] = df["score_rate"].rank(ascending=False, method='min').astype(int)
    df["draws_rate_rank"] = df["draws_rate"].rank(ascending=False, method='min').astype(int)
    
    df["selection_rate"] = df['games'] / df["games"].sum() * 100
    df["selection_rate_rank"] = df["selection_rate"].rank(ascending=False, method='min').astype(int)

    df["score_rate_hist"] = ((df["score_rate"] - 20) / 2).astype(int)
    df["draws_rate_hist"] = (df["draws_rate"] * 3).astype(int)

    score_hist, _ = np.histogram(df['score_rate'], bins=30, range=(20, 80))
    draws_hist, _ = np.histogram(df['draws_rate'], bins=30, range=(0, 10))
    print(score_hist)
    print(draws_hist)

    df.to_csv(f"./backend/db/chess/db_{fn}_processed.csv", na_rep="NaN", encoding="utf-8", index=False)
    print(f"processed: {fn}")

preprocess("white")
preprocess("black")
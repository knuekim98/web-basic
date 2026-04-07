import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import matplotlib.pyplot as plt

RATINGS = [0,1000,1200,1400,1600,1800,2000,2200,2500]
SPEEDS = ["bullet","blitz","rapid","classical"]

def preprocess(fn):
    df = pd.read_csv(f"./backend/db/chess/db_{fn}_selected.csv", encoding="utf-8")

    # get white/draws/black rate
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
    
    # get score rate/rank/hist
    df["score_rate"] = (df[fn] + df["draws"]/2) / df["games"] * 100
    df["score_rate_rank"] = df["score_rate"].rank(ascending=False, method='min').astype(int)
    df["draws_rate_rank"] = df["draws_rate"].rank(ascending=False, method='min').astype(int)
    print("avg score_rate:", (df["score_rate"]*df["games"]).sum() / df["games"].sum())

    df["score_rate_hist"] = ((df["score_rate"] - 20) / 2).astype(int)
    df["draws_rate_hist"] = (df["draws_rate"] * 3).astype(int)
    score_hist, _ = np.histogram(df['score_rate'], bins=30, range=(20, 80))
    draws_hist, _ = np.histogram(df['draws_rate'], bins=30, range=(0, 10))
    print(score_hist)
    print(draws_hist)
    
    # get selection rate/rank
    df["selection_rate"] = df['games'] / df["games"].sum() * 100
    df["selection_rate_rank"] = df["selection_rate"].rank(ascending=False, method='min').astype(int)

    # get sharpness
    sharp_model = LinearRegression()
    sharp_model.fit(df["average_rating"].values.reshape(-1, 1), df["draws_rate"])
    df["sharpness"] = -(df["draws_rate"] - (sharp_model.coef_[0]*df["average_rating"] + sharp_model.intercept_))
    df["sharpness"] = StandardScaler().fit_transform(df["sharpness"].values.reshape(-1, 1))

    # get popularity
    df["popularity"] = MinMaxScaler().fit_transform(np.log(df["games"].values.reshape(-1, 1)))

    # get elo sensitivity
    ES_TARGET_RATINGS = [1200, 1400, 1600, 1800, 2000, 2200]
    ES_X = np.array(ES_TARGET_RATINGS).reshape(-1, 1)
    rating_avg = [np.sum(df[f"{r}_score_rate"]*df[f"{r}_games"])/df[f"{r}_games"].sum() for r in ES_TARGET_RATINGS]
    slopes = []
    for _ , row in df.iterrows():
        y = [row[f"{r}_score_rate"] - rating_avg[i] for i, r in enumerate(ES_TARGET_RATINGS)]
        slopes.append(LinearRegression().fit(ES_X, y).coef_[0])
    df["elo_sensitivity"] = slopes
    df["elo_sensitivity"] = StandardScaler().fit_transform(df["elo_sensitivity"].values.reshape(-1, 1))

    # get time pressure advantage
    bullet_avg = np.sum(df["bullet_score_rate"]*df["bullet_games"])/df["bullet_games"].sum()
    blitz_avg = np.sum(df["blitz_score_rate"]*df["blitz_games"])/df["blitz_games"].sum()
    rapid_avg = np.sum(df["rapid_score_rate"]*df["rapid_games"])/df["rapid_games"].sum()
    classical_avg = np.sum(df["classical_score_rate"]*df["classical_games"])/df["classical_games"].sum()
    df["time_pressure_advantage"] = ((df["bullet_score_rate"]-bullet_avg)*df["bullet_games"] + (df["blitz_score_rate"]-blitz_avg)*df["blitz_games"])/(df["bullet_games"]+df["blitz_games"]) -\
                                    ((df["rapid_score_rate"]-rapid_avg)*df["rapid_games"] + (df["classical_score_rate"]-classical_avg)*df["classical_games"])/(df["rapid_games"]+df["classical_games"])
    df["time_pressure_advantage"] = StandardScaler().fit_transform(df["time_pressure_advantage"].values.reshape(-1, 1))

    df.to_csv(f"./backend/db/chess/db_{fn}_processed.csv", na_rep="NaN", encoding="utf-8", index=False)
    print(f"--- processed: {fn} ---")

preprocess("white")
preprocess("black")
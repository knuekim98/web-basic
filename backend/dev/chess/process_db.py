import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import json
import os, time
import requests
from dotenv import load_dotenv

load_dotenv("./backend/dev/chess/.env.chess")
TOKEN = os.environ.get("API_TOKEN")
def get_data(url):
    res = requests.get(url, headers={"Authorization": f"Bearer {TOKEN}"})
    while res.status_code != 200:
        time.sleep(1)
        res = requests.get(url)
    return json.loads(res.text)

data = get_data(f"https://explorer.lichess.org/lichess?topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical&ratings=1400,1600,1800,2000,2200,2500")
TOTAL_GAME = data["white"] + data["draws"] + data["black"]
RATINGS = [0,1000,1200,1400,1600,1800,2000,2200,2500]
SPEEDS = ["bullet","blitz","rapid","classical"]

def preprocess(fn):
    df = pd.read_csv(f"./backend/db/chess/db_{fn}_selected.csv", encoding="utf-8")
    stats = {"total": df.shape[0]}

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
    stats[f"avg_score_rate"] = (df["score_rate"]*df["games"]).sum() / df["games"].sum()

    df["score_rate_hist"] = ((df["score_rate"] - 20) / 2).astype(int)
    df["draws_rate_hist"] = (df["draws_rate"] * 3).astype(int)
    score_hist, _ = np.histogram(df['score_rate'], bins=31, range=(30, 70))
    draws_hist, _ = np.histogram(df['draws_rate'], bins=31, range=(0, 10))
    stats[f"score_hist"] = score_hist.tolist()
    stats[f"draws_hist"] = draws_hist.tolist()
    
    # get selection rate/rank
    df["selection_rate"] = df["games"] / TOTAL_GAME * 100
    df.loc[df["unshow"] != 1, 'selection_rate_rank'] = df.loc[df["unshow"] != 1, 'games'].rank(ascending=False, method='min').astype(int)

    # get sharpness
    for s in SPEEDS:
        sharp_model = LinearRegression()
        sharp_model.fit(df[f"{s}_avg"].values.reshape(-1, 1), df["draws_rate"])
        df[f"{s}_sharpness"] = -(df["draws_rate"] - (sharp_model.coef_[0]*df[f"{s}_avg"] + sharp_model.intercept_))
        stats[f"{s}_sharpness_coef"] = [sharp_model.coef_[0], sharp_model.intercept_]
    df["sharpness"] = (df["bullet_sharpness"] + df["blitz_sharpness"] + df["rapid_sharpness"] + df["classical_sharpness"]) / 4
    ss = StandardScaler()
    df["sharpness"] = ss.fit_transform(df["sharpness"].values.reshape(-1, 1))
    stats["sharpness_ss"] = [ss.mean_[0], ss.scale_[0]]

    # get popularity
    df["move_num"] = df["moves"].str.split('.').str[-2].str.strip().str.split(' ').str[-1]
    df["games_by_move_num"] = df.groupby("move_num")["games"].transform('sum')
    df["popularity"] = np.log(df['games'] / df['games_by_move_num'] + 1e-10)
    scaler = lambda x: (x - x.mean()) / x.std()
    df["popularity"] = df.groupby("move_num")["popularity"].transform(scaler)
    GLOBAL_MEAN = np.average(df['popularity'], weights=df['games'])
    GLOBAL_SD = np.sqrt(np.average((df['popularity'] - GLOBAL_MEAN)**2, weights=df['games']))
    stats["popularity_ss"] = [GLOBAL_MEAN, GLOBAL_SD]
    df.drop(columns=['move_num', 'games_by_move_num'], inplace=True)
    
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
    with open(f"./backend/db/chess/stats_{fn}.json", "w") as f:
        json.dump(stats, f)
    print(f"--- processed: {fn} ---")

preprocess("white")
preprocess("black")
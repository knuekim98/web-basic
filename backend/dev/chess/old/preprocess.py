import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.linear_model import LinearRegression

query_ratings = ["0", "1000,1200", "1400,1600", "1800,2000", "2200,2500"]
query_speeds = ["bullet", "blitz", "rapid", "classical"]


def get_rating_slope(row):
    x = np.arange(5).reshape(-1, 1)
    y = np.array([row[f"win_rate_{qr}_shrink"] for qr in query_ratings]).reshape(-1, 1)
    lr = LinearRegression().fit(x, y) #sample_weight=[np.log1p(row[f"total_{qr}"]) for qr in query_ratings])
    return lr.coef_[0][0]


def preprocess(df, turn):
    df.dropna(axis=0)
    df["win_ratio"] = df[turn] / (df["white"]+df["black"])
    df = df[(df["ECO"] != "A00") & (df["win_ratio"] > 0.45)]

    X = pd.DataFrame()
    X["total"] = df["white"] + df["draws"] + df["black"]
    X["win_rate"] = df[turn] / X["total"]
    X["draw_rate"] = df["draws"] / X["total"]
    win_rate_global = X["win_rate"].mean()
    k = 40

    for qr in query_ratings:
        X[f"total_{qr}"] = df[f"white_{qr}"] + df[f"draws_{qr}"] + df[f"black_{qr}"]
        X[f"win_rate_{qr}"] = df[f"{turn}_{qr}"] / X[f"total_{qr}"]
        X[f"draw_rate_{qr}"] = df[f"draws_{qr}"] / X[f"total_{qr}"]
        X[f"win_rate_{qr}_shrink"] = X[f"total_{qr}"] / (X[f"total_{qr}"] + k) * X[f"win_rate_{qr}"] + k / (X[f"total_{qr}"] + k) * win_rate_global

    for qs in query_speeds:
        X[f"total_{qs}"] = df[f"white_{qs}"] + df[f"draws_{qs}"] + df[f"black_{qs}"]
        X[f"win_rate_{qs}"] = df[f"{turn}_{qs}"] / X[f"total_{qs}"]
        X[f"draw_rate_{qs}"] = df[f"draws_{qs}"] / X[f"total_{qs}"]

    # factorize and pca ECO code
    eco_factor = pd.get_dummies(df["ECO"], drop_first=True)
    pca = PCA(n_components=5)
    eco_pca = pca.fit_transform(eco_factor)
    eco_pca_df = pd.DataFrame(eco_pca, columns=[f"eco_pca_{i}" for i in range(eco_pca.shape[1])])
    X = pd.concat([X, eco_pca_df], axis=1)

    X["name"] = df["name"]
    X = X.dropna(axis=0)
    X["rating_winrate_slope"] = X.apply(get_rating_slope, axis=1)

    top10 = X.sort_values("rating_winrate_slope", ascending=True).head(10)
    print(top10[["name", "rating_winrate_slope", "win_rate_0", "win_rate_2200,2500", "total"]])


df_white = pd.read_csv("./db-white.csv", encoding="utf-8")
preprocess(df_white, "white")
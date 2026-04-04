import pandas as pd

def preprocess(fn):
    df = pd.read_csv(f"./backend/db/chess/db_{fn}_selected.csv", encoding="utf-8")

    df = df[df["moves"].str.split('.').str[-2].str.strip().str.split(' ').str[-1].astype('int') > 2]

    df["games"] = df["white"] + df["draws"] + df["black"]
    df["white_rate"] = df["white"] / df["games"] * 100
    df["draws_rate"] = df["draws"] / df["games"] * 100
    df["black_rate"] = df["black"] / df["games"] * 100
    df = df.round({"white_rate":1, "draws_rate":1, "black_rate":1})

    df.to_csv(f"./backend/db/chess/db_{fn}_processed.csv", na_rep="NaN", encoding="utf-8", index=False)

preprocess("white")
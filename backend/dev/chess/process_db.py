import pandas as pd

def preprocess(fn):
    df = pd.read_csv(f"./backend/datasets/chess/db_{fn}_selected.csv", encoding="utf-8")
    df["games"] = df["white"] + df["draws"] + df["black"]

    df.to_csv(f"./backend/datasets/chess/db_{fn}_processed.csv", na_rep="NaN", encoding="utf-8", index=False)

preprocess("white")
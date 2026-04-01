import json
import time
import requests
import csv
import os
from dotenv import load_dotenv

load_dotenv("./backend/dev/chess/.env.chess")
TOKEN = os.environ.get("API_TOKEN")

with open(f"./backend/datasets/chess/eco_white_selected.json", encoding="utf-8") as f:
    opening_white = json.load(f)

def get_data(url):
    res = requests.get(url, headers={"Authorization": f"Bearer {TOKEN}"})
    while res.status_code != 200:
        time.sleep(1)
        res = requests.get(url)
    return json.loads(res.text)


RATINGS = [0,1000,1200,1400,1600,1800,2000,2200,2500]
SPEEDS = ["bullet","blitz","rapid","classical"]
def make_db(opening):
    for i, fen in enumerate(opening):
        if not (512<=i): continue
        line = [fen, opening[fen]["name"], opening[fen]["moves"], opening[fen]["eco"]]

        data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical&ratings=1400,1600,1800,2000,2200,2500")
        line.append(data["white"])
        line.append(data["draws"])
        line.append(data["black"])
        data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical")
        games = data["white"]+data["draws"]+data["black"]
        ar = 0
        for move in data["moves"]:
            ar += move["averageRating"]*(move["white"]+move["draws"]+move["black"])
        line.append(int(ar/games*10)/10)

        for r in RATINGS:
            data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical&ratings={r}")
            line.append(data["white"])
            line.append(data["draws"])
            line.append(data["black"])
        for s in SPEEDS:
            data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds={s}&ratings=1400,1600,1800,2000,2200,2500")
            line.append(data["white"])
            line.append(data["draws"])
            line.append(data["black"])

        with open("./backend/datasets/chess/db_white_selected.csv", "a+", newline='', encoding='utf-8') as f:
            csv.writer(f).writerow(line)
        print(i, line)

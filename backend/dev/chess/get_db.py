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
with open(f"./backend/datasets/chess/eco_black_selected.json", encoding="utf-8") as f:
    opening_black = json.load(f)

def get_data(url):
    res = requests.get(url, headers={"Authorization": f"Bearer {TOKEN}"})
    while res.status_code != 200:
        time.sleep(1)
        res = requests.get(url)
    return json.loads(res.text)


RATINGS = [0,1000,1200,1400,1600,1800,2000,2200,2500]
SPEEDS = ["bullet","blitz","rapid","classical"]
def make_db(opening, fn, append=True):
    if not append:
        with open(f"./backend/db/chess/db_{fn}_selected.csv", "w") as f:
            f.write("fen,name,moves,ECO,white,draws,black,average_rating,0_white,0_draws,0_black,1000_white,1000_draws,1000_black,1200_white,1200_draws,1200_black,1400_white,1400_draws,1400_black,1600_white,1600_draws,1600_black,1800_white,1800_draws,1800_black,2000_white,2000_draws,2000_black,2200_white,2200_draws,2200_black,2500_white,2500_draws,2500_black,bullet_white,bullet_draws,bullet_black,blitz_white,blitz_draws,blitz_black,rapid_white,rapid_draws,rapid_black,classical_white,classical_draws,classical_black\n")
    for i, fen in enumerate(opening):
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

        with open(f"./backend/db/chess/db_{fn}_selected.csv", "a+", newline='', encoding='utf-8') as f:
            csv.writer(f).writerow(line)
        print(i, line)
    print(f"succeed to get db of {fn}")

x = input("select color to update(w/b/wb): ")
mode = 'N' in input("init?(Y/N): ")
if 'w' in x: make_db(opening_white, "white", mode)
if 'b' in x: make_db(opening_black, "black", mode)
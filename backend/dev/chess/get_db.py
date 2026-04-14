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
def make_db(opening, fn, start):
    if start == 0:
        with open(f"./backend/db/chess/db_{fn}_selected.csv", "w", newline='') as f:
            cl = ["id", "fen", "name", "moves", "ECO", "parent", "child"]
            cl += ["white", "draws", "black"]
            for s in SPEEDS: cl.append(f"{s}_avg")
            for r in RATINGS: cl += [f"{r}_white", f"{r}_draws", f"{r}_black"]
            for s in SPEEDS: cl += [f"{s}_white", f"{s}_draws", f"{s}_black"]
            csv.writer(f).writerow(cl)
    
    with open(f"./backend/db/chess/db_{fn}_selected.csv", "a+", newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for i, fen in enumerate(opening):
            if not (start<=i): continue
            # basic info
            line = [opening[fen]["id"], fen, opening[fen]["name"], opening[fen]["moves"], opening[fen]["eco"]]
            line.append(opening[fen]["parent"] if "parent" in opening[fen] else None)
            line.append(opening[fen]["child"])

            data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical&ratings=1400,1600,1800,2000,2200,2500")
            line += [data["white"], data["draws"], data["black"]]

            # avg rating
            for s in SPEEDS:   
                data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds={s}")
                games = data["white"]+data["draws"]+data["black"]
                ar = 0
                for move in data["moves"]:
                    ar += move["averageRating"]*(move["white"]+move["draws"]+move["black"])
                line.append(int(ar/games*10)/10)

            # rating
            for r in RATINGS:
                data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical&ratings={r}")
                line += [data["white"], data["draws"], data["black"]]

            # speed
            for s in SPEEDS:
                data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds={s}&ratings=1400,1600,1800,2000,2200,2500")
                line += [data["white"], data["draws"], data["black"]]

            writer.writerow(line)
            f.flush()
            print(i, line)
    print(f"succeed to get db of {fn}")

x = input("select color to update(w/b/wb): ")
start = int(input('start from: '))
if 'w' in x: make_db(opening_white, "white", start)
if 'b' in x: make_db(opening_black, "black", start)
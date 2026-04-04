import json
import time
import requests
import os
from dotenv import load_dotenv

load_dotenv("./backend/dev/chess/.env.chess")
TOKEN = os.environ.get("API_TOKEN")
FILENAME = ["ecoA", "ecoB", "ecoC", "ecoD", "ecoE"]

opening_white = dict()
opening_black = dict()
moves_white = []
moves_black = []
moves_to_fen = dict()

for fn in FILENAME:
    with open(f"./backend/datasets/chess/{fn}.json", encoding="utf-8") as f:
        eco = json.load(f)
    
    for fen in eco:
        moves = eco[fen]["moves"].strip()
        moves = moves.replace("  ", " ").replace(". ", ".")
        eco[fen]["moves"] = moves
        moves_to_fen[moves] = fen

        move_num = int(eco[fen]["moves"].split('.')[-2].strip().split(' ')[-1])
        eco[fen]["move_num"] = move_num
        if " " not in eco[fen]["moves"].split('.')[-1].strip():
            opening_white[fen] = {
                "eco": eco[fen]["eco"],
                "moves": eco[fen]["moves"],
                "name": eco[fen]["name"]
            }
            moves_white.append((move_num, eco[fen]["moves"]))
        else:
            opening_black[fen] = {
                "eco": eco[fen]["eco"],
                "moves": eco[fen]["moves"],
                "name": eco[fen]["name"]
            }
            moves_black.append((move_num, eco[fen]["moves"]))

        
moves_black.sort(); moves_white.sort()
parent = {}
def get_trie(moves):
    trie = {}
    for _, m in moves:
        p = None
        now = trie
        while 1:
            key = None
            for k in now:
                if m.startswith(k):
                    key = k
                    break
            if key is None: break
            now = now[key]
            p = key
        now[m] = {}
        if p is not None:
            parent[moves_to_fen[m]] = moves_to_fen[p]
    return trie

trie_white = get_trie(moves_white)
trie_black = get_trie(moves_black)

def get_data(url):
    res = requests.get(url, headers={"Authorization": f"Bearer {TOKEN}"})
    while res.status_code != 200:
        time.sleep(1)
        res = requests.get(url)
    return json.loads(res.text)


# filter opening: 3~6 moves, >500000 standard games
def select_opening(moves, opening_original, fn):
    opening = {}
    for i, (_, m) in enumerate(moves):
        fen = moves_to_fen[m]
        if not (3 <= opening_original[fen]["move_num"] <= 6): continue
        data = get_data(f"https://explorer.lichess.org/lichess?fen={fen}&topGames=0&recentGames=0&since=2015-01&speeds=blitz,rapid,classical&ratings=1400,1600,1800,2000,2200,2500")
        games = data["white"]+data["draws"]+data["black"]

        if games >= 500000:
            opening[fen] = opening_original[fen]
            # remove parent
            if fen in parent:
                p = parent[fen]
                if p in opening: del opening[p]
            print("selected: ", opening[fen]["name"], games, i, len(opening))
    
    with open(f"./backend/datasets/chess/eco_{fn}_selected.json", "w") as f:
        json.dump(opening, f, indent=4)

select_opening(moves_white, opening_white, "white")
#select_opening(moves_black, opening_black, "black")
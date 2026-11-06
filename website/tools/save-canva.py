"""Save Canva exports as menu photos.

Usage:  python tools/save-canva.py batch.json
batch.json maps a menu item id to the export URL Canva returned, e.g.
  {"b-zinger": "https://export-download.canva.com/..."}
Each photo is cropped to 4:3 and saved as assets/food/cv-<id>.webp (960x720)
and cv-<id>-s.webp (480x360, the menu cards). Point the item at it in
js/menu.js with img:'cv-<id>'.
"""
import io, json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOOD = os.path.join(HERE, 'assets', 'food')

def save(item):
    iid, url = item
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=90).read()
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    w, h = im.size
    tw, th = (w, round(w * 3 / 4)) if w * 3 / 4 <= h else (round(h * 4 / 3), h)
    l, t = (w - tw) // 2, (h - th) // 2
    im = im.crop((l, t, l + tw, t + th))
    im.resize((960, 720), Image.LANCZOS).save(os.path.join(FOOD, f'cv-{iid}.webp'), 'WEBP', quality=82, method=6)
    im.resize((480, 360), Image.LANCZOS).save(os.path.join(FOOD, f'cv-{iid}-s.webp'), 'WEBP', quality=76, method=6)
    return iid

if __name__ == '__main__':
    batch = json.load(open(sys.argv[1], encoding='utf8'))
    with ThreadPoolExecutor(6) as ex:
        for iid in ex.map(save, batch.items()):
            print('saved', iid)

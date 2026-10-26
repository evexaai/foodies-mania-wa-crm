"""Download every photo the menu points at and save it as a small WebP.

Run from the website folder:  python tools/fetch-images.py
Photos are Pexels stock (free licence). Each menu item's `img` is a Pexels
photo id; the card image lands at assets/food/<id>.webp (720x540).
"""
import io, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOOD = os.path.join(HERE, 'assets', 'food')
HERO = os.path.join(HERE, 'assets', 'hero')
HEROES = {'burger': 19247575, 'pizza': 31587831, 'bbq': 37080253}

def get(pid, w):
    url = f'https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w={w}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert('RGB')

def cover(im, W, H):
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((l, t, l + W, t + H))

def card(pid):
    out = os.path.join(FOOD, f'{pid}.webp')
    if os.path.exists(out):
        return pid, 'kept'
    cover(get(pid, 900), 720, 540).save(out, 'WEBP', quality=78, method=6)
    return pid, 'saved'

def hero(name, pid):
    im = get(pid, 2200)
    cover(im, 1920, 1080).save(os.path.join(HERO, f'{name}.webp'), 'WEBP', quality=76, method=6)
    cover(im, 900, 1200).save(os.path.join(HERO, f'{name}-m.webp'), 'WEBP', quality=74, method=6)
    return name, 'saved'

if __name__ == '__main__':
    os.makedirs(FOOD, exist_ok=True); os.makedirs(HERO, exist_ok=True)
    src = open(os.path.join(HERE, 'js', 'menu.js'), encoding='utf8').read()
    ids = sorted(set(int(x) for x in re.findall(r'img:(\d+)', src)))
    with ThreadPoolExecutor(10) as ex:
        for pid, st in ex.map(card, ids):
            print(pid, st)
        for name, st in ex.map(lambda kv: hero(*kv), HEROES.items()):
            print('hero', name, st)
    print(len(ids), 'menu photos')

# Card thumbnails (480x360) sit beside each photo as <id>-s.webp; regenerate after adding photos:
#   python -c "import glob;from PIL import Image;[Image.open(f).convert('RGB').resize((480,360)).save(f[:-5]+'-s.webp','WEBP',quality=74) for f in glob.glob('assets/food/*.webp') if not f.endswith('-s.webp')]"

#!/usr/bin/env python3
"""Fotos por color (distintas) para iPhone 17 Pro y 17 Pro Max."""
import io, json, ssl, urllib.request, urllib.parse
from PIL import Image

CTX = ssl._create_unverified_context()
env = {}
for line in open('.env.local', encoding='utf-8'):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1); env[k.strip()] = v.strip()
SUPA, KEY, BUCKET = env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'], 'productos_imagenes'
A = "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/"
COLORS = ['cosmicorange', 'deepblue', 'silver']

DATA = {
  'iphone-17-pro': [f"{A}iphone-17-pro-finish-select-{c}-202509?wid=1200&fmt=jpeg&qlt=95" for c in COLORS],
  'iphone-17-pro-max': [f"{A}iphone-17-pro-max-finish-select-{c}-202509?wid=1200&fmt=jpeg&qlt=95" for c in COLORS],
}

def req(url, **kw): return urllib.request.urlopen(urllib.request.Request(url, **kw), timeout=60, context=CTX)
for slug, srcs in DATA.items():
    urls = []
    for i, src in enumerate(srcs, 1):
        data = req(src, headers={'User-Agent': 'Mozilla/5.0'}).read()
        out = io.BytesIO(); Image.open(io.BytesIO(data)).convert('RGB').save(out, 'WEBP', quality=82, method=6)
        path = f"seed/{slug}-{i}.webp"
        req(f"{SUPA}/storage/v1/object/{BUCKET}/{path}", data=out.getvalue(), method='POST',
            headers={'Authorization': f'Bearer {KEY}', 'apikey': KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true'}).read()
        urls.append(f"{SUPA}/storage/v1/object/public/{BUCKET}/{path}")
    req(f"{SUPA}/rest/v1/productos?slug=eq.{urllib.parse.quote(slug)}", data=json.dumps({'imagenes': urls}).encode(),
        method='PATCH', headers={'Authorization': f'Bearer {KEY}', 'apikey': KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}).read()
    print(f"✓ {slug}: {len(urls)} fotos por color")
print("Listo.")

#!/usr/bin/env python3
"""Pone hasta 3 fotos por producto, convertidas a WebP, en el bucket.

- Descarga las imágenes oficiales (Apple store gallery / Prodigee Shopify / Samsung).
- Las convierte a WebP (mucho más livianas -> cargan más rápido).
- Las sube a productos_imagenes/seed/<slug>-N.webp con upsert.
- Actualiza productos.imagenes = [urls] vía PostgREST.

Correr:  python3 scripts/fotos_webp.py
"""
import io, json, ssl, urllib.request, urllib.error
from PIL import Image

# Python en macOS suele no tener el CA store configurado -> contexto sin verificar
# (solo descargamos imágenes públicas y subimos a nuestro propio Supabase).
CTX = ssl._create_unverified_context()

# --- credenciales desde .env.local ---
env = {}
for line in open('.env.local', encoding='utf-8'):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
SUPA = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env['SUPABASE_SERVICE_ROLE_KEY']
BUCKET = 'productos_imagenes'

def apple_g(stem, n):
    return (f"https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/"
            f"{stem}-gallery-{n}{'-'+DATE[stem] if stem in DATE else ''}?wid=1200&fmt=jpeg&qlt=95")

# Apple: galería 1/2/3 por modelo (stems verificados en apple.com)
A = "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/"
def ag(p): return [f"{A}{x}?wid=1200&fmt=jpeg&qlt=95" for x in p]
def sh(p): return [f"https://cdn.shopify.com/s/files/1/0205/5216/{x}" for x in p]

TRIPLE = {
  'iphone-17e': ag([f"iphone-17e-finish-unselect-gallery-{n}-202603" for n in (1,2,3)]),
  'iphone-17': ag([f"iphone-17-finish-unselect-gallery-{n}-202509" for n in (1,2,3)]),
  'iphone-air': ag([f"iphone-air-finish-unselect-gallery-{n}-202509" for n in (1,2,3)]),
  'iphone-17-pro': ag([f"iphone-17-pro-model-unselect-gallery-{n}-202509" for n in (1,2,3)]),
  'iphone-17-pro-max': ag([f"iphone-17-pro-model-unselect-gallery-{n}-202509" for n in (1,2,3)]),
  'macbook-air-13-m5': ag(["macbook-air-size-unselect-202601-gallery-1","macbook-air-size-unselect-202601-gallery-2","macbook-air-size-unselect-202603-gallery-3"]),
  'macbook-air-15-m5': ag(["macbook-air-size-unselect-202601-gallery-1","macbook-air-size-unselect-202601-gallery-2","macbook-air-size-unselect-202603-gallery-3"]),
  'macbook-pro-14-m5': ag([f"mac-macbook-pro-size-unselect-202601-gallery-{n}" for n in (1,2,3)]),
  'macbook-pro-16-m5-pro': ag([f"mac-macbook-pro-size-unselect-202601-gallery-{n}" for n in (1,2,3)]),
  'imac-m4': ag([f"imac-color-unselect-202601-gallery-{n}" for n in (1,2,3)]),
  'mac-mini-m4': ag([f"mac-mini-chip-unselect-202601-gallery-{n}" for n in (1,2,3)]),
  'mac-studio-m4-max': ag([f"mac-studio-chip-unselect-202601-gallery-{n}" for n in (1,2,3)]),
  'prodigee-mag-power-to-go-10k-cream': sh([f"files/MagPower-2-Go-10K-v2_Cream_0{n}.jpg" for n in (1,2,3)]),
  'prodigee-mag-power-to-go-10k-metallic': sh([f"files/MagPower-2-Go-10K-v2_Black_0{n}.jpg" for n in (1,2,3)]),
  'prodigee-energee-mini-car-charger': sh([f"products/mini-prodigee-0{n}.jpg" for n in (1,2,3)]),
  'prodigee-mag-da-beat-silver': sh([f"files/magdabeat-silver-0{n}.jpg" for n in (1,2,3)]),
  'parlante-bluetooth-prodigee-mag-da-beat-con-magsafe---plateado': sh([f"files/magdabeat-silver-0{n}.jpg" for n in (1,2,3)]),
}

# Accesorios con una sola foto oficial limpia -> solo conversión a WebP
SINGLE = {
  'apple-home-power-adapter-20w-usb-c': [f"{A}MWVV3?wid=1600&fmt=jpeg&qlt=95"],
  'apple-earpods-usb-c': [f"{A}MTJY3?wid=1600&fmt=jpeg&qlt=95"],
  'apple-earpods-lightning': [f"{A}MMTN2?wid=1600&fmt=jpeg&qlt=95"],
  'apple-usb-c-to-usb-c-woven-cable-1m': [f"{A}MQKJ3?wid=1600&fmt=jpeg&qlt=95"],
  'apple-cable-type-c-to-lightning': [f"{A}MM0A3?wid=1600&fmt=jpeg&qlt=95"],
  'samsung-travel-charger-45w': ["https://images.samsung.com/is/image/samsung/p6pim/hk_en/ep-t4510xbeggb/gallery/hk-en-45w-power-adapter-ep-t4510-ep-t4510xbeggb-532014377?$1164_776_PNG$"],
  'samsung-travel-charger-25w-black': ["https://images.samsung.com/is/image/samsung/p6pim/us/ep-t2510xbegus/gallery/us-25w-power-adapter-ep-t2510-579798-ep-t2510xbegus-553272381?$product-details-jpg$"],
  'samsung-travel-charger-25w-white': ["https://images.samsung.com/is/image/samsung/p6pim/us/ep-t2510xwegus/gallery/us-25w-power-adapter-ep-t2510-579798-ep-t2510xwegus-551043861?$product-details-jpg$"],
}

def download(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
        return r.read()

def to_webp(data):
    im = Image.open(io.BytesIO(data)).convert('RGB')
    out = io.BytesIO()
    im.save(out, 'WEBP', quality=82, method=6)
    return out.getvalue()

def upload(path, data):
    url = f"{SUPA}/storage/v1/object/{BUCKET}/{path}"
    req = urllib.request.Request(url, data=data, method='POST', headers={
        'Authorization': f'Bearer {KEY}', 'apikey': KEY,
        'Content-Type': 'image/webp', 'x-upsert': 'true',
    })
    urllib.request.urlopen(req, timeout=60, context=CTX).read()
    return f"{SUPA}/storage/v1/object/public/{BUCKET}/{path}"

def set_imagenes(slug, urls):
    url = f"{SUPA}/rest/v1/productos?slug=eq.{urllib.parse.quote(slug)}"
    body = json.dumps({'imagenes': urls}).encode()
    req = urllib.request.Request(url, data=body, method='PATCH', headers={
        'Authorization': f'Bearer {KEY}', 'apikey': KEY,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    })
    urllib.request.urlopen(req, timeout=30, context=CTX).read()

import urllib.parse
def procesar(mapa):
    for slug, srcs in mapa.items():
        urls = []
        for i, src in enumerate(srcs, 1):
            try:
                webp = to_webp(download(src))
                u = upload(f"seed/{slug}-{i}.webp", webp)
                urls.append(u); kb = len(webp)//1024
                print(f"   {slug}-{i}.webp  {kb}KB")
            except Exception as e:
                print(f"   x {slug}-{i}: {str(e)[:60]}")
        if urls:
            set_imagenes(slug, urls)
            print(f"✓ {slug}: {len(urls)} foto(s)")
        else:
            print(f"✗ {slug}: SIN imágenes")

print("== Productos con 3 fotos ==")
procesar(TRIPLE)
print("\n== Accesorios (1 foto, a WebP) ==")
procesar(SINGLE)
print("\nListo.")

"""Soru bölgelerini sayfa görüntülerinden kesip küçük dosyalar üretir."""
import json, os, sys, subprocess, io
from PIL import Image, ImageOps

DPI = int(os.environ.get('DPI', '170'))
OLC = DPI / 72.0

def sayfa_goruntu(pdf, pi, klasor):
    yol = os.path.join(klasor, f'p{pi+1:03d}.png')
    if not os.path.exists(yol):
        subprocess.run(['pdftoppm', '-f', str(pi + 1), '-l', str(pi + 1), '-r', str(DPI), '-gray', '-png', '-singlefile', pdf, yol[:-4]], check=True)
    return Image.open(yol).convert('L')

def temizle(im):
    """Filigranı ve açık gri lekeleri sil, 4 gri tona indir."""
    lut = []
    for v in range(256):
        if v > 200: lut.append(255)
        elif v > 150: lut.append(170)
        elif v > 90: lut.append(85)
        else: lut.append(0)
    return im.point(lut)

def kirp_bos(im, pay=4):
    inv = ImageOps.invert(im)
    kutu = inv.getbbox()
    if not kutu: return None
    x0, y0, x1, y1 = kutu
    return im.crop((max(0, x0 - pay), max(0, y0 - pay), min(im.width, x1 + pay), min(im.height, y1 + pay)))

def soru_resmi(pdf, kitap, soru, klasor):
    parcalar = []
    for pi, si, top, bottom in soru['parcalar']:
        sut = kitap['sutunlar'][str(pi)][si]
        if not sut or bottom - top < 3: continue
        sol, sag, a, b = sut
        im = sayfa_goruntu(pdf, pi, klasor)
        x0 = max(a, sol - 4); x1 = min(b, sag + 4)
        kes = im.crop((int(x0 * OLC), int(top * OLC), int(x1 * OLC), int(bottom * OLC)))
        kes = kirp_bos(temizle(kes))
        if kes is not None and kes.height > 6: parcalar.append(kes)
    if not parcalar: return None
    W = max(p.width for p in parcalar); H = sum(p.height for p in parcalar) + 8 * (len(parcalar) - 1)
    out = Image.new('L', (W, H), 255); y = 0
    for p in parcalar:
        out.paste(p, (0, y)); y += p.height + 8
    return out

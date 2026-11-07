"""Tüm kitapçıkların sorularını PNG olarak keser ve soru bankası verisini yazar.
python3 -I hepsini_kes.py <yapi.json> <pdf klasörü> <çıktı klasörü> [işçi sayısı]"""
import json, os, sys, io, re
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kes
from PIL import Image

DILLER = ('İNGİLİZCE', 'ALMANCA', 'FRANSIZCA')

def kitap_id(b):
    return f"{b['yil']}-{b['ay']:02d}-{b['gun']:02d}-{b['oturum']}"

def ders_id(kod, ad):
    for d in DILLER:
        if ad.startswith(d):
            return kod + {'İNGİLİZCE': 'en', 'ALMANCA': 'de', 'FRANSIZCA': 'fr'}[d]
    return kod

def isle(args):
    kitap, pdfk, cikti = args
    pdf = os.path.join(pdfk, kitap['dosya'].replace('.html', '.pdf'))
    kid = kitap_id(kitap['bilgi'])
    sayfak = os.path.join(cikti, '_sayfa', kid)
    os.makedirs(sayfak, exist_ok=True)
    os.makedirs(os.path.join(cikti, 'soru', kid), exist_ok=True)
    kayit, hata = [], []
    for s in kitap['sorular']:
        did = ders_id(s['kod'], s['ad'])
        ad = f"soru/{kid}/{did}_{s['no']:02d}.png"
        yol = os.path.join(cikti, ad)
        if not os.path.exists(yol):
            im = kes.soru_resmi(pdf, kitap, s, sayfak)
            if im is None:
                hata.append(ad); continue
            idx = im.point([0 if v < 43 else 1 if v < 128 else 2 if v < 213 else 3 for v in range(256)])
            pim = Image.frombytes('P', idx.size, idx.tobytes())
            pim.putpalette([0, 0, 0, 85, 85, 85, 170, 170, 170, 255, 255, 255])
            pim.save(yol, 'PNG', optimize=True, bits=2)
        cev = kitap['cevaplar'].get(s['kod'] + '|' + s['ad']) or []
        harf = cev[s['no'] - 1] if s['no'] - 1 < len(cev) else None
        kayit.append({'k': kid, 'd': did, 'n': s['no'], 'c': 'ABCD'.index(harf) if harf in ('A', 'B', 'C', 'D') else -1})
    return kid, kitap['bilgi'], kitap['dizin'], kayit, hata

if __name__ == '__main__':
    yapi, pdfk, cikti = sys.argv[1:4]
    n = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    kitaplar = json.load(open(yapi))
    with Pool(n) as p:
        sonuc = p.map(isle, [(k, pdfk, cikti) for k in kitaplar])
    json.dump(sonuc, open(os.path.join(cikti, 'banka_ham.json'), 'w'), ensure_ascii=False)
    print('soru:', sum(len(r[3]) for r in sonuc), 'hata:', sum(len(r[4]) for r in sonuc))
    for r in sonuc:
        if r[4]: print(r[0], r[4][:5])

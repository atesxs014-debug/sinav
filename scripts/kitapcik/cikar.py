"""AÖL kitapçıklarından soruları ders koduna göre ayırır.
Kullanım: python3 -I cikar.py <pdf klasörü> <çıktı klasörü>
Çıktı: <çıktı>/yapi.json (kitapçık, ders, soru konumları, cevaplar)
"""
import json, os, re, sys, unicodedata
sys_path = __import__("sys").path; sys_path.insert(0, __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
import kelime

KOD = re.compile(r'^\(?(\d{3})\)$')
NO = re.compile(r'^(\d{1,2})\.$')
SIK = re.compile(r'^[ABCD]$')
AYLAR = {'OCAK': 1, 'ŞUBAT': 2, 'MART': 3, 'NİSAN': 4, 'MAYIS': 5, 'HAZİRAN': 6, 'TEMMUZ': 7, 'AĞUSTOS': 8, 'EYLÜL': 9, 'EKİM': 10, 'KASIM': 11, 'ARALIK': 12}


def satirlar(words, tol=2.5):
    """Kelimeleri satırlara grupla (top değerine göre)."""
    out = []
    for w in sorted(words, key=lambda w: (round(w['top']), w['x0'])):
        if out and abs(out[-1][0]['top'] - w['top']) < tol:
            out[-1].append(w)
        else:
            out.append([w])
    return [sorted(s, key=lambda w: w['x0']) for s in out]


def ad_normal(ad):
    ad = ad.replace('–', '-').replace('—', '-')
    ad = re.sub(r'\s*-\s*', ' – ', ad)
    ad = re.sub(r'\s+', ' ', ad).strip()
    ad = ad.replace('BİL.–', 'BİL. –')
    return ad


def govde_on(ws, basl):
    ust = min(w['top'] for w in basl) + 8
    return [w for w in ws if w['top'] > ust and not w['text'].startswith('ADAYLARIN')]


def dizin_oku(pg):
    """1. sayfadaki ders kodu / adı / sayfa listesini oku."""
    ws = pg['words']
    basl = [w for w in ws if w['text'] == 'DERS' and w['top'] > 150]
    if not basl:
        return []
    ust = min(w['top'] for w in basl) + 8
    alt = min([w['top'] for w in ws if w['text'].startswith('ADAYLARIN')] or [pg['h']])
    govde = [w for w in ws if ust < w['top'] < alt - 2]
    # sütunlar: "DERS KODU" başlıklarının x konumları
    # sütun başları: kod kelimelerinin "(ddd)" x konumlarını kümele
    kx = sorted(w['x0'] for w in govde_on(ws, basl) if KOD.match(w['text']))
    kumeler = []
    for x in kx:
        if kumeler and x - kumeler[-1][-1] < 40:
            kumeler[-1].append(x)
        else:
            kumeler.append([x])
    bas = [min(k) - 3 for k in kumeler]
    sinir = [(bas[i] if i else 0, bas[i + 1] if i + 1 < len(bas) else pg['w']) for i in range(len(bas))]
    girdiler = []
    for x0, x1 in sinir:
        sut = [w for w in govde if x0 <= w['x0'] < x1]
        cur = None
        for s in satirlar(sut):
            m = KOD.match(s[0]['text'])
            sayfa = s[-1]['text'] if re.fullmatch(r'\d{1,2}', s[-1]['text']) else None
            kel = [w['text'] for w in s[(1 if m else 0):(-1 if sayfa else None)]]
            if m:
                cur = {'kod': m.group(1), 'ad': ' '.join(kel), 'sayfa': int(sayfa) if sayfa else None}
                girdiler.append(cur)
            elif cur:
                cur['ad'] += ' ' + ' '.join(kel)
                if sayfa and cur['sayfa'] is None:
                    cur['sayfa'] = int(sayfa)
    for g in girdiler:
        g['ad'] = ad_normal(g['ad'])
    return girdiler


def baslik_bilgi(text):
    t = text.replace('\n', ' ')
    tarih = re.search(r'(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+(OCAK|ŞUBAT|MART|NİSAN|MAYIS|HAZİRAN|TEMMUZ|AĞUSTOS|EYLÜL|EKİM|KASIM|ARALIK)\s+(\d{4})', t)
    oturum = re.search(r'(\d)\.\s*OTURUM', t)
    donem = re.search(r'(\d{4})\s*-\s*(\d{4})\s+ÖĞRETİM YILI\s+(\d)\.\s*DÖNEM', t)
    return {
        'gun': int(tarih.group(1)) if tarih else None,
        'ay': AYLAR.get(tarih.group(3)) if tarih else None,
        'ay_ad': tarih.group(3) if tarih else None,
        'yil': int(tarih.group(4)) if tarih else None,
        'oturum': int(oturum.group(1)) if oturum else None,
        'ogretim_yili': f"{donem.group(1)}-{donem.group(2)}" if donem else None,
        'donem': int(donem.group(3)) if donem else None,
    }


def cevaplari_oku(pages, dizin):
    """Son sayfalardaki cevap anahtarı: {(kod, ad): [harf x10]}"""
    sonuc = {}
    for pg in pages:
        ws = pg['words']
        kodlar = [w for w in ws if KOD.match(w['text'])]
        # her kod başlığının adını aynı/sonraki satırdan topla
        basliklar = []
        for k in kodlar:
            kel = [w['text'] for w in ws if abs(w['top'] - k['top']) < 3 and k['x1'] < w['x0'] < k['x0'] + 120]
            basliklar.append({'w': k, 'kod': KOD.match(k['text']).group(1), 'ilk': kel[0] if kel else ''})
        cevap = {}
        for i, w in enumerate(ws):
            m = NO.match(w['text'])
            if not m:
                continue
            n = int(m.group(1))
            if not 1 <= n <= 20:
                continue
            harf = [x for x in ws if SIK.match(x['text']) and abs(x['top'] - w['top']) < 3 and 0 < x['x0'] - w['x1'] < 14]
            if not harf:
                continue
            # en yakın üstteki başlık, aynı sütunda
            aday = [b for b in basliklar if b['w']['top'] < w['top'] and abs((b['w']['x0'] + 45) - w['x0']) < 75]
            if not aday:
                continue
            b = max(aday, key=lambda b: b['w']['top'])
            cevap.setdefault(id(b), (b, {}))[1][n] = harf[0]['text']
        for b, c in cevap.values():
            ad = ad_bul(dizin, b['kod'], b['ilk'])
            if ad:
                sonuc[(b['kod'], ad)] = [c.get(i) for i in range(1, max(c) + 1)]
    return sonuc


def ad_bul(dizin, kod, ilk):
    adaylar = [g for g in dizin if g['kod'] == kod]
    if len(adaylar) == 1:
        return adaylar[0]['ad']
    for g in adaylar:
        if ilk and g['ad'].split()[0].rstrip('.').startswith(ilk.rstrip('.')[:4]):
            return g['ad']
    return adaylar[0]['ad'] if adaylar else None


def sutun_sinirlari(icerik, W):
    """Kelimelerin hiç kaplamadığı dikey boşluklardan 3 sütunu bul."""
    dolu = [False] * (int(W) + 2)
    for w in icerik:
        for x in range(int(w['x0']), int(w['x1']) + 1):
            if 0 <= x < len(dolu):
                dolu[x] = True
    def en_genis(a, b):
        best, cur, bas = None, 0, None
        for x in range(int(a), int(b)):
            if not dolu[x]:
                if bas is None: bas = x
                if x - bas + 1 > cur: cur, best = x - bas + 1, (bas, x)
            else:
                bas = None
        return best, cur
    (g1, l1) = en_genis(W * 0.22, W * 0.47)
    (g2, l2) = en_genis(W * 0.53, W * 0.78)
    b1 = (g1[0] + g1[1]) / 2 if g1 and l1 >= 4 else W * 0.345
    b2 = (g2[0] + g2[1]) / 2 if g2 and l2 >= 4 else W * 0.665
    return [(0, b1), (b1, b2), (b2, W)]


def sorulari_bul(pdf, dizin, cevap_sayfalari):
    pdf = type('P', (), {})(); pdf.pages = SAYFALAR
    """Her ders için soru bölgeleri: [{'sayfa', 'x0','x1','top','bottom'}...] listeleri."""
    dersler = {}
    sira = []  # (sayfa, sütun, y, tür, veri)
    son_sayfa = min(cevap_sayfalari) - 1 if cevap_sayfalari else len(pdf.pages)
    sutunlar = {}
    for pi in range(1, son_sayfa):
        pg = pdf.pages[pi]
        ws = pg['words']
        otr = [w['top'] for w in ws if w['text'] == 'OTURUM' and w['top'] < 60]
        UST[pi] = max([w['bottom'] for w in ws if any(abs(w['top'] - t) < 4 for t in otr)] or [38]) + 2
        icerik = [w for w in ws if 39 < w['top'] < pg['h'] - 40 and not any(abs(w['top'] - t) < 4 for t in otr)]
        if not icerik:
            continue
        W = pg['w']
        sinirlar = sutun_sinirlari(icerik, W)
        sutunlar[pi] = []
        for si, (a, b) in enumerate(sinirlar):
            sw = [w for w in icerik if a <= w['x0'] < b]
            if not sw:
                sutunlar[pi].append(None)
                continue
            sol = min(w['x0'] for w in sw)
            sag = max(w['x1'] for w in sw)
            sutunlar[pi].append((sol, sag, a, b))
            for w in sw:
                m = KOD.match(w['text'])
                if m:
                    kel = [x['text'] for x in sw if abs(x['top'] - w['top']) < 3 and x['x0'] > w['x1']]
                    sira.append((pi, si, w['top'], 'ders', (m.group(1), kel[0] if kel else '')))
                    continue
                m = NO.match(w['text'])
                if m and w['x0'] - sol < 6:
                    sira.append((pi, si, w['top'], 'no', int(m.group(1))))
    sira.sort(key=lambda e: (e[0], e[1], e[2]))
    cur = None
    beklenen = 1
    bolgeler = []  # her soru: dict(ders, no, parcalar=[(pi,si,top,bottom)])
    for e in sira:
        pi, si, y, tur, veri = e
        if tur == 'ders':
            if veri[0] not in {g['kod'] for g in dizin}:
                continue  # soru metnindeki sayı, ders başlığı değil
            ad = ad_bul(dizin, veri[0], veri[1])
            if cur == (veri[0], ad):
                continue
            cur = (veri[0], ad)
            beklenen = 1
            bolgeler.append({'tur': 'ders', 'pi': pi, 'si': si, 'y': y, 'ders': cur})
        elif cur and veri == beklenen:
            bolgeler.append({'tur': 'no', 'pi': pi, 'si': si, 'y': y, 'ders': cur, 'no': veri})
            beklenen += 1
    # her işaretten bir sonrakine kadar bölge çıkar (sütun ve sayfa geçişlerini parçalara böl)
    sorular = []
    for i, b in enumerate(bolgeler):
        if b['tur'] != 'no':
            continue
        sonraki = bolgeler[i + 1] if i + 1 < len(bolgeler) else None
        parcalar = []
        pi, si, y = b['pi'], b['si'], b['y'] - 3
        while True:
            pg = pdf.pages[pi]
            alt = pg['h'] - 40
            if sonraki and sonraki['pi'] == pi and sonraki['si'] == si:
                parcalar.append((pi, si, y, sonraki['y'] - 5 if sonraki['tur'] == 'no' else sonraki['y'] - 9))
                break
            parcalar.append((pi, si, y, alt))
            # sonraki sütuna geç
            si += 1
            if si > 2:
                si, pi = 0, pi + 1
            if pi >= son_sayfa or not sonraki or (pi, si) > (sonraki['pi'], sonraki['si']) or len(parcalar) > 3:
                break
            y = UST.get(pi, 40)
        sorular.append({'ders': b['ders'], 'no': b['no'], 'parcalar': parcalar})
    return sorular, sutunlar


SAYFALAR = []
UST = {}
def metin(pg):
    return ' '.join(w['text'] for w in pg['words'])
def isle(yol):
    global SAYFALAR
    SAYFALAR = kelime.oku(yol)
    pdf = None
    p1 = SAYFALAR[0]
    dizin = dizin_oku(p1)
    bilgi = baslik_bilgi(metin(p1))
    cevap_sayfalari = [i for i, pg in enumerate(SAYFALAR) if i > 0 and 'ANAHTARI' in metin(pg)[:600]]
    cevaplar = cevaplari_oku([SAYFALAR[i] for i in cevap_sayfalari], dizin)
    sorular, sutunlar = sorulari_bul(pdf, dizin, cevap_sayfalari)
    return pdf, dizin, bilgi, cevaplar, sorular, sutunlar


if __name__ == '__main__':
    klasor, cikti = sys.argv[1], sys.argv[2]
    os.makedirs(cikti, exist_ok=True)
    hepsi = []
    for ad in sorted(os.listdir(klasor)):
        if not ad.endswith('.html'):
            continue
        if len(sys.argv) > 3 and sys.argv[3] not in ad:
            continue
        pdf, dizin, bilgi, cevaplar, sorular, sutunlar = isle(os.path.join(klasor, ad))
        sayac = {}
        for s in sorular:
            sayac[s['ders']] = sayac.get(s['ders'], 0) + 1
        eksik = [f"{k[0]} {k[1]}:{n}" for k, n in sayac.items() if n != 10]
        cevapsiz = [f"{g['kod']} {g['ad']}" for g in dizin if (g['kod'], g['ad']) not in cevaplar]
        sorusuz = [f"{g['kod']} {g['ad']}" for g in dizin if (g['kod'], g['ad']) not in sayac]
        print(f"{ad[:45]:45} {bilgi['gun']} {bilgi['ay_ad']} {bilgi['yil']} {bilgi['oturum']}.ot dizin={len(dizin)} ders={len(sayac)} soru={len(sorular)} cevap={len(cevaplar)}")
        for etiket, liste in (('  ≠10 soru', eksik), ('  cevapsız', cevapsiz), ('  sorusuz', sorusuz)):
            if liste:
                print(etiket, '; '.join(liste))
        hepsi.append({
            'dosya': ad, 'bilgi': bilgi, 'dizin': dizin,
            'cevaplar': {f"{k[0]}|{k[1]}": v for k, v in cevaplar.items()},
            'sorular': [{'kod': s['ders'][0], 'ad': s['ders'][1], 'no': s['no'], 'parcalar': s['parcalar']} for s in sorular],
            'sutunlar': {str(k): v for k, v in sutunlar.items()},
        })
    json.dump(hepsi, open(os.path.join(cikti, 'yapi.json'), 'w'), ensure_ascii=False)

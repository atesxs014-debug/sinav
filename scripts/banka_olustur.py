"""Kesilmiş soru resimlerinden uygulamanın soru bankasını (banka.js) üretir.

python3 -I scripts/banka_olustur.py <banka_ham.json> <çıktı banka.js>
"""
import json, re, sys
from collections import defaultdict

AY = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

# Girişte sırayla sorulacak dersler: (aile adı, [(ders kimliği, görünen ad), ...])
AILELER = [
    ('Türk Dili ve Edebiyatı', [(c, f'Türk Dili ve Edebiyatı – {i}') for i, c in enumerate(['541', '542', '543', '544', '545', '546', '547', '548'], 1)]
        + [(c, f'Seçmeli Türk Dili ve Edebiyatı – {i}') for i, c in enumerate(['619', '620', '621', '622'], 1)]),
    ('Matematik', [('998', 'Matematik – 1'), ('999', 'Matematik – 2'), ('163', 'Matematik – 3'), ('164', 'Matematik – 4'),
                   ('165', 'Seçmeli Matematik – 1'), ('609', 'Seçmeli Matematik – 2'), ('467', 'Seçmeli Matematik – 3'), ('468', 'Seçmeli Matematik – 4')]),
    ('Tarih', [('131', 'Tarih – 1'), ('132', 'Tarih – 2'), ('133', 'Tarih – 3'), ('134', 'Tarih – 4'), ('137', 'Tarih – 5'), ('138', 'Tarih – 6'),
               ('135', 'Seçmeli Tarih – 1'), ('136', 'Seçmeli Tarih – 2')]),
    ('T.C. İnkılap Tarihi ve Atatürkçülük', [('141', 'İnkılap Tarihi ve Atatürkçülük – 1'), ('142', 'İnkılap Tarihi ve Atatürkçülük – 2')]),
    ('Coğrafya', [(c, f'Coğrafya – {i}') for i, c in enumerate(['151', '152', '153', '154'], 1)]
        + [(c, f'Seçmeli Coğrafya – {i}') for i, c in enumerate(['155', '156', '157', '158'], 1)]),
    ('Fizik', [(c, f'Fizik – {i}') for i, c in enumerate(['421', '422', '423', '424'], 1)]
        + [(c, f'Seçmeli Fizik – {i}') for i, c in enumerate(['425', '426', '427', '428'], 1)]),
    ('Kimya', [(c, f'Kimya – {i}') for i, c in enumerate(['431', '432', '433', '434'], 1)]
        + [(c, f'Seçmeli Kimya – {i}') for i, c in enumerate(['435', '436', '437', '438'], 1)]),
    ('Biyoloji', [(c, f'Biyoloji – {i}') for i, c in enumerate(['441', '442', '443', '444'], 1)]
        + [(c, f'Seçmeli Biyoloji – {i}') for i, c in enumerate(['445', '446', '447', '448'], 1)]),
    ('Felsefe', [('121', 'Felsefe – 1'), ('122', 'Felsefe – 2'), ('125', 'Felsefe – 3'), ('126', 'Felsefe – 4')]),
    ('Din Kültürü ve Ahlak Bilgisi', [(str(110 + i), f'Din Kültürü ve Ahlak Bilgisi – {i}') for i in range(1, 9)]),
    ('İngilizce', [(c + 'en', f'İngilizce – {i}') for i, c in enumerate(['181', '182', '242', '243', '244', '500', '501', '502'], 1)]),
    ('Almanca', [(c + 'de', f'Almanca – {i}') for i, c in enumerate(['181', '182', '242', '243', '244', '500', '501', '502'], 1)]),
    ('Fransızca', [(c + 'fr', f'Fransızca – {i}') for i, c in enumerate(['181', '182', '242', '243', '244', '500', '501', '502'], 1)]),
    ('Sağlık Bilgisi ve Trafik Kültürü', [('221', 'Sağlık Bilgisi ve Trafik Kültürü – 1'), ('222', 'Sağlık Bilgisi ve Trafik Kültürü – 2')]),
    ('Demokrasi ve İnsan Hakları', [('455', 'Seçmeli Demokrasi ve İnsan Hakları – 1'), ('608', 'Seçmeli Demokrasi ve İnsan Hakları – 2')]),
    ('Ortak Türk Tarihi', [('195', 'Seçmeli Ortak Türk Tarihi – 1'), ('196', 'Seçmeli Ortak Türk Tarihi – 2')]),
    ('Çağdaş Türk ve Dünya Tarihi', [('451', 'Seçmeli Çağdaş Türk ve Dünya Tarihi – 1'), ('452', 'Seçmeli Çağdaş Türk ve Dünya Tarihi – 2')]),
    ('Psikoloji', [('206', 'Seçmeli Psikoloji – 1'), ('207', 'Seçmeli Psikoloji – 2')]),
    ('Sosyoloji', [('208', 'Seçmeli Sosyoloji – 1'), ('209', 'Seçmeli Sosyoloji – 2')]),
    ('Mantık', [('478', 'Seçmeli Mantık – 1'), ('479', 'Seçmeli Mantık – 2')]),
    ('Girişimcilik', [('974', 'Seçmeli Girişimcilik – 1'), ('975', 'Seçmeli Girişimcilik – 2')]),
    ('Temel Dini Bilgiler', [('465', 'Temel Dini Bilgiler – 1'), ('466', 'Temel Dini Bilgiler – 2')]),
    ('Peygamberimizin Hayatı', [(str(530 + i), f'Seçmeli Peygamberimizin Hayatı – {i}') for i in range(1, 9)]),
    ('Fıkıh', [('511', 'Fıkıh – 1'), ('512', 'Fıkıh – 2')]),
    ('Siyer', [('931', 'Siyer – 1'), ('932', 'Siyer – 2')]),
    ('Akaid', [('817', 'Akaid – 1'), ('818', 'Akaid – 2')]),
    ('Kelam', [('819', 'Kelam – 1'), ('820', 'Kelam – 2')]),
    ('Dinler Tarihi', [('611', 'Dinler Tarihi – 1'), ('612', 'Dinler Tarihi – 2')]),
    ('İslam Kültür ve Medeniyeti', [('713', 'İslam Kültür ve Medeniyeti – 1'), ('714', 'İslam Kültür ve Medeniyeti – 2')]),
    ('Osmanlı Türkçesi', [('825', 'Osmanlı Türkçesi – 1'), ('826', 'Osmanlı Türkçesi – 2')]),
]


def main(ham_yol, cikti):
    ham = json.load(open(ham_yol))
    kitaplar = {}
    sorular = defaultdict(lambda: defaultdict(dict))  # ders -> kitap -> no -> cevap
    for kid, bilgi, dizin, kayit, hata in ham:
        kitaplar[kid] = {
            'ad': f"{bilgi['gun']} {AY[bilgi['ay']]} {bilgi['yil']}",
            'donem': f"{bilgi['ogretim_yili']} {bilgi['donem']}. Dönem" if bilgi.get('ogretim_yili') else '',
            'oturum': bilgi['oturum'],
        }
        for s in kayit:
            sorular[s['d']][s['k']][s['n']] = s['c']
    tanimli = {d for _, ds in AILELER for d, _ in ds}
    eksik = sorted(set(sorular) - tanimli)
    if eksik:
        sys.exit('Ailesi tanımlı olmayan dersler: ' + ', '.join(eksik))

    dersler, aileler = {}, []
    for aile, ds in AILELER:
        uyeler = []
        for d, ad in ds:
            if d not in sorular:
                print('Uyarı: sorusu olmayan ders', d, ad)
                continue
            sinavlar = []
            for kid in sorted(sorular[d], reverse=True):  # en yeni sınav önce
                no = sorular[d][kid]
                n = max(no)
                eksikler = [i for i in range(1, n + 1) if i not in no]
                if eksikler:
                    sys.exit(f'{d} {kid}: eksik soru {eksikler}')
                sinavlar.append({'k': kid, 'c': [no[i] for i in range(1, n + 1)]})
            kod = re.match(r'\d+', d).group(0)
            dersler[d] = {'ad': ad, 'kod': kod, 's': sinavlar}
            uyeler.append(d)
        if uyeler:
            aileler.append({'ad': aile, 'd': uyeler})

    veri = {'kitaplar': kitaplar, 'dersler': dersler, 'aileler': aileler}
    toplam = sum(len(c) for x in dersler.values() for s in x['s'] for c in [s['c']])
    iptal = sum(1 for x in dersler.values() for s in x['s'] for v in s['c'] if v < 0)
    with open(cikti, 'w', encoding='utf-8') as f:
        f.write('window.BANKA=' + json.dumps(veri, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'{len(aileler)} ders grubu, {len(dersler)} ders kodu, {len(kitaplar)} kitapçık, {toplam} soru ({iptal} iptal)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

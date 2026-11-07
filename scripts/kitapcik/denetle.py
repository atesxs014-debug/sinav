import json, sys
d=json.load(open(sys.argv[1]))
toplam=0
for k in d:
    say={}
    for s in k['sorular']: say[(s['kod'],s['ad'])]=say.get((s['kod'],s['ad']),0)+1
    sorun=[]
    for g in k['dizin']:
        key=(g['kod'],g['ad']); c=k['cevaplar'].get(g['kod']+'|'+g['ad'])
        n=say.get(key,0); m=len(c) if c else 0
        if n!=m or m==0 or (c and None in c): sorun.append(f"{g['kod']} {g['ad']} soru={n} cevap={m}")
        else: toplam+=n
    print(k['dosya'][:40], k['bilgi']['gun'],k['bilgi']['ay_ad'],k['bilgi']['yil'],k['bilgi']['oturum'],'dizin',len(k['dizin']), '| sorun:', '; '.join(sorun) or 'yok')
print('sağlam soru:', toplam)

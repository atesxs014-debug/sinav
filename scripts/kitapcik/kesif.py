import pdfplumber, re, sys
f=sys.argv[1]
pdf=pdfplumber.open(f)
for i,pg in enumerate(pdf.pages):
    ws=pg.extract_words(keep_blank_chars=False, use_text_flow=False)
    txt=' '.join(w['text'] for w in ws[:40])
    if 'CEVAP ANAHTARI' in pg.extract_text()[:600]:
        print('page',i+1,'ANSWER KEY'); continue
    for w in ws:
        if re.fullmatch(r'\(\d{3}\)', w['text']) and i>0:
            line=[x['text'] for x in ws if abs(x['top']-w['top'])<3 and x['x0']>=w['x0']-1 and x['x0']<w['x0']+170]
            boxes=[r for r in pg.rects if r['x0']-2<=w['x0']<=r['x1'] and r['top']-2<=w['top']<=r['bottom']]
            print(i+1, round(w['x0']), round(w['top']), ' '.join(line), 'box' if boxes else 'nobox', [ (round(b['x0']),round(b['top']),round(b['x1']),round(b['bottom'])) for b in boxes][:1])

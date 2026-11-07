import re, html
def oku(yol):
    """pdftotext -bbox çıktısını sayfa sayfa kelime listesine çevirir."""
    sayfalar = []
    rx_page = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">')
    rx_w = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')
    for blok in open(yol, encoding='utf-8').read().split('<page ')[1:]:
        m = rx_page.match('<page ' + blok)
        W, H = float(m.group(1)), float(m.group(2))
        ws = [{'x0': float(a), 'top': float(b), 'x1': float(c), 'bottom': float(d), 'text': html.unescape(t)} for a, b, c, d, t in rx_w.findall(blok)]
        sayfalar.append({'w': W, 'h': H, 'words': ws})
    return sayfalar

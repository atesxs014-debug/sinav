// Soru dosyalarını doğrular, şıkları karıştırır ve 50 testi üretir.
// Çalıştırma: node scripts/build-data.js
const fs = require('fs');
const path = require('path');

const DERSLER = ['edebiyat', 'matematik', 'tarih', 'cografya', 'fizik', 'kimya', 'biyoloji', 'felsefe', 'demokrasi', 'trafik', 'saglik'];
const dataDir = path.join(__dirname, '..', 'data');

// Tekrarlanabilir rastgelelik (her derlemede aynı sonuç)
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const hatalar = [];
const dersler = [];
const tumSorular = [];

for (const id of DERSLER) {
  const d = JSON.parse(fs.readFileSync(path.join(dataDir, id + '.json'), 'utf8'));
  if (d.sorular.length !== 30) hatalar.push(`${id}: ${d.sorular.length} soru var (30 olmalı)`);
  const gorulen = new Set();
  d.sorular.forEach((q, i) => {
    const qid = `${id}-${i + 1}`;
    if (!Array.isArray(q.secenekler) || q.secenekler.length !== 4) hatalar.push(`${qid}: 4 şık yok`);
    if (!(q.dogru >= 0 && q.dogru < 4)) hatalar.push(`${qid}: doğru cevap geçersiz`);
    if (new Set(q.secenekler).size !== q.secenekler.length) hatalar.push(`${qid}: tekrar eden şık`);
    if (gorulen.has(q.soru)) hatalar.push(`${qid}: tekrar eden soru`);
    gorulen.add(q.soru);
    if (![1, 2, 3].includes(q.test)) hatalar.push(`${qid}: test numarası hatalı`);
    // Şıkları karıştır, doğru cevabı takip et
    const r = rng(hash(qid));
    const idx = [0, 1, 2, 3];
    for (let k = 3; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
    q.id = qid;
    q.ders = id;
    q.secenekler = idx.map((o) => q.secenekler[o]);
    q.dogru = idx.indexOf(q.dogru);
  });
  for (const t of [1, 2, 3]) {
    const n = d.sorular.filter((q) => q.test === t).length;
    if (n !== 10) hatalar.push(`${id}: test ${t} içinde ${n} soru var (10 olmalı)`);
  }
  dersler.push({ id: d.id, ad: d.ad, renk: d.renk });
  tumSorular.push(...d.sorular);
}

if (hatalar.length) { console.error('HATALAR:\n' + hatalar.join('\n')); process.exit(1); }

// 33 konu testi
const testler = [];
for (const d of dersler) {
  for (const t of [1, 2, 3]) {
    const qs = tumSorular.filter((q) => q.ders === d.id && q.test === t);
    const konular = [...new Set(qs.map((q) => q.konu))];
    testler.push({ id: `${d.id}-t${t}`, tur: 'konu', ders: d.id, ad: `${d.ad} – Test ${t}`, aciklama: konular.slice(0, 4).join(', '), sorular: qs.map((q) => q.id), sure: 15 });
  }
}
// 17 karma deneme: her biri 20 soru, derslerden dengeli
for (let n = 1; n <= 17; n++) {
  const r = rng(hash('deneme' + n));
  const secilen = [];
  const sira = [...dersler].sort(() => r() - 0.5);
  let i = 0;
  while (secilen.length < 20) {
    const d = sira[i % sira.length];
    const havuz = tumSorular.filter((q) => q.ders === d.id && !secilen.includes(q.id));
    secilen.push(havuz[Math.floor(r() * havuz.length)].id);
    i++;
  }
  testler.push({ id: `deneme-${n}`, tur: 'deneme', ad: `Karma Deneme ${n}`, aciklama: 'Tüm derslerden 20 soru', sorular: secilen, sure: 30 });
}

const dagilim = [0, 0, 0, 0];
tumSorular.forEach((q) => dagilim[q.dogru]++);
console.log(`${dersler.length} ders, ${tumSorular.length} soru, ${testler.length} test`);
console.log(`Doğru cevap dağılımı A/B/C/D: ${dagilim.join(' / ')}`);

const sorularObj = Object.fromEntries(tumSorular.map((q) => [q.id, { id: q.id, ders: q.ders, konu: q.konu, soru: q.soru, secenekler: q.secenekler, dogru: q.dogru, aciklama: q.aciklama }]));
const cikti = { dersler, sorular: sorularObj, testler };
fs.writeFileSync(path.join(__dirname, '..', 'src', 'veri.json'), JSON.stringify(cikti));
console.log('src/veri.json yazıldı');

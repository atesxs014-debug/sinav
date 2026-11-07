// Android uygulamasının sayfasını assets klasörüne kopyalar.
// Soru bankası (banka.js) ve soru resimleri (soru/) scripts/banka_olustur.py ve kesim betikleriyle üretilir.
const fs = require('fs');
const path = require('path');
const kok = path.join(__dirname, '..');
const assets = path.join(kok, 'android-app', 'app', 'src', 'main', 'assets');
fs.mkdirSync(assets, { recursive: true });
fs.copyFileSync(path.join(kok, 'android-app', 'web', 'sablon.html'), path.join(assets, 'index.html'));
for (const f of ['banka.js']) {
  if (!fs.existsSync(path.join(assets, f))) { console.error('Eksik: ' + f); process.exit(1); }
}
console.log('index.html kopyalandı');

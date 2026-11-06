// Android uygulamasının sayfasını üretir: android-app/web/sablon.html + src/veri.json
// Çalıştırma: node scripts/build-data.js && node scripts/build-android-html.js
const fs = require('fs');
const path = require('path');
const kok = path.join(__dirname, '..');
const veri = fs.readFileSync(path.join(kok, 'src', 'veri.json'), 'utf8').replace(/<\//g, '<\\/');
const sablon = fs.readFileSync(path.join(kok, 'android-app', 'web', 'sablon.html'), 'utf8');
const cikti = path.join(kok, 'android-app', 'app', 'src', 'main', 'assets', 'index.html');
fs.mkdirSync(path.dirname(cikti), { recursive: true });
fs.writeFileSync(cikti, sablon.replace('__VERI__', () => veri));
console.log('Yazıldı:', path.relative(kok, cikti), Math.round(fs.statSync(cikti).size / 1024) + ' KB');

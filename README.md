# Açık Lise Çıkmış Sorular

24 AÖL kitapçığından (Aralık 2023 – Mart 2026) 11.454 çıkmış soru, 138 ders kodu.
Girişte her ders için kod seçilir (ör. Coğrafya – 3) ya da "Atla" ile geçilir; uygulama yalnızca seçilen kodların sorularını gösterir.

Soru resimleri `android-app/app/src/main/assets/soru/<kitapçık>/<ders>_<no>.png`, cevaplar `banka.js` içinde.
Yeniden üretmek için: `scripts/kitapcik/` (kitapçıkları ayırma ve kesme) ve `scripts/banka_olustur.py`.

## Android (4.4 ve üstü)
- Kod: `android-app/` (bağımlılıksız Java + WebView, minSdk 19, v1+v2 imza)
- Arayüz: `android-app/web/sablon.html` (eski telefonlar için ES5)
- Sorular: `data/<ders>.json`
- Derleme: Actions → "APK ve IPA Derle" → platform: android. APK, Releases sayfasına düşer.
- Kalıcı imza için repo secret'ları: `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## iOS
- Kök dizindeki Expo projesi (`App.js`). Actions → platform: ios → imzasız IPA.

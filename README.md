# Açık Lise Hazırlık

11 ders, 330 soru, 50 test (33 konu testi + 17 karma deneme), yanlış tekrarı, çıkmış soru kitapçıkları (PDF) için optik form.

## Android (4.4 ve üstü)
- Kod: `android-app/` (bağımlılıksız Java + WebView, minSdk 19, v1+v2 imza)
- Arayüz: `android-app/web/sablon.html` (eski telefonlar için ES5)
- Sorular: `data/<ders>.json`
- Derleme: Actions → "APK ve IPA Derle" → platform: android. APK, Releases sayfasına düşer.
- Kalıcı imza için repo secret'ları: `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## iOS
- Kök dizindeki Expo projesi (`App.js`). Actions → platform: ios → imzasız IPA.

package com.burak.aciklise;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {

    private static final int PDF_SEC = 41;
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F4F5F7"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);   // ilerleme kaydı (localStorage)
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setSupportZoom(true);           // soru resimlerini iki parmakla büyütme
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file:")) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Kopru(), "Android");
        web.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.geriTusu ? geriTusu() : false", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                if (!"true".equals(value)) finish();
            }
        });
    }

    private void js(final String kod) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                web.evaluateJavascript(kod, null);
            }
        });
    }

    private void mesaj(final String m) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, m, Toast.LENGTH_LONG).show();
            }
        });
    }

    static File pdfKlasoru(android.content.Context c) {
        File d = new File(c.getFilesDir(), "pdf");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    /** Sayfadaki JavaScript'in çağırdığı köprü: window.Android */
    class Kopru {
        @JavascriptInterface
        public void pdfSec() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                    i.setType("application/pdf");
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    try {
                        startActivityForResult(Intent.createChooser(i, "PDF kitapçık seç"), PDF_SEC);
                    } catch (Exception e) {
                        mesaj("Dosya seçici açılamadı.");
                    }
                }
            });
        }

        @JavascriptInterface
        public void pdfAc(String id) {
            if (id == null || !id.matches("\\d+")) return;
            File f = new File(pdfKlasoru(MainActivity.this), id + ".pdf");
            if (!f.exists()) {
                mesaj("PDF dosyası bulunamadı. Kitapçığı silip yeniden ekleyebilirsin.");
                return;
            }
            final Intent v = new Intent(Intent.ACTION_VIEW);
            v.setDataAndType(Uri.parse("content://" + getPackageName() + ".pdf/" + id + ".pdf"), "application/pdf");
            v.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        startActivity(v);
                    } catch (ActivityNotFoundException e) {
                        mesaj("Telefonunda PDF açacak uygulama yok. Google Drive veya bir PDF okuyucu yükleyip tekrar dene.");
                    }
                }
            });
        }

        @JavascriptInterface
        public void pdfSil(String id) {
            if (id == null || !id.matches("\\d+")) return;
            new File(pdfKlasoru(MainActivity.this), id + ".pdf").delete();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PDF_SEC || resultCode != RESULT_OK || data == null || data.getData() == null) return;
        final Uri uri = data.getData();
        mesaj("Kitapçık ekleniyor…");
        new Thread(new Runnable() {
            @Override
            public void run() {
                String id = String.valueOf(System.currentTimeMillis());
                File hedef = new File(pdfKlasoru(MainActivity.this), id + ".pdf");
                InputStream in = null;
                OutputStream out = null;
                try {
                    in = getContentResolver().openInputStream(uri);
                    out = new FileOutputStream(hedef);
                    byte[] tampon = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(tampon)) > 0) out.write(tampon, 0, n);
                    out.close();
                    out = null;
                    js("pdfEklendi(" + JSONObject.quote(id) + "," + JSONObject.quote(isimBul(uri)) + ")");
                } catch (Exception e) {
                    hedef.delete();
                    mesaj("PDF eklenemedi. Dosyayı telefona indirip tekrar dene.");
                } finally {
                    try { if (in != null) in.close(); } catch (Exception ignored) { }
                    try { if (out != null) out.close(); } catch (Exception ignored) { }
                }
            }
        }).start();
    }

    private String isimBul(Uri uri) {
        String ad = null;
        Cursor c = null;
        try {
            c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (c != null && c.moveToFirst()) ad = c.getString(0);
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        if (ad == null || ad.trim().isEmpty()) ad = uri.getLastPathSegment();
        return ad == null ? "Kitapçık" : ad;
    }
}

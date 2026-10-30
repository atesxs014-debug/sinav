import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import VERI from './src/veri.json';
import { bosDurum, kaydet, pdfAc, pdfSec, pdfSil, yukle } from './src/depo';

const HARF = ['A', 'B', 'C', 'D'];
const R = {
  zemin: '#F5F3EE', kart: '#FFFFFF', yazi: '#1D2433', soluk: '#6B7280', cizgi: '#E5E1D8',
  ana: '#1F3A5F', dogru: '#2E9E5B', yanlis: '#D64545', bos: '#9CA3AF',
};
const dersBul = (id) => VERI.dersler.find((d) => d.id === id);

export default function App() {
  const [durum, setDurum] = useState(bosDurum);
  const [hazir, setHazir] = useState(false);
  const [yigin, setYigin] = useState([{ ekran: 'ana' }]);
  const ekran = yigin[yigin.length - 1];

  useEffect(() => { yukle().then((d) => { setDurum(d); setHazir(true); }); }, []);

  const guncelle = (fn) => setDurum((d) => { const y = fn(d); kaydet(y); return y; });
  const git = (e) => setYigin((y) => [...y, e]);
  const geri = () => setYigin((y) => (y.length > 1 ? y.slice(0, -1) : y));
  const anaya = () => setYigin([{ ekran: 'ana' }]);

  useEffect(() => {
    const s = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ekran.ekran === 'test') { testtenCikSor(geri); return true; }
      if (yigin.length > 1) { geri(); return true; }
      return false;
    });
    return () => s.remove();
  }, [yigin]);

  if (!hazir) return null;

  const props = { durum, guncelle, git, geri, anaya, ekran };
  let icerik;
  switch (ekran.ekran) {
    case 'ders': icerik = <DersEkrani {...props} />; break;
    case 'test': icerik = <TestEkrani key={ekran.anahtar} {...props} />; break;
    case 'sonuc': icerik = <SonucEkrani {...props} />; break;
    case 'denemeler': icerik = <DenemelerEkrani {...props} />; break;
    case 'yanlislar': icerik = <YanlislarEkrani {...props} />; break;
    case 'cikmis': icerik = <CikmisEkrani {...props} />; break;
    case 'optik': icerik = <OptikEkrani {...props} />; break;
    default: icerik = <AnaEkran {...props} />;
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: R.zemin }} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        {icerik}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function testtenCikSor(cik) {
  Alert.alert('Testten çık', 'Cevapların kaydedilmeyecek. Çıkmak istiyor musun?', [
    { text: 'Devam et', style: 'cancel' },
    { text: 'Çık', style: 'destructive', onPress: cik },
  ]);
}

/* ---------- Ortak parçalar ---------- */
function Baslik({ baslik, alt, geri, sag }) {
  return (
    <View style={s.baslik}>
      {geri ? <Pressable onPress={geri} hitSlop={12} style={s.geriBtn}><Text style={s.geriYazi}>‹</Text></Pressable> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.baslikYazi} numberOfLines={1}>{baslik}</Text>
        {alt ? <Text style={s.altYazi} numberOfLines={1}>{alt}</Text> : null}
      </View>
      {sag}
    </View>
  );
}
function Buton({ yazi, onPress, tip = 'ana', style, kucuk }) {
  const renk = tip === 'ana' ? R.ana : tip === 'tehlike' ? R.yanlis : 'transparent';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.buton, kucuk && s.butonKucuk, { backgroundColor: renk, opacity: pressed ? 0.8 : 1 }, tip === 'cizgi' && s.butonCizgi, style]}>
      <Text style={[s.butonYazi, tip === 'cizgi' && { color: R.ana }]}>{yazi}</Text>
    </Pressable>
  );
}
function Cubuk({ oran, renk }) {
  return <View style={s.cubuk}><View style={[s.cubukDolu, { width: `${Math.round(oran * 100)}%`, backgroundColor: renk }]} /></View>;
}

/* ---------- Ana ekran ---------- */
function AnaEkran({ durum, git }) {
  const sonuclar = Object.values(durum.sonuclar);
  const cozulen = sonuclar.length;
  const toplamDogru = sonuclar.reduce((a, r) => a + r.dogru, 0);
  const toplamSoru = sonuclar.reduce((a, r) => a + r.toplam, 0);
  const basari = toplamSoru ? Math.round((toplamDogru / toplamSoru) * 100) : 0;
  return (
    <ScrollView contentContainerStyle={s.sayfa}>
      <Text style={s.ustEtiket}>AÇIK LİSE HAZIRLIK</Text>
      <Text style={s.buyukBaslik}>Bugün ne çalışıyoruz?</Text>

      <View style={s.ozetKart}>
        <View style={s.ozetKutu}><Text style={s.ozetSayi}>{cozulen}<Text style={s.ozetKucuk}>/{VERI.testler.length}</Text></Text><Text style={s.ozetEtiket}>Test çözüldü</Text></View>
        <View style={s.ozetAyrac} />
        <View style={s.ozetKutu}><Text style={s.ozetSayi}>%{basari}</Text><Text style={s.ozetEtiket}>Başarı</Text></View>
        <View style={s.ozetAyrac} />
        <View style={s.ozetKutu}><Text style={s.ozetSayi}>{durum.yanlislar.length}</Text><Text style={s.ozetEtiket}>Tekrar edilecek</Text></View>
      </View>

      <View style={s.ikiliSatir}>
        <Pressable style={[s.buyukKart, { backgroundColor: R.ana }]} onPress={() => git({ ekran: 'denemeler' })}>
          <Text style={s.buyukKartBaslik}>Karma Denemeler</Text>
          <Text style={s.buyukKartAlt}>17 deneme · 20'şer soru</Text>
        </Pressable>
        <Pressable style={[s.buyukKart, { backgroundColor: '#8A5A2B' }]} onPress={() => git({ ekran: 'cikmis' })}>
          <Text style={s.buyukKartBaslik}>Çıkmış Sorular</Text>
          <Text style={s.buyukKartAlt}>MEB kitapçıkları + optik</Text>
        </Pressable>
      </View>
      {durum.yanlislar.length > 0 && (
        <Pressable style={s.yanlisBandi} onPress={() => git({ ekran: 'yanlislar' })}>
          <Text style={s.yanlisBandiYazi}>Yanlış yaptığın {durum.yanlislar.length} soruyu tekrar et</Text>
          <Text style={s.yanlisBandiOk}>›</Text>
        </Pressable>
      )}

      <Text style={s.bolumBaslik}>Dersler</Text>
      {VERI.dersler.map((d) => {
        const testler = VERI.testler.filter((t) => t.ders === d.id);
        const biten = testler.filter((t) => durum.sonuclar[t.id]).length;
        return (
          <Pressable key={d.id} style={s.dersSatir} onPress={() => git({ ekran: 'ders', ders: d.id })}>
            <View style={[s.dersNokta, { backgroundColor: d.renk }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.dersAd}>{d.ad}</Text>
              <Cubuk oran={biten / testler.length} renk={d.renk} />
            </View>
            <Text style={s.dersSayac}>{biten}/{testler.length}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Ders ekranı ---------- */
function TestSatiri({ t, sonuc, git, renk }) {
  return (
    <Pressable style={s.testSatir} onPress={() => git({ ekran: 'test', test: t.id, anahtar: Date.now() })}>
      <View style={{ flex: 1 }}>
        <Text style={s.testAd}>{t.ad}</Text>
        <Text style={s.testAlt} numberOfLines={1}>{t.aciklama}</Text>
      </View>
      {sonuc ? (
        <View style={[s.rozet, { backgroundColor: renk + '22' }]}><Text style={[s.rozetYazi, { color: renk }]}>{sonuc.dogru}/{sonuc.toplam}</Text></View>
      ) : (
        <Text style={s.testSure}>{t.sorular.length} soru · {t.sure} dk</Text>
      )}
    </Pressable>
  );
}
function DersEkrani({ durum, git, geri, ekran }) {
  const d = dersBul(ekran.ders);
  const testler = VERI.testler.filter((t) => t.ders === d.id);
  const konular = [...new Set(testler.flatMap((t) => t.sorular.map((q) => VERI.sorular[q].konu)))];
  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik={d.ad} alt={`${testler.length} test · 30 soru`} geri={geri} />
      <ScrollView contentContainerStyle={s.sayfa}>
        {testler.map((t) => <TestSatiri key={t.id} t={t} sonuc={durum.sonuclar[t.id]} git={git} renk={d.renk} />)}
        <Text style={s.bolumBaslik}>Bu dersteki konular</Text>
        <View style={s.etiketler}>{konular.map((k) => <Text key={k} style={s.etiket}>{k}</Text>)}</View>
      </ScrollView>
    </View>
  );
}
function DenemelerEkrani({ durum, git, geri }) {
  const testler = VERI.testler.filter((t) => t.tur === 'deneme');
  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik="Karma Denemeler" alt="Her denemede tüm derslerden sorular" geri={geri} />
      <ScrollView contentContainerStyle={s.sayfa}>
        {testler.map((t) => <TestSatiri key={t.id} t={t} sonuc={durum.sonuclar[t.id]} git={git} renk={R.ana} />)}
      </ScrollView>
    </View>
  );
}

/* ---------- Test çözme ---------- */
function TestEkrani({ durum, guncelle, git, geri, ekran }) {
  const tekrar = ekran.test === 'yanlislar';
  const test = tekrar
    ? { id: 'yanlislar', ad: 'Yanlışları Tekrar', sorular: ekran.sorular, sure: Math.max(5, ekran.sorular.length * 1.5) }
    : VERI.testler.find((t) => t.id === ekran.test);
  const sorular = test.sorular.map((id) => VERI.sorular[id]);
  const [sira, setSira] = useState(0);
  const [cevaplar, setCevaplar] = useState({});
  const [kalan, setKalan] = useState(Math.round(test.sure * 60));
  const bitti = useRef(false);

  useEffect(() => {
    const z = setInterval(() => setKalan((k) => (k > 0 ? k - 1 : 0)), 1000);
    return () => clearInterval(z);
  }, []);
  useEffect(() => { if (kalan === 0 && !bitti.current) bitir(); }, [kalan]);

  const q = sorular[sira];
  const ders = dersBul(q.ders);
  const cevaplanan = Object.keys(cevaplar).length;

  function bitir() {
    if (bitti.current) return;
    bitti.current = true;
    let dogru = 0, yanlis = 0;
    const yeniYanlis = [], dogruOlanlar = [];
    sorular.forEach((x) => {
      const c = cevaplar[x.id];
      if (c === undefined) return;
      if (c === x.dogru) { dogru++; dogruOlanlar.push(x.id); } else { yanlis++; yeniYanlis.push(x.id); }
    });
    const sonuc = { dogru, yanlis, bos: sorular.length - dogru - yanlis, toplam: sorular.length, cevaplar, tarih: Date.now() };
    guncelle((d) => {
      const yl = new Set(d.yanlislar);
      yeniYanlis.forEach((id) => yl.add(id));
      dogruOlanlar.forEach((id) => yl.delete(id));
      const sonuclar = tekrar ? d.sonuclar : { ...d.sonuclar, [test.id]: sonuc };
      return { ...d, sonuclar, yanlislar: [...yl] };
    });
    geri();
    git({ ekran: 'sonuc', test: test.id, sorular: test.sorular, sonuc, ad: test.ad });
  }
  function bitirSor() {
    const bos = sorular.length - cevaplanan;
    Alert.alert('Testi bitir', bos ? `${bos} soru boş. Yine de bitirmek istiyor musun?` : 'Testi bitirmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' }, { text: 'Bitir', onPress: bitir },
    ]);
  }
  const dk = String(Math.floor(kalan / 60)).padStart(2, '0');
  const sn = String(kalan % 60).padStart(2, '0');

  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik={test.ad} alt={`${sira + 1}. soru / ${sorular.length}`} geri={() => testtenCikSor(geri)}
        sag={<Text style={[s.sayac, kalan < 60 && { color: R.yanlis }]}>{dk}:{sn}</Text>} />
      <Cubuk oran={cevaplanan / sorular.length} renk={ders.renk} />
      <ScrollView contentContainerStyle={s.sayfa}>
        <Text style={[s.soruDers, { color: ders.renk }]}>{ders.ad} · {q.konu}</Text>
        <Text style={s.soruMetin}>{sira + 1}. {q.soru}</Text>
        {q.secenekler.map((o, i) => {
          const secili = cevaplar[q.id] === i;
          return (
            <Pressable key={i} onPress={() => setCevaplar((c) => { const y = { ...c }; if (secili) delete y[q.id]; else y[q.id] = i; return y; })}
              style={[s.secenek, secili && { borderColor: R.ana, backgroundColor: '#E8EEF6' }]}>
              <View style={[s.harf, secili && { backgroundColor: R.ana, borderColor: R.ana }]}><Text style={[s.harfYazi, secili && { color: '#fff' }]}>{HARF[i]}</Text></View>
              <Text style={s.secenekYazi}>{o}</Text>
            </Pressable>
          );
        })}
        <View style={s.noktalar}>
          {sorular.map((x, i) => (
            <Pressable key={x.id} onPress={() => setSira(i)} style={[s.nokta, cevaplar[x.id] !== undefined && { backgroundColor: R.ana }, i === sira && { borderColor: R.yazi, borderWidth: 2 }]}>
              <Text style={[s.noktaYazi, cevaplar[x.id] !== undefined && { color: '#fff' }]}>{i + 1}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={s.altBar}>
        <Buton yazi="‹ Önceki" tip="cizgi" kucuk onPress={() => setSira((x) => Math.max(0, x - 1))} style={{ flex: 1, opacity: sira === 0 ? 0.4 : 1 }} />
        {sira < sorular.length - 1
          ? <Buton yazi="Sonraki ›" kucuk onPress={() => setSira((x) => x + 1)} style={{ flex: 1 }} />
          : <Buton yazi="Testi Bitir" kucuk onPress={bitirSor} style={{ flex: 1, backgroundColor: R.dogru }} />}
      </View>
    </View>
  );
}

/* ---------- Sonuç ---------- */
function SonucEkrani({ git, anaya, geri, ekran }) {
  const { sonuc, sorular: ids, ad, test } = ekran;
  const [filtre, setFiltre] = useState('hepsi');
  const sorular = ids.map((id) => VERI.sorular[id]);
  const net = sonuc.dogru - sonuc.yanlis / 4;
  const puan = Math.max(0, Math.round((sonuc.dogru / sonuc.toplam) * 100));
  const gosterilen = sorular.filter((q) => {
    const c = sonuc.cevaplar[q.id];
    if (filtre === 'yanlis') return c !== undefined && c !== q.dogru;
    if (filtre === 'bos') return c === undefined;
    return true;
  });
  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik="Sonuç" alt={ad} geri={geri} />
      <ScrollView contentContainerStyle={s.sayfa}>
        <View style={s.sonucKart}>
          <Text style={s.puan}>{puan}</Text>
          <Text style={s.puanEtiket}>{puan >= 50 ? 'Geçer not! Böyle devam.' : 'Biraz daha çalışalım.'}</Text>
          <View style={s.sonucSatir}>
            <Text style={[s.sonucSayi, { color: R.dogru }]}>{sonuc.dogru} doğru</Text>
            <Text style={[s.sonucSayi, { color: R.yanlis }]}>{sonuc.yanlis} yanlış</Text>
            <Text style={[s.sonucSayi, { color: R.bos }]}>{sonuc.bos} boş</Text>
          </View>
          <Text style={s.netYazi}>Net: {net.toFixed(2)}</Text>
        </View>
        <View style={s.ikiliSatir}>
          {test !== 'yanlislar' && <Buton yazi="Tekrar Çöz" tip="cizgi" onPress={() => { geri(); git({ ekran: 'test', test, anahtar: Date.now() }); }} style={{ flex: 1 }} />}
          <Buton yazi="Ana Sayfa" onPress={anaya} style={{ flex: 1 }} />
        </View>
        <View style={s.filtreler}>
          {[['hepsi', 'Tümü'], ['yanlis', 'Yanlışlar'], ['bos', 'Boşlar']].map(([k, y]) => (
            <Pressable key={k} onPress={() => setFiltre(k)} style={[s.filtre, filtre === k && { backgroundColor: R.ana }]}>
              <Text style={[s.filtreYazi, filtre === k && { color: '#fff' }]}>{y}</Text>
            </Pressable>
          ))}
        </View>
        {gosterilen.map((q) => <CozumKarti key={q.id} q={q} cevap={sonuc.cevaplar[q.id]} no={ids.indexOf(q.id) + 1} />)}
        {gosterilen.length === 0 && <Text style={s.bosYazi}>Bu listede soru yok.</Text>}
      </ScrollView>
    </View>
  );
}
function CozumKarti({ q, cevap, no }) {
  const ders = dersBul(q.ders);
  return (
    <View style={s.cozumKart}>
      <Text style={[s.soruDers, { color: ders.renk }]}>{ders.ad} · {q.konu}</Text>
      <Text style={s.cozumSoru}>{no}. {q.soru}</Text>
      {q.secenekler.map((o, i) => {
        const dogru = i === q.dogru, secilen = i === cevap;
        return (
          <View key={i} style={[s.cozumSecenek, dogru && { backgroundColor: '#E3F4EA' }, secilen && !dogru && { backgroundColor: '#FBE5E5' }]}>
            <Text style={[s.cozumHarf, dogru && { color: R.dogru }, secilen && !dogru && { color: R.yanlis }]}>{HARF[i]})</Text>
            <Text style={s.cozumYazi}>{o}{dogru ? '  ✓' : secilen ? '  ✗' : ''}</Text>
          </View>
        );
      })}
      <Text style={s.aciklama}>{cevap === undefined ? 'Boş bıraktın. ' : ''}{q.aciklama}</Text>
    </View>
  );
}

/* ---------- Yanlışlar ---------- */
function YanlislarEkrani({ durum, guncelle, git, geri }) {
  const sorular = durum.yanlislar.map((id) => VERI.sorular[id]).filter(Boolean);
  const dersSay = {};
  sorular.forEach((q) => { dersSay[q.ders] = (dersSay[q.ders] || 0) + 1; });
  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik="Yanlışlarım" alt={`${sorular.length} soru`} geri={geri} />
      <ScrollView contentContainerStyle={s.sayfa}>
        <Text style={s.bilgi}>Yanlış yaptığın sorular burada birikir. Tekrar çözüp doğru yaptığında listeden çıkar.</Text>
        {sorular.length > 0 && <Buton yazi={`Hepsini Tekrar Çöz (${sorular.length})`} onPress={() => git({ ekran: 'test', test: 'yanlislar', sorular: durum.yanlislar.slice(0, 40), anahtar: Date.now() })} />}
        <Text style={s.bolumBaslik}>Derslere göre</Text>
        {Object.entries(dersSay).sort((a, b) => b[1] - a[1]).map(([id, n]) => {
          const d = dersBul(id);
          const ids = sorular.filter((q) => q.ders === id).map((q) => q.id);
          return (
            <Pressable key={id} style={s.dersSatir} onPress={() => git({ ekran: 'test', test: 'yanlislar', sorular: ids, anahtar: Date.now() })}>
              <View style={[s.dersNokta, { backgroundColor: d.renk }]} />
              <Text style={[s.dersAd, { flex: 1 }]}>{d.ad}</Text>
              <Text style={s.dersSayac}>{n} soru ›</Text>
            </Pressable>
          );
        })}
        {sorular.length > 0 && <Buton yazi="Listeyi temizle" tip="cizgi" style={{ marginTop: 24 }} onPress={() => Alert.alert('Listeyi temizle', 'Tüm yanlışlar silinsin mi?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => guncelle((d) => ({ ...d, yanlislar: [] })) }])} />}
      </ScrollView>
    </View>
  );
}

/* ---------- Çıkmış sorular (PDF + optik form) ---------- */
function CikmisEkrani({ durum, guncelle, git, geri }) {
  async function ekle() {
    const p = await pdfSec();
    if (!p) return;
    const kayit = { id: String(Date.now()), ad: p.ad.replace(/\.pdf$/i, ''), uri: p.uri, formlar: [] };
    guncelle((d) => ({ ...d, cikmis: [kayit, ...d.cikmis] }));
  }
  function sil(k) {
    Alert.alert('Kitapçığı sil', `"${k.ad}" ve optik formları silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => { pdfSil(k.uri); guncelle((d) => ({ ...d, cikmis: d.cikmis.filter((x) => x.id !== k.id) })); } },
    ]);
  }
  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik="Çıkmış Sorular" alt="Gerçek MEB sınav kitapçıkların" geri={geri} />
      <ScrollView contentContainerStyle={s.sayfa}>
        <Text style={s.bilgi}>MEB'in yayımladığı soru ve cevap kitapçıklarını (PDF) telefonuna indir, sonra buraya ekle. Kitapçığı açıp çözerken cevaplarını optik forma işaretle; cevap anahtarını girince puanını hesaplarım.</Text>
        <Buton yazi="+ PDF Kitapçık Ekle" onPress={ekle} />
        {durum.cikmis.length === 0 && <Text style={s.bosYazi}>Henüz kitapçık eklemedin.</Text>}
        {durum.cikmis.map((k) => (
          <View key={k.id} style={s.kitapcikKart}>
            <Text style={s.testAd}>{k.ad}</Text>
            <View style={[s.ikiliSatir, { marginTop: 10 }]}>
              <Buton yazi="PDF'i Aç" tip="cizgi" kucuk onPress={() => pdfAc(k.uri)} style={{ flex: 1 }} />
              <Buton yazi="+ Optik Form" kucuk onPress={() => git({ ekran: 'optik', kitapcik: k.id })} style={{ flex: 1 }} />
            </View>
            {k.formlar.map((f) => {
              const r = optikHesapla(f);
              return (
                <Pressable key={f.id} style={s.formSatir} onPress={() => git({ ekran: 'optik', kitapcik: k.id, form: f.id })}>
                  <Text style={[s.dersAd, { flex: 1 }]}>{f.ders}</Text>
                  <Text style={s.dersSayac}>{r.anahtarVar ? `${r.dogru}D ${r.yanlis}Y · ${r.puan} puan` : `${r.isaretli}/${f.sayi} işaretli`} ›</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => sil(k)}><Text style={s.silYazi}>Kitapçığı sil</Text></Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
function optikHesapla(f) {
  let dogru = 0, yanlis = 0, isaretli = 0;
  const anahtarVar = f.anahtar.some((x) => x !== null);
  for (let i = 0; i < f.sayi; i++) {
    const c = f.cevap[i];
    if (c !== null && c !== undefined) isaretli++;
    if (c === null || c === undefined || f.anahtar[i] === null || f.anahtar[i] === undefined) continue;
    if (c === f.anahtar[i]) dogru++; else yanlis++;
  }
  return { dogru, yanlis, isaretli, anahtarVar, puan: Math.round((dogru / f.sayi) * 100) };
}
function OptikEkrani({ durum, guncelle, geri, ekran }) {
  const k = durum.cikmis.find((x) => x.id === ekran.kitapcik);
  const mevcut = ekran.form ? k.formlar.find((f) => f.id === ekran.form) : null;
  const [ders, setDers] = useState(mevcut?.ders || '');
  const [sayi, setSayi] = useState(String(mevcut?.sayi || 20));
  const [form, setForm] = useState(mevcut);
  const [mod, setMod] = useState('cevap');

  function olustur() {
    const n = Math.min(60, Math.max(1, parseInt(sayi, 10) || 20));
    const f = { id: String(Date.now()), ders: ders.trim() || 'Ders', sayi: n, cevap: Array(n).fill(null), anahtar: Array(n).fill(null) };
    setForm(f);
    guncelle((d) => ({ ...d, cikmis: d.cikmis.map((x) => (x.id === k.id ? { ...x, formlar: [...x.formlar, f] } : x)) }));
  }
  function isaretle(i, h) {
    const alan = mod === 'cevap' ? 'cevap' : 'anahtar';
    const yeni = { ...form, [alan]: form[alan].map((v, j) => (j === i ? (v === h ? null : h) : v)) };
    setForm(yeni);
    guncelle((d) => ({ ...d, cikmis: d.cikmis.map((x) => (x.id === k.id ? { ...x, formlar: x.formlar.map((f) => (f.id === yeni.id ? yeni : f)) } : x)) }));
  }
  function formSil() {
    Alert.alert('Formu sil', 'Bu optik form silinsin mi?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => {
      guncelle((d) => ({ ...d, cikmis: d.cikmis.map((x) => (x.id === k.id ? { ...x, formlar: x.formlar.filter((f) => f.id !== form.id) } : x)) }));
      geri();
    } }]);
  }

  if (!form) {
    return (
      <View style={{ flex: 1 }}>
        <Baslik baslik="Yeni Optik Form" alt={k.ad} geri={geri} />
        <ScrollView contentContainerStyle={s.sayfa}>
          <Text style={s.etiketYazi}>Ders adı</Text>
          <TextInput value={ders} onChangeText={setDers} placeholder="Örn. Tarih 5" style={s.girdi} />
          <Text style={s.etiketYazi}>Soru sayısı</Text>
          <TextInput value={sayi} onChangeText={setSayi} keyboardType="number-pad" style={s.girdi} />
          <Buton yazi="Formu Oluştur" onPress={olustur} style={{ marginTop: 16 }} />
        </ScrollView>
      </View>
    );
  }
  const r = optikHesapla(form);
  return (
    <View style={{ flex: 1 }}>
      <Baslik baslik={form.ders} alt={k.ad} geri={geri} sag={<Pressable onPress={() => pdfAc(k.uri)}><Text style={s.pdfLink}>PDF</Text></Pressable>} />
      <View style={[s.filtreler, { paddingHorizontal: 16 }]}>
        {[['cevap', 'Cevaplarım'], ['anahtar', 'Cevap Anahtarı']].map(([m, y]) => (
          <Pressable key={m} onPress={() => setMod(m)} style={[s.filtre, { flex: 1 }, mod === m && { backgroundColor: m === 'cevap' ? R.ana : '#8A5A2B' }]}>
            <Text style={[s.filtreYazi, { textAlign: 'center' }, mod === m && { color: '#fff' }]}>{y}</Text>
          </Pressable>
        ))}
      </View>
      {r.anahtarVar && (
        <View style={s.optikOzet}>
          <Text style={[s.sonucSayi, { color: R.dogru }]}>{r.dogru} D</Text>
          <Text style={[s.sonucSayi, { color: R.yanlis }]}>{r.yanlis} Y</Text>
          <Text style={[s.sonucSayi, { color: R.bos }]}>{form.sayi - r.dogru - r.yanlis} B</Text>
          <Text style={[s.sonucSayi, { color: R.ana }]}>{r.puan} puan</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={[s.sayfa, { paddingTop: 4 }]}>
        {form.cevap.map((c, i) => {
          const a = form.anahtar[i];
          const secili = mod === 'cevap' ? c : a;
          const durumRenk = a !== null && c !== null ? (a === c ? R.dogru : R.yanlis) : R.soluk;
          return (
            <View key={i} style={s.optikSatir}>
              <Text style={[s.optikNo, { color: durumRenk }]}>{i + 1}</Text>
              {HARF.map((h, hi) => (
                <Pressable key={h} onPress={() => isaretle(i, hi)} hitSlop={4}
                  style={[s.optikDaire, secili === hi && { backgroundColor: mod === 'cevap' ? R.ana : '#8A5A2B', borderColor: 'transparent' },
                    mod === 'cevap' && a === hi && secili !== hi && c !== null && { borderColor: R.dogru, borderWidth: 2 }]}>
                  <Text style={[s.optikHarf, secili === hi && { color: '#fff' }]}>{h}</Text>
                </Pressable>
              ))}
            </View>
          );
        })}
        <Pressable onPress={formSil}><Text style={s.silYazi}>Bu formu sil</Text></Pressable>
      </ScrollView>
    </View>
  );
}

/* ---------- Stiller ---------- */
const s = StyleSheet.create({
  sayfa: { padding: 16, paddingBottom: 40 },
  baslik: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: R.cizgi },
  geriBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  geriYazi: { fontSize: 32, color: R.ana, lineHeight: 34 },
  baslikYazi: { fontSize: 18, fontWeight: '700', color: R.yazi },
  altYazi: { fontSize: 13, color: R.soluk, marginTop: 2 },
  ustEtiket: { fontSize: 12, letterSpacing: 1.5, color: R.soluk, fontWeight: '700', marginTop: 8 },
  buyukBaslik: { fontSize: 28, fontWeight: '800', color: R.yazi, marginTop: 4, marginBottom: 16 },
  ozetKart: { flexDirection: 'row', backgroundColor: R.kart, borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: R.cizgi, marginBottom: 12 },
  ozetKutu: { flex: 1, alignItems: 'center' },
  ozetAyrac: { width: 1, backgroundColor: R.cizgi },
  ozetSayi: { fontSize: 24, fontWeight: '800', color: R.yazi },
  ozetKucuk: { fontSize: 14, color: R.soluk, fontWeight: '600' },
  ozetEtiket: { fontSize: 12, color: R.soluk, marginTop: 2 },
  ikiliSatir: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  buyukKart: { flex: 1, borderRadius: 16, padding: 16, minHeight: 96, justifyContent: 'flex-end' },
  buyukKartBaslik: { color: '#fff', fontSize: 17, fontWeight: '800' },
  buyukKartAlt: { color: '#ffffffcc', fontSize: 12, marginTop: 4 },
  yanlisBandi: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBE5E5', borderRadius: 12, padding: 14, marginBottom: 12 },
  yanlisBandiYazi: { flex: 1, color: R.yanlis, fontWeight: '700' },
  yanlisBandiOk: { color: R.yanlis, fontSize: 22 },
  bolumBaslik: { fontSize: 15, fontWeight: '800', color: R.yazi, marginTop: 16, marginBottom: 8 },
  dersSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: R.kart, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: R.cizgi },
  dersNokta: { width: 12, height: 12, borderRadius: 6 },
  dersAd: { fontSize: 15, fontWeight: '600', color: R.yazi, marginBottom: 6 },
  dersSayac: { fontSize: 13, color: R.soluk, fontWeight: '600' },
  cubuk: { height: 6, backgroundColor: '#ECE8DF', borderRadius: 3, overflow: 'hidden' },
  cubukDolu: { height: 6, borderRadius: 3 },
  testSatir: { flexDirection: 'row', alignItems: 'center', backgroundColor: R.kart, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: R.cizgi, gap: 10 },
  testAd: { fontSize: 16, fontWeight: '700', color: R.yazi },
  testAlt: { fontSize: 13, color: R.soluk, marginTop: 3 },
  testSure: { fontSize: 12, color: R.soluk },
  rozet: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  rozetYazi: { fontWeight: '800', fontSize: 13 },
  etiketler: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  etiket: { backgroundColor: R.kart, borderWidth: 1, borderColor: R.cizgi, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, color: R.yazi },
  sayac: { fontSize: 16, fontWeight: '800', color: R.ana, fontVariant: ['tabular-nums'] },
  soruDers: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  soruMetin: { fontSize: 17, lineHeight: 26, color: R.yazi, marginBottom: 16 },
  secenek: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: R.kart, borderWidth: 1.5, borderColor: R.cizgi, borderRadius: 12, padding: 14, marginBottom: 10 },
  harf: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: R.cizgi, alignItems: 'center', justifyContent: 'center' },
  harfYazi: { fontWeight: '800', color: R.yazi },
  secenekYazi: { flex: 1, fontSize: 15, lineHeight: 21, color: R.yazi },
  noktalar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  nokta: { width: 32, height: 32, borderRadius: 8, backgroundColor: R.kart, borderWidth: 1, borderColor: R.cizgi, alignItems: 'center', justifyContent: 'center' },
  noktaYazi: { fontSize: 12, fontWeight: '700', color: R.soluk },
  altBar: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: R.cizgi, backgroundColor: R.zemin },
  buton: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  butonKucuk: { paddingVertical: 12 },
  butonCizgi: { borderWidth: 1.5, borderColor: R.ana },
  butonYazi: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sonucKart: { backgroundColor: R.kart, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: R.cizgi, marginBottom: 12 },
  puan: { fontSize: 56, fontWeight: '900', color: R.ana },
  puanEtiket: { fontSize: 15, color: R.soluk, marginBottom: 12 },
  sonucSatir: { flexDirection: 'row', gap: 16 },
  sonucSayi: { fontSize: 15, fontWeight: '800' },
  netYazi: { marginTop: 8, color: R.soluk, fontSize: 13 },
  filtreler: { flexDirection: 'row', gap: 8, marginVertical: 12, paddingHorizontal: 0 },
  filtre: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: R.kart, borderWidth: 1, borderColor: R.cizgi },
  filtreYazi: { fontWeight: '700', color: R.yazi, fontSize: 13 },
  cozumKart: { backgroundColor: R.kart, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: R.cizgi },
  cozumSoru: { fontSize: 15, lineHeight: 22, color: R.yazi, marginBottom: 10 },
  cozumSecenek: { flexDirection: 'row', gap: 8, padding: 8, borderRadius: 8 },
  cozumHarf: { fontWeight: '800', color: R.soluk },
  cozumYazi: { flex: 1, color: R.yazi, fontSize: 14 },
  aciklama: { marginTop: 10, fontSize: 13, lineHeight: 19, color: '#4B5563', backgroundColor: '#F7F5F0', padding: 10, borderRadius: 8 },
  bosYazi: { textAlign: 'center', color: R.soluk, marginTop: 24 },
  bilgi: { fontSize: 14, lineHeight: 20, color: R.soluk, marginBottom: 14 },
  kitapcikKart: { backgroundColor: R.kart, borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: R.cizgi },
  formSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: R.cizgi },
  silYazi: { color: R.yanlis, fontSize: 13, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  etiketYazi: { fontSize: 13, fontWeight: '700', color: R.yazi, marginTop: 12, marginBottom: 6 },
  girdi: { backgroundColor: R.kart, borderWidth: 1, borderColor: R.cizgi, borderRadius: 10, padding: 12, fontSize: 16 },
  pdfLink: { color: R.ana, fontWeight: '800', fontSize: 15 },
  optikOzet: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, marginHorizontal: 16, backgroundColor: R.kart, borderRadius: 12, borderWidth: 1, borderColor: R.cizgi },
  optikSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  optikNo: { width: 28, fontWeight: '800', fontSize: 15 },
  optikDaire: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#C9C3B6', alignItems: 'center', justifyContent: 'center' },
  optikHarf: { fontWeight: '800', color: R.yazi },
});

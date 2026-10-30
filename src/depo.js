// Cihazda kalıcı kayıt (AsyncStorage) ve PDF dosya işlemleri
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

const ANAHTAR = 'aciklise:v1';

export const bosDurum = { sonuclar: {}, yanlislar: [], cikmis: [] };

export async function yukle() {
  try {
    const s = await AsyncStorage.getItem(ANAHTAR);
    return s ? { ...bosDurum, ...JSON.parse(s) } : bosDurum;
  } catch {
    return bosDurum;
  }
}

export async function kaydet(durum) {
  try {
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify(durum));
  } catch {}
}

// expo-file-system: yeni API (SDK 54+) varsa onu, yoksa eski API'yi kullan
function dosyaSistemi() {
  try {
    const fs = require('expo-file-system');
    if (fs.File && fs.Paths) return { yeni: true, fs };
  } catch {}
  return { yeni: false, fs: require('expo-file-system/legacy') };
}

// Kullanıcının telefonundan bir PDF seçip uygulama klasörüne kopyalar
export async function pdfSec() {
  const sonuc = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (sonuc.canceled || !sonuc.assets?.length) return null;
  const a = sonuc.assets[0];
  const ad = `${Date.now()}-${(a.name || 'kitapcik.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { yeni, fs } = dosyaSistemi();
  let uri = a.uri;
  try {
    if (yeni) {
      const hedef = new fs.File(fs.Paths.document, ad);
      new fs.File(a.uri).copy(hedef);
      uri = hedef.uri;
    } else {
      const hedef = fs.documentDirectory + ad;
      await fs.copyAsync({ from: a.uri, to: hedef });
      uri = hedef;
    }
  } catch {}
  return { ad: a.name || 'Kitapçık', uri };
}

export async function pdfAc(uri) {
  if (Platform.OS === 'android') {
    try {
      const IntentLauncher = require('expo-intent-launcher');
      const { yeni, fs } = dosyaSistemi();
      const contentUri = yeni ? new fs.File(uri).contentUri : await fs.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, flags: 1, type: 'application/pdf' });
      return;
    } catch {}
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

export async function pdfSil(uri) {
  try {
    const { yeni, fs } = dosyaSistemi();
    if (yeni) new fs.File(uri).delete();
    else await fs.deleteAsync(uri, { idempotent: true });
  } catch {}
}

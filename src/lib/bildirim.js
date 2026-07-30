/* ============================================================
   KOZMO BİLDİRİM YÖNETİMİ (Seçenek 1 — cihaz temelli)

   İlke: nazik ol, rahatsız etme, kullanıcıyı yönet — spam yapma.
   - İzni ilk açılışta İSTEMEZ; kullanıcı değeri gördükten sonra sorar.
   - Bugünün okumasına zaten baktıysa hatırlatma göstermez.
   - Günde en fazla bir hatırlatma.

   Sınır (dürüstlük): Bu, sunucu push değil. Bildirim ancak uygulama
   açıkken ya da tarayıcı arka planda kısa süre çalışırken tetiklenir.
   "Telefon kapalıyken sabah 9'da garanti bildirim" için Seçenek 2 gerekir.
   ============================================================ */

const AYAR = "kozmo_bildirim"; // { izinli, sonHatirlatma, aura }

function ayarOku() {
  try { return JSON.parse(localStorage.getItem(AYAR)) || {}; }
  catch { return {}; }
}
function ayarYaz(a) {
  try { localStorage.setItem(AYAR, JSON.stringify(a)); } catch { /* geç */ }
}

/* Tarayıcı bildirimi destekliyor mu? (iPhone'da yalnız ana ekrana eklenmişse) */
export function bildirimDesteği() {
  return "Notification" in window && "serviceWorker" in navigator;
}

/* Şu anki izin durumu: "default" (sorulmadı) | "granted" | "denied" */
export function izinDurumu() {
  if (!bildirimDesteği()) return "yok";
  return Notification.permission;
}

/* İzni iste — yalnızca kullanıcı bir eylemle tetiklediğinde çağrılmalı
   (buton tıklaması gibi), yoksa tarayıcı reddeder. */
export async function izinIste() {
  if (!bildirimDesteği()) return "yok";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const sonuc = await Notification.requestPermission();
    if (sonuc === "granted") {
      const a = ayarOku();
      a.izinli = true;
      ayarYaz(a);
    }
    return sonuc;
  } catch {
    return "denied";
  }
}

/* Bildirim göster — service worker üzerinden kilit ekranına taşır.
   Kişisel içerik: cihazdaki veriden üretilir, sunucuya hiçbir şey gitmez. */
export async function bildirimGoster(baslik, govde) {
  if (izinDurumu() !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({ tur: "bildirim-goster", baslik, govde });
      return true;
    }
    // service worker mesajı gitmezse doğrudan dene
    await reg.showNotification(baslik, { body: govde, icon: "/icons/icon-192.png", tag: "kozmo-gunluk" });
    return true;
  } catch {
    return false;
  }
}

/* Bugün için hatırlatma gösterilmeli mi?
   Koşullar: izin var + bugün henüz hatırlatılmadı + kullanıcı bugünün
   okumasına henüz bakmadı. */
export function hatirlatmaGerekli(bugunAnahtar, okumaGoruldu) {
  if (izinDurumu() !== "granted") return false;
  if (okumaGoruldu) return false; // zaten baktı
  const a = ayarOku();
  return a.sonHatirlatma !== bugunAnahtar;
}

/* Kişisel günlük hatırlatmayı gönder (aura rengi + notu ile) */
export async function gunlukHatirlat(bugunAnahtar, reading) {
  const baslik = reading?.aura_adi
    ? `Bugünün rengi: ${reading.aura_adi}`
    : "Bugünün gökyüzü hazır";
  const govde = reading?.aura_notu || "Kozmo seni bekliyor.";
  const gonderildi = await bildirimGoster(baslik, govde);
  if (gonderildi) {
    const a = ayarOku();
    a.sonHatirlatma = bugunAnahtar;
    ayarYaz(a);
  }
  return gonderildi;
}

/* Kullanıcı bildirimleri kapatmak isterse (ayar olarak) */
export function bildirimKapat() {
  const a = ayarOku();
  a.izinli = false;
  ayarYaz(a);
}
export function bildirimAcik() {
  return ayarOku().izinli === true && izinDurumu() === "granted";
}

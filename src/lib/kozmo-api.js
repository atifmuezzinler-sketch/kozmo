/* ============================================================
   KOZMO — Zeka Katmanı İstemcisi (önceden üretim mimarisi)

   İlke: Kullanıcı BEKLEMEZ. Bugünün metni dün üretilmiştir ve
   cihazda hazır durur; anında gösterilir. Kullanıcı okurken,
   arka planda yarının metni sessizce hazırlanır.

   Akış:
     açılış → bugünün metni önbellekte mi?
       evet → anında göster (0 ms)
       hayır → yerel havuzdan göster (0 ms) + arka planda üret
     her durumda → arka planda yarının metnini hazırla

   API çökse, kota bitse, internet gitse: yerel havuz devreye girer.
   Kullanıcı hiçbir şey fark etmez.
   ============================================================ */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";
import { mockEngine } from "./engine";
import { signOf, moonLon, moonPhase, sunLon, isRetro, natalSunLon } from "./astro";

const DEPO = "kozmo_icerik";
const SAKLAMA_GUN = 3; // bugün + yarın + bir gün tolerans

const gunAnahtari = (d) => d.toISOString().slice(0, 10);
const yarin = (d) => new Date(d.getTime() + 86400000);

/* ---------- ÖNBELLEK ---------- */

function depoOku() {
  try {
    return JSON.parse(localStorage.getItem(DEPO)) || {};
  } catch {
    return {};
  }
}

function depoYaz(veri) {
  try {
    localStorage.setItem(DEPO, JSON.stringify(veri));
  } catch {
    /* gizli mod ya da kota dolu — sessizce geç, yerel havuz zaten çalışır */
  }
}

/* Eski günleri temizle — önbellek şişmesin */
function depoTemizle(veri, bugun) {
  const sinir = gunAnahtari(new Date(bugun.getTime() - SAKLAMA_GUN * 86400000));
  const temiz = {};
  for (const [anahtar, deger] of Object.entries(veri))
    if (anahtar >= sinir) temiz[anahtar] = deger;
  return temiz;
}

export function onbellekOku(profil, tarih) {
  const veri = depoOku();
  const kayit = veri[gunAnahtari(tarih)];
  if (!kayit) return null;
  // Profil değiştiyse (doğum verisi güncellendi) önbellek geçersiz
  if (kayit.profil_imza !== profilImza(profil)) return null;
  return kayit.cikti;
}

function onbellekYaz(profil, tarih, cikti) {
  const bugun = new Date();
  const veri = depoTemizle(depoOku(), bugun);
  veri[gunAnahtari(tarih)] = {
    profil_imza: profilImza(profil),
    cikti,
    uretim: new Date().toISOString(),
  };
  depoYaz(veri);
}

/* Profil imzası — doğum verisi değişirse önbellek tazelenir */
const profilImza = (p) =>
  `${p.birthDate}|${p.time || ""}|${p.cityName || ""}|${p.rising?.ad || ""}`;

/* ---------- API'YE GÖNDERİLECEK VERİ ---------- */

/* Hesap katmanı bizde: gökyüzü ve skorlar burada hesaplanır,
   modele yalnızca veri olarak verilir (anayasa 5.5). */
export function girdiHazirla(profil, tarih) {
  const yerel = mockEngine(profil, tarih); // skorlar + meta
  return {
    kullanici: {
      burc: profil.sign.ad,
      element: profil.sign.el,
      yukselen: profil.rising ? profil.rising.ad : null,
    },
    gokyuzu: {
      tarih: gunAnahtari(tarih),
      ay_burcu: signOf(moonLon(tarih)).ad,
      ay_evresi: moonPhase(tarih).ad,
      gunes_burcu: signOf(sunLon(tarih)).ad,
      merkur_retro: isRetro("merkur", tarih),
    },
    skorlar: yerel.skorlar,
  };
}

/* İstemci tarafı rate limit koruması: sunucu 429 dönerse bir saat boyunca
   tekrar denemeyiz — hem sunucuyu hem kullanıcının pilini korur. */
const RL_ANAHTAR = "kozmo_rl";
function rateLimitIsaretle() {
  try { localStorage.setItem(RL_ANAHTAR, String(Date.now() + 3600_000)); } catch { /* geç */ }
}
function rateLimitAktif() {
  try {
    const bitis = Number(localStorage.getItem(RL_ANAHTAR) || 0);
    return Date.now() < bitis;
  } catch { return false; }
}

/* ---------- API ÇAĞRISI ---------- */

async function apiCagir(tur, girdi, zamanAsimi = 25000) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null; // yapılandırılmamış
  if (rateLimitAktif()) return null; // sunucu son çağrıda 429 dedi — boşuna deneme

  const kontrol = new AbortController();
  const sayac = setTimeout(() => kontrol.abort(), zamanAsimi);
  try {
    const yanit = await fetch(`${SUPABASE_URL}/functions/v1/kozmo-uret`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ tur, girdi }),
      signal: kontrol.signal,
    });
    // Rate limit ya da başka hata → yerel havuz devreye girer
    if (!yanit.ok) {
      if (yanit.status === 429) rateLimitIsaretle();
      return null;
    }
    const veri = await yanit.json();
    return veri.basarili ? veri.cikti : null;
  } catch {
    return null; // ağ hatası, zaman aşımı — yerel havuz devreye girer
  } finally {
    clearTimeout(sayac);
  }
}

/* ---------- ANA GİRİŞ NOKTALARI ---------- */

/* Günün okuması — HER ZAMAN anında döner.
   Önce önbellek, yoksa yerel havuz. API asla beklenmez. */
export function gunlukOkuma(profil, tarih) {
  const yerel = mockEngine(profil, tarih);
  const onbellek = onbellekOku(profil, tarih);
  if (onbellek) {
    return {
      ...yerel, // skorlar, aura rengi, meta — hesap katmanı yerel kalır
      gunun_cumlesi: onbellek.gunun_cumlesi,
      analiz: onbellek.analiz,
      motto: onbellek.motto,
      kaynak: "api",
    };
  }
  return { ...yerel, kaynak: "yerel" };
}

/* Arka plan üretimi — kullanıcı ekrana bakarken sessizce çalışır.
   YALNIZCA YARINI hazırlar. Bugünün metni ekranda duruyor; okurken
   değişmesi rahatsız edici olurdu. Ayrıca bugünü üretmek israf olurdu:
   gösterilmeyecek bir metne para ödenmez.
   Sonuç: ilk gün yerel havuz (anında), ertesi günden itibaren hep API (anında). */
export async function arkaPlandaHazirla(profil, bugun = new Date()) {
  const hedef = yarin(bugun);
  if (onbellekOku(profil, hedef)) return; // zaten hazır
  const cikti = await apiCagir("gunluk", girdiHazirla(profil, hedef));
  if (cikti) onbellekYaz(profil, hedef, cikti);
}

/* Uyum okuması — kullanıcı butona bastığında çağrılır.
   Burada bekleme kaçınılmaz (girdi o an oluşuyor), ama tek seferlik. */
export async function uyumOkumasi(pA, pB, relType, yerelSonuc) {
  const girdi = {
    kisi_a: { burc: yerelSonuc.sA.ad, element: yerelSonuc.sA.el },
    kisi_b: { burc: yerelSonuc.sB.ad, element: yerelSonuc.sB.el },
    iliski_turu: relType,
    genel_uyum: yerelSonuc.genel,
    kategori_skorlari: yerelSonuc.skorlar,
    burclar: [yerelSonuc.sA.ad, yerelSonuc.sB.ad],
  };
  const cikti = await apiCagir("synastry", girdi);
  return cikti?.analiz || yerelSonuc.analiz; // API yoksa yerel metin
}

/* Check-in notu — kullanıcı duygusunu seçtiğinde çağrılır. */
export async function checkinNotu(ruhHali, kullaniciNotu, yerelNot) {
  const cikti = await apiCagir("checkin", {
    ruh_hali: ruhHali,
    kullanici_notu: kullaniciNotu || "",
  });
  if (!cikti) return { kriz: false, not: yerelNot };
  return { kriz: !!cikti.kriz, not: cikti.not || yerelNot };
}

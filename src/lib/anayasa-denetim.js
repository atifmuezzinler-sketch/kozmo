/* ============================================================
   KOZMO ANAYASA DENETİMİ
   Kaynak: kozmo-yazim-anayasasi-v1.2.md (Bölüm 3, 4, 5)

   İki kullanım:
   1) Yerel içerik havuzunu denetleme (bugün) — npm run denetim
   2) Faz 2'de Claude API çıktılarını üretim sonrası denetleme

   Anayasa 3.7 / 5.7: "Talimat unutabilir; tarama unutmaz."
   ============================================================ */

/* ---------- YASAK LİSTELERİ (Bölüm 3) ---------- */

// Tüm türler için ortak yasaklar
export const ORTAK_YASAK = [
  // Astro-klişe rafı
  "enerjiniz yüksek", "enerjin yüksek", "yıldızlar sizden yana", "yıldızlar senden yana",
  "şanslı gündesin", "şanslı gününüz", "aşk kapıda", "sürprizlere açık ol",
  "kendinizi şımart", "kendini şımart", "pozitif enerji",
  // New-age sözlüğü
  "titreşim", "frekans yükselt", "manifest", "çakra", "enerji alanı",
  "evrene niyet", "kozmik bolluk", "evren sana", "evren size", "evrenin planı",
  "auranı temizle", "aura temizli",
  // Motivasyon posteri
  "her şeyi başarabilirsin", "sınır yok", "hayallerinin peşinden koş",
  "asla vazgeçme", "harika bir gün olacak", "sen güçlüsün", "pozitif kal",
  // Korku ve kaygı dili
  "dikkatli olun", "dikkatli ol,", "kötü haber alabilir", "kayıp yaşayabilir",
  "sağlığınıza dikkat", "sağlığına dikkat",
  // Kesinlik ve garanti
  "kesinlikle", "garanti eder", "%100", "yüzde yüz", "tamamen emin",
  // Çeviri Türkçesi
  "kendine bir iyilik yap", "unutma ki", "hak ediyorsun", "hak ediyorsunuz",
  "bunu hissetmene izin ver", "harika hissettirecek", "kendine nazik ol",
  // Yapay zeka sesi
  "bir yapay zeka olarak", "elbette!", "işte size", "umarım yardımcı olur",
  // Bölüm 5 — dokunulmaz alanlar
  "depresyon", "anksiyete", "panik atak", "travma", "terapi", "tedavi",
  "ilaç kullan", "doktora git", "hastalık",
  "yatırım yap", "hisse al", "altın al", "kripto", "borsa", "kumar",
  "bahis", "piyango", "sayısal loto", "şans oyunu", "tombala", "iddaa",
  "istifa et", "boşan", "dava aç", "imzala",
];

// Synastry'ye özel yasaklar (4.5 — bu türün anayasası sert)
export const SYNASTRY_YASAK = [
  "ayrılık", "ayrılırsınız", "ayrılacak", "kavga", "tartışma çıkar",
  "ihanet", "aldat", "terk et", "boşanma", "yürümez", "yürümeyecek",
  "uyumsuz", "geçimsiz", "sorunlu bir", "yorucu bir", "zor bir ilişki",
  "ruh eşi", "kader birliği", "yazgınızda", "mükemmel uyum",
];

// Check-in'e özel yasaklar (4.4 — klinik sınır)
export const CHECKIN_YASAK = [
  "üzülme", "boş ver", "olumlu düşün", "geçer bu", "her şey yoluna girecek",
  "gülümse", "sadece bir gün", "büyütme", "herkes böyle hisseder",
  "evrene bırak",
];

// Kriz sinyali kalıpları (5.2 — en öncelikli madde)
export const KRIZ_SINYAL = [
  "dayanamıyorum", "dayanamayacağım", "bitmesini istiyorum", "yaşamak istemiyorum",
  "anlamsız geliyor", "anlamı yok", "yorulduğum", "artık yapamıyorum",
  "kimse yok", "yalnızım ve", "çaresizim", "umudum yok", "son bulsun",
  "kendime zarar", "canıma", "bıraksam", "vazgeçsem her şeyden",
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

/* "enerji" mistik anlamda mı? (gri liste — gündelik kullanım serbest)
   Yasak: "Başak enerjisi", "günün enerjisi" · Serbest: "bu enerjiyi işine yatır" */
const MISTIK_ENERJI = /\b(koç|boğa|ikizler|yengeç|aslan|başak|terazi|akrep|yay|oğlak|kova|balık|ay|güneş|merkür|venüs|mars|gökyüzü|burcun|günün|evren)\w*\s+enerji/i;

/* ---------- ARAÇLAR ---------- */

const kelimeSay = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const kucult = (s) => s.toLocaleLowerCase("tr-TR");

function yasakTara(metin, listeler) {
  const t = kucult(metin);
  const bulunan = [];
  for (const liste of listeler)
    for (const y of liste)
      if (t.includes(kucult(y))) bulunan.push(y);
  return bulunan;
}

/* ---------- TÜR DENETİMLERİ (Bölüm 4 bandları, v1.2 kalibre) ---------- */

/* İKİ MOD:
   "api"   → Faz 2'de Claude tek seferde bütün metni üretir; tam anayasa bandları geçerli.
   "yerel" → Mevcut havuz metinleri bağımsız yazılıp birleştirilir (parça mimarisi);
             bandlar bu mimarinin ölçülmüş gerçeğine göre gevşetilmiştir.
             Ölçüm (240 örnek): analiz 35-60 (ort. 48), günün cümlesi 5-12 (ort. 8).
   Yapısal kurallar (yasaklar, kehanet, veri tutarlılığı) İKİ MODDA DA aynıdır. */

export const BANTLAR = {
  api: {
    gunun_cumlesi: { min: 8, max: 16, ad: "Günün cümlesi" },
    analiz: { min: 45, max: 70, ad: "Analiz" },
    motto: { min: 4, max: 10, ad: "Motto" },
    synastry: { min: 22, max: 50, ad: "Uyum okuması" },
    checkin: { min: 12, max: 32, ad: "Bugünün notu" },
    aura_notu: { min: 9, max: 16, ad: "Aura notu" },
    bugunLimit: 2,
  },
  yerel: {
    gunun_cumlesi: { min: 5, max: 16, ad: "Günün cümlesi" },
    analiz: { min: 35, max: 70, ad: "Analiz" },
    motto: { min: 4, max: 12, ad: "Motto" },
    synastry: { min: 20, max: 50, ad: "Uyum okuması" },
    checkin: { min: 10, max: 32, ad: "Bugünün notu" },
    aura_notu: { min: 6, max: 16, ad: "Aura notu" },
    bugunLimit: 3,
  },
};

const bant = (mod) => BANTLAR[mod] || BANTLAR.api;

/* Günlük çıktı denetimi: { gunun_cumlesi, analiz, motto } */
export function denetleGunluk(cikti, skorlar, mod = "api") {
  const B = bant(mod);
  const h = [];
  const { gunun_cumlesi = "", analiz = "", motto = "", aura_notu = "" } = cikti || {};
  const tum = [gunun_cumlesi, analiz, motto, aura_notu].join(" ");

  // Yasaklı kalıplar
  yasakTara(tum, [ORTAK_YASAK]).forEach((y) => h.push(`Yasaklı kalıp: "${y}"`));
  if (MISTIK_ENERJI.test(tum)) h.push('"enerji" mistik anlamda kullanılmış (gri liste)');
  // Emoji ve ünlem
  if (EMOJI.test(tum)) h.push("Emoji kullanılmış");
  if (/!!/.test(tum)) h.push("Çift ünlem");
  if (motto.includes("!")) h.push("Mottoda ünlem (4.3)");
  // Bantlar
  const gk = kelimeSay(gunun_cumlesi), ak = kelimeSay(analiz), mk = kelimeSay(motto);
  if (gk < B.gunun_cumlesi.min || gk > B.gunun_cumlesi.max)
    h.push(`Günün cümlesi ${gk} kelime (${B.gunun_cumlesi.min}-${B.gunun_cumlesi.max})`);
  if (ak < B.analiz.min || ak > B.analiz.max)
    h.push(`Analiz ${ak} kelime (${B.analiz.min}-${B.analiz.max})`);
  if (mk < B.motto.min || mk > B.motto.max)
    h.push(`Motto ${mk} kelime (${B.motto.min}-${B.motto.max})`);
  if (aura_notu) {
    const ak2 = kelimeSay(aura_notu);
    if (ak2 < B.aura_notu.min || ak2 > B.aura_notu.max)
      h.push(`Aura notu ${ak2} kelime (${B.aura_notu.min}-${B.aura_notu.max})`);
    // Rengi tarif etmemeli, günü anlatmalı (4.6)
    if (/\b(reng|renk)\w*(dir|dır|tir|tır)\b|\b(reng|renk)\w*\s+(\S+\s+){0,3}(temsil|simgele|anlamına)/i.test(aura_notu))
      h.push("Aura notu rengi tarif ediyor, günü anlatmıyor (4.6)");
  }
  // Motto kuralları (4.3)
  if (motto && !motto.trim().endsWith(".")) h.push("Motto nokta ile bitmiyor");
  if (/\bsen\b|\bsana\b|\bsenin\b|\bseni\b/i.test(motto)) h.push("Motto kişisel — 'sen' demez (4.3)");
  // "Bugün" tekrarı (Sugarman)
  const bg = (tum.match(/bugün/gi) || []).length;
  if (bg > B.bugunLimit) h.push(`"Bugün" ${bg} kez (en fazla ${B.bugunLimit})`);
  // Kehanet (5.4)
  if (/\b\w+acaksın\b|\b\w+eceksin\b|\b\w+acaksınız\b|\b\w+eceksiniz\b/i.test(tum))
    h.push("Kehanet: gelecek zaman bildirimi (5.4)");
  // Gökyüzü verisi somut geçmeli (4.2)
  if (analiz && !/\bay\b|dolunay|yeni ay|hilal|dördün|merkür|retro|güneş|burcunda/i.test(analiz))
    h.push("Analizde somut gökyüzü verisi yok (4.2)");
  // Veri-metin tutarlılığı (4.2)
  if (skorlar) {
    const KAT = { aile: ["aile", "ev", "yakın"], is: ["iş", "mesleki", "masa"],
      ask: ["aşk", "kalp", "sevdiğin", "duygu"], para: ["para", "bütçe", "harcama", "hesap"] };
    const enSans = Object.entries(skorlar).sort((a, b) => b[1].sans - a[1].sans)[0][0];
    const enRisk = Object.entries(skorlar).sort((a, b) => b[1].risk - a[1].risk)[0][0];
    const gecti = (k) => KAT[k].some((w) => kucult(tum).includes(w));
    if (!gecti(enSans)) h.push(`En yüksek şans alanı (${enSans}) metinde geçmiyor (4.2)`);
    if (!gecti(enRisk)) h.push(`En yüksek risk alanı (${enRisk}) metinde geçmiyor (4.2)`);
  }
  return h;
}

/* Synastry denetimi: { analiz }, ilişki türü ve burç adlarıyla */
export function denetleSynastry(cikti, { relType, burclar, mod = "api" } = {}) {
  const B = bant(mod);
  const h = [];
  const analiz = (cikti && cikti.analiz) || "";

  yasakTara(analiz, [ORTAK_YASAK, SYNASTRY_YASAK]).forEach((y) => h.push(`Yasaklı kalıp: "${y}"`));
  if (EMOJI.test(analiz)) h.push("Emoji kullanılmış");
  if (analiz.includes("!")) h.push("Ünlem (4.5)");

  const k = kelimeSay(analiz);
  if (k < B.synastry.min || k > B.synastry.max)
    h.push(`Uyum okuması ${k} kelime (${B.synastry.min}-${B.synastry.max})`);

  // İlişki türü sözlüğü (4.5)
  if (relType === "is" && /\bkalp\b|\bruh\b|\başk\b|romantik|\bsevgi\b/i.test(analiz))
    h.push("İş birliğinde kalp/romantizm dili (4.5)");
  if ((relType === "aile" || relType === "arkadas") && /romantik|\başk\b/i.test(analiz))
    h.push(`${relType} okumasında romantizm dili (4.5)`);
  // İki burç da geçmeli
  if (burclar && !burclar.every((b) => analiz.includes(b)))
    h.push("İki burç adı metinde geçmiyor (4.5)");
  // Kehanet
  if (/\b\w+acaksınız\b|\b\w+eceksiniz\b/i.test(analiz)) h.push("Kehanet: gelecek bildirimi (5.4)");
  return h;
}

/* Check-in denetimi: { kriz, not }, kullanıcı notuyla */
export function denetleCheckin(cikti, { kullaniciNotu = "", mod = "api" } = {}) {
  const B = bant(mod);
  const h = [];
  const kriz = !!(cikti && cikti.kriz);
  const not = (cikti && cikti.not) || "";

  // Kriz sinyali kaçırıldı mı? (5.2 — en öncelikli)
  const sinyal = yasakTara(kullaniciNotu, [KRIZ_SINYAL]);
  if (sinyal.length > 0 && !kriz)
    h.push(`KRİTİK: Kriz sinyali kaçırıldı ("${sinyal[0]}") — 5.2 protokolü uygulanmalıydı`);

  if (kriz) {
    // Kriz notunda astroloji olmamalı
    if (/\bay\b|burç|gökyüzü|gezegen|retro|element|dolunay/i.test(not))
      h.push("KRİZ notunda astroloji var (5.2)");
    // Yönlendirme olmalı
    if (!/uzman|profesyonel|güvendiğin|birine|konuş|ulaş|destek/i.test(not))
      h.push("KRİZ notunda insana/profesyonele yönlendirme yok (5.2)");
  } else {
    const k = kelimeSay(not);
    if (k < B.checkin.min || k > B.checkin.max)
      h.push(`Bugünün notu ${k} kelime (${B.checkin.min}-${B.checkin.max})`);
  }

  yasakTara(not, [ORTAK_YASAK, CHECKIN_YASAK]).forEach((y) => h.push(`Yasaklı kalıp: "${y}"`));
  if (EMOJI.test(not)) h.push("Emoji kullanılmış");
  if (not.includes("!")) h.push("Ünlem (4.4)");
  if (/\b\w+acaksın\b|\b\w+eceksin\b/i.test(not)) h.push("Kehanet: gelecek bildirimi (5.4)");
  return h;
}

/* ---------- FAZ 2 KULLANIMI ----------
   API çıktısı geldiğinde:

   const hatalar = denetleGunluk(apiCikti, skorlar);
   if (hatalar.length > 0) {
     // 1) Yeniden iste (retry) — hataları modele geri bildir
     // 2) Ya da yerel havuza düş (fallback)
   }
   ------------------------------------- */

/* Tek noktadan denetim — tür adına göre yönlendirir */
export function denetle(tur, cikti, baglam = {}) {
  const mod = baglam.mod || "api";
  switch (tur) {
    case "gunluk": return denetleGunluk(cikti, baglam.skorlar, mod);
    case "synastry": return denetleSynastry(cikti, baglam);
    case "checkin": return denetleCheckin(cikti, baglam);
    default: return [`Bilinmeyen tür: ${tur}`];
  }
}

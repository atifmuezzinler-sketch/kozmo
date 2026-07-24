/* Anayasa denetimi — Edge Function sürümü (api modu)
   Kaynak: src/lib/anayasa-denetim.js
   Anayasa 3.7 / 5.7: "Talimat unutabilir; tarama unutmaz." */

const ORTAK_YASAK = [
  "enerjiniz yüksek", "enerjin yüksek", "yıldızlar sizden yana", "yıldızlar senden yana",
  "şanslı gündesin", "şanslı gününüz", "aşk kapıda", "sürprizlere açık ol",
  "kendinizi şımart", "kendini şımart", "pozitif enerji",
  "titreşim", "frekans yükselt", "manifest", "çakra", "enerji alanı",
  // mistik "enerji" kullanımları — gri liste (gündelik "bu enerjiyi işine yatır" serbest)
  "evrene niyet", "kozmik bolluk", "evren sana", "evren size", "evrenin planı",
  "auranı temizle",
  "her şeyi başarabilirsin", "sınır yok", "hayallerinin peşinden koş",
  "asla vazgeçme", "harika bir gün olacak", "sen güçlüsün", "pozitif kal",
  "dikkatli olun", "kötü haber alabilir", "kayıp yaşayabilir",
  "sağlığınıza dikkat", "sağlığına dikkat",
  "kesinlikle", "garanti eder", "%100", "yüzde yüz",
  "kendine bir iyilik yap", "unutma ki", "hak ediyorsun", "hak ediyorsunuz",
  "bunu hissetmene izin ver", "harika hissettirecek", "kendine nazik ol",
  "bir yapay zeka olarak", "elbette!", "işte size", "umarım yardımcı olur",
  "depresyon", "anksiyete", "panik atak", "travma", "terapi", "tedavi",
  "ilaç kullan", "doktora git",
  "yatırım yap", "hisse al", "altın al", "kripto", "borsa", "kumar",
  "bahis", "piyango", "sayısal loto", "şans oyunu", "tombala", "iddaa",
  "istifa et", "boşan", "dava aç",
];

const SYNASTRY_YASAK = [
  "ayrılık", "ayrılırsınız", "ayrılacak", "kavga", "tartışma çıkar",
  "ihanet", "aldat", "terk et", "boşanma", "yürümez", "yürümeyecek",
  "uyumsuz", "geçimsiz", "sorunlu bir", "yorucu bir", "zor bir ilişki",
  "ruh eşi", "kader birliği", "yazgınızda", "mükemmel uyum",
];

const CHECKIN_YASAK = [
  "üzülme", "boş ver", "olumlu düşün", "geçer bu", "her şey yoluna girecek",
  "gülümse", "sadece bir gün", "büyütme", "herkes böyle hisseder", "evrene bırak",
];

export const KRIZ_SINYAL = [
  "dayanamıyorum", "dayanamayacağım", "bitmesini istiyorum", "yaşamak istemiyorum",
  "anlamsız geliyor", "anlamı yok", "artık yapamıyorum", "kimse yok",
  "çaresizim", "umudum yok", "son bulsun", "kendime zarar", "canıma",
  "vazgeçsem her şeyden", "tükendim",
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const kelimeSay = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const kucult = (s: string) => s.toLocaleLowerCase("tr-TR");

function yasakTara(metin: string, listeler: string[][]): string[] {
  const t = kucult(metin);
  const bulunan: string[] = [];
  for (const liste of listeler)
    for (const y of liste) if (t.includes(kucult(y))) bulunan.push(y);
  return bulunan;
}

/* API modu bantları — anayasa v1.2 */
const B = {
  gunun_cumlesi: { min: 8, max: 16 },
  analiz: { min: 45, max: 70 },
  motto: { min: 4, max: 10 },
  synastry: { min: 22, max: 50 },
  checkin: { min: 12, max: 32 },
  aura_notu: { min: 9, max: 16 },
  bugunLimit: 3, // 2 iken model doğal olarak 3 kullanıp gereksiz retry tetikliyordu
};

/* "enerji" mistik anlamda mı kullanılmış? (gri liste kontrolü)
   Serbest: "bu enerjiyi işine yatır" (gündelik/fiziksel)
   Yasak: "Başak enerjisi", "günün enerjisi", "Ay enerjisi" (mistik güç) */
const MISTIK_ENERJI = /\b(koç|boğa|ikizler|yengeç|aslan|başak|terazi|akrep|yay|oğlak|kova|balık|ay|güneş|merkür|venüs|mars|gökyüzü|burcun|günün|evren)\w*\s+enerji/i;

export function denetleGunluk(c: any, skorlar?: any): string[] {
  const h: string[] = [];
  const gc = c?.gunun_cumlesi ?? "", an = c?.analiz ?? "", mo = c?.motto ?? "", au = c?.aura_notu ?? "";
  if (!gc || !an || !mo || !au)
    return ["Eksik alan: gunun_cumlesi, analiz, motto veya aura_notu yok"];
  const tum = [gc, an, mo, au].join(" ");

  yasakTara(tum, [ORTAK_YASAK]).forEach((y) => h.push(`Yasaklı kalıp: "${y}"`));
  if (MISTIK_ENERJI.test(tum)) h.push('"enerji" mistik anlamda kullanılmış (gri liste)');
  if (EMOJI.test(tum)) h.push("Emoji kullanılmış");
  if (/!!/.test(tum)) h.push("Çift ünlem");
  if (mo.includes("!")) h.push("Mottoda ünlem (4.3)");

  const gk = kelimeSay(gc), ak = kelimeSay(an), mk = kelimeSay(mo);
  if (gk < B.gunun_cumlesi.min || gk > B.gunun_cumlesi.max)
    h.push(`Günün cümlesi ${gk} kelime (${B.gunun_cumlesi.min}-${B.gunun_cumlesi.max})`);
  if (ak < B.analiz.min || ak > B.analiz.max)
    h.push(`Analiz ${ak} kelime (${B.analiz.min}-${B.analiz.max})`);
  if (mk < B.motto.min || mk > B.motto.max)
    h.push(`Motto ${mk} kelime (${B.motto.min}-${B.motto.max})`);
  const auk = kelimeSay(au);
  if (auk < B.aura_notu.min || auk > B.aura_notu.max)
    h.push(`Aura notu ${auk} kelime (${B.aura_notu.min}-${B.aura_notu.max})`);
  if (/\b(reng|renk)\w*(dir|dır|tir|tır)\b|\b(reng|renk)\w*\s+(\S+\s+){0,3}(temsil|simgele|anlamına)/i.test(au))
    h.push("Aura notu rengi tarif ediyor, günü anlatmıyor (4.6)");

  if (!mo.trim().endsWith(".")) h.push("Motto nokta ile bitmiyor");
  if (/\bsen\b|\bsana\b|\bsenin\b|\bseni\b/i.test(mo)) h.push("Motto kişisel (4.3)");

  const bg = (tum.match(/bugün/gi) || []).length;
  if (bg > B.bugunLimit) h.push(`"Bugün" ${bg} kez (en fazla ${B.bugunLimit})`);
  if (/\b\w+acaksın\b|\b\w+eceksin\b|\b\w+acaksınız\b|\b\w+eceksiniz\b/i.test(tum))
    h.push("Kehanet: gelecek zaman bildirimi (5.4)");
  if (!/\bay\b|dolunay|yeni ay|hilal|dördün|merkür|retro|güneş|burcunda/i.test(an))
    h.push("Analizde somut gökyüzü verisi yok (4.2)");

  if (skorlar) {
    const KAT: Record<string, string[]> = {
      aile: ["aile", "ev", "yakın"], is: ["iş", "mesleki", "masa"],
      ask: ["aşk", "kalp", "sevdiğin", "duygu"], para: ["para", "bütçe", "harcama", "hesap"],
    };
    const gir = Object.entries(skorlar) as [string, any][];
    const enSans = gir.sort((a, b) => b[1].sans - a[1].sans)[0][0];
    const enRisk = gir.sort((a, b) => b[1].risk - a[1].risk)[0][0];
    const gecti = (k: string) => KAT[k].some((w) => kucult(tum).includes(w));
    if (!gecti(enSans)) h.push(`En yüksek şans alanı (${enSans}) metinde yok (4.2)`);
    if (!gecti(enRisk)) h.push(`En yüksek risk alanı (${enRisk}) metinde yok (4.2)`);
  }
  return h;
}

export function denetleSynastry(c: any, relType?: string, burclar?: string[]): string[] {
  const h: string[] = [];
  const an = c?.analiz ?? "";
  if (!an) return ["Eksik alan: analiz yok"];

  yasakTara(an, [ORTAK_YASAK, SYNASTRY_YASAK]).forEach((y) => h.push(`Yasaklı kalıp: "${y}"`));
  if (EMOJI.test(an)) h.push("Emoji kullanılmış");
  if (an.includes("!")) h.push("Ünlem (4.5)");

  const k = kelimeSay(an);
  if (k < B.synastry.min || k > B.synastry.max)
    h.push(`Uyum okuması ${k} kelime (${B.synastry.min}-${B.synastry.max})`);
  if (relType === "is" && /\bkalp\b|\bruh\b|\başk\b|romantik|\bsevgi\b/i.test(an))
    h.push("İş birliğinde kalp/romantizm dili (4.5)");
  if ((relType === "aile" || relType === "arkadas") && /romantik|\başk\b/i.test(an))
    h.push(`${relType} okumasında romantizm dili (4.5)`);
  if (burclar && !burclar.every((b) => an.includes(b)))
    h.push("İki burç adı metinde geçmiyor (4.5)");
  if (/\b\w+acaksınız\b|\b\w+eceksiniz\b/i.test(an)) h.push("Kehanet (5.4)");
  return h;
}

export function denetleCheckin(c: any, kullaniciNotu = ""): string[] {
  const h: string[] = [];
  const kriz = !!c?.kriz;
  const not = c?.not ?? "";
  if (!not) return ["Eksik alan: not yok"];

  const sinyal = yasakTara(kullaniciNotu, [KRIZ_SINYAL]);
  if (sinyal.length > 0 && !kriz)
    h.push(`KRİTİK: Kriz sinyali kaçırıldı ("${sinyal[0]}") — 5.2 protokolü`);

  if (kriz) {
    if (/\bay\b|burç|gökyüzü|gezegen|retro|element|dolunay/i.test(not))
      h.push("KRİZ notunda astroloji var (5.2)");
    if (!/uzman|profesyonel|güvendiğin|birine|konuş|ulaş|destek/i.test(not))
      h.push("KRİZ notunda yönlendirme yok (5.2)");
  } else {
    const k = kelimeSay(not);
    if (k < B.checkin.min || k > B.checkin.max)
      h.push(`Bugünün notu ${k} kelime (${B.checkin.min}-${B.checkin.max})`);
  }

  yasakTara(not, [ORTAK_YASAK, CHECKIN_YASAK]).forEach((y) => h.push(`Yasaklı kalıp: "${y}"`));
  if (EMOJI.test(not)) h.push("Emoji kullanılmış");
  if (not.includes("!")) h.push("Ünlem (4.4)");
  if (/\b\w+acaksın\b|\b\w+eceksin\b/i.test(not)) h.push("Kehanet (5.4)");
  return h;
}

/* Kriz sinyali ön tarama — model çağrılmadan önce de kullanılabilir */
export function krizSinyaliVar(metin: string): boolean {
  return yasakTara(metin, [KRIZ_SINYAL]).length > 0;
}

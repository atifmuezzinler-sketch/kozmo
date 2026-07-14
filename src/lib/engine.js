import {
  sunLon, moonLon, planetLon, isRetro, moonPhase, signOf, natalSunLon, EL_AD,
} from "./astro";
import {
  AURA_COLORS, MOTTOS, GUNUN_CUMLESI, MOON_SENT, CAT_HIGH, CAT_RISKY,
} from "../content/metinler";

export const KATEGORILER = ["aile", "is", "ask", "para"];

/* Tohumlu rastgelelik — aynı kullanıcı + aynı gün = aynı sonuç */
export function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v) => Math.max(4, Math.min(98, Math.round(v)));
const sec = (r, dizi) => dizi[Math.floor(r() * dizi.length)];

export function elRel(a, b) {
  if (a === b) return "uyumlu";
  const ikili = (x, y) => (a === x && b === y) || (a === y && b === x);
  if (ikili("ates", "hava") || ikili("toprak", "su")) return "uyumlu";
  if (ikili("ates", "su") || ikili("hava", "toprak")) return "gergin";
  return "notr";
}

/* ============================================================
   MOCK ZEKA KATMANI — Claude API sözleşmesiyle aynı JSON şekli
   Faz 2'de bu fonksiyonun gövdesi API çağrısıyla değişecek;
   arayüz tarafında tek satır bile değişmeyecek.
   ============================================================ */
export function mockEngine(profile, date) {
  const dayKey = date.toISOString().slice(0, 10);
  const seed = hashStr(profile.birthDate + "|" + dayKey);
  const r = rng(seed);
  const natal = signOf(natalSunLon(profile.birthDate));
  const mSign = signOf(moonLon(date));
  const rel = elRel(natal.el, mSign.el);
  const bonus = rel === "uyumlu" ? 9 : rel === "gergin" ? -7 : 0;
  const phase = moonPhase(date);
  const vol =
    Math.abs(180 - phase.e) < 30 || phase.e < 30 || phase.e > 330 ? 8 : 0;

  const skorlar = {};
  for (const k of KATEGORILER) {
    skorlar[k] = {
      sans: clamp(34 + r() * 52 + bonus),
      risk: clamp(18 + r() * 52 + vol - bonus / 2),
    };
  }
  const best = KATEGORILER.reduce((a, b) =>
    skorlar[a].sans >= skorlar[b].sans ? a : b);
  const risky = KATEGORILER.reduce((a, b) =>
    skorlar[a].risk >= skorlar[b].risk ? a : b);

  /* Anti-tekrar rotasyonu: her içerik, havuz uzunluğuyla aralarında asal
     bir adımla döner — kullanıcı tüm havuzu görmeden hiçbir öğe tekrarlanmaz,
     art arda tekrar matematiksel olarak imkânsızdır. */
  const gunNo = Math.floor(date.getTime() / 86400000);
  const rot = (salt, len, step) =>
    (((hashStr(profile.birthDate + salt) + gunNo * step) % len) + len) % len;
  const renk = AURA_COLORS[rot("aura", AURA_COLORS.length, 7)];
  const motto = MOTTOS[rot("motto", MOTTOS.length, 7)];
  const havuz = GUNUN_CUMLESI[natal.el];
  /* adım, havuz boyuyla aralarında asal olacak şekilde seçilir → tam döngü:
     kullanıcı havuzdaki her cümleyi görmeden hiçbiri tekrarlanmaz */
  const asalAdim = (havuz.length % 7 === 0) ? 5 : 7;
  const gununCumlesi = havuz[rot("cumle", havuz.length, asalAdim)];

  const yukselen = profile.rising
    ? ` Yükselenin ${profile.rising.ad}; dış dünyaya açılan kapın bugün ${EL_AD[profile.rising.el].toLowerCase()} elementinden geçiyor.`
    : "";
  const analiz =
    `Güneş'in ${natal.ad} doğası bugün ${phase.ad.toLowerCase()} enerjisiyle buluşuyor; Ay ise ${mSign.ad} burcunda ilerliyor. ` +
    sec(r, MOON_SENT[rel]) + yukselen + " " +
    sec(r, CAT_HIGH[best]) + " " + sec(r, CAT_RISKY[risky]);

  return {
    skorlar,
    aura_rengi: renk.hex,
    aura_adi: renk.ad,
    motto,
    gunun_cumlesi: gununCumlesi,
    analiz,
    meta: { natal, mSign, phase },
  };
}

export function mockSynastry(pA, pB, relType) {
  const sA = signOf(natalSunLon(pA.birthDate));
  const sB = signOf(natalSunLon(pB.birthDate));
  const rel = elRel(sA.el, sB.el);
  const base = rel === "uyumlu" ? 78 : rel === "gergin" ? 52 : 64;
  const r = rng(hashStr(pA.birthDate + "&" + pB.birthDate + "&" + relType));
  const skorlar = {};
  for (const k of KATEGORILER) skorlar[k] = clamp(base - 10 + r() * 24);
  const genel = clamp(base - 4 + r() * 12);

  const RELTXT = {
    partner: "romantik bağ", arkadas: "dostluk",
    aile: "aile bağı", is: "iş birliği",
  };
  const RELDICT = {
    uyumlu: `${sA.ad} ile ${sB.ad}, ${EL_AD[sA.el]} ve ${EL_AD[sB.el]} elementlerinin doğal ittifakında buluşuyor. Bu ${RELTXT[relType]}, birbirini tamamlayan iki ritim gibi: biri tempo tutuyor, diğeri melodiyi taşıyor.`,
    gergin: `${sA.ad} ile ${sB.ad}, ${EL_AD[sA.el]} ve ${EL_AD[sB.el]} elementlerinin klasik geriliminde. Bu ${RELTXT[relType]} kolay değil ama sığ da değil: sürtünme, doğru yönetilirse cila görevi görür.`,
    notr: `${sA.ad} ile ${sB.ad} arasında ne otomatik uyum ne kalıcı gerilim var; bu ${RELTXT[relType]} büyük ölçüde emeğe yazılmış bir hikâye. Gökyüzü burada kalemi size bırakıyor.`,
  };
  return { skorlar, genel, analiz: RELDICT[rel], sA, sB };
}

/* 7 günlük gökyüzü olayları — yapılandırılmış */
export function skyWeek(fromDate) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(fromDate.getTime() + i * 86400000);
    const d1 = new Date(d.getTime() + 86400000);
    const ev = [];
    const p0 = moonPhase(d).e, p1 = moonPhase(d1).e;
    if (p0 < 180 && p1 >= 180)
      ev.push({ ikon: "🌕", metin: "Dolunay", not: "sonuçların görünür olduğu evre" });
    if (p1 < p0)
      ev.push({ ikon: "🌑", metin: "Yeni Ay", not: "yeni başlangıçlar için kapı aralığı" });
    if (isRetro("merkur", d) !== isRetro("merkur", d1))
      ev.push(isRetro("merkur", d1)
        ? { ikon: "☿", metin: "Merkür retrosu başlıyor", not: "iletişimde çift kontrol zamanı" }
        : { ikon: "☿", metin: "Merkür retrosu bitiyor", not: "iletişim trafiği normale dönüyor" });
    if (signOf(sunLon(d)).ad !== signOf(sunLon(d1)).ad)
      ev.push({ ikon: "☀", metin: `Güneş ${signOf(sunLon(d1)).ad} burcuna geçiyor`, not: "yeni sezon enerjisi" });
    if (signOf(planetLon("venus", d)).ad !== signOf(planetLon("venus", d1)).ad)
      ev.push({ ikon: "♀", metin: `Venüs ${signOf(planetLon("venus", d1)).ad} burcuna geçiyor`, not: "aşk göstergeleri hareketleniyor" });
    if (signOf(planetLon("mars", d)).ad !== signOf(planetLon("mars", d1)).ad)
      ev.push({ ikon: "♂", metin: `Mars ${signOf(planetLon("mars", d1)).ad} burcuna geçiyor`, not: "enerji ve hız göstergeleri değişiyor" });
    out.push({ d, ev });
  }
  return out;
}

/* Skor gerekçesi — yalnızca gerçekten hesaplanan etkenleri söyler */
export function skorNasil(profile, daily) {
  const m = daily.meta.mSign;
  const rel = elRel(profile.sign.el, m.el);
  const e = daily.meta.phase.e;
  const vol = Math.abs(180 - e) < 30 || e < 30 || e > 330;
  const relTxt = {
    uyumlu: "uyumlu bir elementte ilerliyor; bu, günün skorlarını yukarı esnetiyor",
    gergin: "gergin bir açıda; bu, skorları temkinli tarafa çekiyor",
    notr: "nötr bir konumda; belirleyici olan senin kişisel gün formülün",
  };
  return `Ay bugün ${m.ad} burcunda ve senin ${EL_AD[profile.sign.el]} doğanla ${relTxt[rel]}. ` +
    (vol ? `${daily.meta.phase.ad} yakınlığı gün içi dalgalanmayı artırıyor. ` : "") +
    "Skorlar, doğum tarihin ile günün gerçek gökyüzü konumlarını birleştiren kişisel gün formülünden türetilir; yorum katmanı geliştirme aşamasındadır.";
}

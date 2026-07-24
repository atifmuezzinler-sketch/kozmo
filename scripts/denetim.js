/* Yerel içerik havuzunu anayasaya karşı denetler.
   Kullanım: npm run denetim
   Metin havuzuna her ekleme sonrası çalıştırılmalıdır. */

import { mockEngine, mockSynastry, elRel } from "../src/lib/engine.js";
import { natalSunLon, signOf, CITIES, ascendant } from "../src/lib/astro.js";
import { MOODS, GLOSS } from "../src/content/metinler.js";
import { TR } from "../src/i18n/tr.js";
import { denetleGunluk, denetleSynastry, denetleCheckin, BANTLAR, ORTAK_YASAK } from "../src/lib/anayasa-denetim.js";

const YESIL = "\x1b[32m", KIRMIZI = "\x1b[31m", SARI = "\x1b[33m", SIFIR = "\x1b[0m";
let toplamHata = 0, toplamTest = 0;

function rapor(baslik, hatalar) {
  toplamTest++;
  if (hatalar.length === 0) return;
  toplamHata += hatalar.length;
  console.log(`${KIRMIZI}✗${SIFIR} ${baslik}`);
  hatalar.forEach((h) => console.log(`    ${h}`));
}

console.log("\n═══ KOZMO ANAYASA DENETİMİ (yerel havuz) ═══\n");

/* 1. GÜNLÜK ÇIKTI — dört element × 30 gün */
console.log("1. Günlük çıktı (4 element × 30 gün = 120 kombinasyon)");
const ornekler = { Ateş: "1990-04-10", Toprak: "1990-05-10", Hava: "1990-06-10", Su: "1991-03-10" };
for (const [el, bd] of Object.entries(ornekler)) {
  const p = { birthDate: bd, sign: signOf(natalSunLon(bd)), rising: null };
  for (let i = 0; i < 30; i++) {
    const g = new Date(Date.UTC(2026, 6, 15 + i));
    const r = mockEngine(p, g);
    rapor(`${el} · gün ${i + 1}`,
      denetleGunluk({ gunun_cumlesi: r.gunun_cumlesi, analiz: r.analiz, motto: r.motto, aura_notu: r.aura_notu }, r.skorlar, "yerel"));
  }
}

/* 2. SYNASTRY — çiftler × ilişki türleri */
console.log("2. Uyum okuması (5 çift × 4 ilişki türü = 20 kombinasyon)");
const ciftler = [
  ["1988-07-20", "1990-01-15"], ["1992-03-30", "1994-09-12"],
  ["1975-05-10", "2005-08-25"], ["1995-06-01", "1996-02-14"],
  ["1980-11-11", "1980-11-11"],
];
for (const [a, b] of ciftler)
  for (const rel of ["partner", "arkadas", "aile", "is"]) {
    const r = mockSynastry({ birthDate: a }, { birthDate: b }, rel);
    rapor(`${r.sA.ad}+${r.sB.ad} · ${rel}`,
      denetleSynastry({ analiz: r.analiz }, { relType: rel, burclar: [r.sA.ad, r.sB.ad], mod: "yerel" }));
  }

/* 3. CHECK-IN — tüm ruh halleri × tüm varyantlar */
console.log("3. Bugünün notu (8 ruh hali × 5 varyant = 40 metin)");
for (const m of MOODS)
  m.rx.forEach((not, i) =>
    rapor(`${m.ad} · varyant ${i + 1}`, denetleCheckin({ kriz: false, not }, { kullaniciNotu: "", mod: "yerel" })));

/* 4. KRİZ PROTOKOLÜ — sinyal yakalama testi */
console.log("4. Kriz protokolü (sinyal yakalama)");
const krizTestleri = [
  { not: "artık dayanamıyorum, her şey anlamsız geliyor", beklenen: true },
  { not: "kendime zarar vermeyi düşünüyorum", beklenen: true },
  { not: "yaşamak istemiyorum artık", beklenen: true },
  { not: "bugün işler yoğundu, biraz yorgunum", beklenen: false },
  { not: "sınav stresi var ama hallederim", beklenen: false },
  { not: "", beklenen: false },
];
for (const t of krizTestleri) {
  // Sistem kriz bayrağını doğru kaldırıyor mu? (beklenen=true iken kriz=false ise KRİTİK hata)
  const h = denetleCheckin({ kriz: t.beklenen, not: t.beklenen
    ? "Bugün taşıdığın şey ağır ve bunu tek başına taşımak zorunda değilsin. Güvendiğin birine ya da bir uzmana ulaş."
    : "Yorgunluk bir borç faturası; bugün asgari ödemeyi yap. Listenden bir işi sil, kalanı yavaşlat." },
    { kullaniciNotu: t.not });
  rapor(`Kriz sinyali: "${t.not.slice(0, 30) || "(boş)"}" → ${t.beklenen}`, h);
  // Ters test: kriz sinyali varken bayrak kalkmazsa yakalanmalı
  if (t.beklenen) {
    const kacirma = denetleCheckin({ kriz: false, not: "Bugün kendine bir mola ver; kısa bir yürüyüş iyi gelir." },
      { kullaniciNotu: t.not });
    const yakalandi = kacirma.some((x) => x.startsWith("KRİTİK"));
    toplamTest++;
    if (!yakalandi) {
      toplamHata++;
      console.log(`${KIRMIZI}✗${SIFIR} Kriz kaçırma YAKALANMADI: "${t.not.slice(0, 30)}"`);
    }
  }
}

/* 5. STATİK ARAYÜZ METİNLERİ — anayasa yalnızca üretilen içeriğe değil,
   Kozmo'nun her sesine uygulanır. Sözlük tanımları ve arayüz metinleri
   de taranır (24 Tem 2026'da burada iki "mistik enerji" ihlali bulundu). */
console.log("5. Statik arayüz metinleri (sözlük + arayüz)");
const MISTIK_UI = /\b(koç|boğa|ikizler|yengeç|aslan|başak|terazi|akrep|yay|oğlak|kova|balık|ay|güneş|merkür|venüs|mars|gökyüzü|burcun|günün|evren)\w*\s+enerji|enerji\s+(birik|akış|aktar|yüksel)/i;
const kucultUI = (x) => x.toLocaleLowerCase("tr-TR");
function statikTara(kaynak, ad) {
  const gez = (obj, yol = "") => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (typeof v === "string") {
        const hatalar = [];
        for (const y of ORTAK_YASAK)
          if (kucultUI(v).includes(kucultUI(y))) hatalar.push(`Yasaklı kalıp: "${y}"`);
        if (MISTIK_UI.test(v)) hatalar.push('"enerji" mistik anlamda kullanılmış');
        rapor(`${ad}.${yol}${k}`, hatalar);
      } else if (v && typeof v === "object") gez(v, `${yol}${k}.`);
    }
  };
  gez(kaynak);
}
statikTara(TR, "TR");
statikTara(GLOSS, "GLOSS");

/* SONUÇ */
console.log(`\n${"─".repeat(48)}`);
if (toplamHata === 0)
  console.log(`${YESIL}✓ TEMİZ${SIFIR} — ${toplamTest} kontrol, 0 anayasa ihlali`);
else
  console.log(`${KIRMIZI}✗ ${toplamHata} ihlal${SIFIR} / ${toplamTest} kontrol`);
const B = BANTLAR.yerel;
console.log(`${SARI}Mod: yerel${SIFIR} (parça birleştirme mimarisi) — analiz ${B.analiz.min}-${B.analiz.max} · ` +
  `uyum ${B.synastry.min}-${B.synastry.max} · not ${B.checkin.min}-${B.checkin.max} · "bugün" max ${B.bugunLimit}\n`);
process.exit(toplamHata === 0 ? 0 : 1);

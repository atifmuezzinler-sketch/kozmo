/* ============================================================
   KOZMO — Zeka Katmanı Kapıcısı (Supabase Edge Function)

   Görev: Claude API anahtarını güvende tutmak, sistem talimatıyla
   çağrı yapmak, çıktıyı anayasa denetiminden geçirmek.

   Akış:
     uygulama → bu fonksiyon → Claude API → denetim → uygulama
     denetim başarısızsa: 1 kez yeniden dene → yine olmazsa hata dön
     (uygulama hata alınca yerel havuza düşer, kullanıcı fark etmez)

   Gizli anahtar: ANTHROPIC_API_KEY (Supabase Secrets'ta tutulur)
   ============================================================ */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { TALIMATLAR } from "./talimatlar.ts";
import { denetleGunluk, denetleSynastry, denetleCheckin, krizSinyaliVar } from "./denetim.ts";

/* Varsayılan model: Opus 4.8.
   A/B/C testiyle seçildi (17 Tem 2026, aynı girdi, üç model):
   - Opus 4.8:  8.4 sn · 324 çıktı token · ~$0.012/çağrı · kalite en iyi  ← SEÇİLDİ
   - Sonnet 5: 36.8 sn · 2512 token (2212'si düşünme) · ~$0.027 · 4x yavaş, 2x pahalı
   - Haiku 4.5: hızlı ama Türkçe yazım hataları ("başlangışlara", "Merkur") → elendi
   Test için istekte "model" alanı gönderilebilir. */
const VARSAYILAN_MODEL = "claude-opus-4-8";
const IZINLI_MODELLER = [
  "claude-sonnet-5", "claude-opus-4-8",
  "claude-haiku-4-5-20251001", "claude-sonnet-4-6",
];
/* 1200 iken Sonnet 5 "boş yanıt" veriyordu: yeni nesil modeller düşünme
   (thinking) için token harcıyor ve yazmaya yer kalmıyordu. 4000 rahat sınır;
   çıktı zaten ~350 token, fazlası faturaya yansımaz (yalnızca üretilen sayılır). */
const MAX_TOKENS = 4000;

/* ---------- RATE LIMITING (fatura koruması) ----------
   IP başına saatlik ve günlük kova. Önceden üretim mimarisi günde tek çağrı
   yaptığı için normal kullanıcı bu sınıra değmez; yalnızca kötüye kullanımı keser.
   Bellek-içi; Edge izolatı yeniden başlarsa sıfırlanır — kaba ama etkili ilk savunma. */
const KOVA = new Map<string, { saat: number[]; gun: number[] }>();
const SAAT_LIMIT = 20;   // bir IP saatte en fazla 20 çağrı
const GUN_LIMIT = 100;   // bir IP günde en fazla 100 çağrı
const SAAT_MS = 3600_000;
const GUN_MS = 86_400_000;

function rateLimit(ip: string): { izin: boolean; kalan: number } {
  const simdi = Date.now();
  const kayit = KOVA.get(ip) ?? { saat: [], gun: [] };
  kayit.saat = kayit.saat.filter((t) => simdi - t < SAAT_MS);
  kayit.gun = kayit.gun.filter((t) => simdi - t < GUN_MS);
  if (kayit.saat.length >= SAAT_LIMIT || kayit.gun.length >= GUN_LIMIT) {
    KOVA.set(ip, kayit);
    return { izin: false, kalan: 0 };
  }
  kayit.saat.push(simdi);
  kayit.gun.push(simdi);
  KOVA.set(ip, kayit);
  // Bellek şişmesini önle: 5000 IP üstünde en eskiyi at
  if (KOVA.size > 5000) KOVA.delete(KOVA.keys().next().value);
  return { izin: true, kalan: GUN_LIMIT - kayit.gun.length };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/* Claude API çağrısı — prompt caching ile (sistem talimatı %90 ucuzlar) */
async function claudeCagir(talimat: string, kullaniciMesaji: string, apiKey: string, model: string) {
  const yanit = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text",
          text: talimat,
          cache_control: { type: "ephemeral" }, // her çağrıda aynı → cache
        },
      ],
      messages: [{ role: "user", content: kullaniciMesaji }],
    }),
  });

  if (!yanit.ok) {
    const hata = await yanit.text();
    throw new Error(`Claude API ${yanit.status}: ${hata.slice(0, 200)}`);
  }
  const veri = await yanit.json();
  const metin = (veri.content ?? [])
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("");
  // Teşhis: metin boşsa yanıtın yapısını hataya taşı
  if (!metin.trim()) {
    const bloklar = (veri.content ?? []).map((p: any) => p.type).join(",") || "hiç blok yok";
    throw new Error(
      `Model metin döndürmedi. Blok tipleri: [${bloklar}]. ` +
      `stop_reason: ${veri.stop_reason ?? "?"}. usage: ${JSON.stringify(veri.usage ?? {})}`,
    );
  }
  return { metin, kullanim: veri.usage ?? null };
}

/* Modelin döndürdüğü metinden JSON çıkar.
   Modeller bazen önsöz, kod bloğu ya da açıklama ekler; hepsini ayıklar. */
function jsonAyikla(metin: string) {
  if (!metin || !metin.trim()) throw new Error("Model boş yanıt döndürdü");

  // 1) Kod bloğu sarmalını temizle
  let temiz = metin.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

  // 2) Doğrudan dene
  try { return JSON.parse(temiz); } catch { /* devam */ }

  // 3) İlk { ile son } arasını al (önsöz/sonsöz varsa kurtarır)
  const bas = temiz.indexOf("{");
  const son = temiz.lastIndexOf("}");
  if (bas !== -1 && son > bas) {
    try { return JSON.parse(temiz.slice(bas, son + 1)); } catch { /* devam */ }
  }

  // 4) Dengeli süslü parantez taraması (iç içe JSON için)
  if (bas !== -1) {
    let derinlik = 0;
    for (let i = bas; i < temiz.length; i++) {
      if (temiz[i] === "{") derinlik++;
      else if (temiz[i] === "}") {
        derinlik--;
        if (derinlik === 0) {
          try { return JSON.parse(temiz.slice(bas, i + 1)); } catch { break; }
        }
      }
    }
  }
  // Teşhis için ham yanıtın başını hataya ekle
  throw new Error(`Geçerli JSON bulunamadı. Ham yanıt başı: ${metin.slice(0, 300)}`);
}

/* Türe göre denetim */
function denetle(tur: string, cikti: any, girdi: any): string[] {
  switch (tur) {
    case "gunluk":
      return denetleGunluk(cikti, girdi.skorlar);
    case "synastry":
      return denetleSynastry(cikti, girdi.iliski_turu, girdi.burclar);
    case "checkin":
      return denetleCheckin(cikti, girdi.kullanici_notu ?? "");
    default:
      return [`Bilinmeyen tür: ${tur}`];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ hata: "Yalnızca POST" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ hata: "ANTHROPIC_API_KEY tanımlı değil" }, 500);

  // Rate limit — IP başına (proxy başlıklarından, yoksa "bilinmeyen")
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
             req.headers.get("cf-connecting-ip") || "bilinmeyen";
  const rl = rateLimit(ip);
  if (!rl.izin) {
    return json({ hata: "Çok fazla istek. Lütfen sonra tekrar deneyin.", kod: "rate_limit" }, 429);
  }

  let govde: any;
  try {
    govde = await req.json();
  } catch {
    return json({ hata: "Geçersiz JSON gövdesi" }, 400);
  }

  const { tur, girdi, model: istenenModel } = govde ?? {};
  if (!tur || !girdi) return json({ hata: "'tur' ve 'girdi' zorunlu" }, 400);
  if (!TALIMATLAR[tur]) return json({ hata: `Bilinmeyen tür: ${tur}` }, 400);

  const model = istenenModel && IZINLI_MODELLER.includes(istenenModel)
    ? istenenModel : VARSAYILAN_MODEL;

  /* KRİZ ÖN TARAMASI (anayasa 5.2 — en öncelikli madde)
     Model çağrılmadan önce yerel tarama; sinyal varsa model yine çağrılır
     ama denetim katmanı bayrağı zorunlu tutar. */
  const krizOn = tur === "checkin" && krizSinyaliVar(girdi.kullanici_notu ?? "");

  const talimat = TALIMATLAR[tur];
  const kullaniciMesaji = JSON.stringify(girdi, null, 1);

  let sonHatalar: string[] = [];
  for (let deneme = 1; deneme <= 2; deneme++) {
    try {
      const mesaj =
        deneme === 1
          ? kullaniciMesaji
          : `${kullaniciMesaji}\n\nÖNCEKİ DENEMEN ŞU KURALLARI İHLAL ETTİ, DÜZELT:\n- ${sonHatalar.join("\n- ")}`;

      const t0 = Date.now();
      const { metin: ham, kullanim } = await claudeCagir(talimat, mesaj, apiKey, model);
      const sure = Date.now() - t0;
      const cikti = jsonAyikla(ham);
      const hatalar = denetle(tur, cikti, girdi);

      // Kriz ön taraması olumluysa bayrak zorunlu
      if (krizOn && !cikti.kriz) hatalar.push("KRİTİK: Kriz sinyali var, kriz:true olmalı (5.2)");

      if (hatalar.length === 0) {
        return json({ basarili: true, cikti, deneme, model, sure_ms: sure, kullanim });
      }
      sonHatalar = hatalar;
      console.log(`Deneme ${deneme} denetimden geçemedi:`, hatalar);
    } catch (e) {
      sonHatalar = [String(e instanceof Error ? e.message : e)];
      console.error(`Deneme ${deneme} hata:`, sonHatalar[0]);
      // API hatası ise ikinci denemenin faydası yok
      if (sonHatalar[0].includes("Claude API 4")) break;
    }
  }

  /* İki deneme de başarısız — uygulama yerel havuza düşecek */
  return json({ basarili: false, hatalar: sonHatalar, model }, 200);
});

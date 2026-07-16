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

/* Varsayılan model. Test için istekte "model" alanı gönderilebilir:
   claude-sonnet-5 (varsayılan, $2/$10 intro) | claude-opus-4-8 ($5/$25)
   claude-haiku-4-5-20251001 ($1/$5) | claude-sonnet-4-6 ($3/$15) */
const VARSAYILAN_MODEL = "claude-sonnet-5";
const IZINLI_MODELLER = [
  "claude-sonnet-5", "claude-opus-4-8",
  "claude-haiku-4-5-20251001", "claude-sonnet-4-6",
];
const MAX_TOKENS = 1200;

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
  return { metin, kullanim: veri.usage ?? null };
}

/* Modelin döndürdüğü metinden JSON çıkar (kod bloğu sarmalı olsa bile) */
function jsonAyikla(metin: string) {
  const temiz = metin.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(temiz);
  } catch {
    const bas = temiz.indexOf("{");
    const son = temiz.lastIndexOf("}");
    if (bas !== -1 && son > bas) return JSON.parse(temiz.slice(bas, son + 1));
    throw new Error("Geçerli JSON bulunamadı");
  }
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

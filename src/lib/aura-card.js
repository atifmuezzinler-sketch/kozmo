/* Kart görselleri: 1080x1920 (9:16 story) PNG üretir.
   Önce cihazın paylaşım menüsünü dener (mobil); olmazsa indirir. */
import { SITE_ADRESI } from "../config";

function satirSar(ctx, metin, maxW) {
  const kelimeler = metin.split(" ");
  const satirlar = [];
  let satir = "";
  for (const k of kelimeler) {
    const deneme = satir ? satir + " " + k : k;
    if (ctx.measureText(deneme).width > maxW && satir) {
      satirlar.push(satir);
      satir = k;
    } else satir = deneme;
  }
  satirlar.push(satir);
  return satirlar;
}

/* Ortak zemin: gece moru + yıldızlar */
function zemin(x, W, H) {
  x.fillStyle = "#1a0b2e";
  x.fillRect(0, 0, W, H);
  const g0 = x.createRadialGradient(W * 0.85, -80, 0, W * 0.85, -80, 1000);
  g0.addColorStop(0, "rgba(22,35,77,0.9)");
  g0.addColorStop(1, "rgba(22,35,77,0)");
  x.fillStyle = g0;
  x.fillRect(0, 0, W, H);
  let s = 987654321;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  for (let i = 0; i < 130; i++) {
    x.globalAlpha = 0.12 + rnd() * 0.5;
    x.fillStyle = "#ffffff";
    x.beginPath();
    x.arc(rnd() * W, rnd() * H, rnd() * 2.2 + 0.6, 0, 7);
    x.fill();
  }
  x.globalAlpha = 1;
}

/* Ortak künye: alt çizgi, sol/sağ metin, ortada site adresi */
function kunye(x, W, sol, sag) {
  x.strokeStyle = "rgba(255,255,255,0.16)";
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(90, 1740);
  x.lineTo(W - 90, 1740);
  x.stroke();
  x.textAlign = "left";
  x.fillStyle = "#b3a7d1";
  x.font = "500 30px Montserrat, sans-serif";
  x.fillText(sol, 90, 1805);
  x.textAlign = "right";
  x.fillStyle = "#d4af37";
  x.font = "600 30px Montserrat, sans-serif";
  x.fillText(sag, W - 90, 1805);
  if (SITE_ADRESI) {
    x.textAlign = "center";
    x.fillStyle = "rgba(179,167,209,0.75)";
    x.font = "500 26px Montserrat, sans-serif";
    x.fillText(SITE_ADRESI, W / 2, 1868);
  }
}

/* PNG'yi paylaş ya da indir */
async function disariVer(c, dosyaAdi) {
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const dosya = new File([blob], dosyaAdi, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
    try {
      await navigator.share({ files: [dosya], title: "Kozmo" });
      return "paylasildi";
    } catch (e) {
      if (e && e.name === "AbortError") return "vazgecildi";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = dosya.name;
  a.click();
  URL.revokeObjectURL(a.href);
  return "indirildi";
}

export async function auraKartiUret({ renkHex, renkAd, motto, auraNotu, sign, tarihStr }) {
  await document.fonts.ready;
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  zemin(x, W, H);

  x.textAlign = "center";
  x.fillStyle = "#b3a7d1";
  x.font = "600 30px Montserrat, sans-serif";
  x.fillText("B U G Ü N K Ü   A U R A ' N", W / 2, 300);

  const oy = 750, orr = 235;
  const g = x.createRadialGradient(W / 2 - 70, oy - 85, 12, W / 2, oy, orr);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, renkHex);
  g.addColorStop(1, "#1a0b2e");
  x.shadowColor = renkHex;
  x.shadowBlur = 140;
  x.fillStyle = g;
  x.beginPath();
  x.arc(W / 2, oy, orr, 0, 7);
  x.fill();
  x.shadowBlur = 0;

  x.fillStyle = "#cfc4e6";
  x.font = "400 30px Montserrat, sans-serif";
  x.fillText("Günün rengi", W / 2, 1140);
  x.fillStyle = renkHex;
  x.font = "600 46px Montserrat, sans-serif";
  x.fillText(renkAd, W / 2, 1205);

  /* Aura notu: rengi güne bağlayan satır. Kartı gören yabancı için de
     anlamlı olduğundan renk adının hemen altında durur. */
  let mottoY = 1390;
  if (auraNotu) {
    x.fillStyle = "#bdb2d4";
    x.font = "400 33px Montserrat, sans-serif";
    const notSatir = satirSar(x, auraNotu, 840);
    notSatir.forEach((l, i) => x.fillText(l, W / 2, 1288 + i * 46));
    mottoY = 1288 + notSatir.length * 46 + 78;
  }

  x.fillStyle = "#ece6f5";
  x.font = "300 50px Montserrat, sans-serif";
  const satirlar = satirSar(x, "\u201C" + motto + "\u201D", 880);
  const bassY = mottoY - ((satirlar.length - 1) * 34);
  satirlar.forEach((l, i) => x.fillText(l, W / 2, bassY + i * 68));

  kunye(x, W, `${sign.sembol} ${sign.ad} · ${tarihStr}`, "Aura · by Kozmo");
  return disariVer(c, "kozmo-aura.png");
}

export async function uyumKartiUret({ sA, sB, adB, genel, relAd, cumle, tarihStr }) {
  await document.fonts.ready;
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  zemin(x, W, H);

  x.textAlign = "center";
  x.fillStyle = "#b3a7d1";
  x.font = "600 30px Montserrat, sans-serif";
  x.fillText("K O Z M İ K   U Y U M", W / 2, 300);

  x.fillStyle = "#ece6f5";
  x.font = "300 170px Montserrat, sans-serif";
  x.fillText(sA.sembol, W / 2 - 200, 640);
  x.fillText(sB.sembol, W / 2 + 200, 640);
  x.fillStyle = "#d4af37";
  x.font = "300 70px Montserrat, sans-serif";
  x.fillText("+", W / 2, 615);
  x.fillStyle = "#b3a7d1";
  x.font = "500 32px Montserrat, sans-serif";
  x.fillText(sA.ad, W / 2 - 200, 720);
  x.fillText(sB.ad, W / 2 + 200, 720); // mahremiyet: kartta isim değil, her zaman burç adı

  x.fillStyle = "#b3a7d1";
  x.font = "600 30px Montserrat, sans-serif";
  x.fillText("G E N E L   U Y U M", W / 2, 920);
  x.fillStyle = "#d4af37";
  x.font = "200 230px Montserrat, sans-serif";
  x.shadowColor = "#d4af37";
  x.shadowBlur = 90;
  x.fillText(String(genel), W / 2, 1160);
  x.shadowBlur = 0;
  x.fillStyle = "#cfc4e6";
  x.font = "500 34px Montserrat, sans-serif";
  x.fillText(relAd, W / 2, 1250);

  x.fillStyle = "#ece6f5";
  x.font = "300 42px Montserrat, sans-serif";
  const satirlar = satirSar(x, cumle, 880).slice(0, 4);
  const bassY = 1450 - ((satirlar.length - 1) * 28);
  satirlar.forEach((l, i) => x.fillText(l, W / 2, bassY + i * 58));

  kunye(x, W, tarihStr, "Kozmo");
  return disariVer(c, "kozmo-uyum.png");
}

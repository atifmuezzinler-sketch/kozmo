/* Aura kartını 1080x1350 PNG olarak üretir.
   Önce cihazın paylaşım menüsünü dener (mobil); olmazsa indirir. */

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

export async function auraKartiUret({ renkHex, renkAd, motto, sign, tarihStr }) {
  await document.fonts.ready;
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");

  x.fillStyle = "#1a0b2e";
  x.fillRect(0, 0, W, H);
  const g0 = x.createRadialGradient(W * 0.85, -80, 0, W * 0.85, -80, 900);
  g0.addColorStop(0, "rgba(22,35,77,0.9)");
  g0.addColorStop(1, "rgba(22,35,77,0)");
  x.fillStyle = g0;
  x.fillRect(0, 0, W, H);

  let s = 987654321;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  for (let i = 0; i < 110; i++) {
    x.globalAlpha = 0.12 + rnd() * 0.5;
    x.fillStyle = "#ffffff";
    x.beginPath();
    x.arc(rnd() * W, rnd() * H, rnd() * 2.2 + 0.6, 0, 7);
    x.fill();
  }
  x.globalAlpha = 1;

  x.textAlign = "center";
  x.fillStyle = "#b3a7d1";
  x.font = "600 30px Montserrat, sans-serif";
  x.fillText("B U G Ü N K Ü   A U R A ' N", W / 2, 170);

  const oy = 500, orr = 205;
  const g = x.createRadialGradient(W / 2 - 65, oy - 75, 12, W / 2, oy, orr);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, renkHex);
  g.addColorStop(1, "#1a0b2e");
  x.shadowColor = renkHex;
  x.shadowBlur = 130;
  x.fillStyle = g;
  x.beginPath();
  x.arc(W / 2, oy, orr, 0, 7);
  x.fill();
  x.shadowBlur = 0;

  x.fillStyle = "#cfc4e6";
  x.font = "400 30px Montserrat, sans-serif";
  x.fillText("Günün rengi", W / 2, 815);
  x.fillStyle = renkHex;
  x.font = "600 46px Montserrat, sans-serif";
  x.fillText(renkAd, W / 2, 878);

  x.fillStyle = "#ece6f5";
  x.font = "300 50px Montserrat, sans-serif";
  const satirlar = satirSar(x, "\u201C" + motto + "\u201D", 880);
  const bassY = 1005 - ((satirlar.length - 1) * 34);
  satirlar.forEach((l, i) => x.fillText(l, W / 2, bassY + i * 68));

  x.strokeStyle = "rgba(255,255,255,0.16)";
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(90, 1225);
  x.lineTo(W - 90, 1225);
  x.stroke();

  x.textAlign = "left";
  x.fillStyle = "#b3a7d1";
  x.font = "500 30px Montserrat, sans-serif";
  x.fillText(`${sign.sembol} ${sign.ad} · ${tarihStr}`, 90, 1288);
  x.textAlign = "right";
  x.fillStyle = "#d4af37";
  x.font = "600 30px Montserrat, sans-serif";
  x.fillText("Aura · by Kozmo", W - 90, 1288);

  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const dosya = new File([blob], "kozmo-aura.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
    try {
      await navigator.share({ files: [dosya], title: "Kozmo Aura" });
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

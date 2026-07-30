import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import { TR } from "../i18n/tr";
import { bildirimDesteği, izinDurumu, izinIste, bildirimGoster } from "../lib/bildirim";

/* Bildirim izni önerisi — günün okumasının altında belirir.
   Kurallar:
   - Yalnızca izin "default" ise (henüz sorulmadı) gösterilir.
   - Kullanıcı reddederse ("şimdi değil") bir daha üstelemez (localStorage).
   - Değeri gördükten SONRA sunulur; ilk açılışta değil. */

const KAPAT = "kozmo_bildirim_oneri_kapali";

export function BildirimOneri() {
  const destekli = bildirimDesteği();
  const [durum, setDurum] = useState(() => izinDurumu());
  const [kapali, setKapali] = useState(() => {
    try { return localStorage.getItem(KAPAT) === "1"; } catch { return false; }
  });
  const [sonuc, setSonuc] = useState(null); // "granted" | "denied" sonrası mesaj

  // Gösterme koşulları
  if (!destekli || kapali) return null;
  if (durum === "granted" || durum === "denied" || durum === "yok") {
    // İzin verildiyse kısa teşekkür, reddedildiyse sessizce kaybol
    if (sonuc === "granted") {
      return (
        <div className="kz-glass p-4 mb-5 kz-fade" style={{ border: "1px solid rgba(212,175,55,0.25)" }}>
          <p className="text-sm text-center" style={{ opacity: 0.85 }}>{TR.bildirimAcikMesaj}</p>
        </div>
      );
    }
    return null;
  }

  const kapat = () => {
    try { localStorage.setItem(KAPAT, "1"); } catch { /* geç */ }
    setKapali(true);
  };

  return (
    <div className="kz-glass p-5 mb-5 kz-fade" style={{ border: "1px solid rgba(212,175,55,0.2)" }}>
      <div className="flex items-start gap-3">
        <Bell size={20} className="kz-gold" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <p className="text-sm mb-1" style={{ fontWeight: 600 }}>{TR.bildirimBaslik}</p>
          <p className="text-sm kz-dim mb-3" style={{ lineHeight: 1.6 }}>{TR.bildirimAciklama}</p>
          <div className="flex gap-2 flex-wrap">
            <button className="kz-btn" style={{ padding: "9px 18px", fontSize: "0.85rem" }}
              onClick={async () => {
                const r = await izinIste();
                setDurum(r);
                setSonuc(r);
                if (r === "granted") {
                  // Kullanıcı neye evet dediğini hemen görsün
                  bildirimGoster(TR.bildirimOrnekBaslik, TR.bildirimOrnekGovde);
                }
              }}>
              {TR.bildirimIzinVer}
            </button>
            <button onClick={kapat}
              style={{ background: "none", border: "none", color: "#9a8fb5",
                fontSize: "0.85rem", cursor: "pointer", padding: "9px 12px" }}>
              {TR.bildirimSimdiDegil}
            </button>
          </div>
        </div>
        <button onClick={kapat} aria-label={TR.bildirimSimdiDegil}
          style={{ background: "none", border: "none", color: "#6b6285", cursor: "pointer", padding: 2 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

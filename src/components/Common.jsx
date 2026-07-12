import React, { useState, useMemo, useEffect } from "react";
import { TR, AYLAR } from "../i18n/tr";
import { hashStr } from "../lib/engine";

/* Yazı boyutu ayarı — kök yazı ölçüsünü büyütür, tercih cihazda saklanır */
export function FontToggle() {
  const [buyuk, setBuyuk] = useState(() => {
    try { return localStorage.getItem("kozmo_yazi") === "buyuk"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.style.fontSize = buyuk ? "18px" : "16px";
    try { localStorage.setItem("kozmo_yazi", buyuk ? "buyuk" : "normal"); } catch { /* özel mod */ }
  }, [buyuk]);
  return (
    <button className="kz-chip" onClick={() => setBuyuk(!buyuk)}
      title="Yazı boyutu"
      style={{ padding: "4px 10px", fontWeight: 700, fontSize: "0.7rem" }}>
      {buyuk ? "A−" : "A+"}
    </button>
  );
}

/* Dokununca tek satırlık sade açıklama açan terim */
export function Terim({ metin, aciklama }) {
  const [ac, setAc] = useState(false);
  return (
    <>
      <button onClick={() => setAc(!ac)} style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        color: "inherit", font: "inherit", letterSpacing: "inherit",
        textTransform: "inherit", borderBottom: "1px dotted rgba(212,175,55,0.55)",
      }}>{metin}</button>
      {ac && (
        <span className="block text-xs kz-dim mt-1 kz-fade" style={{
          fontWeight: 400, letterSpacing: 0, textTransform: "none", lineHeight: 1.6,
        }}>{aciklama}</span>
      )}
    </>
  );
}

export function StarField() {
  const stars = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      left: (hashStr("x" + i) % 1000) / 10,
      top: (hashStr("y" + i) % 1000) / 10,
      s: 1 + (hashStr("s" + i) % 20) / 10,
      d: (hashStr("d" + i) % 40) / 10,
    })), []);
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {stars.map((st, i) => (
        <div key={i} className="kz-star" style={{
          left: st.left + "%", top: st.top + "%",
          width: st.s, height: st.s, animationDelay: st.d + "s",
        }} />
      ))}
    </div>
  );
}

export function ScoreBar({ label, value, gold }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs kz-dim font-medium">{label}</span>
        <span className="text-sm font-bold"
          style={{ color: gold ? "#d4af37" : "#e08aab" }}>{value}</span>
      </div>
      <div className="kz-bar">
        <div style={{
          width: value + "%",
          background: gold
            ? "linear-gradient(90deg,#8a6d1f,#d4af37)"
            : "linear-gradient(90deg,#7e3350,#e08aab)",
        }} />
      </div>
    </div>
  );
}

/* Klavye dostu üç parçalı tarih girişi */
export function DateField({ onChange }) {
  const [d, setD] = useState("");
  const [m, setM] = useState("");
  const [y, setY] = useState("");
  useEffect(() => {
    if (d && m && y.length === 4) {
      const dd = String(d).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const iso = `${y}-${mm}-${dd}`;
      const dt = new Date(iso + "T12:00:00Z");
      const gecerli = !isNaN(dt) && dt.getUTCDate() === Number(dd) &&
        Number(y) >= 1900 && Number(y) <= new Date().getFullYear();
      onChange(gecerli ? iso : "");
    } else onChange("");
    // eslint-disable-next-line
  }, [d, m, y]);
  const num = (v, max) => v.replace(/\D/g, "").slice(0, max);
  return (
    <div className="flex gap-2">
      <input className="kz-input text-center" style={{ width: 72 }}
        inputMode="numeric" placeholder={TR.fDay} value={d}
        onChange={(e) => setD(num(e.target.value, 2))} />
      <select className="kz-input flex-1" value={m}
        onChange={(e) => setM(e.target.value)}>
        <option value="">{TR.fMonth}</option>
        {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
      </select>
      <input className="kz-input text-center" style={{ width: 92 }}
        inputMode="numeric" placeholder={TR.fYear} value={y}
        onChange={(e) => setY(num(e.target.value, 4))} />
    </div>
  );
}

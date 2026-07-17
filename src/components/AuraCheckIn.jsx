import React, { useState, useMemo } from "react";
import { Share2, Sparkles } from "lucide-react";
import { TR } from "../i18n/tr";
import { GLOSS, MOODS } from "../content/metinler";
import { auraKartiUret } from "../lib/aura-card";
import { hashStr } from "../lib/engine";
import { checkinNotu } from "../lib/kozmo-api";
import { Terim } from "./Common";

export function AuraCard({ reading, profile, today }) {
  const [durum, setDurum] = useState(""); // "" | busy | done | shared
  const tarih = today.toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const paylas = async () => {
    if (durum === "busy") return;
    setDurum("busy");
    try {
      const sonuc = await auraKartiUret({
        renkHex: reading.aura_rengi,
        renkAd: reading.aura_adi,
        motto: reading.motto,
        sign: profile.sign,
        tarihStr: tarih,
      });
      setDurum(sonuc === "paylasildi" ? "shared" : sonuc === "indirildi" ? "done" : "");
    } catch {
      setDurum("");
    }
    setTimeout(() => setDurum(""), 3000);
  };

  return (
    <div className="kz-fade relative overflow-hidden rounded-3xl p-7 mb-5"
      style={{
        background: `radial-gradient(500px 320px at 50% -20%, ${reading.aura_rengi}33, transparent 70%), rgba(255,255,255,0.04)`,
        border: "1px solid rgba(255,255,255,0.11)",
        backdropFilter: "blur(14px)",
      }}>
      <div className="kz-eyebrow mb-5 text-center">
        <Terim metin={TR.auraTitle} aciklama={GLOSS.aura} />
      </div>
      <div className="flex justify-center mb-5">
        <div className="kz-orb" style={{
          width: 130, height: 130,
          background: `radial-gradient(circle at 36% 32%, #ffffffcc 0%, ${reading.aura_rengi} 38%, #1a0b2e 90%)`,
          boxShadow: `0 0 70px ${reading.aura_rengi}77`,
        }} />
      </div>
      <p className="text-center text-sm kz-dim mb-1">{TR.auraColor}</p>
      <p className="text-center text-lg font-semibold mb-4" style={{ color: reading.aura_rengi }}>
        {reading.aura_adi}
      </p>
      <p className="text-center text-xl font-light px-2 mb-6" style={{ lineHeight: 1.5 }}>
        “{reading.motto}”
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs kz-dim">
          {profile.sign.sembol} {profile.sign.ad} · {tarih}
        </span>
        <span className="text-xs font-semibold kz-gold tracking-wider">{TR.auraStamp}</span>
      </div>
      <button onClick={paylas}
        className="kz-chip mt-5 w-full flex items-center justify-center gap-2"
        style={{ opacity: durum === "busy" ? 0.6 : 1 }}>
        <Share2 size={14} />
        {durum === "busy" ? TR.auraBusy : TR.auraShare}
      </button>
      {(durum === "done" || durum === "shared") && (
        <div className="absolute inset-x-4 bottom-4 kz-glass px-4 py-3 text-center text-sm kz-fade">
          {durum === "shared" ? TR.auraShared : TR.auraDone}
        </div>
      )}
    </div>
  );
}

export function CheckIn({ today }) {
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState("");
  const [rx, setRx] = useState(null);
  const [kriz, setKriz] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const dayKey = useMemo(() => today.toISOString().slice(0, 10), [today]);
  return (
    <div className="kz-glass p-5 mb-5 kz-fade">
      <div className="kz-eyebrow mb-1 flex items-center gap-2">
        <Sparkles size={12} className="kz-gold" />
        <span><Terim metin={TR.checkinTitle} aciklama={GLOSS.checkin} /></span>
      </div>
      <p className="text-base font-medium mb-4">{TR.checkinQ}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {MOODS.map((m) => (
          <button key={m.k} className={"kz-chip" + (mood === m.k ? " on" : "")}
            onClick={() => { setMood(m.k); setRx(null); }}>
            {m.ad}
          </button>
        ))}
      </div>
      <input className="kz-input mb-4" placeholder={TR.checkinNote}
        value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="kz-btn w-full"
        style={{ opacity: mood && !yukleniyor ? 1 : 0.4 }}
        disabled={!mood || yukleniyor}
        onClick={async () => {
          const m = MOODS.find((x) => x.k === mood);
          const yerelNot = m.rx[hashStr(dayKey + mood) % m.rx.length];
          setYukleniyor(true);
          try {
            const sonuc = await checkinNotu(mood, note, yerelNot);
            setKriz(sonuc.kriz);
            setRx(sonuc.not);
          } catch {
            setKriz(false);
            setRx(yerelNot); // API yoksa yerel havuz
          }
          setYukleniyor(false);
        }}>
        {yukleniyor ? TR.checkinLoading : TR.checkinBtn}
      </button>
      {rx && (
        <div className="mt-4 rounded-2xl p-4 kz-fade"
          style={kriz
            ? { background: "rgba(143,198,236,0.10)", border: "1px solid rgba(143,198,236,0.30)" }
            : { background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}>
          {!kriz && <p className="kz-eyebrow mb-2">{TR.checkinRx}</p>}
          <p className="text-sm" style={{ lineHeight: 1.75 }}>{rx}</p>
        </div>
      )}
    </div>
  );
}

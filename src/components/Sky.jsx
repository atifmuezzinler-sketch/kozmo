import React, { useMemo } from "react";
import { Star, CalendarDays } from "lucide-react";
import { TR, GUN_KISA, GUN_TAM } from "../i18n/tr";
import { GLOSS } from "../content/metinler";
import { sunLon, moonLon, isRetro, moonPhase, signOf } from "../lib/astro";
import { skyWeek } from "../lib/engine";
import { Terim } from "./Common";

export function WeatherBanner({ today }) {
  const ph = moonPhase(today);
  const mSign = signOf(moonLon(today));
  const sSign = signOf(sunLon(today));
  const retro = isRetro("merkur", today);
  return (
    <div className="kz-glass px-5 py-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 kz-fade">
      <span className="kz-eyebrow flex items-center gap-2">
        <Star size={12} className="kz-gold" /> {TR.weather}
      </span>
      <span className="text-sm">
        {ph.ikon} <Terim metin={ph.ad} aciklama={GLOSS.faz[ph.ad]} />
      </span>
      <span className="text-sm kz-dim">{TR.moonIn} {mSign.ad} {mSign.sembol} burcunda</span>
      <span className="text-sm kz-dim">☀ {sSign.ad} {TR.season}</span>
      <span className="text-sm" style={{ color: retro ? "#e08aab" : "#7fd6b0" }}>
        ☿ {retro ? TR.retroOn : TR.retroOff}
      </span>
    </div>
  );
}

/* Gökyüzü Hattı — kaydırmasız 7 gün */
export function SkyStrip({ today }) {
  const week = useMemo(() => skyWeek(today), [today]);
  const olaylar = week.flatMap(({ d, ev }) => ev.map((e) => ({ d, ...e })));
  return (
    <div className="kz-glass p-5 mb-5 kz-fade">
      <p className="kz-eyebrow mb-4 flex items-center gap-2">
        <CalendarDays size={12} className="kz-gold" /> {TR.skyWeek}
      </p>
      <div style={{ position: "relative", height: 62, marginBottom: 12 }}>
        <div style={{
          position: "absolute", left: "4%", right: "4%", top: 44,
          height: 1, background: "rgba(255,255,255,0.15)",
        }} />
        <div className="flex justify-between" style={{ position: "relative" }}>
          {week.map(({ d, ev }, i) => {
            const has = ev.length > 0;
            const boy = i === 0 ? 12 : has ? 14 : 8;
            return (
              <div key={i} style={{ width: "13%", textAlign: "center", position: "relative", height: 62 }}>
                <p style={{
                  fontSize: "0.7rem", margin: 0,
                  color: has ? "#d4af37" : i === 0 ? "#ece6f5" : "#8d80ab",
                  fontWeight: has || i === 0 ? 600 : 400,
                }}>{GUN_KISA[d.getDay()]} {d.getDate()}</p>
                {has && (
                  <span style={{
                    fontSize: "0.82rem", color: "#d4af37",
                    position: "absolute", top: 18, left: 0, right: 0,
                  }}>{ev[0].ikon}</span>
                )}
                <div style={{
                  position: "absolute", top: 44 - boy / 2, left: "50%",
                  transform: "translateX(-50%)",
                  width: boy, height: boy, borderRadius: "50%",
                  background: has ? "#d4af37" : i === 0 ? "#ece6f5" : "rgba(255,255,255,0.25)",
                  outline: i === 0 ? "2px solid rgba(212,175,55,0.5)" : "none",
                  outlineOffset: 3,
                }} />
              </div>
            );
          })}
        </div>
      </div>
      {olaylar.length > 0 ? (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
          {olaylar.map((e, idx) => (
            <p key={idx} style={{ fontSize: "0.82rem", margin: idx ? "8px 0 0" : 0, lineHeight: 1.6 }}>
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: "#d4af37", marginRight: 8,
              }} />
              <b style={{ color: "#d4af37", fontWeight: 600 }}>
                {GUN_TAM[e.d.getDay()]} {e.d.getDate()}
              </b> · {e.metin} — {e.not}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm kz-dim" style={{ margin: 0 }}>{TR.calmWeek}</p>
      )}
    </div>
  );
}

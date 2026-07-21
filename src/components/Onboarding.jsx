import React, { useState, useMemo } from "react";
import { Compass, Sparkles, Clock } from "lucide-react";
import { TR } from "../i18n/tr";
import { CITIES, findCity, natalSunLon, signOf, ascendant, norm, EL_AD } from "../lib/astro";
import { DateField, FontToggle } from "./Common";
import { WeatherBanner, SkyStrip } from "./Sky";

export default function Onboarding({ onDone }) {
  const [birthDate, setBirthDate] = useState("");
  const [cityText, setCityText] = useState("");
  const [time, setTime] = useState("");
  const [phase, setPhase] = useState(0);
  const [cuspAc, setCuspAc] = useState(false);
  const today = useMemo(() => new Date(), []);

  const city = useMemo(() => findCity(cityText), [cityText]);

  const sunInfo = useMemo(() => {
    if (!birthDate || birthDate.length !== 10) return null;
    const lon = natalSunLon(birthDate);
    const deg = norm(lon) % 30;
    return { sign: signOf(lon), cusp: deg < 1.5 || deg > 28.5 };
  }, [birthDate]);
  const sign = sunInfo ? sunInfo.sign : null;

  const rising = useMemo(() => {
    if (!birthDate || !time || !city) return null;
    try { return ascendant(birthDate, time, city); } catch { return null; }
  }, [birthDate, time, city]);

  const ready = birthDate && sign && cityText.trim().length >= 2;

  const submit = (uye) => {
    if (!ready) return;
    setPhase(1);
    setTimeout(() => {
      onDone({ birthDate, cityName: cityText.trim(), city, time, sign, rising, uye });
    }, 1600);
  };

  if (phase === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative" style={{ zIndex: 1 }}>
        <div className="kz-orb" style={{
          width: 110, height: 110,
          background: "radial-gradient(circle at 35% 35%, #d4af37, #6b4fc0 65%, transparent 75%)",
          boxShadow: "0 0 90px rgba(155,110,240,0.5)",
        }} />
        <p className="mt-8 text-sm kz-dim kz-fade">{TR.loading2}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-14 relative kz-fade" style={{ zIndex: 1 }}>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2">
          <Compass size={20} className="kz-gold" />
          <span className="font-extrabold tracking-widest text-lg">KOZMO</span>
        </div>
        <FontToggle />
      </div>
      <p className="kz-eyebrow mb-2">{TR.tagline}</p>
      <h1 className="text-3xl font-light mb-2" style={{ letterSpacing: "-0.01em" }}>{TR.onbTitle}</h1>
      <p className="text-xs mb-6" style={{ color: "#9d90bf", lineHeight: 1.7, maxWidth: 400 }}>
        {TR.onbDesc}
      </p>

      <WeatherBanner today={today} />

      <div className="kz-glass p-5 mb-4">
        <label className="kz-eyebrow block mb-2">{TR.fDate} · {TR.fRequired}</label>
        <DateField onChange={setBirthDate} />
        {sign && (
          <div className="mt-3 kz-fade">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sign.sembol}</span>
              <span className="text-sm">
                {TR.yourSign}: <b className="kz-gold">{sign.ad}</b>
                <span className="kz-dim"> · {EL_AD[sign.el]} elementi</span>
              </span>
              {sunInfo.cusp && (
                <button onClick={() => setCuspAc(!cuspAc)}
                  aria-label="Burç sınırı hakkında bilgi" style={{
                  background: "none", border: "1px solid rgba(212,175,55,0.5)",
                  color: "#d4af37", borderRadius: 99, width: 18, height: 18,
                  fontSize: 11, lineHeight: 1, cursor: "pointer", flexShrink: 0,
                }}>i</button>
              )}
            </div>
            {sunInfo.cusp && cuspAc && (
              <p className="text-xs kz-dim mt-2 kz-fade" style={{ lineHeight: 1.6 }}>
                {TR.cuspNote} <b className="kz-gold">{sign.ad}</b> {TR.cuspNote2}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="kz-glass p-5 mb-4">
        <label className="kz-eyebrow block mb-2">{TR.fPlace} · {TR.fRequired}</label>
        <input className="kz-input" list="kz-cities" placeholder={TR.fPlacePh}
          value={cityText} onChange={(e) => setCityText(e.target.value)} />
        <datalist id="kz-cities">
          {CITIES.map((c) => <option key={c.ad} value={c.ad} />)}
        </datalist>
      </div>

      <div className="kz-glass p-5 mb-6">
        <label className="kz-eyebrow block mb-2">{TR.fTime} · {TR.fOptional}</label>
        <input type="time" className="kz-input" value={time}
          onChange={(e) => setTime(e.target.value)} />
        <p className="text-xs kz-dim mt-2 flex items-center gap-1">
          <Clock size={12} /> {TR.fTimeHint}
        </p>
        {rising && (
          <div className="mt-3 flex items-center gap-2 kz-fade">
            <span className="text-2xl">{rising.sembol}</span>
            <span className="text-sm">{TR.risingSign}: <b className="kz-gold">{rising.ad}</b></span>
          </div>
        )}
        {time && cityText.trim().length >= 2 && !city && (
          <p className="text-xs mt-3 kz-fade" style={{ color: "#e0b06a" }}>
            {TR.fPlaceHint}
          </p>
        )}
      </div>

      <button className="kz-btn w-full flex items-center justify-center gap-2 mb-3"
        style={{ opacity: ready ? 1 : 0.4 }} onClick={() => submit(true)} disabled={!ready}>
        <Sparkles size={16} /> {TR.ctaSaveStart}
      </button>

      <button
        className="w-full text-center mb-2"
        style={{
          opacity: ready ? 0.75 : 0.3, background: "none", border: "none",
          color: "#cfc4e6", fontSize: "0.82rem", cursor: ready ? "pointer" : "default",
          textDecoration: "underline", textUnderlineOffset: 3,
        }}
        onClick={() => submit(false)} disabled={!ready}>
        {TR.ctaJustLook}
      </button>

      <p className="text-center kz-dim mb-6" style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
        {TR.memberHint}
      </p>

      <SkyStrip today={today} />

      <p className="text-center text-xs kz-dim mt-2">{TR.disclaimer}</p>
      <p className="text-center kz-dim mt-1" style={{ fontSize: 12 }}>{TR.privacyNote}</p>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from "react";
import { Compass, Users } from "lucide-react";
import { TR } from "./i18n/tr";
import { StarField, FontToggle } from "./components/Common";
import Onboarding from "./components/Onboarding";
import { WeatherBanner, SkyStrip } from "./components/Sky";
import { PusulaView, UyumView } from "./components/Views";

const SAKLA = "kozmo_profil";

export default function App() {
  const [profile, setProfile] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem(SAKLA));
      // Yapı doğrulaması: eksik/eski format profili reddet (güncelleme sonrası çökme kalkanı)
      if (p && p.birthDate && p.sign && p.sign.sembol && p.sign.el) return p;
      return null;
    } catch { return null; }
  });
  const [mode, setMode] = useState("pusula");
  const [firstReading, setFirstReading] = useState(!profile);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (mode !== "pusula") setFirstReading(false);
  }, [mode]);

  const kaydet = (p) => {
    setProfile(p);
    setFirstReading(true);
    try { localStorage.setItem(SAKLA, JSON.stringify(p)); } catch { /* özel mod */ }
  };
  const sifirla = () => {
    setProfile(null);
    setFirstReading(true);
    setMode("pusula");
    try { localStorage.removeItem(SAKLA); } catch { /* özel mod */ }
  };

  return (
    <div className="kz-root relative" lang="tr">
      <StarField />
      {!profile ? (
        <Onboarding onDone={kaydet} />
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-8 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Compass size={18} className="kz-gold" />
              <span className="font-extrabold tracking-widest">KOZMO</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <FontToggle />
              <span className="text-sm kz-dim">
                {profile.sign.sembol} {profile.sign.ad}
                {profile.rising && <span> · Yük. {profile.rising.ad}</span>}
              </span>
              <button className="kz-chip" style={{ fontSize: 11, padding: "4px 10px" }}
                onClick={sifirla}>
                {TR.edit}
              </button>
            </div>
          </div>

          <WeatherBanner today={today} />

          <div className="flex gap-2 mb-5">
            <button className={"kz-tab" + (mode === "pusula" ? " on" : "")}
              onClick={() => setMode("pusula")}>
              <Compass size={13} className="inline mr-1" /> {TR.modePusula}
            </button>
            <button className={"kz-tab" + (mode === "uyum" ? " on" : "")}
              onClick={() => setMode("uyum")}>
              <Users size={13} className="inline mr-1" /> {TR.modeUyum}
            </button>
          </div>

          <SkyStrip today={today} />
          {mode === "pusula"
            ? <PusulaView profile={profile} today={today} firstReading={firstReading} />
            : <UyumView profile={profile} />}

          <p className="text-center text-xs kz-dim mt-8 mb-1">{TR.disclaimer}</p>
          <p className="text-center kz-dim mb-1" style={{ fontSize: 12 }}>{TR.privacyNote}</p>
          <p className="text-center kz-dim mb-6" style={{ fontSize: 12 }}>{TR.dstNote}</p>
        </div>
      )}
    </div>
  );
}

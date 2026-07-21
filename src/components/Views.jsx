import React, { useState, useMemo, useEffect } from "react";
import { Home, Briefcase, Heart, Coins, Moon, Lock, Users, ArrowRight, Share2 } from "lucide-react";
import { TR, GUN_KISA } from "../i18n/tr";
import { EL_AD, natalSunLon, signOf } from "../lib/astro";
import { mockEngine, mockSynastry, skorNasil, KATEGORILER } from "../lib/engine";
import { gunlukOkuma, arkaPlandaHazirla, uyumOkumasi } from "../lib/kozmo-api";
import { ScoreBar, DateField } from "./Common";
import { AuraCard, CheckIn } from "./AuraCheckIn";
import { uyumKartiUret } from "../lib/aura-card";

const CAT_ICON = { aile: Home, is: Briefcase, ask: Heart, para: Coins };

export function PusulaView({ profile, today, firstReading, onUyeOl }) {
  const [tab, setTab] = useState("daily");
  const [uyeUyari, setUyeUyari] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  /* Önceden üretim: bugünün metni önbellekte varsa (dün hazırlandı) anında
     gelir; yoksa yerel havuz gösterilir. Kullanıcı asla beklemez.
     Metin GÜN BOYUNCA SABİT kalır — okurken değişmez. */
  const daily = useMemo(() => gunlukOkuma(profile, today), [profile, today]);

  /* Arka planda yarının metnini hazırla. Kullanıcı ekrana bakarken sessizce
     çalışır; ekranda hiçbir şeyi değiştirmez. */
  useEffect(() => {
    arkaPlandaHazirla(profile, today);
  }, [profile, today]);
  const weekly = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today.getTime() + i * 86400000);
      return { d, r: mockEngine(profile, d) };
    });
    const agg = {};
    for (const k of KATEGORILER) {
      agg[k] = {
        sans: Math.round(days.reduce((s, x) => s + x.r.skorlar[k].sans, 0) / 7),
        risk: Math.round(days.reduce((s, x) => s + x.r.skorlar[k].risk, 0) / 7),
      };
    }
    return { agg, days };
  }, [profile, today]);

  /* Aylık (30 gün) ve yıllık (12 aylık örnekleme) ortalamalar — yalnızca üyeye açık.
     Yıllıkta her günü hesaplamak yerine ayda bir gün örnekleyerek performans korunur. */
  const donemsel = useMemo(() => {
    if (!profile.uye) return { monthly: null, yearly: null };
    const ort = (adet, adimGun) => {
      const agg = {};
      for (const k of KATEGORILER) agg[k] = { sans: 0, risk: 0 };
      for (let i = 0; i < adet; i++) {
        const r = mockEngine(profile, new Date(today.getTime() + i * adimGun * 86400000));
        for (const k of KATEGORILER) { agg[k].sans += r.skorlar[k].sans; agg[k].risk += r.skorlar[k].risk; }
      }
      for (const k of KATEGORILER) {
        agg[k].sans = Math.round(agg[k].sans / adet);
        agg[k].risk = Math.round(agg[k].risk / adet);
      }
      return agg;
    };
    return { monthly: ort(30, 1), yearly: ort(12, 30) };
  }, [profile, today]);

  const skorlar =
    tab === "daily" ? daily.skorlar :
    tab === "weekly" ? weekly.agg :
    tab === "monthly" ? donemsel.monthly :
    donemsel.yearly;

  return (
    <div>
      <div className="mb-6 kz-fade">
        {firstReading && (
          <span className="kz-eyebrow inline-block mb-2 px-3 py-1 rounded-full"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37",
            }}>
            ✦ {TR.firstReading}
          </span>
        )}
        <p className="text-2xl font-light" style={{ lineHeight: 1.45, letterSpacing: "-0.01em" }}>
          {daily.gunun_cumlesi}
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <button className={"kz-tab" + (tab === "daily" ? " on" : "")}
          onClick={() => setTab("daily")}>{TR.tabDaily}</button>
        <button className={"kz-tab" + (tab === "weekly" ? " on" : "")}
          onClick={() => setTab("weekly")}>{TR.tabWeekly}</button>
        {profile.uye ? (
          <>
            <button className={"kz-tab" + (tab === "monthly" ? " on" : "")}
              onClick={() => setTab("monthly")}>{TR.tabMonthly}</button>
            <button className={"kz-tab" + (tab === "yearly" ? " on" : "")}
              onClick={() => setTab("yearly")}>{TR.tabYearly}</button>
          </>
        ) : (
          <>
            <button className="kz-tab locked" onClick={() => setUyeUyari(true)} title={TR.memberOnly}>
              <Lock size={11} className="inline mr-1" />{TR.tabMonthly}
            </button>
            <button className="kz-tab locked" onClick={() => setUyeUyari(true)} title={TR.memberOnly}>
              <Lock size={11} className="inline mr-1" />{TR.tabYearly}
            </button>
          </>
        )}
      </div>

      {uyeUyari && !profile.uye && (
        <div className="kz-glass p-4 mb-5 kz-fade" style={{ border: "1px solid rgba(212,175,55,0.3)" }}>
          <p className="text-sm mb-3" style={{ lineHeight: 1.7 }}>{TR.memberUpsell}</p>
          <button className="kz-btn w-full" onClick={onUyeOl}>{TR.becomeMember}</button>
        </div>
      )}
      {tab === "weekly" && <p className="text-xs kz-dim mb-4">{TR.weeklyAvg}</p>}
      {tab === "monthly" && <p className="text-xs kz-dim mb-4">{TR.monthlyNote}</p>}
      {tab === "yearly" && <p className="text-xs kz-dim mb-4">{TR.yearlyNote}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
        {KATEGORILER.map((k) => {
          const Icon = CAT_ICON[k];
          return (
            <div key={k} className="kz-glass p-5 kz-fade">
              <p className="font-semibold mb-4 flex items-center gap-2">
                <Icon size={16} className="kz-gold" /> {TR.catAd[k]}
              </p>
              <ScoreBar label={TR.sans} value={skorlar[k].sans} gold />
              <ScoreBar label={TR.risk} value={skorlar[k].risk} />
              {tab === "weekly" && (
                <div className="mt-3">
                  <p className="kz-dim mb-1" style={{ fontSize: "0.7rem" }}>{TR.sans} · gün gün</p>
                  <div className="flex items-end justify-between" style={{ height: 42 }}>
                    {weekly.days.map((g, i) => (
                      <div key={i} style={{ width: "12%" }}>
                        <div style={{
                          height: 5 + g.r.skorlar[k].sans * 0.36,
                          background: i === 0 ? "#d4af37" : "rgba(212,175,55,0.45)",
                          borderRadius: 4, width: "70%", margin: "0 auto",
                        }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {weekly.days.map((g, i) => (
                      <span key={i} className="kz-dim text-center"
                        style={{ width: "12%", fontSize: "0.68rem" }}>
                        {GUN_KISA[g.d.getDay()]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mb-5">
        <button className="text-xs kz-dim" onClick={() => setHowOpen(!howOpen)} style={{
          background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          fontFamily: "inherit", borderBottom: "1px dotted rgba(212,175,55,0.55)",
        }}>{TR.scoreHowQ}</button>
        {howOpen && (
          <p className="text-xs kz-dim mt-2 kz-fade" style={{ lineHeight: 1.7 }}>
            {skorNasil(profile, daily)}
          </p>
        )}
      </div>

      <div className="kz-glass p-6 mb-5 kz-fade">
        <p className="kz-eyebrow mb-3 flex items-center gap-2">
          <Moon size={12} className="kz-gold" /> {TR.analysisTitle}
        </p>
        <p className="text-sm" style={{ lineHeight: 1.85 }}>{daily.analiz}</p>
      </div>

      <AuraCard reading={daily} profile={profile} today={today} />
      <CheckIn today={today} />
    </div>
  );
}

export function UyumView({ profile }) {
  const [bName, setBName] = useState("");
  const [bDate, setBDate] = useState("");
  const [rel, setRel] = useState("partner");
  const [res, setRes] = useState(null);
  const [kart, setKart] = useState(""); // "" | busy | done | shared
  const [uyumYukleniyor, setUyumYukleniyor] = useState(false);
  const RELS = [
    { k: "partner", ad: TR.relPartner }, { k: "arkadas", ad: TR.relFriend },
    { k: "aile", ad: TR.relFamily }, { k: "is", ad: TR.relWork },
  ];
  const bSign = useMemo(() => {
    if (!bDate || bDate.length !== 10) return null;
    return signOf(natalSunLon(bDate));
  }, [bDate]);

  return (
    <div className="kz-fade">
      <div className="kz-glass p-6 mb-5">
        <p className="kz-eyebrow mb-1 flex items-center gap-2">
          <Users size={12} className="kz-gold" /> {TR.modeUyum}
        </p>
        <p className="text-lg font-light mb-5">{TR.synTitle}</p>
        <label className="kz-eyebrow block mb-2">{TR.synPerson} · {TR.fName}</label>
        <input className="kz-input mb-4" placeholder={TR.fNamePh}
          value={bName} onChange={(e) => setBName(e.target.value)} />
        <label className="kz-eyebrow block mb-2">{TR.synPerson} · {TR.fDate}</label>
        <div className="mb-2">
          <DateField onChange={(v) => { setBDate(v); setRes(null); }} />
        </div>
        {bSign && (
          <p className="text-sm mb-3 kz-fade">
            <span className="text-xl mr-1">{bSign.sembol}</span>
            <b className="kz-gold">{bSign.ad}</b>
            <span className="kz-dim"> · {EL_AD[bSign.el]} elementi</span>
          </p>
        )}
        <label className="kz-eyebrow block mb-2 mt-2">{TR.synRel}</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {RELS.map((r) => (
            <button key={r.k} className={"kz-chip" + (rel === r.k ? " on" : "")}
              onClick={() => { setRel(r.k); setRes(null); }}>
              {r.ad}
            </button>
          ))}
        </div>
        <button className="kz-btn w-full flex items-center justify-center gap-2"
          style={{ opacity: bSign && !uyumYukleniyor ? 1 : 0.4 }}
          disabled={!bSign || uyumYukleniyor}
          onClick={async () => {
            const yerel = mockSynastry(profile, { birthDate: bDate }, rel);
            setRes(yerel);           // skorlar anında görünür
            setUyumYukleniyor(true); // metin API'den gelecek
            try {
              const metin = await uyumOkumasi(profile, { birthDate: bDate }, rel, yerel);
              setRes({ ...yerel, analiz: metin });
            } catch { /* yerel metin kalır */ }
            setUyumYukleniyor(false);
          }}>
          <ArrowRight size={16} />
          {uyumYukleniyor ? TR.synLoading : TR.synCta}
        </button>
      </div>

      {res && (
        <div className="kz-glass p-6 kz-fade relative overflow-hidden">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-3xl">{res.sA.sembol}</p>
              <p className="text-xs kz-dim mt-1">{res.sA.ad}</p>
            </div>
            <div className="text-center">
              <p className="kz-eyebrow mb-1">{TR.synScore}</p>
              <p className="text-5xl font-extralight kz-gold">{res.genel}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl">{res.sB.sembol}</p>
              <p className="text-xs kz-dim mt-1">{bName || res.sB.ad}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-5">
            {KATEGORILER.map((k) => (
              <ScoreBar key={k} label={TR.catAd[k]} value={res.skorlar[k]} gold />
            ))}
          </div>
          <p className="kz-eyebrow mb-2">{TR.synAnalysis}</p>
          <p className="text-sm" style={{ lineHeight: 1.85 }}>{res.analiz}</p>
          <button onClick={async () => {
            if (kart === "busy") return;
            setKart("busy");
            try {
              const relAd = RELS.find((x) => x.k === rel).ad;
              const cumle = res.analiz.split(". ")[0] + ".";
              const tarih = new Date().toLocaleDateString("tr-TR", {
                day: "numeric", month: "long", year: "numeric",
              });
              const sonuc = await uyumKartiUret({
                sA: res.sA, sB: res.sB, adB: bName.trim(),
                genel: res.genel, relAd, cumle, tarihStr: tarih,
              });
              setKart(sonuc === "paylasildi" ? "shared" : sonuc === "indirildi" ? "done" : "");
            } catch { setKart(""); }
            setTimeout(() => setKart(""), 3000);
          }}
            className="kz-chip mt-5 w-full flex items-center justify-center gap-2"
            style={{ opacity: kart === "busy" ? 0.6 : 1 }}>
            <Share2 size={14} />
            {kart === "busy" ? TR.auraBusy : TR.synShare}
          </button>
          {(kart === "done" || kart === "shared") && (
            <div className="absolute inset-x-4 bottom-4 kz-glass px-4 py-3 text-center text-sm kz-fade">
              {kart === "shared" ? TR.synShared : TR.synDone}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

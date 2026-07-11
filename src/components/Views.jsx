import React, { useState, useMemo } from "react";
import { Home, Briefcase, Heart, Coins, Moon, Lock, Users, ArrowRight } from "lucide-react";
import { TR } from "../i18n/tr";
import { EL_AD, natalSunLon, signOf } from "../lib/astro";
import { mockEngine, mockSynastry, skorNasil, KATEGORILER } from "../lib/engine";
import { ScoreBar, DateField } from "./Common";
import { AuraCard, CheckIn } from "./AuraCheckIn";

const CAT_ICON = { aile: Home, is: Briefcase, ask: Heart, para: Coins };

export function PusulaView({ profile, today, firstReading }) {
  const [tab, setTab] = useState("daily");
  const [howOpen, setHowOpen] = useState(false);
  const daily = useMemo(() => mockEngine(profile, today), [profile, today]);
  const weekly = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) =>
      mockEngine(profile, new Date(today.getTime() + i * 86400000)));
    const agg = {};
    for (const k of KATEGORILER) {
      agg[k] = {
        sans: Math.round(days.reduce((s, d) => s + d.skorlar[k].sans, 0) / 7),
        risk: Math.round(days.reduce((s, d) => s + d.skorlar[k].risk, 0) / 7),
      };
    }
    return agg;
  }, [profile, today]);

  const skorlar = tab === "daily" ? daily.skorlar : weekly;

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
        <button className="kz-tab locked" title={TR.soon}>
          <Lock size={11} className="inline mr-1" />{TR.tabMonthly} · {TR.soon}
        </button>
        <button className="kz-tab locked" title={TR.soon}>
          <Lock size={11} className="inline mr-1" />{TR.tabYearly} · {TR.soon}
        </button>
      </div>
      {tab === "weekly" && <p className="text-xs kz-dim mb-4">{TR.weeklyAvg}</p>}

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
          style={{ opacity: bSign ? 1 : 0.4 }} disabled={!bSign}
          onClick={() => setRes(mockSynastry(profile, { birthDate: bDate }, rel))}>
          <ArrowRight size={16} /> {TR.synCta}
        </button>
      </div>

      {res && (
        <div className="kz-glass p-6 kz-fade">
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
        </div>
      )}
    </div>
  );
}

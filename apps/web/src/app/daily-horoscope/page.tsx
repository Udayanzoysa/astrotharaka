"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useUi } from "@/components/providers/ui-provider";
import type { Language } from "@/lib/types";

type MultilingualField = {
  si?: string;
  en?: string;
  ta?: string;
};

type PanchangaData = {
  rahuKalaya: string | MultilingualField;
  subaDishawa: string | MultilingualField;
  maruDishawa: string | MultilingualField;
  thithi?: string | MultilingualField;
  nakatha?: string | MultilingualField;
};

type LagnaPrediction = {
  code: string;
  nameSi: string;
  nameEn: string;
  nameTa?: string;
  symbol: string;
  summary: string | MultilingualField;
  career: string | MultilingualField;
  wealth: string | MultilingualField;
  love: string | MultilingualField;
  health: string | MultilingualField;
  luckyNumber: string;
  luckyColor: string | MultilingualField;
  luckyDirection: string | MultilingualField;
};

type DailyHoroscopeRecord = {
  id: string;
  period: string;
  periodKey: string;
  dateDisplay: string | MultilingualField;
  panchanga: PanchangaData;
  generalNotes: string | MultilingualField;
  lagnaPredictions: LagnaPrediction[];
};

const ZODIAC_NAMES: Record<string, { si: string; en: string; ta: string }> = {
  aries: { si: "මේෂ", en: "Aries", ta: "மேஷம்" },
  taurus: { si: "වෘෂභ", en: "Taurus", ta: "ரிஷபம்" },
  gemini: { si: "මිථුන", en: "Gemini", ta: "மிதுனம்" },
  cancer: { si: "කටක", en: "Cancer", ta: "கடகம்" },
  leo: { si: "සිංහ", en: "Leo", ta: "சிம்மம்" },
  virgo: { si: "කන්‍යා", en: "Virgo", ta: "கன்னி" },
  libra: { si: "තුලා", en: "Libra", ta: "துலாம்" },
  scorpio: { si: "වෘශ්චික", en: "Scorpio", ta: "விருச்சிகம்" },
  sagittarius: { si: "ධනු", en: "Sagittarius", ta: "தனுசு" },
  capricorn: { si: "මකර", en: "Capricorn", ta: "மகரம்" },
  aquarius: { si: "කුම්භ", en: "Aquarius", ta: "கும்பம்" },
  pisces: { si: "මීන", en: "Pisces", ta: "மீனம்" },
};

function getLoc(val: unknown, lang: Language, fallback = ""): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const record = val as Record<string, string | undefined>;
    return record[lang] || record.si || record.en || record.ta || fallback;
  }
  return fallback;
}

const I18N = {
  badge: {
    si: "✨ තාරකා ජ්‍යොතිෂ අනාවැකි",
    en: "✨ Taraka Astrology Predictions",
    ta: "✨ தாரகா ஜோதிட பலன்கள்",
  },
  title: {
    si: "අද දවසේ පලාපල සහ පංචාංගය",
    en: "Today's Horoscope & Panchangam",
    ta: "இன்றைய ராசி பலன் மற்றும் பஞ்சாங்கம்",
  },
  subtitle: {
    si: "සුභ දවසක්! අද දිනයේ ලග්න පලාපලය සහ පංචාංගය පහත දිස්වේ, මෙහිදී ඔබගේ ලග්නයට අදාල පහත දක්වා ඇති කොටුව මත ඔබා ඔබගේ ලග්නයට අද දවස කෙසේද යන බව දැනගන්න. පහත ඇති දිනය මත ඔබා ඔබට පසුගිය දිනයේ හෝ ඉදිරි දිනවල ලග්න පලාපලය හා පංචාංගය බලාගැනීමට හැකියාවක් ඇත.",
    en: "Welcome! Today's astrological predictions and daily panchangam are detailed below. Click on your zodiac sign card to read your complete daily horoscope. Use the date selector to view predictions for past or upcoming days.",
    ta: "இனிய நாள்! இன்றைய ராசி பலன்கள் மற்றும் பஞ்சாங்கம் கீழே கொடுக்கப்பட்டுள்ளன. உங்கள் ராசிக்கான முழுமையான பலன்களை அறிய கீழே உள்ள அட்டையை கிளிக் செய்யவும். முந்தைய அல்லது அடுத்த நாட்களின் பலன்களை அறிய தேதியை மாற்றலாம்.",
  },
  periods: {
    DAILY: { si: "අද දවස (Daily)", en: "Today (Daily)", ta: "இன்று (Daily)" },
    WEEKLY: { si: "මේ සතිය (Weekly)", en: "This Week (Weekly)", ta: "இந்த வாரம் (Weekly)" },
    MONTHLY: { si: "මේ මාසය (Monthly)", en: "This Month (Monthly)", ta: "இந்த மாதம் (Monthly)" },
    YEARLY: { si: "මේ වසර (Yearly)", en: "This Year (Yearly)", ta: "இந்த ஆண்டு (Yearly)" },
  },
  yesterday: { si: "← ඊයේ", en: "← Yesterday", ta: "← நேற்று" },
  tomorrow: { si: "හෙට →", en: "Tomorrow →", ta: "நாளை →" },
  selectDate: { si: "දිනය තෝරන්න:", en: "Select Date:", ta: "தேதியை தேர்ந்தெடுக்கவும்:" },
  panchangaTitle: {
    si: "✦ දවසේ පංචාංගය සහ සුබ මුහුර්ත",
    en: "✦ Daily Panchangam & Auspicious Times",
    ta: "✦ இன்றைய பஞ்சாங்கம் மற்றும் சுப முகூர்த்தம்",
  },
  rahuKalaya: { si: "රාහු කාලය", en: "Rahu Kalaya", ta: "இராகு காலம்" },
  subaDishawa: { si: "සුබ දිශාව", en: "Auspicious Direction", ta: "சுப திசை" },
  maruDishawa: { si: "මරු සිටින දිශාව", en: "Inauspicious Direction (Maru)", ta: "எம கண்ட திசை" },
  generalTitle: {
    si: "✦ දිනපතා පලාපල පොදු ග්‍රහ චාරය සහ විශේෂ සටහන",
    en: "✦ General Planetary Transit Overview & Special Advice",
    ta: "✦ பொதுவான கிரக நிலைகள் மற்றும் சிறப்பு குறிப்பு",
  },
  lagnaTitle: {
    si: "✦ දිනපතා පලාපල 12 (ඔබගේ ලග්නය තෝරන්න)",
    en: "✦ 12 Zodiac Predictions (Choose Your Sign)",
    ta: "✦ 12 ராசி பலன்கள் (உங்கள் ராசியை தேர்ந்தெடுக்கவும்)",
  },
  lagnaSubtitle: {
    si: "ඔබගේ ලග්නයට හිමි සම්පූර්ණ දිනපතා පලාපල විස්තරය කියවීම සඳහා අදාල ලග්න කාඩ්පත ක්ලික් කරන්න.",
    en: "Click on your zodiac sign card to read your complete astrological forecast for the day.",
    ta: "உங்கள் ராசிக்கான முழுமையான தினசரி பலன்களைப் படிக்க தொடர்புடைய அட்டையை கிளிக் செய்யவும்.",
  },
  viewPrediction: { si: "පලාපල බලන්න →", en: "View Prediction →", ta: "பலன் பார்க்க →" },
  daySummary: { si: "දවසේ සාරාංශය: ", en: "Day Summary: ", ta: "தினசரி சுருக்கம்: " },
  career: { si: "💼 රැකියාව සහ ව්‍යාපාර", en: "💼 Career & Business", ta: "💼 தொழில் மற்றும் வியாபாரம்" },
  wealth: { si: "💰 ධනය සහ මුදල්", en: "💰 Wealth & Finance", ta: "💰 தனம் மற்றும் செல்வம்" },
  love: { si: "❤️ ආදරය සහ පවුල් ජීවිතය", en: "❤️ Love & Family", ta: "❤️ காதல் மற்றும் குடும்பம்" },
  health: { si: "🌿 සෞඛ්‍යය", en: "🌿 Health & Wellness", ta: "🌿 ஆரோக்கியம்" },
  luckyNumber: { si: "ජය අංකය", en: "Lucky Number", ta: "அதிர்ஷ்ட எண்" },
  luckyColor: { si: "ජය වර්ණය", en: "Lucky Color", ta: "அதிர்ஷ்ட நிறம்" },
  luckyDirection: { si: "ජය දිශාව", en: "Lucky Direction", ta: "அதிர்ஷ்ட திசை" },
  close: { si: "සංවෘත කරන්න", en: "Close", ta: "மூடுக" },
  loading: {
    si: "අද දවසේ පලාපල සහ පංචාංගය සකස් වෙමින් පවතී...",
    en: "Preparing today's horoscope and panchangam...",
    ta: "இன்றைய ராசி பலன் மற்றும் பஞ்சாங்கம் தயாராகிறது...",
  },
  error: {
    si: "දිනපතා පලාපල දත්ත ලබාගැනීමේදී දෝෂයක් සිදුවිය.",
    en: "Failed to load daily horoscope data.",
    ta: "தினசரி பலன்களைப் பெறுவதில் பிழை ஏற்பட்டது.",
  },
  retry: { si: "නැවත උත්සාහ කරන්න", en: "Try Again", ta: "மீண்டும் முயற்சிக்கவும்" },
};

export default function DailyHoroscopePage() {
  const { language, setLanguage } = useUi();
  const lang = (language === "si" || language === "ta" || language === "en" ? language : "si") as Language;

  const [selectedPeriod, setSelectedPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("DAILY");
  const [selectedDate, setSelectedDate] = useState(() => {
    const slNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    return slNow.toISOString().slice(0, 10);
  });

  const [data, setData] = useState<DailyHoroscopeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLagna, setSelectedLagna] = useState<LagnaPrediction | null>(null);
  const [dateInputOpen, setDateInputOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";

  const fetchHoroscope = useCallback(
    async (dateStr: string, periodStr: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/daily-horoscope/${dateStr}?period=${periodStr}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load horoscope:", err);
        setError(I18N.error[lang]);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, lang]
  );

  useEffect(() => {
    fetchHoroscope(selectedDate, selectedPeriod);
  }, [fetchHoroscope, selectedDate, selectedPeriod]);

  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const periodOptions: Array<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"> = [
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "YEARLY",
  ];

  const periodIcons = {
    DAILY: "☀️",
    WEEKLY: "📅",
    MONTHLY: "🌙",
    YEARLY: "🌟",
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[var(--accent)]/30 selection:text-[var(--accent)]">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Language Switcher Bar on Page */}
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
            <button
              onClick={() => setLanguage("si")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                lang === "si"
                  ? "bg-[var(--accent)] text-[#0b0f19] shadow-sm font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              සිංහල
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                lang === "en"
                  ? "bg-[var(--accent)] text-[#0b0f19] shadow-sm font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("ta")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                lang === "ta"
                  ? "bg-[var(--accent)] text-[#0b0f19] shadow-sm font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Main Title & Description */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--warning-bg)] border border-[var(--warning-border)] text-xs text-[var(--accent)] font-medium">
            <span>{I18N.badge[lang]}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[var(--text)] tracking-tight drop-shadow-[0_2px_14px_rgba(243,229,171,0.25)]">
            {I18N.title[lang]}
          </h1>
          <p className="max-w-3xl mx-auto text-xs sm:text-sm text-[var(--text-muted)] font-light leading-relaxed">
            {I18N.subtitle[lang]}
          </p>
        </div>

        {/* Period Selector Tabs (Daily, Weekly, Monthly, Yearly) */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-inner">
            {periodOptions.map((periodKey) => {
              const active = selectedPeriod === periodKey;
              return (
                <button
                  key={periodKey}
                  onClick={() => setSelectedPeriod(periodKey)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-[var(--accent)] text-[#0b0f19] font-bold shadow-md scale-[1.02]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)]"
                  }`}
                >
                  <span>{periodIcons[periodKey]}</span>
                  <span>{I18N.periods[periodKey][lang]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => changeDateByDays(-1)}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition text-xs sm:text-sm flex items-center gap-1"
            title="Yesterday"
          >
            {I18N.yesterday[lang]}
          </button>

          <div className="relative">
            <button
              onClick={() => setDateInputOpen(!dateInputOpen)}
              className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--warning-border)] text-[var(--accent)] hover:bg-[var(--input-bg)] transition shadow-lg text-xs sm:text-sm font-semibold"
            >
              <span>📅</span>
              <span>
                {data ? getLoc(data.dateDisplay, lang) : `${selectedDate}`}
              </span>
              <span className="text-[10px] opacity-70">▼</span>
            </button>

            {dateInputOpen && (
              <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl flex flex-col gap-2">
                <label className="text-[11px] text-[var(--text-muted)]">{I18N.selectDate[lang]}</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setDateInputOpen(false);
                    }
                  }}
                  className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--text)] text-xs outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => changeDateByDays(1)}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition text-xs sm:text-sm flex items-center gap-1"
            title="Tomorrow"
          >
            {I18N.tomorrow[lang]}
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            <p className="text-sm text-[var(--accent)] font-medium animate-pulse">
              {I18N.loading[lang]}
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/30 text-center text-red-300">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchHoroscope(selectedDate, selectedPeriod)}
              className="mt-4 px-4 py-2 rounded-xl bg-red-600/30 border border-red-500/50 hover:bg-red-600/50 text-white text-xs"
            >
              {I18N.retry[lang]}
            </button>
          </div>
        ) : data ? (
          <div className="space-y-12">
            
            {/* Section 1: Daily Panchangam & Auspicious Times */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-[var(--text)] flex items-center gap-2">
                <span className="text-[var(--accent)]">✦</span>
                <span>{I18N.panchangaTitle[lang]}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Rahu Kalaya Card */}
                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md flex items-center gap-4 hover:border-[var(--accent)]/40 transition">
                  <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning-border)] flex items-center justify-center text-[var(--accent)] text-xl shrink-0">
                    🕒
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-muted)]">
                      {I18N.rahuKalaya[lang]}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[var(--text)] mt-0.5">
                      {getLoc(data.panchanga?.rahuKalaya, lang, "9.00am - 10.30am")}
                    </div>
                  </div>
                </div>

                {/* Suba Dishawa Card */}
                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md flex items-center gap-4 hover:border-[var(--accent)]/40 transition">
                  <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning-border)] flex items-center justify-center text-[var(--accent)] text-xl shrink-0">
                    ⭐
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-muted)]">
                      {I18N.subaDishawa[lang]}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[var(--text)] mt-0.5">
                      {getLoc(data.panchanga?.subaDishawa, lang, "North")}
                    </div>
                  </div>
                </div>

                {/* Maru Sitina Dishawa Card */}
                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md flex items-center gap-4 hover:border-[var(--accent)]/40 transition">
                  <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning-border)] flex items-center justify-center text-[var(--accent)] text-xl shrink-0">
                    🧭
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-muted)]">
                      {I18N.maruDishawa[lang]}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-[var(--text)] mt-0.5">
                      {getLoc(data.panchanga?.maruDishawa, lang, "East")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: General Planetary Transit Overview */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border-l-4 border-l-[var(--accent)] border border-[var(--border)] shadow-xl space-y-3">
              <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--accent)] flex items-center gap-2">
                <span>✦</span>
                <span>{I18N.generalTitle[lang]}</span>
              </h3>
              <div className="text-xs sm:text-sm text-[var(--text)]/90 leading-relaxed space-y-3 whitespace-pre-line font-light">
                {getLoc(data.generalNotes, lang)}
              </div>
            </div>

            {/* Section 3: 12 Lagna Cards Grid */}
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-bold text-[var(--text)] flex items-center gap-2">
                  <span className="text-[var(--accent)]">✦</span>
                  <span>{I18N.lagnaTitle[lang]}</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {I18N.lagnaSubtitle[lang]}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {data.lagnaPredictions?.map((lagna) => {
                  const names = ZODIAC_NAMES[lagna.code.toLowerCase()] || {
                    si: lagna.nameSi,
                    en: lagna.nameEn,
                    ta: lagna.nameTa || lagna.nameEn,
                  };

                  const primaryName = names[lang];
                  const secondaryName = lang === "en" ? names.si : names.en;

                  return (
                    <div
                      key={lagna.code}
                      className="group relative p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/50 shadow-lg hover:shadow-[var(--accent)]/10 transition-all duration-300 flex flex-col items-center text-center justify-between gap-4"
                    >
                      {/* Zodiac Icon Circle */}
                      <div className="w-16 h-16 rounded-full bg-[var(--input-bg)] border border-[var(--warning-border)] flex items-center justify-center text-[var(--accent)] text-3xl group-hover:scale-110 group-hover:border-[var(--accent)] transition-all duration-300 shadow-inner">
                        {lagna.symbol}
                      </div>

                      {/* Names in current language */}
                      <div className="space-y-0.5">
                        <div className="text-base font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition font-heading">
                          {primaryName}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          {secondaryName}
                        </div>
                      </div>

                      {/* Summary in current language */}
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 px-1 font-light">
                        {getLoc(lagna.summary, lang)}
                      </p>

                      {/* Action Button */}
                      <button
                        onClick={() => setSelectedLagna(lagna)}
                        className="w-full py-2 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text)] hover:text-[#0b0f19] transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <span>{I18N.viewPrediction[lang]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : null}

      </div>

      {/* Lagna Detail Modal */}
      {selectedLagna && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--warning-border)] p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--input-bg)] border border-[var(--warning-border)] flex items-center justify-center text-3xl text-[var(--accent)] shadow-inner">
                  {selectedLagna.symbol}
                </div>
                <div>
                  <h3 className="text-2xl font-heading font-bold text-[var(--text)] flex items-center gap-2">
                    <span>
                      {(ZODIAC_NAMES[selectedLagna.code.toLowerCase()] || {})[lang] || selectedLagna.nameEn}
                    </span>
                    <span className="text-sm font-normal text-[var(--accent)]">
                      ({selectedLagna.nameEn})
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {data ? getLoc(data.dateDisplay, lang) : ""}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLagna(null)}
                className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary in selected language */}
            <div className="p-4 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning-border)] text-xs sm:text-sm text-[var(--text)] leading-relaxed">
              <span className="font-bold text-[var(--accent)]">{I18N.daySummary[lang]}</span>
              {getLoc(selectedLagna.summary, lang)}
            </div>

            {/* 4 Life Areas in selected language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] space-y-1">
                <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  {I18N.career[lang]}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-light">
                  {getLoc(selectedLagna.career, lang)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] space-y-1">
                <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  {I18N.wealth[lang]}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-light">
                  {getLoc(selectedLagna.wealth, lang)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] space-y-1">
                <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  {I18N.love[lang]}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-light">
                  {getLoc(selectedLagna.love, lang)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] space-y-1">
                <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  {I18N.health[lang]}
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-light">
                  {getLoc(selectedLagna.health, lang)}
                </p>
              </div>
            </div>

            {/* Lucky Highlights in selected language */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-center">
                <div className="text-[11px] text-[var(--text-muted)]">{I18N.luckyNumber[lang]}</div>
                <div className="text-base font-bold text-[var(--accent)] mt-0.5">
                  {selectedLagna.luckyNumber}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-center">
                <div className="text-[11px] text-[var(--text-muted)]">{I18N.luckyColor[lang]}</div>
                <div className="text-sm sm:text-base font-bold text-[var(--accent)] mt-0.5">
                  {getLoc(selectedLagna.luckyColor, lang)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-center">
                <div className="text-[11px] text-[var(--text-muted)]">{I18N.luckyDirection[lang]}</div>
                <div className="text-sm sm:text-base font-bold text-[var(--accent)] mt-0.5">
                  {getLoc(selectedLagna.luckyDirection, lang)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLagna(null)}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:brightness-110 text-[#0b0f19] font-bold text-xs transition shadow-lg"
              >
                {I18N.close[lang]}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

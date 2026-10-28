import {
  DailyHoroscopePayload,
  LAGNA_DEFINITIONS,
  LagnaCode,
  LagnaPrediction,
  MultilingualField,
  PanchangaData,
  resolveLocalizedText,
} from './types';

// Sri Lankan traditional day-wise Panchanga defaults in Sinhala, English, and Tamil
const DAY_PANCHANGAS: Record<
  number,
  {
    rahu: MultilingualField;
    suba: MultilingualField;
    maru: MultilingualField;
    day: MultilingualField;
  }
> = {
  0: {
    rahu: { si: 'ප.ව. 4.30 - 6.00', en: '4:30 PM - 6:00 PM', ta: 'மாலை 04:30 - 06:00' },
    suba: { si: 'උතුර', en: 'North', ta: 'வடக்கு' },
    maru: { si: 'වයඹ', en: 'Northwest', ta: 'வடமேற்கு' },
    day: { si: 'ඉරිදා', en: 'Sunday', ta: 'ஞாயிற்றுக்கிழமை' },
  },
  1: {
    rahu: { si: 'පෙ.ව. 7.30 - 9.00', en: '7:30 AM - 9:00 AM', ta: 'காலை 07:30 - 09:00' },
    suba: { si: 'වයඹ', en: 'Northwest', ta: 'வடமேற்கு' },
    maru: { si: 'නිරිත', en: 'Southwest', ta: 'தென்மேற்கு' },
    day: { si: 'සඳුදා', en: 'Monday', ta: 'திங்கட்கிழமை' },
  },
  2: {
    rahu: { si: 'ප.ව. 3.00 - 4.30', en: '3:00 PM - 4:30 PM', ta: 'மாலை 03:00 - 04:30' },
    suba: { si: 'නැගෙනහිර', en: 'East', ta: 'கிழக்கு' },
    maru: { si: 'බටහිර', en: 'West', ta: 'மேற்கு' },
    day: { si: 'අඟහරුවාදා', en: 'Tuesday', ta: 'செவ்வாய்க்கிழமை' },
  },
  3: {
    rahu: { si: 'ප.ව. 12.00 - 1.30', en: '12:00 PM - 1:30 PM', ta: 'பகல் 12:00 - 01:30' },
    suba: { si: 'දකුණ', en: 'South', ta: 'தெற்கு' },
    maru: { si: 'නිරිත', en: 'Southwest', ta: 'தென்மேற்கு' },
    day: { si: 'බදාදා', en: 'Wednesday', ta: 'புதன்கிழமை' },
  },
  4: {
    rahu: { si: 'ප.ව. 1.30 - 3.00', en: '1:30 PM - 3:00 PM', ta: 'பகல் 01:30 - 03:00' },
    suba: { si: 'ඊසාන', en: 'Northeast', ta: 'வடகிழக்கு' },
    maru: { si: 'දකුණ', en: 'South', ta: 'தெற்கு' },
    day: { si: 'බ්‍රහස්පතින්දා', en: 'Thursday', ta: 'வியாழக்கிழமை' },
  },
  5: {
    rahu: { si: 'පෙ.ව. 10.30 - 12.00', en: '10:30 AM - 12:00 PM', ta: 'காலை 10:30 - 12:00' },
    suba: { si: 'ගිනිකොණ', en: 'Southeast', ta: 'தென்கிழக்கு' },
    maru: { si: 'ඊසාන', en: 'Northeast', ta: 'வடகிழக்கு' },
    day: { si: 'සිකුරාදා', en: 'Friday', ta: 'வெள்ளிக்கிழமை' },
  },
  6: {
    rahu: { si: 'පෙ.ව. 9.00 - 10.30', en: '9:00 AM - 10:30 AM', ta: 'காலை 09:00 - 10:30' },
    suba: { si: 'උතුර', en: 'North', ta: 'வடக்கு' },
    maru: { si: 'නැගෙනහිර', en: 'East', ta: 'கிழக்கு' },
    day: { si: 'සෙනසුරාදා', en: 'Saturday', ta: 'சனிக்கிழமை' },
  },
};

const MONTHS_MAP: Record<number, MultilingualField> = {
  1: { si: 'ජනවාරි', en: 'January', ta: 'ஜனவரி' },
  2: { si: 'පෙබරවාරි', en: 'February', ta: 'பிப்ரவரி' },
  3: { si: 'මාර්තු', en: 'March', ta: 'மார்ச்' },
  4: { si: 'අප්‍රේල්', en: 'April', ta: 'ஏப்ரல்' },
  5: { si: 'මැයි', en: 'May', ta: 'மே' },
  6: { si: 'ජූනි', en: 'June', ta: 'ஜூன்' },
  7: { si: 'ජූලි', en: 'July', ta: 'ஜூலை' },
  8: { si: 'අගෝස්තු', en: 'August', ta: 'ஆகஸ்ட்' },
  9: { si: 'සැප්තැම්බර්', en: 'September', ta: 'செப்டம்பர்' },
  10: { si: 'ඔක්තෝබර්', en: 'October', ta: 'அக்டோபர்' },
  11: { si: 'නොවැම්බර්', en: 'November', ta: 'நவம்பர்' },
  12: { si: 'දෙසැම්බර්', en: 'December', ta: 'டிசம்பர்' },
};

export function formatMultilingualDateDisplay(dateStr: string): MultilingualField {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const dateObj = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr), 6, 0, 0));
  const dayOfWeek = dateObj.getUTCDay();
  const dayMeta = DAY_PANCHANGAS[dayOfWeek]?.day ?? DAY_PANCHANGAS[6].day;
  const monthMeta = MONTHS_MAP[Number(monthStr)] ?? { si: monthStr, en: monthStr, ta: monthStr };
  const dNum = Number(dayStr);

  return {
    si: `${yearStr} ${monthMeta.si} ${dNum} - ${dayMeta.si} (අද)`,
    en: `${monthMeta.en} ${dNum}, ${yearStr} - ${dayMeta.en} (Today)`,
    ta: `${yearStr} ${monthMeta.ta} ${dNum} - ${dayMeta.ta} (இன்று)`,
  };
}

export function getDefaultPanchangaForDate(dateStr: string): PanchangaData {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const dateObj = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr), 6, 0, 0));
  const dayOfWeek = dateObj.getUTCDay();
  const meta = DAY_PANCHANGAS[dayOfWeek] ?? DAY_PANCHANGAS[6];

  return {
    rahuKalaya: meta.rahu,
    subaDishawa: meta.suba,
    maruDishawa: meta.maru,
    thithi: { si: 'ශුභ තිථිය', en: 'Auspicious Tithi', ta: 'சுப திதி' },
    nakatha: { si: 'සුබ නැකත', en: 'Auspicious Nakshatra', ta: 'சுப நட்சத்திரம்' },
  };
}

function extractJsonObject(raw: string): any {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI response is not valid JSON');
  }
}

function ensureMultilingual(
  val: any,
  fallback: MultilingualField,
): MultilingualField {
  if (typeof val === 'string' && val.trim()) {
    return { si: val.trim(), en: val.trim(), ta: val.trim() };
  }
  if (val && typeof val === 'object') {
    return {
      si: typeof val.si === 'string' && val.si.trim() ? val.si.trim() : fallback.si,
      en: typeof val.en === 'string' && val.en.trim() ? val.en.trim() : fallback.en,
      ta: typeof val.ta === 'string' && val.ta.trim() ? val.ta.trim() : fallback.ta,
    };
  }
  return fallback;
}

export class DailyHoroscopeAiGenerator {
  private resolveProvider(): 'gemini' | 'openai' | 'local' {
    const raw = (
      process.env.DAILY_HOROSCOPE_AI_PROVIDER ||
      process.env.NARRATIVE_PROVIDER ||
      'auto'
    )
      .toLowerCase()
      .trim();

    const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
    const hasOpenAi = !!process.env.OPENAI_API_KEY?.trim();

    if (raw === 'openai' && hasOpenAi) return 'openai';
    if (raw === 'gemini' && hasGemini) return 'gemini';

    if (raw === 'auto' || raw === 'gemini' || raw === 'openai') {
      if (hasGemini) return 'gemini';
      if (hasOpenAi) return 'openai';
    }

    return 'local';
  }

  async generate(
    dateStr: string,
    preferredProvider?: 'gemini' | 'openai',
  ): Promise<{
    payload: DailyHoroscopePayload;
    aiProvider: string;
    aiModel: string;
  }> {
    const provider = preferredProvider || this.resolveProvider();
    const dateDisplay = formatMultilingualDateDisplay(dateStr);
    const defaultPanchanga = getDefaultPanchangaForDate(dateStr);

    if (provider === 'gemini') {
      try {
        return await this.generateWithGemini(dateStr, dateDisplay, defaultPanchanga);
      } catch (err) {
        console.warn(
          `[DailyHoroscope] Gemini failed: ${err instanceof Error ? err.message : String(err)}. Checking OpenAI fallback...`,
        );
        if (process.env.OPENAI_API_KEY?.trim()) {
          return await this.generateWithOpenAi(dateStr, dateDisplay, defaultPanchanga);
        }
        return this.generateFallback(dateStr, dateDisplay, defaultPanchanga, 'gemini-failed');
      }
    }

    if (provider === 'openai') {
      try {
        return await this.generateWithOpenAi(dateStr, dateDisplay, defaultPanchanga);
      } catch (err) {
        console.warn(
          `[DailyHoroscope] OpenAI failed: ${err instanceof Error ? err.message : String(err)}. Checking Gemini fallback...`,
        );
        if (process.env.GEMINI_API_KEY?.trim()) {
          return await this.generateWithGemini(dateStr, dateDisplay, defaultPanchanga);
        }
        return this.generateFallback(dateStr, dateDisplay, defaultPanchanga, 'openai-failed');
      }
    }

    return this.generateFallback(dateStr, dateDisplay, defaultPanchanga, 'no-key-fallback');
  }

  private buildSystemPrompt(): string {
    return [
      'You are a revered Sri Lankan & South Asian Vedic Astrologer ("තාරකා ජ්‍යොතිෂ වේදී") writing the official Daily Horoscope and Panchangam for Taraka (astrotharaka.com).',
      '',
      'CRITICAL MULTILINGUAL REQUIREMENT: You MUST output all astrological text in THREE LANGUAGES: Sinhala (si), English (en), and Tamil (ta).',
      'The tone must be authentic, traditional, culturally resonant, positive yet practical.',
      '',
      'Output MUST strictly be a JSON object matching this schema:',
      '{',
      '  "dateDisplay": { "si": "string", "en": "string", "ta": "string" },',
      '  "panchanga": {',
      '    "rahuKalaya": { "si": "string", "en": "string", "ta": "string" },',
      '    "subaDishawa": { "si": "string", "en": "string", "ta": "string" },',
      '    "maruDishawa": { "si": "string", "en": "string", "ta": "string" },',
      '    "thithi": { "si": "string", "en": "string", "ta": "string" },',
      '    "nakatha": { "si": "string", "en": "string", "ta": "string" }',
      '  },',
      '  "generalNotes": {',
      '    "si": "Multi-paragraph comprehensive general planetary transit overview for the day in Sinhala (පොදු ග්‍රහ චාරය සහ විශේෂ සටහන).",',
      '    "en": "Comprehensive general planetary transit overview for the day in English.",',
      '    "ta": "Comprehensive general planetary transit overview for the day in Tamil."',
      '  },',
      '  "lagnaPredictions": [',
      '    {',
      '      "code": "aries",',
      '      "nameSi": "මේෂ",',
      '      "nameEn": "Aries",',
      '      "nameTa": "மேஷம்",',
      '      "symbol": "♈",',
      '      "summary": { "si": "string", "en": "string", "ta": "string" },',
      '      "career": { "si": "string", "en": "string", "ta": "string" },',
      '      "wealth": { "si": "string", "en": "string", "ta": "string" },',
      '      "love": { "si": "string", "en": "string", "ta": "string" },',
      '      "health": { "si": "string", "en": "string", "ta": "string" },',
      '      "luckyNumber": "7",',
      '      "luckyColor": { "si": "රතු", "en": "Red", "ta": "சிவப்பு" },',
      '      "luckyDirection": { "si": "නැගෙනහිර", "en": "East", "ta": "கிழக்கு" }',
      '    }',
      '    // ... all 12 signs in exact order: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces',
      '  ],',
      '  "socialPost": "An engaging Facebook post formatted with emojis, hashtags, and website link"',
      '}',
    ].join('\n');
  }

  private buildUserPrompt(
    dateStr: string,
    dateDisplay: MultilingualField,
    defaultPanchanga: PanchangaData,
  ): string {
    const rSi = resolveLocalizedText(defaultPanchanga.rahuKalaya, 'si');
    const sSi = resolveLocalizedText(defaultPanchanga.subaDishawa, 'si');
    const mSi = resolveLocalizedText(defaultPanchanga.maruDishawa, 'si');

    return [
      `Generate the complete Multilingual (Sinhala, English, Tamil) Daily Horoscope & Panchangam for date: ${dateStr}.`,
      `Display Date (Sinhala): ${dateDisplay.si}`,
      `Display Date (English): ${dateDisplay.en}`,
      `Display Date (Tamil): ${dateDisplay.ta}`,
      `Authentic Sri Lankan Panchanga details for this weekday:`,
      `- රාහු කාලය / Rahu: ${rSi}`,
      `- සුබ දිශාව / Suba: ${sSi}`,
      `- මරු සිටින දිශාව / Maru: ${mSi}`,
      '',
      'Requirements:',
      '1. Return ALL 12 Lagnas with { si, en, ta } translations for summary, career, wealth, love, health, luckyColor, and luckyDirection.',
      '2. Ensure generalNotes has authentic, high-quality, inspiring text in all 3 languages: Sinhala, English, and Tamil.',
      '3. Strict valid JSON output only conforming to the system schema.',
    ].join('\n');
  }

  private async generateWithGemini(
    dateStr: string,
    dateDisplay: MultilingualField,
    defaultPanchanga: PanchangaData,
  ): Promise<{ payload: DailyHoroscopePayload; aiProvider: string; aiModel: string }> {
    const apiKey = process.env.GEMINI_API_KEY!.trim();
    const candidateModels = [
      'gemini-3.8-flash',
      process.env.GEMINI_MODEL?.trim(),
      'gemini-flash-latest',
    ].filter((m): m is string => Boolean(m) && m !== 'gemini-2.5-flash');

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model,
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: this.buildSystemPrompt() }] },
            contents: [
              {
                role: 'user',
                parts: [{ text: this.buildUserPrompt(dateStr, dateDisplay, defaultPanchanga) }],
              },
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as any;
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) throw new Error('Empty Gemini response content');

        const parsed = extractJsonObject(content);
        return {
          payload: this.normalizePayload(dateStr, dateDisplay, defaultPanchanga, parsed),
          aiProvider: 'gemini',
          aiModel: model,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[DailyHoroscope] Gemini model ${model} failed: ${lastError.message}`);
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  private async generateWithOpenAi(
    dateStr: string,
    dateDisplay: MultilingualField,
    defaultPanchanga: PanchangaData,
  ): Promise<{ payload: DailyHoroscopePayload; aiProvider: string; aiModel: string }> {
    const apiKey = process.env.OPENAI_API_KEY!.trim();
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: this.buildUserPrompt(dateStr, dateDisplay, defaultPanchanga) },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty OpenAI response content');

    const parsed = extractJsonObject(content);
    return {
      payload: this.normalizePayload(dateStr, dateDisplay, defaultPanchanga, parsed),
      aiProvider: 'openai',
      aiModel: model,
    };
  }

  private normalizePayload(
    dateStr: string,
    dateDisplay: MultilingualField,
    defaultPanchanga: PanchangaData,
    data: any,
  ): DailyHoroscopePayload {
    const defaultRahu = defaultPanchanga.rahuKalaya as MultilingualField;
    const defaultSuba = defaultPanchanga.subaDishawa as MultilingualField;
    const defaultMaru = defaultPanchanga.maruDishawa as MultilingualField;

    const panchanga: PanchangaData = {
      rahuKalaya: ensureMultilingual(data.panchanga?.rahuKalaya, defaultRahu),
      subaDishawa: ensureMultilingual(data.panchanga?.subaDishawa, defaultSuba),
      maruDishawa: ensureMultilingual(data.panchanga?.maruDishawa, defaultMaru),
      thithi: ensureMultilingual(data.panchanga?.thithi, {
        si: 'ශුභ තිථිය',
        en: 'Auspicious Tithi',
        ta: 'சுப திதி',
      }),
      nakatha: ensureMultilingual(data.panchanga?.nakatha, {
        si: 'සුබ නැකත',
        en: 'Auspicious Nakshatra',
        ta: 'சுப நட்சத்திரம்',
      }),
    };

    const generalNotes: MultilingualField = ensureMultilingual(data.generalNotes, {
      si: `${dateDisplay.si} දිනය ඔබගේ රැකියාව, ව්‍යාපාර කටයුතු, මුදල් කළමනාකරණය සහ පවුල් සබඳතා සම්බන්ධයෙන් සැලකිලිමත් විය යුතු දිනයකි.`,
      en: `${dateDisplay.en} is an auspicious day to maintain patience, mindfulness, and focused attention on career, finances, and relationships.`,
      ta: `${dateDisplay.ta} தொழில், நிதி மற்றும் குடும்ப உறவுகளில் பொறுமையாகவும் விவேகமாகவும் செயல்பட வேண்டிய ஒரு நல்ல நாளாகும்.`,
    });

    const rawLagnas = Array.isArray(data.lagnaPredictions) ? data.lagnaPredictions : [];
    const lagnaMap = new Map<string, any>();
    for (const l of rawLagnas) {
      if (l?.code) lagnaMap.set(String(l.code).toLowerCase(), l);
    }

    const DEFAULT_PROFILES: Record<
      string,
      {
        summary: MultilingualField;
        career: MultilingualField;
        wealth: MultilingualField;
        love: MultilingualField;
        health: MultilingualField;
        luckyNumber: string;
        luckyColor: MultilingualField;
        luckyDirection: MultilingualField;
      }
    > = {
      aries: {
        summary: {
          si: 'මේෂ ලග්න හිමියන්ට අද දිනයේ නව උනන්දුවක් හා ජවයක් ඇතිවේ. ප්‍රමාද වූ කාර්යයන් නිම කිරීමට මනා පිටුවහලක් ලැබේ.',
          en: 'Aries natives will experience renewed drive, energy, and determination to clear pending tasks.',
          ta: 'மேஷ ராசிக்காரர்களுக்கு இன்றைய நாள் புதிய உற்சாகத்தையும் பணிகளை முடிக்கும் ஆற்றலையும் தரும்.',
        },
        career: {
          si: 'රැකියා ස්ථානයේ ප්‍රධානීන්ගේ පැසසුම් හිමිවන අතර නව ව්‍යාපෘති ආරම්භ කිරීමට සුබයි.',
          en: 'Positive recognition from seniors in the workplace; favorable for new initiatives.',
          ta: 'பணியிடத்தில் நற்பெயர் கிடைக்கும்; புதிய திட்டங்களைத் தொடங்க உகந்தது.',
        },
        wealth: {
          si: 'මූල්‍ය වාසි ඇතිවිය හැකි අතර හදිසි තීරණවලින් සහ අනවශ්‍ය වියදම්වලින් වළකින්න.',
          en: 'Financial gains are indicated; avoid impulsive shopping and hasty investments.',
          ta: 'நிதி வரவுகள் உண்டாகும்; தேவையற்ற செலவுகளைக் கட்டுப்படுத்துங்கள்.',
        },
        love: {
          si: 'පවුලේ අය සමඟ අවබෝධයෙන් කටයුතු කරන්න. අනවශ්‍ය වාද විවාදවලින් වළකින්න.',
          en: 'Maintain open and affectionate communication with close loved ones.',
          ta: 'குடும்பத்தினருடன் அன்பாகவும் விவேகமாகவும் பழகுங்கள்.',
        },
        health: {
          si: 'හිසේ රෝග හෝ ආතතිය පාලනයට ප්‍රමාණවත් විවේකයක් ගන්න.',
          en: 'Ensure adequate rest to avoid stress or head fatigue.',
          ta: 'போதுமான ஓய்வு எடுத்து மன அழுத்தத்தைத் தவிர்த்திடுங்கள்.',
        },
        luckyNumber: '9',
        luckyColor: { si: 'රතු', en: 'Red', ta: 'சிவப்பு' },
        luckyDirection: { si: 'නැගෙනහිර', en: 'East', ta: 'கிழக்கு' },
      },
      taurus: {
        summary: {
          si: 'වෘෂභ ලග්න හිමියන්ට ඉවසීමෙන් හා බුද්ධියෙන් කටයුතු කිරීමෙන් යහපත් ප්‍රතිඵල අත්වන සාමකාමී දිනයකි.',
          en: 'Taurus natives will find steady success through practical patience, persistence, and calm mindset.',
          ta: 'ரிஷப ராசிக்காரர்களுக்கு பொறுமையும் விவேகமும் நல்ல பலன்களைத் தரும்.',
        },
        career: {
          si: 'ස්ථාවර තීරණ සහ සාමූහික කැපවීම තුළින් වෘත්තීය ගැටලු සාර්ථකව විසඳාගත හැක.',
          en: 'Consistent teamwork and careful judgment resolve professional hurdles smoothly.',
          ta: 'கூட்டு முயற்சியால் பணியிட சவால்கள் தீர்க்கப்படும்.',
        },
        wealth: {
          si: 'ආදායම් මාර්ග ස්ථාවරව පවතින අතර අනාගතය වෙනුවෙන් මුදල් ඉතිරි කිරීමට සුබයි.',
          en: 'Steady income stream; favorable for budgeting and long-term savings.',
          ta: 'வருமானம் நிலையாக இருக்கும்; சேமிப்புக்கு உகந்த நாள்.',
        },
        love: {
          si: 'ආදර සබඳතාවල පැහැදිලි බවක් හා බැඳීමක් ඇතිවේ. සහකරුගේ සහය ලැබේ.',
          en: 'Harmony and warmth in personal ties; mutual understanding deepens.',
          ta: 'துணையுடன் நல்லிணக்கமும் ஆதரவும் அதிகரிக்கும்.',
        },
        health: {
          si: 'ගෙල සහ උගුර ආශ්‍රිත සෙම් අමාරු ගැන සැලකිලිමත් වන්න.',
          en: 'Watch for throat sensitivity and stay comfortably warm.',
          ta: 'தொண்டை மற்றும் சளி தொடர்பான ஆரோக்கியத்தில் கவனம் செலுத்துங்கள்.',
        },
        luckyNumber: '6',
        luckyColor: { si: 'සුදු', en: 'White', ta: 'வெள்ளை' },
        luckyDirection: { si: 'දකුණ', en: 'South', ta: 'தெற்கு' },
      },
      gemini: {
        summary: {
          si: 'මිථුන ලග්න හිමියන්ට අලුත් සබඳතා සහ නිර්මාණශීලී අදහස් තුළින් සාර්ථකත්වය හිමිවන ඵලදායී දිනයකි.',
          en: 'Gemini natives benefit from networking, dynamic ideas, and engaging discussions.',
          ta: 'மிதுன ராசிக்காரர்களுக்கு புதிய தொடர்புகளும் சிந்தனைகளும் வெற்றியைத் தரும்.',
        },
        career: {
          si: 'සන්නිවේදන සහ සාකච්ඡා කටයුතුවලින් ඉහළ වාසි අත්වේ. අදහස් පැහැදිලිව ඉදිරිපත් කරන්න.',
          en: 'Fruitful discussions and creative presentations open promising doors.',
          ta: 'தகவல் தொடர்பும் பேச்சுவார்த்தைகளும் வெற்றிகரமாக அமையும்.',
        },
        wealth: {
          si: 'වෙළෙඳ සහ තැරැව්කාර කටයුතුවලින් වාසි හිමිවේ. අනවශ්‍ය වියදම් සීමා කරන්න.',
          en: 'Commercial and trading transactions yield solid margins.',
          ta: 'வியாபாரத்தில் லாபகரமான வாய்ப்புகள் உண்டாகும்.',
        },
        love: {
          si: 'මිතුරු ඇසුරින් සතුට හා සහයෝගය ලැබේ. ප්‍රේම සබඳතා ශක්තිමත් වේ.',
          en: 'Meaningful connections with genuine friends and uplifting romance.',
          ta: 'நண்பர்கள் மற்றும் துணையுடன் மகிழ்ச்சியான பொழுதுகள் அமையும்.',
        },
        health: {
          si: 'හුස්ම ගැනීමේ පහසුව හා ශ්වසන පද්ධතිය පිළිබඳ සැලකිලිමත් වන්න.',
          en: 'Practice mindful breathing and avoid overly crowded spaces.',
          ta: 'சுவாச ஆரோக்கியத்தில் கவனம் செலுத்துங்கள்.',
        },
        luckyNumber: '5',
        luckyColor: { si: 'කොළ', en: 'Green', ta: 'பச்சை' },
        luckyDirection: { si: 'බටහිර', en: 'West', ta: 'மேற்கு' },
      },
      cancer: {
        summary: {
          si: 'කටක ලග්න හිමියන්ට පවුලේ වගකීම් හා ගෘහ ජීවිතයේ කටයුතු කෙරෙහි වැඩි අවධානයක් යොමු කිරීමට සිදුවේ.',
          en: 'Cancer natives will focus on domestic matters, emotional reassurance, and family welfare.',
          ta: 'கடக ராசிக்காரர்களுக்கு குடும்பப் பொறுப்புகளும் அமைதியும் முக்கியத்துவம் பெறும்.',
        },
        career: {
          si: 'ඉවසිලිවන්තව වැඩකටයුතු කිරීමෙන් වෘත්තීය සාර්ථකත්වය සහ සිතේ සැනසීම රැකගත හැක.',
          en: 'Maintain steady patience and diligence to preserve peace of mind at work.',
          ta: 'பணியிடத்தில் அமைதியாக செயல்படுவது நல்ல பலனைத் தரும்.',
        },
        wealth: {
          si: 'ගෘහස්ථ වියදම් ඉහළ යා හැකි බැවින් අයවැය නිවැරදිව පාලනය කරගන්න.',
          en: 'Budget thoughtfully for domestic necessities and avoid unnecessary splurges.',
          ta: 'வீட்டுச் செலவுகளைத் திட்டமிட்டு நிர்வகியுங்கள்.',
        },
        love: {
          si: 'සමීපතමයන්ගේ සෙනෙහස සහ ආදරය ලැබේ. පවුලේ සමගිය වර්ධනය වේ.',
          en: 'Affection and warmth flourish within the household; relationships strengthen.',
          ta: 'குடும்பத்தினரின் அன்பு மனதிற்கு மகிழ்ச்சி தரும்.',
        },
        health: {
          si: 'ආහාර ජීර්ණ පද්ධතියේ සුවතාව ගැන සැලකිලිමත් වන්න.',
          en: 'Focus on light, nutritious, freshly prepared meals.',
          ta: 'செரிமான நலனில் விழிப்புடன் இருங்கள்.',
        },
        luckyNumber: '2',
        luckyColor: { si: 'සුදු හෝ ක්‍රීම්', en: 'White / Cream', ta: 'வெள்ளை' },
        luckyDirection: { si: 'වයඹ', en: 'Northwest', ta: 'வடமேற்கு' },
      },
      leo: {
        summary: {
          si: 'සිංහ ලග්න හිමියන්ට නායකත්ව ගුණාංග විදහා දක්වමින් සමාජයේ ගෞරවය හා පිළිගැනීම දිනාගත හැකි දිනයකි.',
          en: 'Leo natives shine with charismatic leadership, confidence, and broad societal goodwill.',
          ta: 'சிம்ம ராசிக்காரர்களுக்கு தலைமைப் பண்பும் சமூக மரியாதையும் உயரும்.',
        },
        career: {
          si: 'තීරණ ගැනීමේදී ආත්ම විශ්වාසය ඉහළ යයි. අන්‍යන්ගේ අදහස්වලටද සවන් දෙන්න.',
          en: 'Decisive command at work; remember to value feedback from your team.',
          ta: 'நம்பிக்கையுடன் முடிவெடுங்கள்; மற்றவர்களின் ஆலோசனையையும் மதியுங்கள்.',
        },
        wealth: {
          si: 'ආයෝජන සහ ව්‍යාපාර කටයුතුවලින් සුබදායක ප්‍රවණතා මතුවේ.',
          en: 'Favorable prospects for prudent investments and business expansion.',
          ta: 'தொழில் மற்றும் முதலீடுகளில் சாதகமான சூழல் நிலவும்.',
        },
        love: {
          si: 'පෙම්වතුන් අතර සුහදතාව වැඩිවේ. අනවශ්‍ය උඩඟුකමෙන් වළකින්න.',
          en: 'Warm romance; avoid pride and embrace sincere tenderness.',
          ta: 'அன்பும் பாசமும் அதிகரிக்கும்; வீண் கர்வத்தைத் தவிர்த்திடுங்கள்.',
        },
        health: {
          si: 'හෘදය සහ රුධිර පීඩනය කෙරෙහි මඳක් විමසිලිමත් වන්න.',
          en: 'Stay active, keep salt intake balanced, and rest adequately.',
          ta: 'இரத்த அழுத்தம் மற்றும் இதய ஆரோக்கியத்தில் கவனம் தேவை.',
        },
        luckyNumber: '1',
        luckyColor: { si: 'රන්වන් කහ', en: 'Gold / Yellow', ta: 'தங்கம்' },
        luckyDirection: { si: 'නැගෙනහිර', en: 'East', ta: 'கிழக்கு' },
      },
      virgo: {
        summary: {
          si: 'කන්‍යා ලග්න හිමියන්ට සැලසුම් සහගතව සහ සූක්ෂ්මව කටයුතු කිරීමෙන් සියලු බලාපොරොත්තු ඉටුකරගත හැක.',
          en: 'Virgo natives prosper through meticulous planning, precision, and practical discipline.',
          ta: 'கன்னி ராசிக்காரர்களுக்கு திட்டமிட்ட உழைப்பு நல்ல முன்னேற்றம் தரும்.',
        },
        career: {
          si: 'විස්තරාත්මක කාර්යයන් හා ලේඛන කටයුතු සාර්ථකව නිම කළ හැක.',
          en: 'Complex paperwork, audits, and analytical tasks wrap up seamlessly.',
          ta: 'ஆவணங்கள் மற்றும் துல்லியமான பணிகள் வெற்றிகரமாக முடியும்.',
        },
        wealth: {
          si: 'ආර්ථික වාසි අත්වන අතර අනවශ්‍ය ණය ගනුදෙනුවලින් ඈත්ව සිටින්න.',
          en: 'Positive cash inflow; avoid taking on unnecessary borrowed debt.',
          ta: 'பொருளாதார நிலை சீராகும்; கடன் வாங்குவதைத் தவிர்க்கவும்.',
        },
        love: {
          si: 'අධික විවේචනයෙන් වැළකී ආදරණීයයන්ගේ යහපත් ගතිගුණ අගය කරන්න.',
          en: 'Replace sharp critique with gentle appreciation of partner qualities.',
          ta: 'விமர்சனங்களைத் தவிர்த்து அன்பைப் பாராட்டுங்கள்.',
        },
        health: {
          si: 'මානසික විවේකය හා සෞඛ්‍ය සම්පන්න ආහාර වේලක් කෙරෙහි සැලකිලිමත් වන්න.',
          en: 'Prioritize a wholesome diet and take short relaxing breaks.',
          ta: 'சீரான உணவு மற்றும் மன அமைதியைப் பேணுங்கள்.',
        },
        luckyNumber: '5',
        luckyColor: { si: 'කොළ', en: 'Green', ta: 'பச்சை' },
        luckyDirection: { si: 'දකුණ', en: 'South', ta: 'தெற்கு' },
      },
      libra: {
        summary: {
          si: 'තුලා ලග්න හිමියන්ට හවුල් ව්‍යාපාර හා සමාජ සබඳතා වඩාත් ශක්තිමත් වන සමබර දිනයකි.',
          en: 'Libra natives will cultivate harmony, collaborative partnerships, and pleasant agreements.',
          ta: 'துலாம் ராசிக்காரர்களுக்கு கூட்டு முயற்சிகளும் நல்லுறவுகளும் பலப்படும்.',
        },
        career: {
          si: 'සාකච්ඡා සහ සම්මුතීන් සඳහා ඉතා සුදුසුයි. කණ්ඩායම් හැඟීමෙන් ජයග්‍රහණ අත්වේ.',
          en: 'Excellent for diplomacy, contractual pacts, and team synergy.',
          ta: 'ஒப்பந்தங்கள் மற்றும் கலந்துரையாடல்களுக்கு உகந்த நாள்.',
        },
        wealth: {
          si: 'මූල්‍ය තීරණ සමබරව ගන්න. අනවශ්‍ය බාහිර වියදම් පාලනය කරන්න.',
          en: 'Keep budget well-balanced; avoid luxury expenditures today.',
          ta: 'நிதி முடிவுகளை சமநிலையுடன் எடுங்கள்.',
        },
        love: {
          si: 'විවාහ ජීවිතයේ සතුට හා සාමය වැඩිවේ. අලුත් සබඳතා ඇතිවිය හැක.',
          en: 'Deep joy and peace in conjugal life; loving bonds flourish.',
          ta: 'தாம்பத்திய வாழ்வில் மகிழ்ச்சியும் அமைதியும் நிலவும்.',
        },
        health: {
          si: 'වකුගඩු හා මුත්‍රා පද්ධතියේ සුවතාව ගැන සලකා වැඩිපුර ජලය පානය කරන්න.',
          en: 'Drink plentiful fresh water to support kidney and urinary vitality.',
          ta: 'நிறைய தண்ணீர் குடித்து உடலை நீரேற்றமாக வைத்திருங்கள்.',
        },
        luckyNumber: '6',
        luckyColor: { si: 'ලා නිල්', en: 'Light Blue', ta: 'இளநீலம்' },
        luckyDirection: { si: 'බටහිර', en: 'West', ta: 'மேற்கு' },
      },
      scorpio: {
        summary: {
          si: 'වෘශ්චික ලග්න හිමියන්ට සැඟවුණු හැකියාවන් ඉස්මතු කරමින් අභියෝග ජයගත හැකි ශක්තිමත් දිනයකි.',
          en: 'Scorpio natives unlock inner resilience and insightful perception to conquer hurdles.',
          ta: 'விருச்சிக ராசிக்காரர்களுக்கு தைரியமும் உள்ுணர்வும் தடைகளை வெல்ல உதவும்.',
        },
        career: {
          si: 'නොසැලෙන අධිෂ්ඨානයෙන් යුතුව කටයුතු කිරීමෙන් දුෂ්කර කාර්යයන් පහසුවෙන් නිම වේ.',
          en: 'Unyielding resolve ensures mastery over complex responsibilities.',
          ta: 'உறுதியான உழைப்பால் கடினமான பணிகளும் எளிதாகும்.',
        },
        wealth: {
          si: 'අනපේක්ෂිත මූල්‍ය ලැබීම් හෝ හිඟ මුදල් පියවීම් සිදුවිය හැක.',
          en: 'Surprise financial receipts or resolution of pending arrears.',
          ta: 'எதிர்பாராத பணவரவு அல்லது பழைய பாக்கிகள் வசூலாகும்.',
        },
        love: {
          si: 'සැකය දුරුකර අවංකව කටයුතු කිරීමෙන් ප්‍රේම සබඳතා රැකගත හැක.',
          en: 'Cultivate candid trust and dispel unfounded suspicions.',
          ta: 'சந்தேகங்களைத் தவிர்த்து நேர்மையுடன் பழகுங்கள்.',
        },
        health: {
          si: 'ඉක්මන් කෝපය පාලනය කරගෙන මනසේ සන්සුන් බව පවත්වා ගන්න.',
          en: 'Channel fiery energy constructively and keep inner serenity.',
          ta: 'கோபத்தைக் கட்டுப்படுத்தி மன அமைதியைக் காக்கவும்.',
        },
        luckyNumber: '9',
        luckyColor: { si: 'තද රතු', en: 'Dark Red', ta: 'அடர் சிவப்பு' },
        luckyDirection: { si: 'උතුර', en: 'North', ta: 'வடக்கு' },
      },
      sagittarius: {
        summary: {
          si: 'ධනු ලග්න හිමියන්ට නව දැනුම, අධ්‍යාපනික ප්‍රගතිය සහ සුබ ගමන් බිමන්වලට මග සැලසෙන දිනයකි.',
          en: 'Sagittarius natives will enjoy optimism, intellectual growth, and auspicious journeys.',
          ta: 'தனுசு ராசிக்காரர்களுக்கு அறிவு வளர்ச்சி, கல்வி முன்னேற்றம் மற்றும் சுபப் பயணம் அமையும்.',
        },
        career: {
          si: 'දූරදර්ශී සැලසුම් සාර්ථක වන අතර ඉහළ නිලධාරීන්ගේ ප්‍රසාදය දිනාගත හැක.',
          en: 'Visionary thinking is rewarded; supervisors applaud your foresight.',
          ta: 'தொலைநோக்குத் திட்டங்கள் வெற்றி பெற்று பாராட்டுக்கள் குவியும்.',
        },
        wealth: {
          si: 'ආදායම වර්ධනය කරගැනීමට අලුත් මාවත් විවර වේ. අධික වියදම් සීමා කරන්න.',
          en: 'Promising avenues for income generation; manage travel expenses wisely.',
          ta: 'புதிய வருமான வாய்ப்புகள் உருவாகும்; செலவுகளைக் கவனியுங்கள்.',
        },
        love: {
          si: 'ආගමික හෝ අධ්‍යාත්මික කටයුතු තුළින් පවුලේ සතුට හා සාමය ගොඩනැගේ.',
          en: 'Spiritual shared moments deepen domestic joy and concord.',
          ta: 'ஆன்மீக சிந்தனைகள் குடும்பத்தில் அமைதியை உண்டாக்கும்.',
        },
        health: {
          si: 'කලවා සහ පාද ආශ්‍රිත වේදනාවන්ගෙන් ප්‍රවේසම් වන්න.',
          en: 'Take care of hips, thighs, and stretch lightly before strenuous walks.',
          ta: 'கால் மற்றும் இடுப்புப் பகுதி ஆரோக்கியத்தில் கவனம் செலுத்துங்கள்.',
        },
        luckyNumber: '3',
        luckyColor: { si: 'කහ', en: 'Yellow', ta: 'மஞ்சள்' },
        luckyDirection: { si: 'ඊසාන', en: 'Northeast', ta: 'வடகிழக்கு' },
      },
      capricorn: {
        summary: {
          si: 'මකර ලග්න හිමියන්ට වෘත්තීය ඉලක්ක සපුරාගැනීමට කැපවීම හා විනය ප්‍රයෝජනවත් වන ඵලදායී දිනයකි.',
          en: 'Capricorn natives achieve concrete milestones through relentless dedication and solid discipline.',
          ta: 'மகர ராசிக்காரர்களுக்கு விடாமுயற்சியும் ஒழுக்கமும் சிறந்த இலக்குகளை எட்ட உதவும்.',
        },
        career: {
          si: 'වගකීම් ඉහළ යන නමුත් දැඩි උත්සාහය තුළින් ප්‍රතිඵල අත්කරගත හැක.',
          en: 'Demanding assignments handled with supreme administrative competence.',
          ta: 'கூடுதல் பொறுப்புகள் வந்தாலும் சிறப்பாகச் செய்து முடிப்பீர்கள்.',
        },
        wealth: {
          si: 'ස්ථාවර වත්කම් හෝ ඉඩකඩම් සම්බන්ධ කටයුතුවලින් යහපත් ප්‍රතිඵල ලැබේ.',
          en: 'Solid returns linked to real estate or fixed institutional investments.',
          ta: 'நிலம் மற்றும் சொத்து தொடர்பான விவகாரங்கள் சாதகமாகும்.',
        },
        love: {
          si: 'වැඩිහිටියන්ගේ ආශීර්වාදය සහ මගපෙන්වීම පවුල් ජීවිතයට ශක්තියක් වේ.',
          en: 'Elders offer valuable blessings that solidify household peace.',
          ta: 'பெரியவர்களின் ஆசியும் வழிகாட்டலும் பலம் சேர்க்கும்.',
        },
        health: {
          si: 'දණහිස් සහ සන්ධි ආශ්‍රිත අපහසුතා කෙරෙහි සැලකිලිමත් වන්න.',
          en: 'Guard against joint stiffness; stay warm and mobile.',
          ta: 'மூட்டு மற்றும் முழங்கால் ஆரோக்கியத்தில் அக்கறை காட்டுங்கள்.',
        },
        luckyNumber: '8',
        luckyColor: { si: 'තද නිල්', en: 'Dark Blue', ta: 'நீலம்' },
        luckyDirection: { si: 'දකුණ', en: 'South', ta: 'தெற்கு' },
      },
      aquarius: {
        summary: {
          si: 'කුම්භ ලග්න හිමියන්ට නවෝත්පාදන අදහස් සහ සමාජ හිතකාමී කටයුතු තුළින් ප්‍රසාදය දිනාගත හැකි දිනයකි.',
          en: 'Aquarius natives stand out with visionary originality, progressive intellect, and communal impact.',
          ta: 'கும்ப ராசிக்காரர்களுக்கு புதுமையான எண்ணங்களும் சமூக அக்கறையும் மதிப்பளிக்கும்.',
        },
        career: {
          si: 'තාක්ෂණික හා නව්‍ය ව්‍යාපෘති සාර්ථක වන අතර මිතුරන්ගේ සහය ලැබේ.',
          en: 'Technological, humanitarian, and collective ventures make solid headway.',
          ta: 'தொழில்நுட்பம் மற்றும் கூட்டுத் திட்டங்கள் வெற்றிகரமாக அமையும்.',
        },
        wealth: {
          si: 'හදිසි ආයෝජනවලින් වැළකී විශ්වාසවන්ත ක්‍රමවල පමණක් මුදල් යොදවන්න.',
          en: 'Avoid speculative gambling; rely on verified financial vehicles.',
          ta: 'ஊக வணிகத்தைத் தவிர்த்து பாதுகாப்பான முறையில் முதலீடு செய்யுங்கள்.',
        },
        love: {
          si: 'නිදහස් මනසකින් හා අන්‍යෝන්‍ය ගෞරවයෙන් ප්‍රේම සබඳතා පවත්වා ගන්න.',
          en: 'Mutual space and sincere intellectual resonance grace romance.',
          ta: 'பரஸ்பர மரியாதையுடனும் புரிதலுடனும் அன்பைப் பேணுங்கள்.',
        },
        health: {
          si: 'වෙහෙස අඩුකර ප්‍රමාණවත් නින්දක් ලබාගැනීමට උත්සාහ කරන්න.',
          en: 'Rest your eyes from screen fatigue and secure sound sleep.',
          ta: 'நல்ல தூக்கமும் கண் ஓய்வும் உடல் சோர்வை நீக்கும்.',
        },
        luckyNumber: '8',
        luckyColor: { si: 'අළු හෝ නිල්', en: 'Grey / Blue', ta: 'சாம்பல்' },
        luckyDirection: { si: 'බටහිර', en: 'West', ta: 'மேற்கு' },
      },
      pisces: {
        summary: {
          si: 'මීන ලග්න හිමියන්ට අධ්‍යාත්මික සහනය, මනසේ සාමය සහ නිර්මාණශීලී කාර්යයන්වලින් ඉහළ තෘප්තියක් ලැබේ.',
          en: 'Pisces natives touch serene spiritual equilibrium, empathy, and artistic fulfilment.',
          ta: 'மீன ராசிக்காரர்களுக்கு ஆன்மீக அமைதியும் கலைத்திறனும் மனநிறைவை வழங்கும்.',
        },
        career: {
          si: 'කලාත්මක සහ සේවාදායක වෘත්තීන්හි නියුතු අයට විශේෂ ප්‍රගතියක් අත්වේ.',
          en: 'Remarkable progress for caregiving, educational, and artistic sectors.',
          ta: 'கலை மற்றும் சேவைத் துறைகளில் உள்ளவர்களுக்கு நல்ல முன்னேற்றம் உண்டு.',
        },
        wealth: {
          si: 'පුණ්‍ය කටයුතු සඳහා වියදම් සිදුවිය හැක. අයවැය නිවැරදිව පාලනය කරන්න.',
          en: 'Charitable donations bring joy; keep your savings boundary firm.',
          ta: 'தான தர்மங்கள் செய்வீர்கள்; வரவு செலவை சீராக வையுங்கள்.',
        },
        love: {
          si: 'සංවේදී බව සහ කරුණාවන්ත සිතුවිලි ඔබේ ආදර සබඳතා තවදුරටත් සමීප කරනු ඇත.',
          en: 'Tender compassion and heartfelt gestures blossom in your bond.',
          ta: 'கனிவான அன்பும் ஆதரவும் உங்கள் உறவை மேலும் பலப்படுத்தும்.',
        },
        health: {
          si: 'පාද ආශ්‍රිත සුවතාව සහ ප්‍රමාණවත් සුව නින්දක් කෙරෙහි අවධානය දෙන්න.',
          en: 'Pamper your feet, maintain gentle circulation, and rest peacefully.',
          ta: 'பாதங்கள் மற்றும் நல்ல உறக்கத்திற்கு முக்கியத்துவம் கொடுங்கள்.',
        },
        luckyNumber: '3',
        luckyColor: { si: 'රන්වන් කහ', en: 'Gold / Yellow', ta: 'தங்கம்' },
        luckyDirection: { si: 'උතුර', en: 'North', ta: 'வடக்கு' },
      },
    };

    const lagnaPredictions: LagnaPrediction[] = LAGNA_DEFINITIONS.map((def) => {
      const l = lagnaMap.get(def.code);
      const fallbackProfile = DEFAULT_PROFILES[def.code] || DEFAULT_PROFILES.aries;

      // Reject generic repetitive placeholder text
      const rawSummary = typeof l?.summary === 'string' ? l.summary : l?.summary?.si;
      const isPlaceholder =
        typeof rawSummary === 'string' &&
        rawSummary.includes('සුබදායක ප්‍රවණතා ගෙනදෙයි');

      const summary = isPlaceholder ? fallbackProfile.summary : ensureMultilingual(l?.summary, fallbackProfile.summary);
      const career = isPlaceholder ? fallbackProfile.career : ensureMultilingual(l?.career, fallbackProfile.career);
      const wealth = isPlaceholder ? fallbackProfile.wealth : ensureMultilingual(l?.wealth, fallbackProfile.wealth);
      const love = isPlaceholder ? fallbackProfile.love : ensureMultilingual(l?.love, fallbackProfile.love);
      const health = isPlaceholder ? fallbackProfile.health : ensureMultilingual(l?.health, fallbackProfile.health);
      const luckyNumber = isPlaceholder || !l?.luckyNumber ? fallbackProfile.luckyNumber : String(l.luckyNumber);
      const luckyColor = isPlaceholder ? fallbackProfile.luckyColor : ensureMultilingual(l?.luckyColor, fallbackProfile.luckyColor);
      const luckyDirection = isPlaceholder ? fallbackProfile.luckyDirection : ensureMultilingual(l?.luckyDirection, fallbackProfile.luckyDirection);

      return {
        code: def.code,
        nameSi: def.nameSi,
        nameEn: def.nameEn,
        nameTa: def.nameTa,
        symbol: def.symbol,
        summary,
        career,
        wealth,
        love,
        health,
        luckyNumber,
        luckyColor,
        luckyDirection,
      };
    });

    const socialPost =
      typeof data.socialPost === 'string' && data.socialPost.trim()
        ? data.socialPost.trim()
        : `✨ ${dateDisplay.si} - අද දවසේ පලාපල සහ පංචාංගය ✨\n\n` +
          `⏰ රාහු කාලය: ${resolveLocalizedText(panchanga.rahuKalaya, 'si')}\n` +
          `🧭 සුබ දිශාව: ${resolveLocalizedText(panchanga.subaDishawa, 'si')} | මරු: ${resolveLocalizedText(panchanga.maruDishawa, 'si')}\n\n` +
          `🌟 දවසේ විශේෂ සටහන:\n${resolveLocalizedText(generalNotes, 'si').slice(0, 250)}...\n\n` +
          `👉 කියවන්න: https://astrotharaka.com/daily-horoscope\n\n` +
          `#AstroTaraka #DailyHoroscope #LagnaPalapala #Astrology`;

    return {
      date: dateStr,
      dateDisplay,
      panchanga,
      generalNotes,
      lagnaPredictions,
      socialPost,
    };
  }

  private generateFallback(
    dateStr: string,
    dateDisplay: MultilingualField,
    defaultPanchanga: PanchangaData,
    reason: string,
  ): { payload: DailyHoroscopePayload; aiProvider: string; aiModel: string } {
    return {
      payload: this.normalizePayload(dateStr, dateDisplay, defaultPanchanga, {}),
      aiProvider: 'fallback',
      aiModel: `local-fallback:${reason}`,
    };
  }
}

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
      process.env.GEMINI_MODEL?.trim(),
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash',
    ].filter((m): m is string => Boolean(m));

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

    const lagnaPredictions: LagnaPrediction[] = LAGNA_DEFINITIONS.map((def) => {
      const l = lagnaMap.get(def.code);
      return {
        code: def.code,
        nameSi: def.nameSi,
        nameEn: def.nameEn,
        nameTa: def.nameTa,
        symbol: def.symbol,
        summary: ensureMultilingual(l?.summary, {
          si: `${def.nameSi} ලග්න හිමියන්ට අද දිනය සුබදායක ප්‍රවණතා ගෙනදෙයි.`,
          en: `Favorable astrological trends bring optimism and new prospects for ${def.nameEn}.`,
          ta: `${def.nameTa} ராசிக்காரர்களுக்கு இன்றைய நாள் சாதகமான மற்றும் சுப பலன்களைத் தரும்.`,
        }),
        career: ensureMultilingual(l?.career, {
          si: 'රැකියා ස්ථානයේ සුහදතාව සහ ඉවසීම ප්‍රයෝජනවත් වේ.',
          en: 'Patience and team collaboration in the workplace yield positive results.',
          ta: 'தொழில் மற்றும் பணியிடத்தில் அமைதியும் நல்லுறவும் நன்மைகளைத் தரும்.',
        }),
        wealth: ensureMultilingual(l?.wealth, {
          si: 'අනවශ්‍ය වියදම් පාලනය කරගැනීමෙන් මූල්‍ය ස්ථාවරත්වය පවත්වා ගත හැක.',
          en: 'Prudent budgeting and avoiding impulsive spending ensure financial stability.',
          ta: 'தேவையற்ற செலவுகளைக் கட்டுப்படுத்துவது நிதி ஸ்திரத்தன்மையை ஏற்படுத்தும்.',
        }),
        love: ensureMultilingual(l?.love, {
          si: 'පවුලේ සාමාජිකයන් සමඟ සුහදශීලීව කාලය ගත කරන්න.',
          en: 'Spend quality, supportive time with family and close loved ones.',
          ta: 'குடும்ப உறுப்பினர்களுடன் அன்பாகவும் ஆதரவாகவும் நேரத்தை செலவிடுங்கள்.',
        }),
        health: ensureMultilingual(l?.health, {
          si: 'සිරුරේ උෂ්ණාධික බව පාලනයට ප්‍රමාණවත් තරම් ජලය පානය කරන්න.',
          en: 'Stay well-hydrated, maintain a balanced diet, and rest adequately.',
          ta: 'போதுமான அளவு தண்ணீர் குடித்து உடல் ஆரோக்கியத்தை சீராகப் பேணுங்கள்.',
        }),
        luckyNumber: String(l?.luckyNumber || '7'),
        luckyColor: ensureMultilingual(l?.luckyColor, {
          si: 'කහ පැහැය',
          en: 'Yellow',
          ta: 'மஞ்சள்',
        }),
        luckyDirection: ensureMultilingual(l?.luckyDirection, {
          si: 'උතුර',
          en: 'North',
          ta: 'வடக்கு',
        }),
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

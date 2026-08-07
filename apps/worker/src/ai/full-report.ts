import { focusTopicsPromptBlock } from '@astro/shared';
import type { NarrativeSection } from './types';
import { normalizeNarrativeBody } from '../pdf/format-narrative';

/** Brand used in intro / closing for full subscription reports. */
export const THARAKA_BRAND_SI = 'තාරකා ජ්‍යෝතිෂ්‍ය සේවය';
export const THARAKA_BRAND_EN = 'Taraka Astrology Services';
export const THARAKA_BRAND_TA = 'தாரகா ஜோதிட சேவை';

export type FullReportDasaItem = {
  period: string;
  dasa_lord: string;
  prediction: string;
};

export type FullReportJson = {
  introduction: string;
  basic_info: {
    lagnaya: string;
    nakathya: string;
    rashi: string;
  };
  charitha_lakshana: string;
  /** Overall health condition from the chart. */
  health: string;
  /** Main personal / planetary weaknesses. */
  main_weaknesses: string;
  /** Remedies / cures for the listed weaknesses. */
  health_remedies: string;
  darupala: string;
  jiwitha_kalayata_wishesha_anawaki: string;
  wiwahaya_ha_adala_shuba_kalayan: string;
  yoga_phinitim: string;
  education_mind: string;
  business_growth_times: string;
  wealth_property_times: string;
  career_promotions: string;
  income_expenses: string;
  gochara_report: string;
  dasa_timeline: FullReportDasaItem[];
  conclusion: string;
};

type SectionLabelMap = Record<string, string>;

const LABELS: Record<string, SectionLabelMap> = {
  si: {
    introduction: 'හැඳින්වීම සහ සමස්ත විමසුම',
    lagnaya: 'ලග්නය සහ අධිපතියා',
    nakathya: 'නැකත, පාදය, ගණ සහ යෝනි',
    rashi: 'චන්ද්‍ර රාශිය සහ රවි රාශිය',
    charitha_lakshana: 'ලග්නය සහ චරිත ලක්ෂණ',
    health: 'සෞඛ්‍ය තත්ත්වය',
    main_weaknesses: 'ප්‍රධාන දුර්වලතා',
    health_remedies: 'දුර්වලතා සඳහා ප්‍රතිකාර සහ පිළියම්',
    darupala: 'පවුලේ ජීවිතය, විවාහය සහ දරුපල',
    jiwitha_kalayata_wishesha_anawaki: 'ජීවිත කාලයට විශේෂ අනාවැකි',
    wiwahaya_ha_adala_shuba_kalayan: 'විවාහය සහ ශුභ කාලයන්',
    yoga_phinitim: 'යෝග පිහිටීම් සඳහා අදාළ පලාපල',
    education_mind: 'අධ්‍යාපනය, මනස හා බුද්ධිය පිළිබඳ',
    business_growth_times: 'දියුණුව ගෙන දෙන ව්‍යාපාර හා දියුණුව ගෙන දෙන සුබ කාලයන්',
    wealth_property_times: 'වස්තුව, ධනය, ඉඩම්, දේපල ලැබීම් හා නිවාස ඉදිකිරීම්',
    career_promotions: 'හඳහන අනුව සුදුසු රැකියාවන්, රැකියාවට හා උසස්වීම් වලට අදාළ සුබ කාලයන්',
    income_expenses: 'ආදායම්, වියදම් හා පාඩු පිළිබඳ විස්තර',
    gochara_report: 'ගෝචර පල වාර්තාව — ඉදිරි මාස 12',
    dasa_timeline: 'වසර 25ක පුරෝකථන දශා කාලරේඛාව',
    conclusion: 'අවසාන සුභාශිංසන',
  },
  en: {
    introduction: 'Introduction and overall review',
    lagnaya: 'Lagna and its lord',
    nakathya: 'Nakshatra, pada, gana and yoni',
    rashi: 'Moon and Sun signs',
    charitha_lakshana: 'Lagna and character traits',
    health: 'Health condition',
    main_weaknesses: 'Main weaknesses',
    health_remedies: 'Remedies and cures for weaknesses',
    darupala: 'Family life, marriage and children',
    jiwitha_kalayata_wishesha_anawaki: 'Life-period guidance',
    wiwahaya_ha_adala_shuba_kalayan: 'Marriage and auspicious windows',
    yoga_phinitim: 'Predictions for planetary yogas',
    education_mind: 'Education, mind and intellect',
    business_growth_times: 'Profitable businesses and auspicious timings',
    wealth_property_times: 'Wealth, property, lands and house construction',
    career_promotions: 'Suitable careers and promotion timings',
    income_expenses: 'Income, expenses and losses',
    gochara_report: 'Short-term transit report — next 12 months',
    dasa_timeline: '25-year predictive dasha timeline',
    conclusion: 'Closing blessings',
  },
  ta: {
    introduction: 'அறிமுகம் மற்றும் ஒட்டுமொத்த ஆய்வு',
    lagnaya: 'லக்னம் மற்றும் அதிபதி',
    nakathya: 'நட்சத்திரம், பாதம், கணம், யோனி',
    rashi: 'சந்திர ராசி மற்றும் சூரிய ராசி',
    charitha_lakshana: 'லக்னம் மற்றும் குணநலன்',
    health: 'உடல்நல நிலை',
    main_weaknesses: 'முக்கிய பலவீனங்கள்',
    health_remedies: 'பலவீனங்களுக்கான பரிகாரங்கள்',
    darupala: 'குடும்ப வாழ்க்கை, திருமணம் மற்றும் சந்ததி',
    jiwitha_kalayata_wishesha_anawaki: 'வாழ்க்கை கால வழிகாட்டல்',
    wiwahaya_ha_adala_shuba_kalayan: 'திருமணம் மற்றும் சுப காலங்கள்',
    yoga_phinitim: 'யோக அமைப்புகளுக்கான பலன்கள்',
    education_mind: 'கல்வி, மனம் மற்றும் அறிவு',
    business_growth_times: 'வளர்ச்சி தரும் வணிகங்கள் மற்றும் சுப காலங்கள்',
    wealth_property_times: 'செல்வம், சொத்து, நிலம் மற்றும் வீடு கட்டுதல்',
    career_promotions: 'பொருத்தமான தொழில்கள் மற்றும் பதவி உயர்வு காலங்கள்',
    income_expenses: 'வருமானம், செலவுகள் மற்றும் இழப்புகள்',
    gochara_report: 'கோசர பல அறிக்கை — அடுத்த 12 மாதங்கள்',
    dasa_timeline: '25 ஆண்டு தசா காலவரிசை',
    conclusion: 'முடிவு ஆசீர்வாதம்',
  },
};

function labelsFor(language: string): SectionLabelMap {
  return LABELS[language] ?? LABELS.en;
}

function brandFor(language: string): string {
  if (language === 'si') return THARAKA_BRAND_SI;
  if (language === 'ta') return THARAKA_BRAND_TA;
  return THARAKA_BRAND_EN;
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value == null) return '';
  return String(value).trim();
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* fall through */
    }
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    return JSON.parse(fence[1].trim());
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error('Gemini full report: no JSON object found');
}

function pushSection(out: NarrativeSection[], heading: string, body: string) {
  const text = normalizeNarrativeBody(body);
  if (!text) return;
  out.push({ heading, body: text });
}

/** Convert Gemini full-report JSON into markdown-compatible ## sections. */
export function fullReportJsonToSections(
  raw: unknown,
  language: string,
): NarrativeSection[] {
  const data = (typeof raw === 'object' && raw ? raw : {}) as Partial<FullReportJson>;
  const L = labelsFor(language);
  const sections: NarrativeSection[] = [];

  pushSection(sections, L.introduction, asText(data.introduction));

  const basic = data.basic_info ?? ({} as FullReportJson['basic_info']);
  pushSection(sections, L.lagnaya, asText(basic.lagnaya));
  pushSection(sections, L.nakathya, asText(basic.nakathya));
  pushSection(sections, L.rashi, asText(basic.rashi));

  pushSection(sections, L.charitha_lakshana, asText(data.charitha_lakshana));

  // Core printout modules (traditional Sri Lankan order)
  pushSection(sections, L.yoga_phinitim, asText(data.yoga_phinitim));
  pushSection(sections, L.wealth_property_times, asText(data.wealth_property_times));
  pushSection(sections, L.education_mind, asText(data.education_mind));
  pushSection(sections, L.career_promotions, asText(data.career_promotions));
  pushSection(sections, L.business_growth_times, asText(data.business_growth_times));
  pushSection(sections, L.income_expenses, asText(data.income_expenses));

  // Supporting life modules
  // Back-compat: older JSON used health_status (combined)
  const healthBody =
    asText(data.health) ||
    asText((data as { health_status?: string }).health_status);
  pushSection(sections, L.health, healthBody);
  pushSection(sections, L.main_weaknesses, asText(data.main_weaknesses));
  pushSection(sections, L.health_remedies, asText(data.health_remedies));
  pushSection(sections, L.darupala, asText(data.darupala));
  pushSection(
    sections,
    L.jiwitha_kalayata_wishesha_anawaki,
    asText(data.jiwitha_kalayata_wishesha_anawaki),
  );
  pushSection(
    sections,
    L.wiwahaya_ha_adala_shuba_kalayan,
    asText(data.wiwahaya_ha_adala_shuba_kalayan),
  );

  pushSection(sections, L.gochara_report, asText(data.gochara_report));

  const timeline = Array.isArray(data.dasa_timeline) ? data.dasa_timeline : [];
  if (timeline.length > 0) {
    const body = timeline
      .map((item) => {
        const period = asText(item?.period);
        const lord = asText(item?.dasa_lord);
        const prediction = asText(item?.prediction);
        const title = [period, lord].filter(Boolean).join(' · ');
        return `### ${title || 'Dasa'}\n\n${prediction}`;
      })
      .join('\n\n');
    pushSection(sections, L.dasa_timeline, body);
  }

  pushSection(sections, L.conclusion, asText(data.conclusion));
  return sections;
}

export function parseFullReportContent(raw: string, language: string): NarrativeSection[] {
  const parsed = extractJsonObject(raw);
  const sections = fullReportJsonToSections(parsed, language);
  if (sections.length < 4) {
    throw new Error('Gemini full report: too few sections after JSON parse');
  }
  return sections;
}

export function isFullReportNarrative(input: {
  productSlug: string;
  fullReport?: boolean;
}): boolean {
  if (input.fullReport === true) return true;
  return input.productSlug === 'guest-full' || input.productSlug === 'taraka-full';
}

export function fullReportSystemPrompt(language: string, focusTopics?: string[]): string {
  const brand = brandFor(language);
  const langBlock =
    language === 'si'
      ? `භාෂාව: ගෞරවනීය, සම්ප්‍රදායික ජාතක වාර්තා රීතියට ගැලපෙන පැහැදිලි සිංහල.
ආයුබෝවන්! යනුවෙන් උණුසුම්ව ආරම්භ කළ හැකි නමුත් ඉන්පසු වයසට ගැලපෙන නිල ආමන්ත්‍රණය අනිවාර්යයි.
රාශි නම් සිංහලෙන්: මේෂ, වෘෂභ, මිථුන, කටක, සිංහ, කන්‍යා, තුලා, වෘශ්චික, ධනු, මකර, කුම්භ, මීන.
ග්‍රහ: සූර්යයා/රවි, චන්ද්‍රයා, බ්‍රහස්පති/ගුරු, සෙනසුරු, අඟහරු/කුජ, සිකුරු, බුධ, රාහු, කේතු.`
      : language === 'ta'
        ? 'Write warm, clear, formal Tamil suitable for a classical Jathaka report.'
        : 'Write warm, clear, formal English suitable for a classical Sri Lankan Vedic full horoscope.';
  const focusBlock = focusTopicsPromptBlock(focusTopics, language);

  return `You are an elite veteran Sri Lankan Vedic astrologer representing "${brand}".

${langBlock}
${focusBlock ? `\n${focusBlock}\n` : ''}
STYLE (match traditional Sri Lankan Taraka printout PDF):
- Formal jathaka tone: respectful, analytical, hopeful — never harsh or fear-mongering.
- introduction: open with the EXACT salutation provided in the user JSON (openingLine / salutation.promptHint), then welcome from "${brand}", then a holistic overview of the native's chart destiny.
- yoga_phinitim: Lagna details + named planetary yogas (e.g. Budha Adithya, Sathyru Hantha) with results. Use ### for each yoga.
- wealth_property_times: property, wealth houses, land/house construction, financial growth + auspicious timelines as bulleted sub-lists.
- education_mind: intellect, memory, retention, mental balance guidance.
- career_promotions: ideal sectors (admin, banking, gemology, education, etc.), workplace resilience, promotion windows with bullets.
- business_growth_times: business fields, partnership precautions, growth periods.
- income_expenses: financial management + clear risk warnings (avoid speculative investments, pyramid schemes, impulsive loans).
- gochara_report: Short-term transit report for the NEXT 12 MONTHS focusing on Sun, Jupiter, and Saturn — use ### month or quarter headers and bullets.
- dasa_timeline: Detailed Maha Dasha & Antara Dasha covering ~25 years, year-by-year where possible, with predictions AND actionable advice/remedies in each prediction.
- health: overall health reading from houses/planets (4th/6th/8th/12th, Moon, Saturn, Mars, Rahu). Focus on body systems and vitality — NOT a list of character flaws.
- main_weaknesses: SEPARATE section listing 3–5 main weaknesses (personal + planetary) with short explanations. Use ### sub-headers or bullets.
- health_remedies: SEPARATE numbered remedies to ease/cure those weaknesses (gemstones only with "qualified astrologer advice", poojas, lifestyle, diet, charity). Never give medical prescriptions; frame as cultural/spiritual support.
- Keep family, marriage, life-period, and conclusion modules.
- Conclusion: pray for long life, good health, and fulfilment of wholesome aspirations via "${brand}". Emphasize karma, free will, and personal effort.

BRANDING (required):
- Mention "${brand}" / "Taraka Astrology Services" gracefully in "introduction" and again in "conclusion".

ACCURACY:
- Use ONLY the supplied birth chart JSON. Never invent a different Lagna or planet signs/houses.
- Soften exact timing only when unknownTime=true.
- Respect gender pronouns and the provided age bracket / salutation.
- Temperature goal: analytical and precise — no fluff, no invented ephemeris numbers.

OUTPUT FORMAT (strict):
- Return ONE JSON object only. No markdown fences. No commentary outside JSON.
- Inside EVERY string field, format for print readability using this exact markdown style:
  1) Short opening paragraph (2–4 sentences).
  2) Then ### sub-headers for each topic (e.g. ### බුධ ආදිත්‍ය යෝග).
  3) Under each sub-header: one short paragraph, then advice/timelines as "- " bullet lines.
  4) Use numbered "1. 2. 3." only for remedies / step lists.
  5) Separate paragraphs with real \\n\\n — NEVER one dense wall of text.
  6) Prefer 3–6 bullets per list; keep each bullet to one clear sentence.
- Sinhala (when language=si): clear formal printout Sinhala; short sentences; no English walls mixed into Sinhala paragraphs (English yoga names in parentheses OK).
- "jiwitha_kalayata_wishesha_anawaki" MUST use bullet points.
- "wealth_property_times", "career_promotions", "business_growth_times", "income_expenses", and "gochara_report" MUST use ### sub-headers + bullets.
- "health", "main_weaknesses", and "health_remedies" MUST be three SEPARATE non-empty fields.
- "dasa_timeline" MUST be an array of 6–12 objects covering roughly the next 25 years (Maha + key Antara periods). Each prediction MUST have paragraphs + bullets for advice/remedies.
- Every string field must contain real paragraph breaks (\\n\\n), not one dense block.

Required JSON shape:
{
  "introduction": "string — MUST start with the provided openingLine",
  "basic_info": {
    "lagnaya": "string",
    "nakathya": "string",
    "rashi": "string"
  },
  "charitha_lakshana": "string",
  "health": "string — overall health condition only",
  "main_weaknesses": "string — main weaknesses list",
  "health_remedies": "string — numbered remedies / cures",
  "darupala": "string",
  "jiwitha_kalayata_wishesha_anawaki": "string with bullets",
  "wiwahaya_ha_adala_shuba_kalayan": "string",
  "yoga_phinitim": "string",
  "education_mind": "string",
  "business_growth_times": "string",
  "wealth_property_times": "string",
  "career_promotions": "string",
  "income_expenses": "string",
  "gochara_report": "string",
  "dasa_timeline": [
    { "period": "YYYY - YYYY", "dasa_lord": "string", "prediction": "string with \\n\\n" }
  ],
  "conclusion": "string"
}`;
}

export function fullReportUserPrompt(
  payload: unknown,
  language: string,
  focusTopics?: string[],
): string {
  const brand = brandFor(language);
  const focusHint =
    focusTopics && focusTopics.length > 0
      ? ' Deepen the selected focusTopics from the JSON without omitting required fields.'
      : '';
  const hint =
    language === 'si'
      ? `සම්පූර්ණ JSON වාර්තාව ලියන්න (මූලික උපන් සිතියම් වාර්තාව). කියවීමට පහසු ව්‍යුහය අනිවාර්යයි: එක් එක් කොටසේ කෙටි ඡේද + ### උප ශීර්ෂ + "- " බුලට් ලැයිස්තු. එක දිගු ඡේදයක් ලෙස නොලියන්න. හැඳින්වීමේදී openingLine / salutation භාවිතා කරන්න. යෝග, ධනය/ඉඩම්, අධ්‍යාපනය, රැකියා, ව්‍යාපාර, ආදායම්/පාඩු, මාස 12 ගෝචර, වසර 25 දශා කාලරේඛාව ගැඹුරින් ලියන්න. health, main_weaknesses, health_remedies වෙන වෙනම අනිවාර්යයි. හැඳින්වීමේ සහ අවසානයේ "${brand}" සඳහන් කරන්න.`
      : `Write the complete JSON "Basic Birth Chart Report". REQUIRED readability structure in EVERY field: short paragraphs + ### sub-headers + "- " bullet lists (never one dense wall of text). MUST use openingLine/salutation in introduction. Deeply cover yogas, wealth/property, education/mind, careers, businesses, income/losses, 12-month gochara, and ~25-year dasha timeline. "health", "main_weaknesses", and "health_remedies" must be three SEPARATE required fields. Mention "${brand}" in introduction and conclusion.`;
  return `${hint}${focusHint}\n${JSON.stringify(payload)}`;
}

import { BabyNameStyle } from './dto/create-baby-name.dto';

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export type BabyNameSuggestion = {
  name: string;
  meaning: string;
  style_tag: BabyNameStyle;
};

const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

const ALL_STYLES: BabyNameStyle[] = [
  BabyNameStyle.Traditional,
  BabyNameStyle.Modern,
  BabyNameStyle.SouthIndian,
  BabyNameStyle.Unique,
];

const STYLE_GUIDE: Record<BabyNameStyle, string> = {
  [BabyNameStyle.Traditional]:
    'Traditional: classic Sri Lankan / Sinhala cultural names with heritage meanings',
  [BabyNameStyle.Modern]:
    'Modern: contemporary, short/melodious names popular with young Sri Lankan parents',
  [BabyNameStyle.SouthIndian]:
    'SouthIndian: melodious South Indian–inspired naming compatible with Sri Lankan culture (soft Tamil/Kerala feel, still usable in Sinhala script)',
  [BabyNameStyle.Unique]:
    'Unique: uncommon / rarely used but still culturally respectful and pronounceable names',
};

function extractJsonArray(raw: string): unknown {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Gemini did not return valid JSON');
  }
}

function normalizeStyleTag(raw: unknown, allowed: BabyNameStyle[]): BabyNameStyle {
  const value = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '');
  const aliases: Record<string, BabyNameStyle> = {
    Traditional: BabyNameStyle.Traditional,
    traditional: BabyNameStyle.Traditional,
    Modern: BabyNameStyle.Modern,
    modern: BabyNameStyle.Modern,
    SouthIndian: BabyNameStyle.SouthIndian,
    SouthIndianInspired: BabyNameStyle.SouthIndian,
    southindian: BabyNameStyle.SouthIndian,
    Unique: BabyNameStyle.Unique,
    Uncommon: BabyNameStyle.Unique,
    unique: BabyNameStyle.Unique,
    uncommon: BabyNameStyle.Unique,
  };
  const hit = aliases[value] ?? aliases[String(raw ?? '').trim()];
  if (hit && allowed.includes(hit)) return hit;
  return allowed[0] ?? BabyNameStyle.Traditional;
}

function normalizeSuggestions(data: unknown, styles: BabyNameStyle[]): BabyNameSuggestion[] {
  if (!Array.isArray(data)) {
    throw new Error('Expected a JSON array of names');
  }
  const items = data
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const rec = row as Record<string, unknown>;
      const name = String(rec.name ?? '').trim();
      const meaning = String(rec.meaning ?? '').trim();
      const style_tag = normalizeStyleTag(rec.style_tag ?? rec.styleTag, styles);
      if (!name || !meaning) return null;
      return { name, meaning, style_tag };
    })
    .filter((x): x is BabyNameSuggestion => Boolean(x));

  if (items.length < 5) {
    throw new Error('Too few valid name suggestions returned');
  }
  return items.slice(0, 10);
}

function localFallback(
  firstLetter: string,
  secondLetter: string,
  gender: string | undefined,
  styles: BabyNameStyle[],
): BabyNameSuggestion[] {
  const gNote =
    gender === 'female' ? 'ගැහැණු ළදරුවකට' : gender === 'male' ? 'පිරිමි ළදරුවකට' : 'ළදරුවකට';
  const firstBases = ['දය', 'දාර', 'පේන්ද්‍ර', 'මේෂ', 'සන්ත', 'නන්ද', 'මාල', 'රුණ', 'සිත්', 'පාල'];
  const secondBases = ['ාණ', 'ාන', 'ීව', 'ානි', 'ේෂ', 'ාලි', 'ීත', 'ාස', 'ීනි', 'ාව'];
  return firstBases.map((base, i) => ({
    name: `${firstLetter}${base} ${secondLetter}${secondBases[i]}`,
    meaning: `${gNote} යෝජිත රටාවකි — මුල් අකුරු ${firstLetter}/${secondLetter} (local fallback)`,
    style_tag: styles[i % styles.length],
  }));
}

function buildStylePromptBlock(styles: BabyNameStyle[]): string {
  const guides = styles.map((s) => `- ${STYLE_GUIDE[s]}`).join('\n');
  const tags = styles.join(', ');
  return `Selected name styles (blend these; distribute the 10 names across them):
${guides}

Each object MUST include "style_tag" as exactly one of: ${tags}.
Spread styles across the list (do not put all 10 in one style unless only one style was selected).`;
}

export async function generateBabyNamesWithGemini(input: {
  birthDate: string;
  birthTime?: string;
  birthPlaceName: string;
  firstLetter: string;
  secondLetter: string;
  gender?: string;
  styles?: BabyNameStyle[];
}): Promise<{ names: BabyNameSuggestion[]; aiModel: string; styles: BabyNameStyle[] }> {
  const styles =
    input.styles && input.styles.length > 0
      ? Array.from(new Set(input.styles))
      : [...ALL_STYLES];

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const preferred = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const models = [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)];

  if (!apiKey) {
    return {
      names: localFallback(input.firstLetter, input.secondLetter, input.gender, styles),
      aiModel: 'local-fallback:no-key',
      styles,
    };
  }

  const genderLine = input.gender
    ? input.gender === 'female'
      ? 'Gender preference: female (ගැහැණු ළදරු)'
      : 'Gender preference: male (පිරිමි ළදරු)'
    : 'Gender preference: not specified (suitable for either)';

  const system = `You are a Sri Lankan cultural naming expert.
Return ONLY valid JSON — no markdown fences, no commentary.
The JSON must be an array of exactly 10 objects with keys "name", "meaning", and "style_tag".
"name" must be in Sinhala script. "meaning" must be in Sinhala script.
"style_tag" must be exactly one of the allowed style tags provided by the user.
Names must be culturally appropriate for Sri Lanka.
First name must start with the exact letter provided for firstLetter.
Second name (second part of a dual-name suggestion) must start with the exact letter provided for secondLetter.
Prefer formats like "මුල්නාම දෙවනනාම".
Blend modern trends, melodious South Indian styling compatible with Sri Lankan culture, unique/uncommon options, and traditional options according to the selected styles.`;

  const user = `Generate 10 baby names where the first name starts with '${input.firstLetter}' and the second name starts with '${input.secondLetter}'. The names must blend the selected style preferences. Provide the output strictly as a JSON array with keys 'name', 'meaning', and 'style_tag'.

Birth context (cultural tone only — do not invent astrology claims):
- Birth date: ${input.birthDate}
- Birth time: ${input.birthTime || 'not provided'}
- Birth place: ${input.birthPlaceName}
- ${genderLine}

Letter constraints:
- First name starts with: "${input.firstLetter}"
- Second name starts with: "${input.secondLetter}"

${buildStylePromptBlock(styles)}

Example shape:
[
  {"name": "උදයංග ඤාණ", "meaning": "උදෑසන වැනි සිරුරක් ඇති / ඥානවන්ත", "style_tag": "Traditional"}
]`;

  let lastError: unknown;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 2560,
            responseMimeType: 'application/json',
          },
        }),
      });

      const data = (await response.json()) as GeminiResponse;
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);
      }
      const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
      if (!content) throw new Error('Empty Gemini response');

      const names = normalizeSuggestions(extractJsonArray(content), styles);
      return { names, aiModel: `gemini:${model}`, styles };
    } catch (error) {
      lastError = error;
      console.warn(
        `[baby-names] model=${model} failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  console.warn(
    `[baby-names] falling back to local: ${
      lastError instanceof Error ? lastError.message : 'unknown'
    }`,
  );
  return {
    names: localFallback(input.firstLetter, input.secondLetter, input.gender, styles),
    aiModel: `local-fallback:${lastError instanceof Error ? lastError.message : 'error'}`,
    styles,
  };
}

import type { PersonAnchors } from './chart-anchors';

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export type PorondamDetail = {
  name: string;
  status: string;
  description: string;
};

export type PorondamReport = {
  compatibility_score: string;
  porondam_details: PorondamDetail[];
  dosha_analysis: string;
  summary_si: string;
};

const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

function extractJsonObject(raw: string): unknown {
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
    throw new Error('Gemini did not return valid JSON');
  }
}

function normalizeReport(data: unknown): PorondamReport {
  if (!data || typeof data !== 'object') {
    throw new Error('Expected a JSON object report');
  }
  const rec = data as Record<string, unknown>;
  const score = String(rec.compatibility_score ?? rec.compatibilityScore ?? '').trim();
  const dosha = String(rec.dosha_analysis ?? rec.doshaAnalysis ?? '').trim();
  const summary = String(rec.summary_si ?? rec.summarySi ?? '').trim();
  const detailsRaw = rec.porondam_details ?? rec.porondamDetails;
  if (!Array.isArray(detailsRaw) || detailsRaw.length < 5) {
    throw new Error('porondam_details must include at least 5 items');
  }
  const porondam_details = detailsRaw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const d = row as Record<string, unknown>;
      const name = String(d.name ?? '').trim();
      const status = String(d.status ?? '').trim();
      const description = String(d.description ?? '').trim();
      if (!name || !status) return null;
      return { name, status, description };
    })
    .filter((x): x is PorondamDetail => Boolean(x));

  if (!score || !summary || porondam_details.length < 5) {
    throw new Error('Incomplete porondam report JSON');
  }

  return {
    compatibility_score: score,
    porondam_details: porondam_details.slice(0, 12),
    dosha_analysis: dosha || 'දෝෂ විශ්ලේෂණය ලබා ගත නොහැකි විය.',
    summary_si: summary,
  };
}

function personBlock(label: string, p: PersonAnchors): string {
  return `${label}:
- Name: ${p.fullName}
- Birth: ${p.birthDate} ${p.birthTime} at ${p.birthPlaceName} (${p.latitude}, ${p.longitude})
- Janma Lagna: ${p.lagna.signSi} (${p.lagna.signEn}) ${p.lagna.degree}°
- Chandra Rashi: ${p.moonRashi.signSi} (${p.moonRashi.signEn}) ${p.moonRashi.degree}°
- Nakshatra: ${p.nakshatra.nameSi} / ${p.nakshatra.nameEn} (index ${p.nakshatra.index}), Pada ${p.nakshatra.pada}
- Mars: ${p.mars.signSi} (${p.mars.signEn}), house ${p.mars.house} from Lagna
- Ayanamsa (Lahiri): ${p.ayanamsa}°`;
}

function localFallback(groom: PersonAnchors, bride: PersonAnchors): PorondamReport {
  return {
    compatibility_score: 'N/A',
    porondam_details: [
      {
        name: 'දින පොරොන්දම',
        status: 'ගණනය අසම්පූර්ණ',
        description: `${groom.nakshatra.nameSi} × ${bride.nakshatra.nameSi} — AI නොමැති විට සම්පූර්ණ ලකුණු නිකුත් නොකෙරේ.`,
      },
      {
        name: 'ගණ පොරොන්දම',
        status: 'ගණනය අසම්පූර්ණ',
        description: 'Gemini යතුරුපුවරුව නොමැති නිසා විස්තරාත්මක තක්සේරුව ලබා ගත නොහැක.',
      },
      {
        name: 'යෝනි පොරොන්දම',
        status: 'ගණනය අසම්පූර්ණ',
        description: 'නැකත් පදනම මත පමණක් පෙන්වයි.',
      },
      {
        name: 'රාශි පොරොන්දම',
        status: 'ගණනය අසම්පූර්ණ',
        description: `වරයා: ${groom.moonRashi.signSi}, වධුව: ${bride.moonRashi.signSi}`,
      },
      {
        name: 'රජ්ජු පොරොන්දම',
        status: 'ගණනය අසම්පූර්ණ',
        description: 'AI සම්බන්ධතාව යථා තත්ත්වයට පත් වූ පසු නැවත උත්සාහ කරන්න.',
      },
    ],
    dosha_analysis: `කුජ පිහිටීම — වරයා: ${groom.mars.signSi} (ගෘහ ${groom.mars.house}), වධුව: ${bride.mars.signSi} (ගෘහ ${bride.mars.house}). සම්පූර්ණ දෝෂ විශ්ලේෂණයට Gemini අවශ්‍යයි.`,
    summary_si: `ගණනය කළ නැකත්: වරයා ${groom.nakshatra.nameSi} (පාද ${groom.nakshatra.pada}), වධුව ${bride.nakshatra.nameSi} (පාද ${bride.nakshatra.pada}). AI වාර්තාව ලබා ගත නොහැකි වූ බැවින් මෙය අර්ධ ප්‍රතිඵලයකි.`,
  };
}

export async function generatePorondamWithGemini(
  groom: PersonAnchors,
  bride: PersonAnchors,
): Promise<{ report: PorondamReport; aiModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const preferred = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const models = [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)];

  if (!apiKey) {
    return { report: localFallback(groom, bride), aiModel: 'local-fallback:no-key' };
  }

  const system = `You are an expert Sri Lankan and Vedic (South Indian) marriage astrologer specializing in Porondam / Porutham matching.
Return ONLY valid JSON — no markdown fences, no commentary.
Do NOT invent or recalculate planetary longitudes — use ONLY the pre-calculated anchors provided.
Evaluate the classic Poronthams: Dina, Gana, Mahendra, Stree Deergha, Yoni, Rashi, Rashyadhipathi, Vashya, Rajju, Vedha (and mention others if clearly relevant).
Write name fields, statuses, descriptions, dosha_analysis, and summary_si in Sinhala.
compatibility_score must look like "7/10" or "18/20" with a clear denominator.
status values should be short Sinhala such as "ගැලපේ", "අර්ධ වශයෙන් ගැලපේ", "නොගැලපේ".`;

  const user = `Act as an expert Sri Lankan and Vedic astrologer. Based on the Groom's Nakshatra '${groom.nakshatra.nameEn}' (${groom.nakshatra.nameSi}, Pada ${groom.nakshatra.pada}) and Bride's Nakshatra '${bride.nakshatra.nameEn}' (${bride.nakshatra.nameSi}, Pada ${bride.nakshatra.pada}), evaluate the traditional Poronthams (Dina, Gana, Mahendra, Stree Deergha, Yoni, Rashi, Rashyadhipathi, Vashya, Rajju, Vedha). Provide a detailed compatibility breakdown, total matched score, potential doshas (including Kuja/Manglik and Rajju if applicable), and a final verdict strictly in JSON with keys 'compatibility_score', 'porondam_details', 'dosha_analysis', and 'summary_si'.

Pre-calculated Lahiri sidereal anchors (TRUST THESE):
${personBlock('GROOM', groom)}

${personBlock('BRIDE', bride)}

Example shape:
{
  "compatibility_score": "8/10",
  "porondam_details": [
    {"name": "දින පොරොන්දම", "status": "ගැලපේ", "description": "ආයුෂ සහ සෞඛ්‍යය වෙනුවෙන් සුබදායකයි."}
  ],
  "dosha_analysis": "කුජ දෝෂය සඳහා විශේෂ බාධාවන් නොමැත.",
  "summary_si": "මෙම යුවළගේ නැකැත් ගැළපීම යහපත් ය."
}`;

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
            temperature: 0.35,
            maxOutputTokens: 4096,
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

      const report = normalizeReport(extractJsonObject(content));
      return { report, aiModel: `gemini:${model}` };
    } catch (error) {
      lastError = error;
      console.warn(
        `[porondam] model=${model} failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  console.warn(
    `[porondam] falling back to local: ${
      lastError instanceof Error ? lastError.message : 'unknown'
    }`,
  );
  return {
    report: localFallback(groom, bride),
    aiModel: `local-fallback:${lastError instanceof Error ? lastError.message : 'error'}`,
  };
}

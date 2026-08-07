type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

export type DreamReport = {
  dream_summary: string;
  main_meaning: string;
  deep_analysis: string;
  category: string;
  actionable_advice: string;
  confidence_score: string;
};

const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];

const CATEGORY_POSITIVE = 'ධනාත්මක (Positive)';
const CATEGORY_PRECAUTION = 'සූදානම් විය යුතු (Precautionary)';
const CATEGORY_NEUTRAL = 'සාමාන්‍ය (Neutral)';

const SYSTEM_PROMPT = [
  'You are an expert cultural and psychological dream analyst specializing in traditional Sri Lankan and South Asian dream interpretations ("හීන පලාපල"), combined with modern symbolic understanding.',
  '',
  'Your objective is to provide highly accurate, culturally authentic, deeply trustworthy, and reassuring dream interpretations in clear, respectful Sinhala.',
  '',
  'Instructions:',
  '1. Language Support: The user may input their dream in Sinhala, English, Tamil, Singlish, or mixed scripts. Analyze the core message regardless of the input language, but ALWAYS generate the JSON response values in clear, grammatically correct Sinhala (සිංහල).',
  '2. Tone & Trust: Maintain an empathetic, calm, authentic, and culturally resonant tone. Avoid overly alarming predictions; frame negative traditional interpretations as "කරුණු පිළිබඳව සැලකිලිමත් වීම සුදුසුයි" (points to be mindful of) rather than definite bad events.',
  '3. Structure: You MUST strictly return your response in a valid JSON format only (no markdown wrapping, just pure raw JSON).',
  '',
  'JSON Output Schema Required:',
  '{',
  '  "dream_summary": "Short summary of the user\'s dream in Sinhala",',
  '  "main_meaning": "Primary meaning/interpretation of the dream in clear, trustworthy Sinhala",',
  '  "deep_analysis": "Detailed explanation covering traditional interpretations and symbolic meaning in Sinhala",',
  `  "category": "${CATEGORY_POSITIVE} / ${CATEGORY_PRECAUTION} / ${CATEGORY_NEUTRAL}",`,
  '  "actionable_advice": "A positive takeaway or mindful tip for the user\'s daily life in Sinhala",',
  '  "confidence_score": "95%"',
  '}',
].join('\n');

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

function normalizeCategory(raw: string): string {
  const s = raw.trim();
  if (!s) return CATEGORY_NEUTRAL;
  const lower = s.toLowerCase();
  if (lower.includes('positive') || s.includes('ධනාත්මක')) return CATEGORY_POSITIVE;
  if (lower.includes('precaution') || s.includes('සූදානම්')) return CATEGORY_PRECAUTION;
  if (lower.includes('neutral') || s.includes('සාමාන්‍ය')) return CATEGORY_NEUTRAL;
  return s;
}

function normalizeConfidence(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return '90%';
  if (/^\d{1,3}%$/.test(s)) return s;
  const n = Number.parseInt(s.replace(/%/g, ''), 10);
  if (Number.isFinite(n) && n >= 0 && n <= 100) return `${n}%`;
  return '90%';
}

function normalizeReport(data: unknown): DreamReport {
  if (!data || typeof data !== 'object') {
    throw new Error('Expected a JSON object report');
  }
  const rec = data as Record<string, unknown>;
  const dream_summary = String(rec.dream_summary ?? rec.dreamSummary ?? '').trim();
  const main_meaning = String(rec.main_meaning ?? rec.mainMeaning ?? '').trim();
  const deep_analysis = String(rec.deep_analysis ?? rec.deepAnalysis ?? '').trim();
  const category = normalizeCategory(String(rec.category ?? ''));
  const actionable_advice = String(
    rec.actionable_advice ?? rec.actionableAdvice ?? '',
  ).trim();
  const confidence_score = normalizeConfidence(
    String(rec.confidence_score ?? rec.confidenceScore ?? ''),
  );

  if (!dream_summary || !main_meaning || !deep_analysis || !actionable_advice) {
    throw new Error('Incomplete dream interpretation JSON');
  }

  return {
    dream_summary,
    main_meaning,
    deep_analysis,
    category,
    actionable_advice,
    confidence_score,
  };
}

function localFallback(dreamText: string): DreamReport {
  const snippet = dreamText.trim().slice(0, 80);
  const more = dreamText.length > 80 ? '…' : '';
  return {
    dream_summary: `Dream summary (offline): ${snippet}${more}`,
    main_meaning:
      'Full Heena Palapala interpretation needs Gemini. Dreams often reflect daily mood and inner symbols.',
    deep_analysis:
      'Traditional Sri Lankan dream lore depends on personal experience and cultural symbols. Configure GEMINI_API_KEY and retry.',
    category: CATEGORY_NEUTRAL,
    actionable_advice: 'Stay calm and take the day gently.',
    confidence_score: '50%',
  };
}

export async function generateDreamWithGemini(
  dreamText: string,
): Promise<{ report: DreamReport; aiModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const preferred = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const models = [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)];

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GEMINI_API_KEY is required for dream interpretation in production');
    }
    return { report: localFallback(dreamText), aiModel: 'local-fallback:no-key' };
  }

  const user = [
    'Interpret the following dream. Return ONLY the required JSON object with keys',
    'dream_summary, main_meaning, deep_analysis, category, actionable_advice, confidence_score.',
    'All string values MUST be in Sinhala.',
    '',
    'User dream:',
    '"""',
    dreamText.trim(),
    '"""',
  ].join('\n');

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
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 3072,
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
        `[dream] model=${model} failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  console.warn(
    `[dream] falling back to local: ${
      lastError instanceof Error ? lastError.message : 'unknown'
    }`,
  );
  if (process.env.NODE_ENV === 'production') {
    throw lastError instanceof Error ? lastError : new Error('Gemini dream interpretation failed');
  }
  return {
    report: localFallback(dreamText),
    aiModel: `local-fallback:${lastError instanceof Error ? lastError.message : 'error'}`,
  };
}

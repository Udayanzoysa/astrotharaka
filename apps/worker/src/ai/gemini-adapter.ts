import { LocalNarrativeAdapter } from './local-narrative';
import { localizeChart } from './localize-chart';
import { isFullReportNarrative, parseFullReportContent } from './full-report';
import { buildNarrativePrompts, parseMarkdownSections } from './prompt';
import type { NarrativeAdapter, NarrativeInput, NarrativeResult } from './types';
import { sectionsToPlainText } from './types';

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

const GEMINI_MODEL_FALLBACKS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

export class GeminiAdapter implements NarrativeAdapter {
  readonly modelName: string;
  private readonly apiKey: string;
  private readonly models: string[];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    const preferred = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest';
    this.models = [preferred, ...GEMINI_MODEL_FALLBACKS.filter((m) => m !== preferred)];
    this.modelName = `gemini:${preferred}`;
  }

  async generate(input: NarrativeInput): Promise<NarrativeResult> {
    const local = new LocalNarrativeAdapter();
    const lang = String(input.language);
    const localized: NarrativeInput = {
      ...input,
      chart: localizeChart(input.chart, lang),
    };

    let lastError: unknown;
    for (const model of this.models) {
      try {
        return await this.generateWithModel(localized, model);
      } catch (error) {
        lastError = error;
        console.warn(
          `[gemini-adapter] model=${model} failed: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }
    }

    console.warn(
      `[gemini-adapter] falling back to local: ${
        lastError instanceof Error ? lastError.message : 'unknown'
      }`,
    );
    const fallback = await local.generate(localized);
    return { ...fallback, aiModel: `${this.modelName}+local-fallback` };
  }

  private async generateWithModel(input: NarrativeInput, model: string): Promise<NarrativeResult> {
    const { system, user, maxOutputTokens, jsonMode, temperature } = buildNarrativePrompts(input);
    const full = isFullReportNarrative(input);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const generationConfig: Record<string, unknown> = {
      temperature,
      maxOutputTokens,
    };
    if (jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig,
      }),
    });

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
    if (!content) {
      throw new Error('Empty Gemini response');
    }

    const title = `${input.productName} — ${input.fullName}`;
    const sections = full
      ? parseFullReportContent(content, String(input.language))
      : parseMarkdownSections(content, title);

    return {
      title,
      sections,
      plainText: sectionsToPlainText(title, sections),
      aiModel: `gemini:${model}`,
    };
  }
}

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
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { message?: string };
};

const GEMINI_MODEL_FALLBACKS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export class GeminiAdapter implements NarrativeAdapter {
  readonly modelName: string;
  private readonly apiKey: string;
  private readonly models: string[];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    const preferred = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-lite-latest';
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

    const thinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? 512);

    const buildPayload = (includeThinking: boolean) => {
      const generationConfig: Record<string, unknown> = {
        temperature,
        maxOutputTokens,
      };
      if (jsonMode) {
        generationConfig.responseMimeType = 'application/json';
      }
      if (includeThinking && thinkingBudget > 0) {
        generationConfig.thinkingConfig = { thinkingBudget };
      }
      return {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig,
      };
    };

    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(true)),
    });

    let data = (await response.json()) as GeminiResponse;

    // If model rejects thinkingConfig (HTTP 400), retry once without thinkingConfig
    if (!response.ok && response.status === 400 && thinkingBudget > 0) {
      console.warn(`[gemini-adapter] model=${model} rejected thinkingConfig, retrying without it...`);
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      });
      data = (await response.json()) as GeminiResponse;
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);
    }

    const candidate = data.candidates?.[0];
    if (candidate?.finishReason === 'MAX_TOKENS') {
      console.warn(
        `[gemini-adapter] WARNING: model=${model} hit MAX_TOKENS (${maxOutputTokens}). Output may be truncated.`,
      );
    }
    if (data.usageMetadata?.thoughtsTokenCount) {
      console.log(
        `[gemini-adapter] model=${model} thinking tokens: ${data.usageMetadata.thoughtsTokenCount}, candidate tokens: ${data.usageMetadata.candidatesTokenCount}`,
      );
    }

    const content = candidate?.content?.parts?.map((p) => p.text ?? '').join('').trim();
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

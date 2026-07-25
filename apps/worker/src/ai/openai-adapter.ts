import { LocalNarrativeAdapter } from './local-narrative';
import { localizeChart } from './localize-chart';
import { isFullReportNarrative, parseFullReportContent } from './full-report';
import { buildNarrativePrompts, parseMarkdownSections } from './prompt';
import type { NarrativeAdapter, NarrativeInput, NarrativeResult } from './types';
import { sectionsToPlainText } from './types';

type OpenAiMessage = { role: string; content: string };

export class OpenAiAdapter implements NarrativeAdapter {
  readonly modelName: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    this.modelName = `openai:${this.model}`;
  }

  async generate(input: NarrativeInput): Promise<NarrativeResult> {
    const local = new LocalNarrativeAdapter();
    const lang = String(input.language);
    const localized: NarrativeInput = {
      ...input,
      chart: localizeChart(input.chart, lang),
    };
    try {
      const { system, user, maxOutputTokens, jsonMode, temperature } =
        buildNarrativePrompts(localized);
      const full = isFullReportNarrative(localized);

      const body: Record<string, unknown> = {
        model: this.model,
        temperature,
        max_tokens: Math.min(maxOutputTokens, 12000),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ] satisfies OpenAiMessage[],
      };
      if (jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty OpenAI response');
      }

      const title = `${localized.productName} — ${localized.fullName}`;
      const sections = full
        ? parseFullReportContent(content, lang)
        : parseMarkdownSections(content, title);
      return {
        title,
        sections,
        plainText: sectionsToPlainText(title, sections),
        aiModel: this.modelName,
      };
    } catch (error) {
      console.warn(
        `[openai-adapter] falling back to local: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
      const fallback = await local.generate(localized);
      return { ...fallback, aiModel: `${this.modelName}+local-fallback` };
    }
  }
}

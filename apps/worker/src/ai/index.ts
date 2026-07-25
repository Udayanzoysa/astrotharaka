import { GeminiAdapter } from './gemini-adapter';
import { LocalNarrativeAdapter } from './local-narrative';
import { OpenAiAdapter } from './openai-adapter';
import type { NarrativeAdapter } from './types';

export type NarrativeProvider = 'auto' | 'openai' | 'gemini' | 'local';

function isProduction(): boolean {
  return (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

function resolveProvider(): NarrativeProvider {
  const raw = (process.env.NARRATIVE_PROVIDER ?? 'auto').toLowerCase().trim();
  if (raw === 'openai' || raw === 'gemini' || raw === 'local' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

function requireLiveAi(reason: string): never {
  throw new Error(
    `[narrative] ${reason}. Set GEMINI_API_KEY or OPENAI_API_KEY (and NARRATIVE_PROVIDER) for go-live.`,
  );
}

export function createNarrativeAdapter(): NarrativeAdapter {
  const provider = resolveProvider();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const prod = isProduction();

  if (provider === 'local') {
    if (prod) requireLiveAi('NARRATIVE_PROVIDER=local is not allowed in production');
    return new LocalNarrativeAdapter();
  }
  if (provider === 'openai') {
    if (!openaiKey) {
      if (prod) requireLiveAi('OPENAI_API_KEY missing');
      console.warn('[narrative] OPENAI_API_KEY missing; using local (non-production only)');
      return new LocalNarrativeAdapter();
    }
    return new OpenAiAdapter(openaiKey);
  }
  if (provider === 'gemini') {
    if (!geminiKey) {
      if (prod) requireLiveAi('GEMINI_API_KEY missing');
      console.warn('[narrative] GEMINI_API_KEY missing; using local (non-production only)');
      return new LocalNarrativeAdapter();
    }
    return new GeminiAdapter(geminiKey);
  }

  // auto: prefer Gemini, then OpenAI, then local (local only outside production)
  if (geminiKey) return new GeminiAdapter(geminiKey);
  if (openaiKey) return new OpenAiAdapter(openaiKey);
  if (prod) requireLiveAi('No AI API keys configured');
  return new LocalNarrativeAdapter();
}

export type { NarrativeAdapter, NarrativeInput, NarrativeResult, NarrativeSection } from './types';

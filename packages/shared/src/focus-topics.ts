/**
 * Optional report focus topics for guest free preview + full PDF personalization.
 * Empty selection = default standard report (unchanged behavior).
 */

export const FOCUS_TOPIC_IDS = [
  'marriage',
  'education',
  'children',
  'next_10_years',
  'health',
  'wealth',
  'remedies',
] as const;

export type FocusTopicId = (typeof FOCUS_TOPIC_IDS)[number];

export const FOCUS_TOPIC_MAX = 4;

export type FocusTopicLabels = Record<FocusTopicId, string>;

/** English labels (also used in AI prompt instructions). */
export const FOCUS_TOPIC_LABELS_EN: FocusTopicLabels = {
  marriage: 'Marriage / relationships — delays, timing, and remedies',
  education: 'Education and career path',
  children: 'Children / progeny',
  next_10_years: 'What will happen in the next 10 years',
  health: 'Health and well-being',
  wealth: 'Wealth, property, and finances',
  remedies: 'Life struggles, remedies, and cures',
};

export const FOCUS_TOPIC_LABELS_SI: FocusTopicLabels = {
  marriage: 'Marriage / relationships — delays, timing, and remedies',
  education: 'Education and career path',
  children: 'Children / progeny',
  next_10_years: 'What will happen in the next 10 years',
  health: 'Health and well-being',
  wealth: 'Wealth, property, and finances',
  remedies: 'Life struggles, remedies, and cures',
};

export const FOCUS_TOPIC_LABELS_TA: FocusTopicLabels = {
  marriage: 'Marriage / relationships — delays, timing, and remedies',
  education: 'Education and career path',
  children: 'Children / progeny',
  next_10_years: 'What will happen in the next 10 years',
  health: 'Health and well-being',
  wealth: 'Wealth, property, and finances',
  remedies: 'Life struggles, remedies, and cures',
};

// Locale display strings filled via web i18n; shared package keeps EN for AI prompts.
export function focusTopicLabels(_language: string): FocusTopicLabels {
  return FOCUS_TOPIC_LABELS_EN;
}

export function isFocusTopicId(value: string): value is FocusTopicId {
  return (FOCUS_TOPIC_IDS as readonly string[]).includes(value);
}

/** Normalize client input: keep only allowlisted IDs, unique, max FOCUS_TOPIC_MAX. */
export function normalizeFocusTopics(raw: unknown): FocusTopicId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<FocusTopicId>();
  const out: FocusTopicId[] = [];
  for (const item of raw) {
    const id = String(item ?? '').trim();
    if (!isFocusTopicId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= FOCUS_TOPIC_MAX) break;
  }
  return out;
}

/** Human-readable lines for AI prompts. */
export function focusTopicsForPrompt(
  topics: string[] | null | undefined,
  _language = 'en',
): string[] {
  const normalized = normalizeFocusTopics(topics ?? []);
  if (normalized.length === 0) return [];
  return normalized.map((id) => FOCUS_TOPIC_LABELS_EN[id]);
}

/** Short instruction block injected into system/user prompts when topics are set. */
export function focusTopicsPromptBlock(
  topics: string[] | null | undefined,
  language = 'en',
): string {
  const lines = focusTopicsForPrompt(topics, language);
  if (lines.length === 0) return '';
  const list = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
  return `FOCUS TOPICS (user selected — deepen these without dropping required sections/headings):
${list}
- Give richer, more specific guidance on the selected topics.
- Keep the required report structure and all mandatory headings.
- If a topic maps to an existing section, expand that section; otherwise weave insights into the closest related section.`;
}

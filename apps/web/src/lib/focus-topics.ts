/** Mirrors @astro/shared focus-topic allowlist for the web app. */

export const FOCUS_TOPIC_IDS = [
  "marriage",
  "education",
  "children",
  "next_10_years",
  "health",
  "wealth",
  "remedies",
] as const;

export type FocusTopicId = (typeof FOCUS_TOPIC_IDS)[number];

export const FOCUS_TOPIC_MAX = 4;

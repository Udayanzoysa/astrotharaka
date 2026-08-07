import type { ChartResult } from '../chart/types';

export type NarrativeSection = {
  heading: string;
  body: string;
};

export type NarrativeResult = {
  title: string;
  sections: NarrativeSection[];
  plainText: string;
  aiModel: string;
};

export type NarrativeInput = {
  language: 'en' | 'si' | 'ta' | string;
  productSlug: string;
  productName: string;
  fullName: string;
  gender?: string | null;
  email?: string | null;
  mobile?: string | null;
  birthPlace: string;
  birthDate: string;
  unknownBirthTime: boolean;
  orderNumber: string;
  /** When true, generate the full Tharaka JSON subscription report (not guest teaser). */
  fullReport?: boolean;
  /** Optional user-selected focus topics (allowlisted IDs). Empty = default report. */
  focusTopics?: string[];
  chart: ChartResult;
};

export interface NarrativeAdapter {
  readonly modelName: string;
  generate(input: NarrativeInput): Promise<NarrativeResult>;
}

export function sectionsToPlainText(title: string, sections: NarrativeSection[]): string {
  return [title, '', ...sections.flatMap((s) => [`## ${s.heading}`, s.body, ''])]
    .join('\n')
    .trim();
}

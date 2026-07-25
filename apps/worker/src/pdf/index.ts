import type { ChartResult } from '../chart/types';
import type { NarrativeSection } from '../ai/types';
import { renderReportPdf as renderPdfKit } from '../pdf-report';
import { pdfEnginePreference, renderReportPdfChromium } from './chromium-pdf';

export type ReportPdfInput = {
  outputPath: string;
  title: string;
  orderNumber: string;
  fullName: string;
  birthPlace: string;
  birthDate: string;
  language: string;
  unknownBirthTime: boolean;
  gender?: string | null;
  chart: ChartResult;
  sections: NarrativeSection[];
};

export async function renderReportPdfSmart(input: ReportPdfInput): Promise<{ engine: string }> {
  const pref = pdfEnginePreference();

  if (pref === 'pdfkit') {
    await renderPdfKit(input);
    return { engine: 'pdfkit' };
  }

  try {
    await renderReportPdfChromium(input);
    return { engine: 'chromium' };
  } catch (error) {
    if (pref === 'chromium') {
      throw error;
    }
    console.warn(
      `[pdf] chromium failed, falling back to PDFKit: ${
        error instanceof Error ? error.message : 'unknown'
      }`,
    );
    await renderPdfKit(input);
    return { engine: 'pdfkit-fallback' };
  }
}

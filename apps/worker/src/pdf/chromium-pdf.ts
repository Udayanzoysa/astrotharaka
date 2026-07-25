import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { chromium, type Browser } from 'playwright';
import type { HtmlReportInput } from './html-template';
import { buildReportHtml } from './html-template';

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    return sharedBrowser;
  }
  sharedBrowser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
  return sharedBrowser;
}

export async function closeChromiumBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
  }
}

export async function renderReportPdfChromium(
  input: HtmlReportInput & { outputPath: string },
): Promise<void> {
  mkdirSync(dirname(input.outputPath), { recursive: true });
  const html = buildReportHtml(input);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: input.outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '12mm', bottom: '14mm', left: '12mm' },
    });
  } finally {
    await page.close();
  }
}

export function pdfEnginePreference(): 'auto' | 'chromium' | 'pdfkit' {
  const raw = (process.env.PDF_ENGINE ?? 'auto').toLowerCase();
  if (raw === 'chromium' || raw === 'pdfkit' || raw === 'auto') return raw;
  return 'auto';
}

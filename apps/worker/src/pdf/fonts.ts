import { existsSync, statSync } from 'fs';
import { join } from 'path';
import type PDFKit from 'pdfkit';

export type PdfFontPair = {
  regular: string;
  bold: string;
  /** Path used for logging / Chromium @font-face */
  sourcePath: string;
  /** PostScript name inside a .ttc collection, if any */
  collectionRegular?: string;
  collectionBold?: string;
};

function bundledFontDir(): string {
  return join(__dirname, '..', '..', 'assets', 'fonts');
}

/** Reject tiny/corrupt stubs left by failed downloads. */
function isUsableFontFile(path: string): boolean {
  if (!existsSync(path)) return false;
  try {
    return statSync(path).size > 10_000;
  } catch {
    return false;
  }
}

/**
 * Resolve a Unicode font that can render Sinhala / Tamil.
 * PDFKit's default Helvetica cannot — that is why PDFs showed mojibake.
 */
export function resolveUnicodePdfFont(): PdfFontPair | null {
  const envPath = process.env.PDF_FONT_PATH?.trim();
  if (envPath && isUsableFontFile(envPath)) {
    const boldEnv = process.env.PDF_FONT_BOLD_PATH?.trim();
    return {
      regular: envPath,
      bold: boldEnv && isUsableFontFile(boldEnv) ? boldEnv : envPath,
      sourcePath: envPath,
    };
  }

  const dir = bundledFontDir();
  const bundledRegular = join(dir, 'NotoSansSinhala-Regular.ttf');
  const bundledBold = join(dir, 'NotoSansSinhala-Bold.ttf');
  if (isUsableFontFile(bundledRegular)) {
    return {
      regular: bundledRegular,
      bold: isUsableFontFile(bundledBold) ? bundledBold : bundledRegular,
      sourcePath: bundledRegular,
    };
  }

  const winNirmala = 'C:\\Windows\\Fonts\\Nirmala.ttc';
  if (isUsableFontFile(winNirmala)) {
    return {
      regular: winNirmala,
      bold: winNirmala,
      sourcePath: winNirmala,
      collectionRegular: 'NirmalaUI',
      collectionBold: 'NirmalaUI-Bold',
    };
  }

  const linuxCandidates = [
    '/usr/share/fonts/truetype/noto/NotoSansSinhala-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansSinhala-Regular.otf',
    '/usr/share/fonts/truetype/NotoSansSinhala-Regular.ttf',
  ];
  for (const regular of linuxCandidates) {
    if (!isUsableFontFile(regular)) continue;
    const bold = regular.replace('-Regular.', '-Bold.');
    return {
      regular,
      bold: isUsableFontFile(bold) ? bold : regular,
      sourcePath: regular,
    };
  }

  return null;
}

const FONT_BODY = 'TarakaUnicode';
const FONT_BOLD = 'TarakaUnicode-Bold';

/** Register and switch the document to a Sinhala/Tamil-capable font. */
export function applyUnicodeFont(doc: PDFKit.PDFDocument): boolean {
  const fonts = resolveUnicodePdfFont();
  if (!fonts) {
    console.warn(
      '[pdf] No Unicode font found (set PDF_FONT_PATH or install Nirmala UI / Noto Sans Sinhala). Sinhala text will garble.',
    );
    return false;
  }

  try {
    if (fonts.collectionRegular) {
      doc.registerFont(FONT_BODY, fonts.regular, fonts.collectionRegular);
      doc.registerFont(
        FONT_BOLD,
        fonts.bold,
        fonts.collectionBold || fonts.collectionRegular,
      );
    } else {
      doc.registerFont(FONT_BODY, fonts.regular);
      doc.registerFont(FONT_BOLD, fonts.bold);
    }
    doc.font(FONT_BODY);
    console.log(`[pdf] unicode font=${fonts.sourcePath}`);
    return true;
  } catch (error) {
    console.warn(
      `[pdf] Failed to register Unicode font ${fonts.sourcePath}: ${
        error instanceof Error ? error.message : 'unknown'
      }`,
    );
    return false;
  }
}

export function pdfBodyFont(): string {
  return FONT_BODY;
}

export function pdfBoldFont(): string {
  return FONT_BOLD;
}

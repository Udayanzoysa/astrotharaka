import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import PDFDocument from 'pdfkit';
import type { ChartResult } from './chart/types';
import type { NarrativeSection } from './ai/types';
import { drawKundaliPdf } from './kundali/kundali-pdf';
import { applyUnicodeFont, pdfBodyFont, pdfBoldFont } from './pdf/fonts';
import { parseNarrativeBlocks } from './pdf/format-narrative';

function plainInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');
}

function writeStructuredSection(
  doc: PDFKit.PDFDocument,
  bodyText: string,
  body: () => PDFKit.PDFDocument,
  bold: () => PDFKit.PDFDocument,
) {
  const blocks = parseNarrativeBlocks(bodyText);
  for (const block of blocks) {
    if (doc.y > 720) doc.addPage();
    switch (block.type) {
      case 'h3':
        doc.moveDown(0.35);
        bold().fillColor('#7a1f2b').fontSize(11).text(plainInline(block.text), { width: 495 });
        doc.moveDown(0.15);
        break;
      case 'h4':
        doc.moveDown(0.25);
        bold().fillColor('#1a365d').fontSize(10.5).text(plainInline(block.text), { width: 495 });
        doc.moveDown(0.1);
        break;
      case 'p':
        body()
          .fillColor('#2c2c2c')
          .fontSize(10)
          .text(plainInline(block.text), { align: 'left', lineGap: 3, width: 495 });
        doc.moveDown(0.25);
        break;
      case 'ul':
        for (const item of block.items) {
          if (doc.y > 730) doc.addPage();
          body()
            .fillColor('#2c2c2c')
            .fontSize(10)
            .text(`•  ${plainInline(item)}`, {
              align: 'left',
              lineGap: 2,
              width: 480,
              indent: 12,
            });
        }
        doc.moveDown(0.2);
        break;
      case 'ol':
        block.items.forEach((item, i) => {
          if (doc.y > 730) doc.addPage();
          body()
            .fillColor('#2c2c2c')
            .fontSize(10)
            .text(`${i + 1}.  ${plainInline(item)}`, {
              align: 'left',
              lineGap: 2,
              width: 480,
              indent: 12,
            });
        });
        doc.moveDown(0.2);
        break;
      default:
        break;
    }
  }
}

export async function renderReportPdf(input: {
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
}): Promise<void> {
  mkdirSync(dirname(input.outputPath), { recursive: true });

  await new Promise<void>((resolvePromise, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    const stream = createWriteStream(input.outputPath);
    doc.pipe(stream);

    const hasUnicode = applyUnicodeFont(doc);
    const body = () => doc.font(hasUnicode ? pdfBodyFont() : 'Helvetica');
    const bold = () => doc.font(hasUnicode ? pdfBoldFont() : 'Helvetica-Bold');

    bold().fillColor('#1a365d').fontSize(11).text('TARAKA ASTROLOGY SERVICES', { align: 'left' });
    body().fontSize(16).fillColor('#7a1f2b').text('තාරකා ජ්‍යෝතිෂ්‍ය සේවය');
    body()
      .moveDown(0.3)
      .fontSize(10)
      .fillColor('#5c6570')
      .text('Navigating a destiny through the air mass.');

    doc.moveDown(0.8);
    bold()
      .fillColor('#1a365d')
      .fontSize(16)
      .text(
        input.language === 'si' ? 'මූලික උපන් සිතියම් වාර්තාව' : 'Basic Birth Chart Report',
        { width: 480 },
      );
    doc.moveDown(0.5);
    body().fontSize(11).fillColor('#333333');
    doc.text(`Order: ${input.orderNumber}`);
    doc.text(`Name: ${input.fullName}`);
    doc.text(`Birth: ${input.birthDate} · ${input.birthPlace}`);
    doc.text(`Language: ${input.language}`);
    if (input.chart.placeholder) {
      doc.moveDown(0.3);
      body()
        .fontSize(9)
        .fillColor('#8a6d3b')
        .text('Chart engine: stub fallback (Swiss Ephemeris unavailable in this runtime).');
    } else {
      doc.moveDown(0.3);
      body()
        .fontSize(9)
        .fillColor('#2f5d3a')
        .text('Chart engine: Swiss Ephemeris (Lahiri sidereal).');
    }

    if (input.unknownBirthTime) {
      doc.moveDown(0.6);
      body()
        .fontSize(9)
        .fillColor('#8a6d3b')
        .text(
          'Accuracy notice: birth time is approximate or unknown; house and timing details may be reduced.',
          { width: 495 },
        );
    }

    doc.moveDown(0.8);
    bold().fillColor('#0B0F19').fontSize(13).text('Rasi Kundali', { underline: true });
    doc.moveDown(0.4);
    const kundaliY = doc.y;
    drawKundaliPdf(doc, input.chart, 50, kundaliY, 280);
    doc.y = kundaliY + 300;

    if (doc.y > 680) doc.addPage();
    bold().fillColor('#0B0F19').fontSize(13).text('Chart summary', { underline: true });
    doc.moveDown(0.4);
    body().fontSize(10).fillColor('#222222');
    doc.text(
      `Lagna: ${input.chart.lagna.sign} · ${input.chart.lagna.degree.toFixed(1)}° (${input.chart.lagna.houseSystem})`,
    );
    doc.moveDown(0.3);
    for (const planet of input.chart.planets.slice(0, 9)) {
      const retro = planet.retrograde ? ' R' : '';
      body().text(
        `${planet.name.padEnd(8)} ${planet.sign.padEnd(12)} H${planet.house}  ${planet.degree.toFixed(1)}°${retro}`,
      );
    }
    if (!input.chart.placeholder && input.chart.system) {
      doc.moveDown(0.3);
      body()
        .fontSize(9)
        .fillColor('#666666')
        .text(
          `System: ${input.chart.system}${
            input.chart.ayanamsa != null ? ` · Ayanamsa ${String(input.chart.ayanamsa)}` : ''
          }`,
        );
    }

    for (const section of input.sections) {
      doc.moveDown(0.9);
      if (doc.y > 700) doc.addPage();
      bold().fillColor('#1a365d').fontSize(12).text(section.heading, { width: 495 });
      doc
        .moveTo(50, doc.y + 2)
        .lineTo(545, doc.y + 2)
        .strokeColor('#c4b39a')
        .lineWidth(0.6)
        .stroke();
      doc.moveDown(0.45);
      writeStructuredSection(doc, section.body, body, bold);
    }

    doc.moveDown(1.4);
    if (doc.y > 720) doc.addPage();
    body()
      .fontSize(10)
      .fillColor('#7a1f2b')
      .text(
        input.language === 'si'
          ? 'තාරකා ජ්‍යෝතිෂ්‍ය සේවය වෙනුවෙන් ඔබට දීර්ඝායුෂ, නිරෝගී සුවය සහ සියලු යහපත් ප්‍රාර්ථනා සාර්ථක වේවා!'
          : 'With blessings from Taraka Astrology Services — may you enjoy long life, good health, and fulfilment of wholesome aspirations.',
        { width: 495 },
      );
    doc.moveDown(0.5);
    body()
      .fontSize(8)
      .fillColor('#5c6570')
      .text(
        'Disclaimer: Astrology guidance for cultural, spiritual, and entertainment purposes. Karma, free will, and personal effort shape outcomes. Reports do not guarantee results and are not medical, legal, or financial advice.',
        { align: 'left', width: 495 },
      );

    doc.end();
    stream.on('finish', () => resolvePromise());
    stream.on('error', reject);
  });
}

export function reportsDir(): string {
  const raw = process.env.REPORTS_DIR?.trim() || join(process.cwd(), 'uploads', 'reports');
  // Always absolute so API can open the same path regardless of cwd
  return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
}

export function reportPdfPath(orderNumber: string, version: number): string {
  return resolve(reportsDir(), `${orderNumber}-v${version}.pdf`);
}

export function guestReportPdfPath(guestReportId: string): string {
  return resolve(reportsDir(), `guest-${guestReportId}.pdf`);
}

export function pdfExists(path: string): boolean {
  return existsSync(path);
}

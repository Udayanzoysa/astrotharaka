import type PDFKit from 'pdfkit';
import type { ChartResult } from '../chart/types';
import { PLANET_ABBR, kundaliHouseCells, planetsByHouse, signForHouse } from './kundali-svg';

/**
 * Draw a South-Indian rasi kundali into the PDF.
 */
export function drawKundaliPdf(
  doc: PDFKit.PDFDocument,
  chart: ChartResult,
  originX: number,
  originY: number,
  size = 280,
): void {
  const cell = size / 4;
  const byHouse = planetsByHouse(chart.planets);
  const lagnaSign = chart.lagna.sign;

  doc.save();
  doc.rect(originX, originY, size, size).lineWidth(1.2).strokeColor('#D4AF37').stroke();

  for (const { house, col, row } of kundaliHouseCells()) {
    const x = originX + col * cell;
    const y = originY + row * cell;
    const bodies = byHouse.get(house) ?? [];
    const abbr = bodies
      .map((p) => `${PLANET_ABBR[p.name] ?? p.name.slice(0, 2)}${p.retrograde ? 'r' : ''}`)
      .join(' ');
    const sign = signForHouse(lagnaSign, house).slice(0, 3);

    doc.lineWidth(house === 1 ? 1.8 : 0.8).strokeColor('#D4AF37');
    doc.rect(x, y, cell, cell).stroke();
    doc.fillColor('#8a7350').fontSize(7).text(`${house}${house === 1 ? 'L' : ''}`, x + 3, y + 3, {
      width: cell - 6,
    });
    doc.fillColor('#0B0F19').fontSize(9).text(sign, x, y + cell / 2 - 8, {
      width: cell,
      align: 'center',
    });
    if (abbr) {
      doc.fillColor('#1a4d8c').fontSize(7).text(abbr, x + 2, y + cell / 2 + 6, {
        width: cell - 4,
        align: 'center',
      });
    }
  }

  // Center badge
  doc
    .fillColor('#0B0F19')
    .fontSize(9)
    .text('Taraka', originX + cell, originY + cell + cell / 2 - 10, {
      width: cell * 2,
      align: 'center',
    });
  doc
    .fillColor('#666666')
    .fontSize(8)
    .text('Rasi Kundali', originX + cell, originY + cell + cell / 2 + 4, {
      width: cell * 2,
      align: 'center',
    });

  doc.restore();
}

/** @deprecated alias */
export const drawNorthIndianKundaliPdf = drawKundaliPdf;

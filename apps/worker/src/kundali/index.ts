import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { ChartResult } from '../chart/types';
import { reportsDir } from '../pdf-report';
import { renderKundaliSvg } from './kundali-svg';

export function reportKundaliSvgPath(orderNumber: string, version: number): string {
  return join(reportsDir(), `${orderNumber}-v${version}-kundali.svg`);
}

export function writeKundaliSvg(input: {
  orderNumber: string;
  version: number;
  chart: ChartResult;
  fullName: string;
}): string {
  const path = reportKundaliSvgPath(input.orderNumber, input.version);
  mkdirSync(dirname(path), { recursive: true });
  const svg = renderKundaliSvg(input.chart, `Kundali — ${input.fullName}`);
  writeFileSync(path, svg, 'utf8');
  return path;
}

export { renderKundaliSvg } from './kundali-svg';
export { drawKundaliPdf } from './kundali-pdf';

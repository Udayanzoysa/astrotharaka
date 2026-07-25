import type { ChartPlanet, ChartResult } from '../chart/types';

const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const ZODIAC = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

/**
 * South-Indian fixed grid: each cell is a rasi house number (1=Lagna).
 * Coordinates are cell top-left in a 4×4 layout (outer ring used).
 */
const HOUSE_CELLS: Record<number, { col: number; row: number }> = {
  1: { col: 1, row: 0 },
  2: { col: 2, row: 0 },
  3: { col: 3, row: 0 },
  4: { col: 3, row: 1 },
  5: { col: 3, row: 2 },
  6: { col: 3, row: 3 },
  7: { col: 2, row: 3 },
  8: { col: 1, row: 3 },
  9: { col: 0, row: 3 },
  10: { col: 0, row: 2 },
  11: { col: 0, row: 1 },
  12: { col: 0, row: 0 },
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function planetsByHouse(planets: ChartPlanet[]): Map<number, ChartPlanet[]> {
  const map = new Map<number, ChartPlanet[]>();
  for (let h = 1; h <= 12; h += 1) map.set(h, []);
  for (const p of planets) {
    const house = Math.min(12, Math.max(1, p.house || 1));
    map.get(house)!.push(p);
  }
  return map;
}

function lagnaSignIndex(sign: string): number {
  const idx = ZODIAC.findIndex((z) => z.toLowerCase() === sign.toLowerCase());
  return idx >= 0 ? idx : 0;
}

function signForHouse(lagnaSign: string, house: number): string {
  const start = lagnaSignIndex(lagnaSign);
  return ZODIAC[(start + house - 1) % 12];
}

export function renderKundaliSvg(chart: ChartResult, title?: string): string {
  const size = 400;
  const cell = size / 4;
  const byHouse = planetsByHouse(chart.planets);
  const lagnaSign = chart.lagna.sign;

  const cells = Object.entries(HOUSE_CELLS)
    .map(([num, pos]) => {
      const house = Number(num);
      const x = pos.col * cell;
      const y = pos.row * cell;
      const sign = signForHouse(lagnaSign, house);
      const bodies = byHouse.get(house) ?? [];
      const abbr = bodies
        .map((p) => `${PLANET_ABBR[p.name] ?? p.name.slice(0, 2)}${p.retrograde ? 'r' : ''}`)
        .join(' ');
      const highlight = house === 1 ? 'stroke="#D4AF37" stroke-width="2.5"' : 'stroke="#c4b59a" stroke-width="1"';
      return `
      <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#FBF8F1" ${highlight}/>
      <text x="${x + 8}" y="${y + 16}" font-size="11" fill="#8a7350">${house}${house === 1 ? ' Lagna' : ''}</text>
      <text x="${x + cell / 2}" y="${y + cell / 2 - 2}" text-anchor="middle" font-size="13" font-weight="600" fill="#0B0F19">${escapeXml(
        sign.slice(0, 3),
      )}</text>
      <text x="${x + cell / 2}" y="${y + cell / 2 + 16}" text-anchor="middle" font-size="12" fill="#1a4d8c">${escapeXml(
        abbr,
      )}</text>`;
    })
    .join('\n');

  // Center empty square label
  const center = `
    <rect x="${cell}" y="${cell}" width="${cell * 2}" height="${cell * 2}" fill="#0B0F19" fill-opacity="0.04" stroke="#D4AF37" stroke-width="1.5"/>
    <text x="${size / 2}" y="${size / 2 - 6}" text-anchor="middle" font-size="14" fill="#0B0F19">Taraka</text>
    <text x="${size / 2}" y="${size / 2 + 14}" text-anchor="middle" font-size="11" fill="#666666">Rasi Kundali</text>
  `;

  const heading = title ?? 'Kundali (South Indian)';
  const subtitle = chart.placeholder
    ? 'Stub chart'
    : `${chart.system ?? 'sidereal'} · Lagna ${lagnaSign}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="440" viewBox="0 0 400 440" role="img" aria-label="${escapeXml(
    heading,
  )}">
  <rect width="400" height="440" fill="#F7F3EA"/>
  <text x="200" y="24" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#0B0F19">${escapeXml(
    heading,
  )}</text>
  <text x="200" y="42" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#666666">${escapeXml(
    subtitle,
  )}</text>
  <g transform="translate(0,30)">
    ${cells}
    ${center}
  </g>
</svg>`;
}

/** @deprecated alias */
export const renderNorthIndianKundaliSvg = renderKundaliSvg;

export function kundaliHouseCells(): Array<{
  house: number;
  col: number;
  row: number;
}> {
  return Object.entries(HOUSE_CELLS).map(([house, pos]) => ({
    house: Number(house),
    col: pos.col,
    row: pos.row,
  }));
}

export { PLANET_ABBR, planetsByHouse, signForHouse };

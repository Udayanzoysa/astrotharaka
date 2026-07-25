import type { ChartPlanet, ChartResult } from '../chart/types';

const SIGN_SI: Record<string, string> = {
  Aries: '\u0db8\u0dda\u0dc2',
  Taurus: '\u0dc0\u0dd8\u0dc2\u0db7',
  Gemini: '\u0db8\u0dd2\u0dae\u0dd4\u0db1',
  Cancer: '\u0d9a\u0da7\u0d9a',
  Leo: '\u0dc3\u0dd2\u0d82\u0dc4',
  Virgo: '\u0d9a\u0db1\u0dca\u200d\u0dba\u0dcf',
  Libra: '\u0dad\u0dd4\u0dbd\u0dcf',
  Scorpio: '\u0dc0\u0dd8\u0dc1\u0dca\u0da0\u0dd2\u0d9a',
  Sagittarius: '\u0db0\u0db1\u0dd4',
  Capricorn: '\u0db8\u0d9a\u0dbb',
  Aquarius: '\u0d9a\u0dd4\u0db8\u0dca\u0db7',
  Pisces: '\u0db8\u0dd3\u0db1',
};

const PLANET_SI: Record<string, string> = {
  Sun: '\u0dc3\u0dd6\u0dbb\u0dca\u0dba\u0dba\u0dcf',
  Moon: '\u0da0\u0db1\u0dca\u0daf\u0dca\u200d\u0dbb\u0dba\u0dcf',
  Mars: '\u0d9a\u0dd4\u0da2',
  Mercury: '\u0db6\u0dd4\u0db0',
  Jupiter: '\u0db6\u0dca\u200d\u0dbb\u0dc4\u0dc3\u0dca\u0db4\u0dad\u0dd2',
  Venus: '\u0dc1\u0dd4\u0d9a\u0dca\u200d\u0dbb',
  Saturn: '\u0dc3\u0dd9\u0db1\u0dc3\u0dd4\u0dbb\u0dd4',
  Rahu: '\u0dbb\u0dcf\u0dc4\u0dd4',
  Ketu: '\u0d9a\u0dda\u0dad\u0dd4',
};

const THEME_SI: Record<string, string> = {
  'Self & identity': '\u0dad\u0db8\u0dcf \u0dc3\u0dc4 \u0d85\u0db1\u0db1\u0dca\u200d\u0dba\u0dad\u0dcf\u0dc0',
  'Resources & values': '\u0dc3\u0db8\u0dca\u0db4\u0dad\u0dca \u0dc3\u0dc4 \u0dc0\u0da7\u0dd2\u0db1\u0dcf\u0d9a\u0db8\u0dca',
  Communication: '\u0dc3\u0db1\u0dca\u0db1\u0dd2\u0dc0\u0dda\u0daf\u0db1\u0dba',
  'Home & roots': '\u0db1\u0dd2\u0dc0\u0dc3 \u0dc3\u0dc4 \u0db8\u0dd4\u0dbd\u0dca',
  'Creativity & joy': '\u0db1\u0dd2\u0dbb\u0dca\u0db8\u0dcf\u0dab\u0dc1\u0dd3\u0dbd\u0dd3\u0dad\u0dca\u0dc0\u0dba \u0dc3\u0dc4 \u0dc3\u0dad\u0dd4\u0da7',
  'Work & health': '\u0dc0\u0dd0\u0da9 \u0dc3\u0dc4 \u0dc3\u0ddc\u0d9b\u0dca\u200d\u0dba\u0dba',
  Partnerships: '\u0dc4\u0dc0\u0dd4\u0dbd\u0dca\u0d9a\u0dcf\u0dbb\u0d9a\u0db8\u0dca',
  Transformation: '\u0db4\u0dbb\u0dd2\u0dc0\u0dbb\u0dca\u0dad\u0db1\u0dba',
  'Beliefs & travel': '\u0dc0\u0dd2\u0dc1\u0dca\u0dc0\u0dcf\u0dc3 \u0dc3\u0dc4 \u0d9c\u0db8\u0db1\u0dca',
  'Career & status': '\u0dbb\u0dd0\u0d9a\u0dd2\u0dba\u0dcf\u0dc0 \u0dc3\u0dc4 \u0dad\u0dad\u0dca\u0dad\u0dca\u0dc0\u0dba',
  'Community & hopes': '\u0dc3\u0db8\u0dcf\u0da2\u0dba \u0dc3\u0dc4 \u0db6\u0dbd\u0dcf\u0db4\u0ddc\u0dbb\u0ddc\u0dad\u0dca\u0dad\u0dd4',
  'Rest & release': '\u0dc0\u0dd2\u0dc0\u0dda\u0d9a\u0dba \u0dc3\u0dc4 \u0db8\u0dd4\u0daf\u0dcf\u0dc4\u0dd0\u0dbb\u0dd3\u0db8',
  'Steady growth through aligned effort':
    '\u0d89\u0dc0\u0dc3\u0dd3\u0db8\u0dd9\u0db1\u0dca \u0d8b\u0dad\u0dca\u0dc3\u0dcf\u0dc4 \u0d9a\u0dd3\u0dbd\u0ddc\u0dad\u0dca \u0dc3\u0dca\u0dae\u0dd2\u0dbb \u0daf\u0dd2\u0dba\u0dd4\u0dab\u0dd4\u0dc0\u0d9a\u0dca \u0dbd\u0dd0\u0db6\u0dd9\u0db1\u0dc0\u0dcf',
  'Communication sharpens career timing':
    '\u0dc4\u0ddc\u0da9\u0dd2\u0db1\u0dca \u0d9a\u0dad\u0dcf \u0d9a\u0dbb\u0dbd\u0dcf \u0dc0\u0dd0\u0da9 \u0d9a\u0dbb\u0db1\u0d9a\u0ddc\u0da7 \u0dbb\u0dd0\u0d9a\u0dd2\u0dba\u0dcf\u0dc0\u0dda \u0d89\u0daf\u0dd2\u0dbb\u0dd2\u0dba\u0da7 \u0dba\u0db1\u0dca\u0db1 \u0db4\u0dd4\u0dc5\u0dd4\u0dc0\u0db1\u0dca',
  'Partnerships open unexpected doors':
    '\u0dc4\u0ddc\u0da9 \u0dc4\u0dc0\u0dd4\u0dbd\u0dca\u0d9a\u0dcf\u0dbb\u0d9a\u0db8\u0dca \u0dc0\u0dbd\u0dd2\u0db1\u0dca \u0d85\u0dbd\u0dd4\u0dad\u0dca \u0d85\u0dc0\u0dc3\u0dca\u0dae\u0dcf \u0d91\u0db1\u0dc0\u0dcf',
};

export function signToSi(sign: string): string {
  return SIGN_SI[sign] ?? sign;
}

export function planetToSi(name: string): string {
  return PLANET_SI[name] ?? name;
}

export function themeToSi(theme: string): string {
  return THEME_SI[theme] ?? theme;
}

export function localizeChart(chart: ChartResult, language: string): ChartResult {
  if (language !== 'si') return chart;

  const mapPlanet = (p: ChartPlanet): ChartPlanet => ({
    ...p,
    name: planetToSi(p.name),
    sign: signToSi(p.sign),
  });

  return {
    ...chart,
    language: 'si',
    lagna: {
      ...chart.lagna,
      sign: signToSi(chart.lagna.sign),
    },
    planets: chart.planets.map(mapPlanet),
    houses: chart.houses.map((h) => ({
      ...h,
      sign: signToSi(h.sign),
      theme: themeToSi(h.theme),
    })),
    themes: chart.themes.map(themeToSi),
    notes: chart.notes.map((n) => themeToSi(n)),
  };
}

export type MultilingualField = {
  si: string;
  en: string;
  ta: string;
};

export type PanchangaData = {
  rahuKalaya: string | MultilingualField;
  subaDishawa: string | MultilingualField;
  maruDishawa: string | MultilingualField;
  thithi?: string | MultilingualField;
  nakatha?: string | MultilingualField;
  subaMuhurtha?: string[];
};

export type LagnaCode =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type LagnaPrediction = {
  code: LagnaCode;
  nameSi: string;
  nameEn: string;
  nameTa: string;
  symbol: string;
  summary: string | MultilingualField;
  career: string | MultilingualField;
  wealth: string | MultilingualField;
  love: string | MultilingualField;
  health: string | MultilingualField;
  luckyNumber: string;
  luckyColor: string | MultilingualField;
  luckyDirection: string | MultilingualField;
};

export type DailyHoroscopePayload = {
  date: string; // YYYY-MM-DD
  dateDisplay: string | MultilingualField;
  panchanga: PanchangaData;
  generalNotes: string | MultilingualField;
  lagnaPredictions: LagnaPrediction[];
  socialPost?: string | MultilingualField;
};

export const LAGNA_DEFINITIONS: Array<{
  code: LagnaCode;
  nameSi: string;
  nameEn: string;
  nameTa: string;
  symbol: string;
}> = [
  { code: 'aries', nameSi: 'මේෂ', nameEn: 'Aries', nameTa: 'மேஷம்', symbol: '♈' },
  { code: 'taurus', nameSi: 'වෘෂභ', nameEn: 'Taurus', nameTa: 'ரிஷபம்', symbol: '♉' },
  { code: 'gemini', nameSi: 'මිථුන', nameEn: 'Gemini', nameTa: 'மிதுனம்', symbol: '♊' },
  { code: 'cancer', nameSi: 'කටක', nameEn: 'Cancer', nameTa: 'கடகம்', symbol: '♋' },
  { code: 'leo', nameSi: 'සිංහ', nameEn: 'Leo', nameTa: 'சிம்மம்', symbol: '♌' },
  { code: 'virgo', nameSi: 'කන්‍යා', nameEn: 'Virgo', nameTa: 'கன்னி', symbol: '♍' },
  { code: 'libra', nameSi: 'තුලා', nameEn: 'Libra', nameTa: 'துலாம்', symbol: '♎' },
  { code: 'scorpio', nameSi: 'වෘශ්චික', nameEn: 'Scorpio', nameTa: 'விருச்சிகம்', symbol: '♏' },
  { code: 'sagittarius', nameSi: 'ධනු', nameEn: 'Sagittarius', nameTa: 'தனுசு', symbol: '♐' },
  { code: 'capricorn', nameSi: 'මකර', nameEn: 'Capricorn', nameTa: 'மகரம்', symbol: '♑' },
  { code: 'aquarius', nameSi: 'කුම්භ', nameEn: 'Aquarius', nameTa: 'கும்பம்', symbol: '♒' },
  { code: 'pisces', nameSi: 'මීන', nameEn: 'Pisces', nameTa: 'மீனம்', symbol: '♓' },
];

export function resolveLocalizedText(
  value: string | MultilingualField | undefined | null,
  lang: 'si' | 'en' | 'ta' = 'si',
  fallback = '',
): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[lang] || value.si || value.en || value.ta || fallback;
}

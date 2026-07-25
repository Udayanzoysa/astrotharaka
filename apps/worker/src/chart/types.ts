export type ChartPlanet = {
  name: string;
  sign: string;
  degree: number;
  house: number;
  longitude?: number;
  retrograde?: boolean;
};

export type ChartHouse = {
  number: number;
  sign: string;
  theme: string;
  cuspLongitude?: number;
};

export type ChartResult = {
  engineVersion: string;
  placeholder: boolean;
  system?: string;
  ayanamsa?: number | string | null;
  birthProfileId?: string | null;
  language: string;
  lagna: {
    sign: string;
    degree: number;
    longitude?: number;
    houseSystem: string;
  };
  planets: ChartPlanet[];
  houses: ChartHouse[];
  themes: string[];
  notes: string[];
};

export const ZODIAC_SIGNS = [
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

export const HOUSE_THEMES = [
  'Self & identity',
  'Resources & values',
  'Communication',
  'Home & roots',
  'Creativity & joy',
  'Work & health',
  'Partnerships',
  'Transformation',
  'Beliefs & travel',
  'Career & status',
  'Community & hopes',
  'Rest & release',
] as const;

export const PLANET_NAMES = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
] as const;

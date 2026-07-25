import * as Astronomy from 'astronomy-engine';

const ZODIAC_EN = [
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

const ZODIAC_SI = [
  'මේෂ',
  'වෘෂභ',
  'මිථුන',
  'කටක',
  'සිංහ',
  'කන්‍යා',
  'තුලා',
  'වෘශ්චික',
  'ධනු',
  'මකර',
  'කුම්භ',
  'මීන',
] as const;

const NAKSHATRA_EN = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

const NAKSHATRA_SI = [
  'අස්විනී',
  'භරණී',
  'කෘත්තිකා',
  'රෝහිණී',
  'මෘගශිරස්',
  'ආර්ද්‍රා',
  'පුනර්වසු',
  'පුෂ්‍ය',
  'ආශ්ලේෂා',
  'මඛ',
  'පූර්ව ඵල්ගුණී',
  'උත්තර ඵල්ගුණී',
  'හස්ත',
  'චිත්‍රා',
  'ස්වාති',
  'විශාඛා',
  'අනුරාධා',
  'ජ්‍යේෂ්ඨා',
  'මූල',
  'පූර්වාෂාඪා',
  'උත්තරාෂාඪා',
  'ශ්‍රවණ',
  'ධනිෂ්ඨා',
  'ශතභිෂා',
  'පූර්ව භාද්‍රපදා',
  'උත්තර භාද්‍රපදා',
  'රේවතී',
] as const;

export type PersonAnchors = {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthPlaceName: string;
  latitude: number;
  longitude: number;
  ayanamsa: number;
  lagna: { signEn: string; signSi: string; degree: number; longitude: number };
  moonRashi: { signEn: string; signSi: string; degree: number; longitude: number };
  nakshatra: { nameEn: string; nameSi: string; index: number; pada: number; degreeInPada: number };
  mars: { signEn: string; signSi: string; house: number; longitude: number };
  engineVersion: string;
};

function norm360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function julianDayUt(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function lahiriAyanamsa(date: Date): number {
  const jd = julianDayUt(date);
  const t = (jd - 2451545.0) / 36525.0;
  return 23.852294 + 1.3969714274 * t;
}

function localBirthToUtc(birthDate: string, birthTime: string, timezone: string): Date {
  const timePart = birthTime.length === 5 ? `${birthTime}:00` : birthTime.slice(0, 8);
  const offsets: Record<string, string> = {
    'Asia/Colombo': '+05:30',
    'Asia/Kolkata': '+05:30',
    'Asia/Calcutta': '+05:30',
    UTC: '+00:00',
  };
  const offset = offsets[timezone] ?? '+05:30';
  const utc = new Date(`${birthDate}T${timePart}${offset}`);
  if (Number.isNaN(utc.getTime())) {
    throw new Error(`Invalid birth datetime: ${birthDate} ${timePart}`);
  }
  return utc;
}

function tropicalAscendant(date: Date, latitude: number, longitude: number): number {
  const time = Astronomy.MakeTime(date);
  const gastHours = Astronomy.SiderealTime(time);
  const ramc = norm360(gastHours * 15 + longitude);
  const eps = Astronomy.e_tilt(time).tobl * (Math.PI / 180);
  const lat = latitude * (Math.PI / 180);
  const ramcRad = ramc * (Math.PI / 180);
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
  return norm360((Math.atan2(y, x) * 180) / Math.PI);
}

function tropicalLongitude(body: Astronomy.Body, date: Date): number {
  if (body === Astronomy.Body.Sun) return Astronomy.SunPosition(date).elon;
  if (body === Astronomy.Body.Moon) return Astronomy.EclipticGeoMoon(date).lon;
  const geo = Astronomy.GeoVector(body, date, true);
  return Astronomy.Ecliptic(geo).elon;
}

function signFromLon(lon: number) {
  const longitude = norm360(lon);
  const idx = Math.floor(longitude / 30) % 12;
  return {
    signEn: ZODIAC_EN[idx],
    signSi: ZODIAC_SI[idx],
    degree: Math.round((longitude % 30) * 10000) / 10000,
    longitude: Math.round(longitude * 10000) / 10000,
    index: idx,
  };
}

function nakshatraFromMoonLon(moonLon: number) {
  const lon = norm360(moonLon);
  const span = 360 / 27; // 13°20'
  const index = Math.min(26, Math.floor(lon / span));
  const within = lon - index * span;
  const padaSpan = span / 4; // 3°20'
  const pada = Math.min(4, Math.floor(within / padaSpan) + 1);
  return {
    nameEn: NAKSHATRA_EN[index],
    nameSi: NAKSHATRA_SI[index],
    index: index + 1,
    pada,
    degreeInPada: Math.round((within % padaSpan) * 10000) / 10000,
  };
}

function wholeSignHouse(planetLon: number, ascLon: number): number {
  const p = Math.floor(norm360(planetLon) / 30);
  const a = Math.floor(norm360(ascLon) / 30);
  return ((p - a + 12) % 12) + 1;
}

export function computePersonAnchors(input: {
  fullName: string;
  birthDate: string;
  birthTime: string;
  birthPlaceName: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}): PersonAnchors {
  const tz = input.timezone ?? 'Asia/Colombo';
  const utc = localBirthToUtc(input.birthDate, input.birthTime, tz);
  const ayanamsa = lahiriAyanamsa(utc);
  const toSidereal = (tropicalLon: number) => norm360(tropicalLon - ayanamsa);

  const ascLon = toSidereal(tropicalAscendant(utc, input.latitude, input.longitude));
  const lagna = signFromLon(ascLon);

  const moonSid = toSidereal(tropicalLongitude(Astronomy.Body.Moon, utc));
  const moonRashi = signFromLon(moonSid);
  const nakshatra = nakshatraFromMoonLon(moonSid);

  const marsSid = toSidereal(tropicalLongitude(Astronomy.Body.Mars, utc));
  const marsSign = signFromLon(marsSid);

  return {
    fullName: input.fullName,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlaceName: input.birthPlaceName,
    latitude: input.latitude,
    longitude: input.longitude,
    ayanamsa: Math.round(ayanamsa * 10000) / 10000,
    lagna: {
      signEn: lagna.signEn,
      signSi: lagna.signSi,
      degree: lagna.degree,
      longitude: lagna.longitude,
    },
    moonRashi: {
      signEn: moonRashi.signEn,
      signSi: moonRashi.signSi,
      degree: moonRashi.degree,
      longitude: moonRashi.longitude,
    },
    nakshatra,
    mars: {
      signEn: marsSign.signEn,
      signSi: marsSign.signSi,
      house: wholeSignHouse(marsSid, ascLon),
      longitude: marsSign.longitude,
    },
    engineVersion: 'api-lahiri-astronomy-porondam-0.1.0',
  };
}

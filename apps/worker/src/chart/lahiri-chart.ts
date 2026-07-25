import * as Astronomy from 'astronomy-engine';
import type { ChartResult } from './types';
import { HOUSE_THEMES, ZODIAC_SIGNS } from './types';

const ENGINE_VERSION = 'worker-lahiri-astronomy-0.1.0';

function norm360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function signDegree(lon: number): { sign: string; degree: number; longitude: number } {
  const longitude = norm360(lon);
  const idx = Math.floor(longitude / 30) % 12;
  return {
    sign: ZODIAC_SIGNS[idx],
    degree: longitude % 30,
    longitude,
  };
}

function wholeSignHouse(planetLon: number, ascLon: number): number {
  const p = Math.floor(norm360(planetLon) / 30);
  const a = Math.floor(norm360(ascLon) / 30);
  return ((p - a + 12) % 12) + 1;
}

/** Julian Day (UT) from Date — matches astronomy-engine epoch usage. */
function julianDayUt(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa degrees.
 * Anchored to Swiss-Ephemeris-compatible value near J2000 (~23.85°).
 */
export function lahiriAyanamsa(date: Date): number {
  const jd = julianDayUt(date);
  const t = (jd - 2451545.0) / 36525.0;
  // Linear Lahiri approximation (good to ~arcminutes for modern dates)
  return 23.852294 + 1.3969714274 * t;
}

/**
 * Convert local civil birth clock to UTC Date.
 * Sri Lanka (Asia/Colombo) has no DST — fixed UTC+05:30.
 */
export function localBirthToUtc(
  birthDate: string,
  birthTime: string | null,
  timezone: string,
  unknownBirthTime: boolean,
): { utc: Date; usedNoon: boolean } {
  const timePart = unknownBirthTime || !birthTime ? '12:00:00' : birthTime.length === 5 ? `${birthTime}:00` : birthTime.slice(0, 8);
  const usedNoon = unknownBirthTime || !birthTime;

  const tz = timezone || 'Asia/Colombo';
  // Fixed offsets for our primary markets (no DST for these zones in practice for natal work)
  const offsets: Record<string, string> = {
    'Asia/Colombo': '+05:30',
    'Asia/Kolkata': '+05:30',
    'Asia/Calcutta': '+05:30',
    UTC: '+00:00',
  };
  const offset = offsets[tz] ?? '+05:30';
  const utc = new Date(`${birthDate}T${timePart}${offset}`);
  if (Number.isNaN(utc.getTime())) {
    throw new Error(`Invalid birth datetime: ${birthDate} ${timePart} ${tz}`);
  }
  return { utc, usedNoon };
}

/** Tropical ecliptic Ascendant (degrees 0–360). */
export function tropicalAscendant(date: Date, latitude: number, longitude: number): number {
  const time = Astronomy.MakeTime(date);
  const gastHours = Astronomy.SiderealTime(time); // Greenwich apparent sidereal time (hours)
  const ramc = norm360(gastHours * 15 + longitude); // local sidereal → RAMC degrees
  const eps = Astronomy.e_tilt(time).tobl * (Math.PI / 180);
  const lat = latitude * (Math.PI / 180);
  const ramcRad = ramc * (Math.PI / 180);

  // Meeus: tan(ASC) = cos(θ) / -(sin(θ)cos(ε) + tan(φ)sin(ε))
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
  return norm360((Math.atan2(y, x) * 180) / Math.PI);
}

/** Mean lunar ascending node (Rahu) — Meeus approximation, tropical longitude. */
function meanNorthNodeTropical(date: Date): number {
  const jd = julianDayUt(date);
  const t = (jd - 2451545.0) / 36525.0;
  return norm360(125.0445479 - 1934.1362891 * t + 0.0020754 * t * t);
}

function tropicalLongitude(body: Astronomy.Body, date: Date): number {
  if (body === Astronomy.Body.Sun) {
    return Astronomy.SunPosition(date).elon;
  }
  if (body === Astronomy.Body.Moon) {
    return Astronomy.EclipticGeoMoon(date).lon;
  }
  const geo = Astronomy.GeoVector(body, date, true);
  return Astronomy.Ecliptic(geo).elon;
}

function planetSpeedSign(body: Astronomy.Body, date: Date): number {
  const t0 = new Date(date.getTime() - 12 * 3600 * 1000);
  const t1 = new Date(date.getTime() + 12 * 3600 * 1000);
  const lon0 = tropicalLongitude(body, t0);
  const lon1 = tropicalLongitude(body, t1);
  let d = lon1 - lon0;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function buildLahiriChart(input: {
  birthProfileId?: string | null;
  fullName: string;
  birthDate: string;
  birthTime: string | null;
  unknownBirthTime: boolean;
  latitude?: number | null;
  longitude?: number | null;
  timezone: string;
  language: string;
}): ChartResult {
  const lat = input.latitude ?? 6.9271;
  const lon = input.longitude ?? 79.8612;
  const { utc, usedNoon } = localBirthToUtc(
    input.birthDate,
    input.birthTime,
    input.timezone,
    input.unknownBirthTime,
  );

  const ayanamsa = lahiriAyanamsa(utc);
  const toSidereal = (tropicalLon: number) => norm360(tropicalLon - ayanamsa);

  const ascTropical = tropicalAscendant(utc, lat, lon);
  const ascLon = toSidereal(ascTropical);
  const lagna = signDegree(ascLon);

  const bodies: Array<{ name: string; body: Astronomy.Body }> = [
    { name: 'Sun', body: Astronomy.Body.Sun },
    { name: 'Moon', body: Astronomy.Body.Moon },
    { name: 'Mercury', body: Astronomy.Body.Mercury },
    { name: 'Venus', body: Astronomy.Body.Venus },
    { name: 'Mars', body: Astronomy.Body.Mars },
    { name: 'Jupiter', body: Astronomy.Body.Jupiter },
    { name: 'Saturn', body: Astronomy.Body.Saturn },
  ];

  const planets = bodies.map(({ name, body }) => {
    const tropical = tropicalLongitude(body, utc);
    const sidereal = toSidereal(tropical);
    const sd = signDegree(sidereal);
    const speed = planetSpeedSign(body, utc);
    return {
      name,
      sign: sd.sign,
      degree: Math.round(sd.degree * 10000) / 10000,
      longitude: Math.round(sd.longitude * 10000) / 10000,
      house: wholeSignHouse(sidereal, ascLon),
      retrograde: speed < 0,
    };
  });

  const rahuTrop = meanNorthNodeTropical(utc);
  const rahuSid = toSidereal(rahuTrop);
  const rahu = signDegree(rahuSid);
  planets.push({
    name: 'Rahu',
    sign: rahu.sign,
    degree: Math.round(rahu.degree * 10000) / 10000,
    longitude: Math.round(rahu.longitude * 10000) / 10000,
    house: wholeSignHouse(rahuSid, ascLon),
    retrograde: true,
  });
  const ketuLon = norm360(rahuSid + 180);
  const ketu = signDegree(ketuLon);
  planets.push({
    name: 'Ketu',
    sign: ketu.sign,
    degree: Math.round(ketu.degree * 10000) / 10000,
    longitude: Math.round(ketu.longitude * 10000) / 10000,
    house: wholeSignHouse(ketuLon, ascLon),
    retrograde: true,
  });

  const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  planets.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  const lagnaIdx = Math.floor(ascLon / 30) % 12;
  const houses = HOUSE_THEMES.map((theme, i) => ({
    number: i + 1,
    sign: ZODIAC_SIGNS[(lagnaIdx + i) % 12],
    theme,
  }));

  const sun = planets.find((p) => p.name === 'Sun')!;
  const moon = planets.find((p) => p.name === 'Moon')!;
  const themes = [
    `Lagna in ${lagna.sign} frames identity and initiative`,
    `Sun in ${sun.sign} (H${sun.house}) colours vitality and direction`,
    `Moon in ${moon.sign} (H${moon.house}) colours emotional pacing`,
  ];

  const notes = [
    'Calculated with astronomy-engine + Lahiri ayanamsa (worker local).',
    `Ayanamsa ≈ ${ayanamsa.toFixed(4)}°.`,
    `Native: ${input.fullName}.`,
  ];
  if (usedNoon) {
    notes.push('Birth time unknown/approximate — used local noon; house emphasis softened.');
  }

  return {
    engineVersion: ENGINE_VERSION,
    placeholder: false,
    system: 'sidereal-lahiri',
    ayanamsa: Math.round(ayanamsa * 10000) / 10000,
    birthProfileId: input.birthProfileId ?? null,
    language: input.language,
    lagna: {
      sign: lagna.sign,
      degree: Math.round(lagna.degree * 10000) / 10000,
      longitude: Math.round(lagna.longitude * 10000) / 10000,
      houseSystem: 'WholeSign',
    },
    planets,
    houses,
    themes,
    notes,
  };
}

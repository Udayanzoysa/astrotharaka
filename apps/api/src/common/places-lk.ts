/** Common Sri Lankan places → lat/long (WGS84). Default Colombo if unknown. */
export const LK_PLACES: Record<string, { lat: number; lon: number; name: string }> = {
  colombo: { lat: 6.9271, lon: 79.8612, name: 'Colombo' },
  dehiwala: { lat: 6.856, lon: 79.865, name: 'Dehiwala' },
  moratuwa: { lat: 6.773, lon: 79.8816, name: 'Moratuwa' },
  negombo: { lat: 7.2083, lon: 79.8358, name: 'Negombo' },
  gampaha: { lat: 7.0917, lon: 79.999, name: 'Gampaha' },
  kandy: { lat: 7.2906, lon: 80.6337, name: 'Kandy' },
  matale: { lat: 7.4675, lon: 80.6234, name: 'Matale' },
  nuwaraeliya: { lat: 6.9497, lon: 80.7891, name: 'Nuwara Eliya' },
  galle: { lat: 6.0535, lon: 80.221, name: 'Galle' },
  matara: { lat: 5.9549, lon: 80.555, name: 'Matara' },
  hambantota: { lat: 6.1241, lon: 81.1185, name: 'Hambantota' },
  jaffna: { lat: 9.6615, lon: 80.0255, name: 'Jaffna' },
  kilinochchi: { lat: 9.3803, lon: 80.377, name: 'Kilinochchi' },
  vavuniya: { lat: 8.7514, lon: 80.4971, name: 'Vavuniya' },
  trincomalee: { lat: 8.5874, lon: 81.2152, name: 'Trincomalee' },
  batticaloa: { lat: 7.7102, lon: 81.6924, name: 'Batticaloa' },
  ampara: { lat: 7.2975, lon: 81.682, name: 'Ampara' },
  anuradhapura: { lat: 8.3114, lon: 80.4037, name: 'Anuradhapura' },
  polonnaruwa: { lat: 7.9403, lon: 81.0188, name: 'Polonnaruwa' },
  kurunegala: { lat: 7.4818, lon: 80.3609, name: 'Kurunegala' },
  puttalam: { lat: 8.0362, lon: 79.8283, name: 'Puttalam' },
  ratnapura: { lat: 6.7056, lon: 80.3847, name: 'Ratnapura' },
  kegalle: { lat: 7.2513, lon: 80.3464, name: 'Kegalle' },
  badulla: { lat: 6.9934, lon: 81.055, name: 'Badulla' },
  monaragala: { lat: 6.8721, lon: 81.3507, name: 'Monaragala' },
  kalutara: { lat: 6.5854, lon: 79.9607, name: 'Kalutara' },
  panadura: { lat: 6.7133, lon: 79.9026, name: 'Panadura' },
  chilaw: { lat: 7.5758, lon: 79.7953, name: 'Chilaw' },
  beruwala: { lat: 6.4788, lon: 79.9828, name: 'Beruwala' },
  wattala: { lat: 6.989, lon: 79.8917, name: 'Wattala' },
  maharagama: { lat: 6.848, lon: 79.9265, name: 'Maharagama' },
  homagama: { lat: 6.844, lon: 80.002, name: 'Homagama' },
  kaduwela: { lat: 6.9355, lon: 79.983, name: 'Kaduwela' },
  peradeniya: { lat: 7.2699, lon: 80.5938, name: 'Peradeniya' },
  hatton: { lat: 6.8916, lon: 80.5955, name: 'Hatton' },
  ella: { lat: 6.8667, lon: 81.0466, name: 'Ella' },
  bandarawela: { lat: 6.829, lon: 80.9889, name: 'Bandarawela' },
};

const COLOMBO = LK_PLACES.colombo;

function normalizePlaceKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0d80-\u0dff]+/g, '')
    .trim();
}

/** Sinhala / common aliases → English key */
const ALIASES: Record<string, string> = {
  කොළඹ: 'colombo',
  කොලඹ: 'colombo',
  මහනුවර: 'kandy',
  ගාල්ල: 'galle',
  මාතර: 'matara',
  රත්නපුර: 'ratnapura',
  රත්නපුරය: 'ratnapura',
  අනුරාධපුර: 'anuradhapura',
  අනුරාධපුරය: 'anuradhapura',
  යාපනය: 'jaffna',
  කුරුණෑගල: 'kurunegala',
  ගම්පහ: 'gampaha',
  නෙගොම්බෝ: 'negombo',
  බදුල්ල: 'badulla',
  මාතලේ: 'matale',
  ත්‍රිකුණාමලය: 'trincomalee',
  මඩකලපුව: 'batticaloa',
};

export function resolveLkPlace(placeName: string): {
  lat: number;
  lon: number;
  matchedName: string;
  usedDefault: boolean;
} {
  const raw = placeName.trim();
  if (!raw) {
    return { lat: COLOMBO.lat, lon: COLOMBO.lon, matchedName: COLOMBO.name, usedDefault: true };
  }

  const lower = raw.toLowerCase();
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (raw.includes(alias) || lower.includes(alias.toLowerCase())) {
      const hit = LK_PLACES[key];
      return { lat: hit.lat, lon: hit.lon, matchedName: hit.name, usedDefault: false };
    }
  }

  const key = normalizePlaceKey(raw);
  for (const [placeKey, place] of Object.entries(LK_PLACES)) {
    if (key.includes(placeKey) || placeKey.includes(key) || lower.includes(place.name.toLowerCase())) {
      return { lat: place.lat, lon: place.lon, matchedName: place.name, usedDefault: false };
    }
  }

  return { lat: COLOMBO.lat, lon: COLOMBO.lon, matchedName: COLOMBO.name, usedDefault: true };
}

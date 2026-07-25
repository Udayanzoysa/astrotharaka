/** Shared CustomerProfile JSON shape for /auth and /users/me */

export type SerializedCustomerProfile = {
  id: string;
  fullName: string;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  preferredLanguage: string;
  country: string;
  birthDate: string | null;
  birthTime: string | null;
  unknownBirthTime: boolean;
  birthPlaceName: string | null;
  gender: string | null;
  emailMarketingConsent: boolean;
  whatsappMarketingConsent: boolean;
};

type ProfileRow = {
  id: string;
  fullName: string;
  mobileNumber: string | null;
  whatsappNumber: string | null;
  preferredLanguage: string;
  country: string;
  birthDate: Date | null;
  birthTime: Date | null;
  unknownBirthTime: boolean;
  birthPlaceName: string | null;
  gender?: string | null;
  emailMarketingConsent: boolean;
  whatsappMarketingConsent: boolean;
};

/** YYYY-MM-DD for <input type="date"> */
export function formatDateOnly(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

/** HH:mm for <input type="time"> — stored as UTC wall-clock on TIME column */
export function formatTimeOnly(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const iso = value.match(/T(\d{2}):(\d{2})/);
    if (iso) return `${iso[1]}:${iso[2]}`;
    const hm = value.match(/^(\d{2}):(\d{2})/);
    return hm ? `${hm[1]}:${hm[2]}` : null;
  }
  if (Number.isNaN(value.getTime())) return null;
  const h = value.getUTCHours().toString().padStart(2, '0');
  const m = value.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function parseDateOnly(value: string): Date {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) throw new Error(`Invalid date: ${value}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function parseTimeOnly(value: string): Date {
  const normalized = value.trim().length === 5 ? `${value.trim()}:00` : value.trim();
  const m = normalized.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) throw new Error(`Invalid time: ${value}`);
  return new Date(`1970-01-01T${m[1]}:${m[2]}:${m[3] ?? '00'}Z`);
}

export function serializeCustomerProfile(
  profile: ProfileRow | null | undefined,
): SerializedCustomerProfile | null {
  if (!profile) return null;
  return {
    id: profile.id,
    fullName: profile.fullName,
    mobileNumber: profile.mobileNumber,
    whatsappNumber: profile.whatsappNumber,
    preferredLanguage: profile.preferredLanguage,
    country: profile.country,
    birthDate: formatDateOnly(profile.birthDate),
    birthTime: formatTimeOnly(profile.birthTime),
    unknownBirthTime: profile.unknownBirthTime,
    birthPlaceName: profile.birthPlaceName,
    gender: profile.gender ?? null,
    emailMarketingConsent: profile.emailMarketingConsent,
    whatsappMarketingConsent: profile.whatsappMarketingConsent,
  };
}

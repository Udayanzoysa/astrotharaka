/**
 * Prisma @db.Date / @db.Time helpers for the astrology engine.
 *
 * The API stores local birth clock time as UTC on 1970-01-01
 * (e.g. 21:27 → 1970-01-01T21:27:00.000Z). Dates are UTC midnight.
 * Never use Date#toString() — locale strings poison the engine payload
 * and force stub charts with fake Lagna.
 */

/** Prisma @db.Date → YYYY-MM-DD */
export function birthDateIso(value: Date | string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Invalid birthDate');
    }
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid birthDate: ${s}`);
  }
  return parsed.toISOString().slice(0, 10);
}

/** Prisma @db.Time → HH:mm:ss wall clock (UTC getters). */
export function birthTimeIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const hh = String(value.getUTCHours()).padStart(2, '0');
    const mm = String(value.getUTCMinutes()).padStart(2, '0');
    const ss = String(value.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  const s = String(value).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return s.length === 5 ? `${s}:00` : s.slice(0, 8);
  }
  if (s.includes('T')) {
    const part = s.slice(s.indexOf('T') + 1, s.indexOf('T') + 9);
    if (/^\d{2}:\d{2}:\d{2}$/.test(part)) return part;
  }
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  const hh = String(parsed.getUTCHours()).padStart(2, '0');
  const mm = String(parsed.getUTCMinutes()).padStart(2, '0');
  const ss = String(parsed.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

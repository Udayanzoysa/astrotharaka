/**
 * Prisma @db.Time values often arrive as ISO datetimes on 1970-01-01
 * (e.g. "1970-01-01T14:30:00.000Z"). Never slice(0, 8) — that yields "1970-01-".
 */

/** HH:mm for display / <input type="time"> */
export function formatBirthTime(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  const iso = s.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  const hm = s.match(/^(\d{2}):(\d{2})(?::\d{2})?/);
  return hm ? `${hm[1]}:${hm[2]}` : "";
}

/** YYYY-MM-DD */
export function formatBirthDate(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

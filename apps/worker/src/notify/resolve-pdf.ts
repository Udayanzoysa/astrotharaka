import { existsSync } from 'fs';
import { basename, isAbsolute, join, resolve } from 'path';

/** Resolve guest/order PDF path across worker vs API cwd layouts. */
export function resolvePdfPath(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const key = stored.trim();
  const name = basename(key);
  const configured = (process.env.REPORTS_DIR || './uploads/reports').trim();
  const configuredAbs = isAbsolute(configured)
    ? configured
    : resolve(process.cwd(), configured);

  const candidates = [
    key,
    isAbsolute(key) ? null : resolve(process.cwd(), key),
    join(configuredAbs, name),
    resolve(process.cwd(), '../api/uploads/reports', name),
    resolve(process.cwd(), 'uploads/reports', name),
  ].filter((p): p is string => Boolean(p));

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

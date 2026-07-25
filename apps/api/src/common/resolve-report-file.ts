import { existsSync } from 'fs';
import { basename, isAbsolute, join, resolve } from 'path';

/**
 * Resolve a stored PDF/SVG path to an existing file.
 * Worker and API often run with different cwd, so relative REPORTS_DIR
 * paths (e.g. uploads/reports/guest-….pdf) may live under apps/worker.
 */
export function resolveReportFilePath(
  stored: string | null | undefined,
  reportsDir?: string | null,
): string | null {
  if (!stored?.trim()) return null;

  const key = stored.trim();
  const name = basename(key);
  const configured = (reportsDir || process.env.REPORTS_DIR || './uploads/reports').trim();
  const configuredAbs = isAbsolute(configured)
    ? configured
    : resolve(process.cwd(), configured);

  const candidates = [
    key,
    isAbsolute(key) ? null : resolve(process.cwd(), key),
    join(configuredAbs, name),
    // Monorepo: API cwd apps/api → worker writes under apps/worker
    resolve(process.cwd(), '../worker', key),
    resolve(process.cwd(), '../worker/uploads/reports', name),
    resolve(process.cwd(), '../../uploads/reports', name),
  ].filter((p): p is string => Boolean(p));

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

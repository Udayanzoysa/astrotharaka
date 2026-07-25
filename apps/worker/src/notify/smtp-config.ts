import type { PrismaClient } from '@prisma/client';

export type WorkerSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

const KEYS = {
  host: 'smtp.host',
  port: 'smtp.port',
  secure: 'smtp.secure',
  user: 'smtp.user',
  pass: 'smtp.pass',
  from: 'smtp.from',
} as const;

let prismaRef: PrismaClient | null = null;

export function bindSmtpPrisma(prisma: PrismaClient): void {
  prismaRef = prisma;
}

/** Prefer DB SystemSetting (admin UI), then env, then Namecheap defaults. */
export async function loadSmtpConfig(): Promise<WorkerSmtpConfig> {
  const map = new Map<string, string>();
  if (prismaRef) {
    try {
      const rows = await prismaRef.systemSetting.findMany({
        where: { key: { in: Object.values(KEYS) } },
      });
      for (const row of rows) map.set(row.key, row.value);
    } catch {
      // table may not exist yet during rollout
    }
  }

  const host =
    map.get(KEYS.host)?.trim() ||
    process.env.SMTP_HOST?.trim() ||
    'mail.privateemail.com';
  const port = Number(map.get(KEYS.port) || process.env.SMTP_PORT || 465);
  const secureRaw =
    map.get(KEYS.secure) ?? process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false');
  const secure = secureRaw === 'true' || secureRaw === '1' || port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    user: map.get(KEYS.user)?.trim() || process.env.SMTP_USER?.trim() || '',
    pass: map.get(KEYS.pass) || process.env.SMTP_PASS || '',
    from:
      map.get(KEYS.from)?.trim() ||
      process.env.SMTP_FROM?.trim() ||
      'Taraka <noreply@taraka.local>',
  };
}

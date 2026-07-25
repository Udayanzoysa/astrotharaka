import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SMTP_DEFAULTS, SMTP_SETTING_KEYS, type SmtpConfig } from './smtp-types';

@Injectable()
export class SmtpConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getConfig(): Promise<SmtpConfig> {
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: Object.values(SMTP_SETTING_KEYS) } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const envHost = this.config.get<string>('SMTP_HOST')?.trim() || '';
    const dbHost = map.get(SMTP_SETTING_KEYS.host)?.trim() || '';
    const host = dbHost || envHost || SMTP_DEFAULTS.host;

    const portRaw =
      map.get(SMTP_SETTING_KEYS.port) ||
      this.config.get<string>('SMTP_PORT') ||
      String(SMTP_DEFAULTS.port);
    const port = Number(portRaw) || SMTP_DEFAULTS.port;

    const secureRaw =
      map.get(SMTP_SETTING_KEYS.secure) ??
      this.config.get<string>('SMTP_SECURE') ??
      String(SMTP_DEFAULTS.secure);
    const secure = secureRaw === 'true' || secureRaw === '1' || port === 465;

    const user =
      map.get(SMTP_SETTING_KEYS.user)?.trim() ||
      this.config.get<string>('SMTP_USER')?.trim() ||
      '';
    const pass =
      map.get(SMTP_SETTING_KEYS.pass) ||
      this.config.get<string>('SMTP_PASS') ||
      '';
    const from =
      map.get(SMTP_SETTING_KEYS.from)?.trim() ||
      this.config.get<string>('SMTP_FROM')?.trim() ||
      SMTP_DEFAULTS.from;

    let source: SmtpConfig['source'] = 'default';
    if (dbHost || map.has(SMTP_SETTING_KEYS.user)) source = 'database';
    else if (envHost) source = 'env';

    return {
      host,
      port,
      secure,
      user,
      pass,
      from,
      hasPassword: Boolean(pass),
      source,
    };
  }

  /** Public shape for admin UI (password never returned). */
  async getPublicConfig() {
    const cfg = await this.getConfig();
    return {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      from: cfg.from,
      hasPassword: cfg.hasPassword,
      source: cfg.source,
      encryption: cfg.secure ? 'SSL' : 'STARTTLS',
      profileHint:
        'Default profile: Namecheap Private Email (mail.privateemail.com) with SSL on port 465.',
    };
  }

  async save(input: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    from: string;
    /** Empty string keeps existing password. */
    pass?: string;
  }): Promise<void> {
    const upserts: Array<{ key: string; value: string }> = [
      { key: SMTP_SETTING_KEYS.host, value: input.host.trim() },
      { key: SMTP_SETTING_KEYS.port, value: String(input.port) },
      { key: SMTP_SETTING_KEYS.secure, value: input.secure ? 'true' : 'false' },
      { key: SMTP_SETTING_KEYS.user, value: input.user.trim() },
      { key: SMTP_SETTING_KEYS.from, value: input.from.trim() },
    ];

    if (input.pass !== undefined && input.pass !== '') {
      upserts.push({ key: SMTP_SETTING_KEYS.pass, value: input.pass });
    }

    await this.prisma.$transaction(
      upserts.map((row) =>
        this.prisma.systemSetting.upsert({
          where: { key: row.key },
          create: { key: row.key, value: row.value },
          update: { value: row.value },
        }),
      ),
    );
  }

  isReady(cfg: SmtpConfig): boolean {
    return Boolean(cfg.host && cfg.user && cfg.pass);
  }
}

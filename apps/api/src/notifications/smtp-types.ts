export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  /** True when a password is stored (DB or env) — never expose raw pass to clients. */
  hasPassword: boolean;
  source: 'database' | 'env' | 'default';
};

export const SMTP_SETTING_KEYS = {
  host: 'smtp.host',
  port: 'smtp.port',
  secure: 'smtp.secure',
  user: 'smtp.user',
  pass: 'smtp.pass',
  from: 'smtp.from',
} as const;

/** Namecheap Private Email defaults (same profile as typical info@… mailboxes). */
export const SMTP_DEFAULTS = {
  host: 'mail.privateemail.com',
  port: 465,
  secure: true,
  from: 'Taraka <noreply@taraka.local>',
} as const;

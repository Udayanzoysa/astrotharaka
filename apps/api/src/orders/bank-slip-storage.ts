import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, isAbsolute, join, resolve } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function bankSlipsDir(): string {
  const raw = process.env.BANK_SLIPS_DIR?.trim() || join(process.cwd(), 'uploads', 'bank-slips');
  return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
}

export function assertAllowedSlip(file: { originalname: string; mimetype: string; size: number }) {
  const ext = extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('Bank slip must be PDF, JPG, PNG, or WEBP');
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new Error('Invalid bank slip file type');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Bank slip must be under 8MB');
  }
  return ext;
}

/** Save slip buffer; returns relative storage key `bank-slips/...`. */
export function saveBankSlipFile(file: {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}): string {
  const ext = assertAllowedSlip(file);
  const dir = bankSlipsDir();
  mkdirSync(dir, { recursive: true });
  const filename = `${randomUUID()}${ext}`;
  writeFileSync(join(dir, filename), file.buffer);
  return `bank-slips/${filename}`;
}

export function resolveBankSlipPath(storageKey: string | null | undefined): string | null {
  if (!storageKey?.trim()) return null;
  const key = storageKey.trim().replace(/^\/+/, '');
  if (!key.startsWith('bank-slips/') || key.includes('..')) return null;
  const abs = join(bankSlipsDir(), key.slice('bank-slips/'.length));
  if (existsSync(abs)) return abs;
  const alt = resolve(process.cwd(), 'uploads', key);
  return existsSync(alt) ? alt : null;
}

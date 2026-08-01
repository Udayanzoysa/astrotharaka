import { Logger } from '@nestjs/common';
import { isProductionRuntime } from './runtime-flags';

function env(key: string): string {
  return (process.env[key] ?? '').trim();
}

function looksLikePlaceholderSecret(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    !value ||
    lower.includes('change-me') ||
    lower === 'minioadmin' ||
    value.length < 32
  );
}

/**
 * Fail fast on unsafe production configuration.
 * Call once during API bootstrap before listening.
 */
export function validateProductionConfig(): void {
  if (!isProductionRuntime()) return;

  const logger = new Logger('ProductionConfig');
  const errors: string[] = [];

  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'CORS_ORIGIN',
    'WEB_APP_URL',
    'REDIS_HOST',
    'ASTROLOGY_ENGINE_URL',
    'PAYHERE_NOTIFY_URL',
    'PAYHERE_RETURN_URL',
    'PAYHERE_CANCEL_URL',
  ] as const;

  for (const key of required) {
    if (!env(key)) errors.push(`${key} is required in production`);
  }

  if (looksLikePlaceholderSecret(env('JWT_ACCESS_SECRET'))) {
    errors.push('JWT_ACCESS_SECRET must be a strong secret (min 32 chars, not a placeholder)');
  }

  for (const key of ['CORS_ORIGIN', 'WEB_APP_URL', 'PAYHERE_NOTIFY_URL', 'PAYHERE_RETURN_URL', 'PAYHERE_CANCEL_URL'] as const) {
    const value = env(key);
    if (value.includes('localhost') || value.includes('127.0.0.1')) {
      errors.push(`${key} must not use localhost in production`);
    }
  }

  if (env('OTP_RETURN_IN_RESPONSE') === 'true') {
    errors.push('OTP_RETURN_IN_RESPONSE must be false in production');
  }
  if (env('ALLOW_DEV_PAYMENTS') === 'true') {
    errors.push('ALLOW_DEV_PAYMENTS must be false in production');
  }
  if (env('ALLOW_PLACEHOLDER_CHART') === 'true') {
    errors.push('ALLOW_PLACEHOLDER_CHART must be false in production');
  }
  if (env('PAYHERE_MODE') !== 'live') {
    errors.push('PAYHERE_MODE must be live in production');
  }
  if (!env('PAYHERE_MERCHANT_ID') || !env('PAYHERE_MERCHANT_SECRET')) {
    errors.push('PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET are required in production');
  }
  if (!env('GEMINI_API_KEY') && !env('OPENAI_API_KEY')) {
    errors.push('GEMINI_API_KEY or OPENAI_API_KEY is required in production');
  }

  if (errors.length > 0) {
    throw new Error(`Production configuration invalid:\n- ${errors.join('\n- ')}`);
  }

  logger.log('Production configuration validated');
}

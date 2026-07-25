import { HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '@astro/shared';
import { AppException } from './errors/app.exception';

/** True when process is running as production. */
export function isProductionRuntime(): boolean {
  return (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

/**
 * Local-only instant payment / free package activation.
 * Never enabled in production. Outside production requires ALLOW_DEV_PAYMENTS=true.
 */
export function allowDevPayments(): boolean {
  if (isProductionRuntime()) return false;
  return process.env.ALLOW_DEV_PAYMENTS === 'true';
}

export function assertDevPaymentsAllowed(action = 'Dev payment'): void {
  if (allowDevPayments()) return;
  throw new AppException(
    ErrorCodes.FORBIDDEN,
    `${action} is disabled. Use PayHere or bank transfer (admin confirms).`,
    HttpStatus.FORBIDDEN,
  );
}

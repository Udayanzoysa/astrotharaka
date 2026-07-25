import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@astro/shared';

export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

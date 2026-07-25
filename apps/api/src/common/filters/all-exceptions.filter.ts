import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCodes } from '@astro/shared';
import { AppException } from '../errors/app.exception';
import { OAuthRedirectException } from '../errors/oauth-redirect.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Response already committed (e.g. OAuth redirect) — do not write again.
    if (response.headersSent) {
      return;
    }

    if (exception instanceof OAuthRedirectException) {
      response.redirect(exception.location);
      return;
    }

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] }).message ??
            exception.message);

      response.status(status).json({
        code: ErrorCodes.VALIDATION_FAILED,
        message: Array.isArray(message) ? message.join('; ') : message,
        details: typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unknown error',
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    });
  }
}

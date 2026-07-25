import { HttpException, HttpStatus } from '@nestjs/common';

/** Signals the exception filter to issue an HTTP redirect instead of JSON. */
export class OAuthRedirectException extends HttpException {
  constructor(public readonly location: string) {
    super('OAuth redirect', HttpStatus.FOUND);
  }
}

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Allows unauthenticated requests; attaches user when a valid JWT is present. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    if (!req.headers.authorization) {
      return true;
    }
    try {
      const ok = await super.canActivate(context);
      return ok as boolean;
    } catch {
      return true;
    }
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | null {
    if (err || !user) return null;
    return user;
  }
}

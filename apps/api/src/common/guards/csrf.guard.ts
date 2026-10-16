import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'node:crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const method = req.method.toUpperCase();

    // Safe read methods bypass CSRF checks
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Security Gate Clarification 1: CSRF bypass is permitted ONLY when
    // authentication is established exclusively through non-cookie bearer mechanism
    if (req.authMethod === 'bearer') {
      return true;
    }

    // If unauthenticated public request (e.g. login or register), CSRF check is bypassed
    if (!req.session && isPublic) {
      return true;
    }

    // Cookie-authenticated mutating requests require CSRF token
    const clientCsrfToken = req.headers['x-csrf-token'];
    const sessionCsrfSecret = req.session?.csrfSecret;

    if (!clientCsrfToken || typeof clientCsrfToken !== 'string' || !sessionCsrfSecret) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    // Constant-time token comparison
    const clientBuf = Buffer.from(clientCsrfToken);
    const secretBuf = Buffer.from(sessionCsrfSecret);

    if (clientBuf.length !== secretBuf.length || !crypto.timingSafeEqual(clientBuf, secretBuf)) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    return true;
  }
}

import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours idle timeout

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();

    const cookieToken = req.cookies?.['sb_session'];
    const authHeader = req.headers['authorization'];
    const hasBearer =
      authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ');

    // Security Gate Clarification 1: Reject requests containing both credentials
    if (cookieToken && hasBearer) {
      throw new BadRequestException(
        'Ambiguous credentials: both session cookie and authorization header provided',
      );
    }

    let rawToken: string | undefined;
    let authMethod: 'cookie' | 'bearer' = 'cookie';

    if (hasBearer) {
      rawToken = authHeader.slice(7).trim();
      authMethod = 'bearer';
    } else if (cookieToken) {
      rawToken = cookieToken;
      authMethod = 'cookie';
    }

    if (!rawToken) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Authentication required');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();

    // Query session matching tokenHash with user details
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session) {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Security Gate Clarification 5: Separate idle and absolute expiration limits
    if (session.expiresAt <= now || session.idleExpiresAt <= now) {
      // Clean up expired session record
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => null);
      if (isPublic) return true;
      throw new UnauthorizedException('Session expired');
    }

    // Atomically extend idle timeout only if still valid
    const newIdle = new Date(now.getTime() + IDLE_TIMEOUT_MS);
    const updated = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        expiresAt: { gt: now },
        idleExpiresAt: { gt: now },
      },
      data: {
        lastActiveAt: now,
        idleExpiresAt: newIdle,
      },
    });

    if (updated.count === 0) {
      if (isPublic) return true;
      throw new UnauthorizedException('Session expired concurrently');
    }

    // Bind session context to request
    req.user = session.user;
    req.session = session;
    req.authMethod = authMethod;

    return true;
  }
}

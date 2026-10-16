import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'node:crypto';
import { AuthGuard } from '../src/common/guards/auth.guard.js';

describe('AuthGuard - Credentials & Session Lifecycle', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let mockPrisma: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockPrisma = {
      session: {
        findUnique: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn(),
      },
    };
    guard = new AuthGuard(reflector, mockPrisma as any);
  });

  const createMockContext = (
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {},
  ) => {
    const req: any = {
      cookies,
      headers,
      user: null,
      session: null,
      authMethod: null,
    };

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  };

  it('Requirement 1: REJECTS requests containing both a session cookie and a bearer credential', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext(
      { sb_session: 'cookie-session-token-123' },
      { authorization: 'Bearer machine-token-456' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(context)).rejects.toThrow('Ambiguous credentials');
  });

  it('Requirement 1: Rejects unauthenticated request when no session or bearer is provided', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext({}, {});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('Requirement 1: Allows unauthenticated request on @Public() endpoints', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockContext({}, {});

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('Requirement 5: Enforces session lookup using SHA-256 tokenHash', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const rawToken = 'plain-session-secret-xyz';
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const context = createMockContext({ sb_session: rawToken }, {});

    const now = new Date();
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-1',
      tokenHash: expectedHash,
      expiresAt: new Date(now.getTime() + 1000000),
      idleExpiresAt: new Date(now.getTime() + 500000),
      user: { id: 'u1', email: 'test@skyra-tech.com', fullName: 'Tester', emailVerified: true },
    });
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: expectedHash },
      include: expect.anything(),
    });
  });

  it('Requirement 5: Rejects and deletes session when absolute expiration has passed', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const rawToken = 'expired-session-token';

    const context = createMockContext({ sb_session: rawToken }, {});

    const now = new Date();
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-expired-abs',
      tokenHash: 'hash',
      expiresAt: new Date(now.getTime() - 1000), // Expired absolute
      idleExpiresAt: new Date(now.getTime() + 500000),
      user: { id: 'u1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 'sess-expired-abs' } });
  });

  it('Requirement 5: Rejects and deletes session when idle expiration has passed', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const rawToken = 'idle-expired-token';

    const context = createMockContext({ sb_session: rawToken }, {});

    const now = new Date();
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-expired-idle',
      tokenHash: 'hash',
      expiresAt: new Date(now.getTime() + 1000000),
      idleExpiresAt: new Date(now.getTime() - 1000), // Expired idle
      user: { id: 'u1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(mockPrisma.session.delete).toHaveBeenCalledWith({ where: { id: 'sess-expired-idle' } });
  });

  it('Requirement 5: Prevents concurrent requests from reviving expired sessions (updateMany returns 0)', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const rawToken = 'concurrent-race-token';

    const context = createMockContext({ sb_session: rawToken }, {});

    const now = new Date();
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-racing',
      tokenHash: 'hash',
      expiresAt: new Date(now.getTime() + 1000000),
      idleExpiresAt: new Date(now.getTime() + 500000),
      user: { id: 'u1' },
    });

    // Another concurrent request or janitor expired/deleted the session between findUnique and updateMany
    mockPrisma.session.updateMany.mockResolvedValue({ count: 0 });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow('Session expired concurrently');
  });

  it('Sets authMethod to "bearer" when authenticated exclusively via Authorization header', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const bearerToken = 'machine-token-abc';
    const context = createMockContext({}, { authorization: `Bearer ${bearerToken}` });

    const now = new Date();
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'sess-bearer',
      tokenHash: crypto.createHash('sha256').update(bearerToken).digest('hex'),
      expiresAt: new Date(now.getTime() + 1000000),
      idleExpiresAt: new Date(now.getTime() + 500000),
      user: { id: 'm1', email: 'service@skyra-tech.com' },
    });
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.authMethod).toBe('bearer');
  });
});

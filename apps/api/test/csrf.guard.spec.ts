import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from '../src/common/guards/csrf.guard.js';

describe('CsrfGuard - Token Validation & Lifecycle', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CsrfGuard(reflector);
  });

  const createMockContext = (
    method: string,
    headers: Record<string, string>,
    reqData: any = {},
  ) => {
    const req = {
      method,
      headers,
      session: reqData.session ?? null,
      authMethod: reqData.authMethod ?? 'cookie',
      ...reqData,
    };

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  };

  it('Bypasses safe read HTTP methods (GET, HEAD, OPTIONS)', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const context = createMockContext(method, {}, { session: { csrfSecret: 'secret123' } });
      expect(guard.canActivate(context)).toBe(true);
    }
  });

  it('Requirement 1: Permitted CSRF bypass ONLY when authentication is established exclusively through bearer mechanism', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext(
      'POST',
      {},
      { authMethod: 'bearer', session: { id: 'sess-b' } },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('Requirement 2: Rejects mutating request when X-CSRF-Token header is missing', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext(
      'POST',
      {},
      {
        authMethod: 'cookie',
        session: { csrfSecret: 'expected-csrf-secret-1234567890abcdef' },
      },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Invalid or missing CSRF token');
  });

  it('Requirement 2: Rejects mutating request when X-CSRF-Token does not match session csrfSecret', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext(
      'POST',
      { 'x-csrf-token': 'wrong-or-forged-csrf-token-123456789' },
      {
        authMethod: 'cookie',
        session: { csrfSecret: 'correct-session-csrf-secret-123456789' },
      },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Invalid or missing CSRF token');
  });

  it('Requirement 2: Rejects mutating request when X-CSRF-Token is of different length (stale/truncated)', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext(
      'PUT',
      { 'x-csrf-token': 'short-token' },
      {
        authMethod: 'cookie',
        session: { csrfSecret: 'expected-much-longer-session-csrf-secret-string' },
      },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('Requirement 2: Allows mutating request when valid matching CSRF token is provided', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const validSecret = '5f4dcc3b5aa765d61d8327deb882cf992b321a673ee85f12e0220675276e00b8';

    const context = createMockContext(
      'POST',
      { 'x-csrf-token': validSecret },
      {
        authMethod: 'cookie',
        session: { csrfSecret: validSecret },
      },
    );

    expect(guard.canActivate(context)).toBe(true);
  });
});

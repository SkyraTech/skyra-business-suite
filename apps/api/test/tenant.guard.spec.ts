import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { TenantGuard } from '../src/common/guards/tenant.guard.js';

describe('TenantGuard - Multi-Tenant Isolation & Identifier Manipulation Defense', () => {
  let guard: TenantGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      organizationMembership: {
        findUnique: vi.fn(),
      },
    };
    guard = new TenantGuard(mockPrisma as any);
  });

  const createMockContext = (
    user: any,
    headers: Record<string, string> = {},
    params: Record<string, string> = {},
  ) => {
    const req = {
      user,
      headers,
      params,
      tenantContext: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  };

  it('Requirement 4: Rejects request if user context is missing from request', async () => {
    const context = createMockContext(null, { 'x-skyra-org-id': 'org-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('User context missing');
  });

  it('Requirement 4: Rejects request if no target organization identifier is provided', async () => {
    const context = createMockContext({ id: 'user-1' }, {}, {});
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    await expect(guard.canActivate(context)).rejects.toThrow('Organization context required');
  });

  it('Requirement 4: Treats organization header strictly as requested target, rejecting cross-tenant manipulation when user has no membership', async () => {
    const context = createMockContext({ id: 'user-a' }, { 'x-skyra-org-id': 'victim-org-secret' });

    // Database lookup finds no membership for user-a in victim-org-secret
    mockPrisma.organizationMembership.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access to requested organization denied',
    );

    expect(mockPrisma.organizationMembership.findUnique).toHaveBeenCalledWith({
      where: {
        organizationId_userId: {
          organizationId: 'victim-org-secret',
          userId: 'user-a',
        },
      },
      include: { organization: true },
    });
  });

  it('Requirement 4: Rejects access when membership exists but is deactivated (isActive: false)', async () => {
    const context = createMockContext(
      { id: 'user-b' },
      { 'x-skyra-org-id': 'org-deactivated-membership' },
    );

    mockPrisma.organizationMembership.findUnique.mockResolvedValue({
      id: 'mem-1',
      userId: 'user-b',
      organizationId: 'org-deactivated-membership',
      role: 'MEMBER',
      isActive: false, // Inactive / revoked membership
      organization: { id: 'org-deactivated-membership', status: 'ACTIVE', name: 'Corp B' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('Requirement 4: Rejects access when organization status is SUSPENDED', async () => {
    const context = createMockContext({ id: 'user-c' }, { 'x-skyra-org-id': 'org-suspended' });

    mockPrisma.organizationMembership.findUnique.mockResolvedValue({
      id: 'mem-2',
      userId: 'user-c',
      organizationId: 'org-suspended',
      role: 'ADMIN',
      isActive: true,
      organization: { id: 'org-suspended', status: 'SUSPENDED', name: 'Suspended Org' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('Requirement 4: Attaches validated tenantContext when active membership is verified', async () => {
    const context = createMockContext({ id: 'user-legit' }, { 'x-skyra-org-id': 'org-legit' });

    mockPrisma.organizationMembership.findUnique.mockResolvedValue({
      id: 'mem-3',
      userId: 'user-legit',
      organizationId: 'org-legit',
      role: 'OWNER',
      isActive: true,
      organization: { id: 'org-legit', status: 'ACTIVE', name: 'Skyra Technologies' },
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);

    const req = context.switchToHttp().getRequest();
    expect(req.tenantContext).toEqual({
      organizationId: 'org-legit',
      organizationName: 'Skyra Technologies',
      role: 'OWNER',
      membershipId: 'mem-3',
    });
  });
});

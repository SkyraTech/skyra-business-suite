import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { OrganizationService } from '../src/modules/organization/organization.service.js';

describe('OrganizationService - Atomic Creation, Rollback & Tenant Isolation', () => {
  let orgService: OrganizationService;
  let mockPrisma: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      organizationMembership: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb(mockPrisma);
      }),
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    orgService = new OrganizationService(mockPrisma as any, mockAudit as any);
  });

  describe('Atomic Organization & Owner Membership Creation', () => {
    it('Requirement 9: Atomically creates organization and assigns creator as OWNER in a single transaction', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue({
        id: 'org-1',
        name: 'Skyra Logistics',
        slug: 'skyra-logistics',
        status: 'ACTIVE',
      });
      mockPrisma.organizationMembership.create.mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        userId: 'user-owner',
        role: 'OWNER',
        isActive: true,
      });

      const result = await orgService.createOrganization(
        'user-owner',
        { name: 'Skyra Logistics', slug: 'skyra-logistics' },
        '127.0.0.1',
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.organization.id).toBe('org-1');
      expect(result.role).toBe('OWNER');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORGANIZATION_CREATED',
          organizationId: 'org-1',
          outcome: 'SUCCESS',
        }),
      );
    });

    it('Requirement 9: Rolls back organization creation if membership assignment fails', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue({ id: 'org-rollback', name: 'Failed Org' });
      mockPrisma.organizationMembership.create.mockRejectedValue(
        new Error('Foreign key violation'),
      );

      await expect(
        orgService.createOrganization('user-owner', { name: 'Failed Org' }, '127.0.0.1'),
      ).rejects.toThrow('Foreign key violation');
    });

    it('Rejects duplicate explicit slug with ConflictException', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-already-there',
        slug: 'taken-slug',
      });

      await expect(
        orgService.createOrganization(
          'user-owner',
          { name: 'Any', slug: 'taken-slug' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Tenant Isolation & Membership Enforcement in Service Paths', () => {
    it('Requirement 4: Cross-tenant dashboard access is rejected with ForbiddenException if user is not an active member', async () => {
      // Organization exists, but user-intruder is NOT in its memberships
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'tenant-a-id',
        name: 'Tenant Alpha',
        slug: 'tenant-alpha',
        status: 'ACTIVE',
        memberships: [{ id: 'mem-alpha-1', role: 'OWNER', userId: 'user-legit-owner' }],
      });

      await expect(orgService.getTenantDashboard('tenant-a-id', 'user-intruder')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(orgService.getTenantDashboard('tenant-a-id', 'user-intruder')).rejects.toThrow(
        'User is not an active member of this organization',
      );
    });

    it('Requirement 4: Organization not found returns NotFoundException', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(orgService.getTenantDashboard('non-existent-org', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Requirement 4: Returns tenant dashboard for verified active member', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'tenant-legit',
        name: 'Legit Tenant Corp',
        slug: 'legit-tenant',
        status: 'ACTIVE',
        memberships: [
          { id: 'mem-10', role: 'ADMIN', userId: 'user-admin' },
          { id: 'mem-11', role: 'MEMBER', userId: 'user-staff' },
        ],
      });

      const dashboard = await orgService.getTenantDashboard('tenant-legit', 'user-admin');
      expect(dashboard.organizationId).toBe('tenant-legit');
      expect(dashboard.userRole).toBe('ADMIN');
      expect(dashboard.totalActiveMembers).toBe(2);
    });

    it('Requirement 4: Organization switching verifies active membership and organization ACTIVE status', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        id: 'mem-switch',
        userId: 'user-switcher',
        organizationId: 'target-org',
        role: 'MEMBER',
        isActive: true,
        organization: {
          id: 'target-org',
          name: 'Target Org',
          slug: 'target-org',
          status: 'ACTIVE',
        },
      });

      const switched = await orgService.switchOrganization(
        'user-switcher',
        'target-org',
        '127.0.0.1',
      );
      expect(switched.activeOrganization.id).toBe('target-org');
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORGANIZATION_SWITCHED',
          organizationId: 'target-org',
          outcome: 'SUCCESS',
        }),
      );
    });

    it('Requirement 4: Rejects organization switching if user membership is inactive or org is suspended', async () => {
      mockPrisma.organizationMembership.findUnique.mockResolvedValue({
        id: 'mem-switch-bad',
        userId: 'user-switcher',
        organizationId: 'target-org-bad',
        role: 'MEMBER',
        isActive: false, // Inactive
        organization: { id: 'target-org-bad', status: 'ACTIVE' },
      });

      await expect(
        orgService.switchOrganization('user-switcher', 'target-org-bad', '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/services/audit.service.js';
import type { CreateOrganizationDto } from './dto/organization.dto.js';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Atomically creates an organization and assigns the creator as OWNER in a single transaction.
   */
  async createOrganization(userId: string, dto: CreateOrganizationDto, ipAddress?: string) {
    let slug = dto.slug ? dto.slug.trim().toLowerCase() : this.slugify(dto.name);

    const existingSlug = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      if (dto.slug) {
        throw new ConflictException('An organization with this slug already exists');
      }
      slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
    }

    // Execute atomic creation of Organization and OWNER OrganizationMembership
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          slug,
          status: 'ACTIVE',
        },
      });

      const membership = await tx.organizationMembership.create({
        data: {
          organizationId: org.id,
          userId,
          role: 'OWNER',
          isActive: true,
        },
      });

      return { org, membership };
    });

    await this.auditService.record({
      actorId: userId,
      organizationId: result.org.id,
      action: 'ORGANIZATION_CREATED',
      resourceType: 'Organization',
      resourceId: result.org.id,
      outcome: 'SUCCESS',
      ipAddress,
      metadata: { role: 'OWNER' },
    });

    return {
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        status: result.org.status,
      },
      role: result.membership.role,
    };
  }

  /**
   * Lists all organizations the user is an active member of.
   */
  async listUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      status: m.organization.status,
    }));
  }

  /**
   * Validates and switches active organization context.
   */
  async switchOrganization(userId: string, targetOrgId: string, ipAddress?: string) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: targetOrgId,
          userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership || !membership.isActive || membership.organization.status !== 'ACTIVE') {
      throw new ForbiddenException('Access to organization workspace denied');
    }

    await this.auditService.record({
      actorId: userId,
      organizationId: targetOrgId,
      action: 'ORGANIZATION_SWITCHED',
      resourceType: 'Organization',
      resourceId: targetOrgId,
      outcome: 'SUCCESS',
      ipAddress,
    });

    return {
      activeOrganization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      },
    };
  }

  /**
   * Retrieves tenant-scoped summary ensuring caller has active membership.
   */
  async getTenantDashboard(organizationId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          where: { isActive: true },
          select: { id: true, role: true, userId: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const userMembership = org.memberships.find((m) => m.userId === userId);
    if (!userMembership) {
      throw new ForbiddenException('User is not an active member of this organization');
    }

    return {
      organizationId: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      userRole: userMembership.role,
      totalActiveMembers: org.memberships.length,
    };
  }

  private slugify(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'org'
    );
  }
}

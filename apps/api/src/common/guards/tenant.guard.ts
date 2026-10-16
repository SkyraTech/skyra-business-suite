import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;

    if (!userId) {
      throw new ForbiddenException('User context missing');
    }

    // Treat header or route parameter strictly as a requested target
    const targetOrgId =
      (req.headers['x-skyra-org-id'] as string) ||
      (req.params?.['organizationId'] as string) ||
      (req.query?.['organizationId'] as string);

    if (!targetOrgId) {
      throw new BadRequestException('Organization context required (X-Skyra-Org-ID)');
    }

    // Validate active membership and role in the database
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
      throw new ForbiddenException('Access to requested organization denied');
    }

    // Attach validated tenant context to request
    req.tenantContext = {
      organizationId: targetOrgId,
      organizationName: membership.organization.name,
      role: membership.role,
      membershipId: membership.id,
    };

    return true;
  }
}

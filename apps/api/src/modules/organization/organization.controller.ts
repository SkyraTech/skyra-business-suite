import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrganizationService } from './organization.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CsrfGuard } from '../../common/guards/csrf.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { getClientIp } from '../../common/utils/client-ip.util.js';
import { CreateOrganizationDto, SwitchOrganizationDto } from './dto/organization.dto.js';

@Controller('api/v1/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @UseGuards(CsrfGuard)
  @Post()
  async createOrganization(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrganizationDto,
    @Req() req: Request,
  ) {
    const ip = getClientIp(req);
    return this.organizationService.createOrganization(userId, dto, ip);
  }

  @Get()
  async listUserOrganizations(@CurrentUser('id') userId: string) {
    return this.organizationService.listUserOrganizations(userId);
  }

  @UseGuards(CsrfGuard)
  @Post('switch')
  @HttpCode(HttpStatus.OK)
  async switchOrganization(
    @CurrentUser('id') userId: string,
    @Body() dto: SwitchOrganizationDto,
    @Req() req: Request,
  ) {
    const ip = getClientIp(req);
    return this.organizationService.switchOrganization(userId, dto.organizationId, ip);
  }

  @UseGuards(TenantGuard)
  @Get(':organizationId/dashboard')
  async getTenantDashboard(
    @Param('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationService.getTenantDashboard(organizationId, userId);
  }
}

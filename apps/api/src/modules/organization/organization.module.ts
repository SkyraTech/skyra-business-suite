import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller.js';
import { OrganizationService } from './organization.service.js';
import { AuditService } from '../../common/services/audit.service.js';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService, AuditService],
  exports: [OrganizationService],
})
export class OrganizationModule {}

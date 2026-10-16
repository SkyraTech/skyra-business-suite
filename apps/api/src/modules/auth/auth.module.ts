import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { EmailSenderService } from '../../common/services/email-sender.service.js';
import { AuditService } from '../../common/services/audit.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailSenderService, AuditService],
  exports: [AuthService],
})
export class AuthModule {}

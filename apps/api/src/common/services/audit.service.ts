import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuditLogParams {
  actorId?: string | null | undefined;
  organizationId?: string | null | undefined;
  action: string;
  resourceType: string;
  resourceId?: string | null | undefined;
  outcome: 'SUCCESS' | 'FAILURE';
  ipAddress?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an append-only audit log entry.
   * Redacts any sensitive keys (passwords, tokens, secrets) before persistence.
   */
  async record(params: AuditLogParams): Promise<void> {
    try {
      const sanitizedMetadata = params.metadata ? this.redactSensitive(params.metadata) : undefined;

      await this.prisma.auditEvent.create({
        data: {
          actorId: params.actorId ?? null,
          organizationId: params.organizationId ?? null,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId ?? null,
          outcome: params.outcome,
          ipAddress: params.ipAddress ?? null,
          metadata: (sanitizedMetadata ?? {}) as any,
        },
      });
    } catch (err) {
      // Do not crash the primary transaction if logging audit event encounters an issue
      this.logger.error(
        `Failed to persist audit event for ${params.action}: ${(err as Error).message}`,
      );
    }
  }

  private redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'hash',
      'csrf',
      'session',
      'authorization',
    ];
    const cleaned: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(data)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        cleaned[key] = '[REDACTED]';
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        cleaned[key] = this.redactSensitive(val as Record<string, unknown>);
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }
}

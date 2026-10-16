import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../src/common/services/audit.service.js';

describe('AuditService - Append-Only Store & Sensitive Field Redaction', () => {
  let auditService: AuditService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'evt-1' }),
      },
    };
    auditService = new AuditService(mockPrisma as any);
  });

  it('Requirement 7: Records append-only audit event with null fallbacks for optional parameters', async () => {
    await auditService.record({
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: 'usr-1',
      outcome: 'SUCCESS',
      ipAddress: '127.0.0.1',
    });

    expect(mockPrisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        actorId: null,
        organizationId: null,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: 'usr-1',
        outcome: 'SUCCESS',
        ipAddress: '127.0.0.1',
        metadata: {},
      },
    });
  });

  it('Requirement 7: Recursively REDACTS sensitive fields from audit metadata', async () => {
    const sensitivePayload = {
      userEmail: 'admin@skyra-tech.com',
      password: 'PlainPassword123!',
      passwordHash: '$argon2id$v=19$m=65536...',
      sessionToken: 'raw-session-bearer-secret',
      csrfSecret: '32-byte-hex-csrf',
      api_secret_key: 'top-secret',
      authorizationHeader: 'Bearer xyz',
      nested: {
        userToken: 'nested-token',
        publicNote: 'safe note',
      },
    };

    await auditService.record({
      actorId: 'usr-1',
      action: 'SENSITIVE_OPERATION',
      resourceType: 'Security',
      outcome: 'SUCCESS',
      metadata: sensitivePayload,
    });

    const createCall = mockPrisma.auditEvent.create.mock.calls[0][0];
    const savedMetadata = createCall.data.metadata;

    expect(savedMetadata.password).toBe('[REDACTED]');
    expect(savedMetadata.passwordHash).toBe('[REDACTED]');
    expect(savedMetadata.sessionToken).toBe('[REDACTED]');
    expect(savedMetadata.csrfSecret).toBe('[REDACTED]');
    expect(savedMetadata.api_secret_key).toBe('[REDACTED]');
    expect(savedMetadata.authorizationHeader).toBe('[REDACTED]');
    expect(savedMetadata.nested.userToken).toBe('[REDACTED]');
    expect(savedMetadata.nested.publicNote).toBe('safe note');
    expect(savedMetadata.userEmail).toBe('admin@skyra-tech.com');
  });

  it('Requirement 7: Contains audit logging failures without interrupting primary workflow', async () => {
    mockPrisma.auditEvent.create.mockRejectedValue(new Error('Disk write failure'));

    // Must not throw or crash caller
    await expect(
      auditService.record({
        action: 'TEST_ACTION',
        resourceType: 'Test',
        outcome: 'FAILURE',
      }),
    ).resolves.not.toThrow();
  });
});

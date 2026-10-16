import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { AuthService } from '../src/modules/auth/auth.service.js';

describe('AuthService - Authentication, Argon2, Races & Session Revocation', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockEmailSender: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      emailVerificationToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
      passwordResetToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
      session: {
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma)),
    };

    mockEmailSender = {
      sendEmail: vi.fn().mockResolvedValue(true),
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    authService = new AuthService(mockPrisma as any, mockEmailSender as any, mockAudit as any);
  });

  describe('Registration & Duplicate Email Handling', () => {
    it('successfully registers user with Argon2id password hash and dispatches verification email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-new',
        email: 'alice@skyra-tech.com',
        fullName: 'Alice Dev',
      });
      mockPrisma.emailVerificationToken.create.mockResolvedValue({ id: 'tok-1' });

      const res = await authService.register(
        { email: 'alice@skyra-tech.com', password: 'StrongPassword123!', fullName: 'Alice Dev' },
        '127.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'alice@skyra-tech.com',
          passwordHash: expect.stringMatching(/^\$argon2id\$/),
        }),
      });
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        'alice@skyra-tech.com',
        expect.any(String),
        'verification',
      );
    });

    it('rejects registration when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.register(
          { email: 'alice@skyra-tech.com', password: 'StrongPassword123!', fullName: 'Alice Dev' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Email Verification & Token Redemption Races', () => {
    it('Requirement 9: Prevents token redemption races via atomic conditional updateMany', async () => {
      const rawToken = 'verification-token-single-use';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.emailVerificationToken.findFirst.mockResolvedValue({
        id: 'vt-1',
        tokenHash,
        userId: 'usr-1',
        expiresAt: new Date(Date.now() + 100000),
        redeemedAt: null,
      });

      // Simulate a concurrent redemption race where another request already redeemed the token
      mockPrisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(authService.verifyEmail(rawToken, '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(authService.verifyEmail(rawToken, '127.0.0.1')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('Rejects expired email verification token', async () => {
      const rawToken = 'expired-token';

      // Expired token is not found by findFirst ({ gt: now })
      mockPrisma.emailVerificationToken.findFirst.mockResolvedValue(null);

      await expect(authService.verifyEmail(rawToken, '127.0.0.1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Password Verification & Unknown User Dummy Hash', () => {
    it('Requirement 6: Executes dummy hash verification for unknown users to mitigate timing attacks and returns generic error', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login(
          { email: 'ghost@skyra-tech.com', password: 'AnyPassword123!' },
          '127.0.0.1',
        ),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.login(
          { email: 'ghost@skyra-tech.com', password: 'AnyPassword123!' },
          '127.0.0.1',
        ),
      ).rejects.toThrow('Invalid email or password');

      // Audit log records failure
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          outcome: 'FAILURE',
        }),
      );
    });

    it('Requirement 6: Verifies valid password with Argon2 and returns generic error for invalid password', async () => {
      const realPassword = 'RealSecretPassword99!';
      const passwordHash = await argon2.hash(realPassword, { type: argon2.argon2id });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-valid',
        email: 'bob@skyra-tech.com',
        fullName: 'Bob Smith',
        passwordHash,
        emailVerified: true,
      });

      // Wrong password attempt
      await expect(
        authService.login({ email: 'bob@skyra-tech.com', password: 'WrongPassword!' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.login({ email: 'bob@skyra-tech.com', password: 'WrongPassword!' }, '127.0.0.1'),
      ).rejects.toThrow('Invalid email or password');

      // Correct password attempt
      mockPrisma.session.create.mockResolvedValue({ id: 'sess-created' });
      const loginResult = await authService.login(
        { email: 'bob@skyra-tech.com', password: realPassword },
        '127.0.0.1',
      );

      expect(loginResult.user.id).toBe('user-valid');
      expect(loginResult.sessionToken).toBeDefined();
      expect(loginResult.csrfToken).toBeDefined();
    });
  });

  describe('Password Reset & Total Session Invalidation', () => {
    it('Requirement 5 & 9: Resetting password invalidates and revokes ALL active sessions for that user', async () => {
      const rawResetToken = 'reset-token-secret-123';
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      mockPrisma.passwordResetToken.findFirst.mockResolvedValue({
        id: 'prt-1',
        tokenHash,
        userId: 'victim-account',
        expiresAt: new Date(Date.now() + 600000),
        redeemedAt: null,
      });
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 }); // 5 active sessions revoked

      const result = await authService.resetPassword(
        { token: rawResetToken, newPassword: 'NewBrandPassword2026!' },
        '127.0.0.1',
      );

      expect(result.success).toBe(true);
      // All existing sessions MUST be revoked
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'victim-account' },
      });
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_COMPLETED',
          outcome: 'SUCCESS',
        }),
      );
    });
  });
});

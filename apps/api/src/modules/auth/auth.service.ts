import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmailSenderService } from '../../common/services/email-sender.service.js';
import { AuditService } from '../../common/services/audit.service.js';
import type { RegisterDto, LoginDto, ResetPasswordDto } from './dto/auth.dto.js';

// Pre-computed valid Argon2id hash used to perform dummy verification for unknown users
let DUMMY_HASH: string | null = null;
async function getDummyHash(): Promise<string> {
  if (!DUMMY_HASH) {
    DUMMY_HASH = await argon2.hash('__skyra_dummy_salt_padding__', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }
  return DUMMY_HASH;
}

const SESSION_ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_IDLE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface AuthSessionResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
  };
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailSender: EmailSenderService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registers a new user account and creates a single-use email verification token.
   */
  async register(
    dto: RegisterDto,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: dto.fullName.trim(),
          emailVerified: false,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          tokenHash,
          expiresAt,
        },
      });

      return createdUser;
    });

    // Dispatch email safely (raw token sent only to user, never logged)
    await this.emailSender.sendEmail(
      user.email,
      'Verify your Skyra Business Suite account',
      'verification',
    );

    await this.auditService.record({
      actorId: user.id,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user.id,
      outcome: 'SUCCESS',
      ipAddress,
    });

    return {
      success: true,
      message: 'Registration successful. Please verify your email to continue.',
    };
  }

  /**
   * Verifies an email address using single-use token with conditional atomic update.
   */
  async verifyEmail(
    rawToken: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      // Find valid unredeemed token
      const token = await tx.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          redeemedAt: null,
          expiresAt: { gt: now },
        },
      });

      if (!token) {
        return null;
      }

      // Mark token as redeemed
      const updated = await tx.emailVerificationToken.updateMany({
        where: {
          id: token.id,
          redeemedAt: null,
        },
        data: {
          redeemedAt: now,
        },
      });

      if (updated.count === 0) {
        return null; // Concurrent redemption prevented
      }

      // Update user verification status
      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerified: true },
      });

      return token.userId;
    });

    if (!result) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.auditService.record({
      actorId: result,
      action: 'EMAIL_VERIFIED',
      resourceType: 'User',
      resourceId: result,
      outcome: 'SUCCESS',
      ipAddress,
    });

    return {
      success: true,
      message: 'Email verified successfully. You may now sign in.',
    };
  }

  /**
   * Authenticates user using Argon2id with dummy hash comparison for unknown users.
   */
  async login(dto: LoginDto, ipAddress?: string): Promise<AuthSessionResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let isValid = false;

    if (!user) {
      // Timing attack mitigation: verify against dummy hash
      const dummy = await getDummyHash();
      await argon2.verify(dummy, dto.password).catch(() => false);
    } else {
      isValid = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    }

    if (!user || !isValid) {
      await this.auditService.record({
        action: 'LOGIN_FAILED',
        resourceType: 'Session',
        outcome: 'FAILURE',
        ipAddress,
        metadata: { attemptedEmail: normalizedEmail },
      });
      // Generic authentication failure error
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create session with cryptographically random tokens and hash at rest
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const now = new Date();
    const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS);
    const idleExpiresAt = new Date(now.getTime() + SESSION_IDLE_TTL_MS);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        csrfSecret: csrfToken,
        expiresAt: absoluteExpiresAt,
        idleExpiresAt,
      },
    });

    await this.auditService.record({
      actorId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'Session',
      resourceId: user.id,
      outcome: 'SUCCESS',
      ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
      },
      sessionToken: rawSessionToken,
      csrfToken,
      expiresAt: absoluteExpiresAt,
    };
  }

  /**
   * Requests password reset with generic response to prevent account enumeration.
   */
  async forgotPassword(
    email: string,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.emailSender.sendEmail(
        user.email,
        'Reset your Skyra Business Suite password',
        'password-reset',
      );

      await this.auditService.record({
        actorId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'User',
        resourceId: user.id,
        outcome: 'SUCCESS',
        ipAddress,
      });
    }

    // Generic response regardless of whether account exists
    return {
      success: true,
      message: 'If an account with this email exists, a password reset link has been dispatched.',
    };
  }

  /**
   * Resets password using single-use token and invalidates ALL active sessions.
   */
  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');
    const now = new Date();

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash,
          redeemedAt: null,
          expiresAt: { gt: now },
        },
      });

      if (!token) {
        return null;
      }

      const updated = await tx.passwordResetToken.updateMany({
        where: {
          id: token.id,
          redeemedAt: null,
        },
        data: {
          redeemedAt: now,
        },
      });

      if (updated.count === 0) {
        return null; // Double-spending prevented
      }

      // Update password hash
      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash: newPasswordHash },
      });

      // Security Gate Clarification 5: Invalidate ALL active sessions for this user
      await tx.session.deleteMany({
        where: { userId: token.userId },
      });

      return token.userId;
    });

    if (!result) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    await this.auditService.record({
      actorId: result,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'User',
      resourceId: result,
      outcome: 'SUCCESS',
      ipAddress,
    });

    return {
      success: true,
      message:
        'Password reset successfully. All previous sessions have been revoked. Please sign in.',
    };
  }

  /**
   * Logs out user by revoking active session.
   */
  async logout(
    sessionId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<{ success: boolean }> {
    await this.prisma.session
      .delete({
        where: { id: sessionId },
      })
      .catch(() => null);

    await this.auditService.record({
      actorId: userId,
      action: 'LOGOUT',
      resourceType: 'Session',
      resourceId: sessionId,
      outcome: 'SUCCESS',
      ipAddress,
    });

    return { success: true };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CsrfGuard } from '../../common/guards/csrf.guard.js';
import { getClientIp } from '../../common/utils/client-ip.util.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.register(dto, ip);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.verifyEmail(dto.token, ip);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = getClientIp(req);
    const result = await this.authService.login(dto, ip);

    const isProd = process.env['NODE_ENV'] === 'production';

    // Set secure HttpOnly session cookie
    res.cookie('sb_session', result.sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });

    // Set CSRF token cookie readable by Angular client
    res.cookie('sb_csrf', result.csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      expires: result.expiresAt,
    });

    return {
      user: result.user,
      csrfToken: result.csrfToken,
      sessionToken: result.sessionToken, // Provided for machine/bearer clients
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.forgotPassword(dto.email, ip);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = getClientIp(req);
    return this.authService.resetPassword(dto, ip);
  }

  @UseGuards(CsrfGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = (req as any).session;
    const user = (req as any).user;
    const ip = getClientIp(req);

    if (session) {
      await this.authService.logout(session.id, user.id, ip);
    }

    res.clearCookie('sb_session', { path: '/' });
    res.clearCookie('sb_csrf', { path: '/' });

    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: any) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return {
      user,
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  @Get('csrf')
  async getCsrf(@Req() req: Request) {
    const session = (req as any).session;
    return {
      csrfToken: session?.csrfSecret ?? null,
    };
  }
}

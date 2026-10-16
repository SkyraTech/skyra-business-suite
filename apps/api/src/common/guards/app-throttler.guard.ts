import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getClientIp } from '../utils/client-ip.util.js';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    const rawProxies = process.env.TRUSTED_PROXIES;
    const trustedProxies = rawProxies
      ? rawProxies
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : ['127.0.0.1', '::1'];
    return getClientIp(req as any, { trustedProxies });
  }
}

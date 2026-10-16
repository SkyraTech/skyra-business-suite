import type { Request } from 'express';

export interface TrustedProxyConfig {
  trustedProxies?: string[];
  trustAll?: boolean;
}

/**
 * Extracts and validates the client IP address considering trusted proxies.
 * Does NOT trust raw arbitrary headers unless the immediate connection originates
 * from a verified trusted proxy.
 */
export function getClientIp(req: Request, config?: TrustedProxyConfig): string {
  const directRemoteIp = req.socket?.remoteAddress || '127.0.0.1';

  // Normalize IPv6 localhost
  const normalizedDirectIp =
    directRemoteIp === '::1' ? '127.0.0.1' : directRemoteIp.replace(/^::ffff:/, '');

  const forwardedHeader = req.headers['x-forwarded-for'];
  if (!forwardedHeader) {
    return normalizedDirectIp;
  }

  // If trusting all proxies (e.g. controlled private container network)
  if (config?.trustAll) {
    const rawIps = Array.isArray(forwardedHeader) ? forwardedHeader.join(',') : forwardedHeader;
    const parts = rawIps.split(',').map((ip) => ip.trim());
    return parts[0] || normalizedDirectIp;
  }

  const trustedList = config?.trustedProxies ?? ['127.0.0.1', '::1'];
  const isDirectIpTrusted = trustedList.includes(normalizedDirectIp);

  // If the direct connection is NOT from a trusted proxy, ignore X-Forwarded-For to prevent spoofing
  if (!isDirectIpTrusted) {
    return normalizedDirectIp;
  }

  const rawIps = Array.isArray(forwardedHeader) ? forwardedHeader.join(',') : forwardedHeader;
  const parts = rawIps.split(',').map((ip) => ip.trim());

  // Return the first IP in the forwarded chain
  return parts[0] || normalizedDirectIp;
}

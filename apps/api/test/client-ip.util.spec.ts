import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { getClientIp } from '../src/common/utils/client-ip.util.js';

describe('client-ip.util - Trusted Proxies and Direct Exposure', () => {
  it('returns direct connection remoteAddress when no forwarded headers are present', () => {
    const req = {
      socket: { remoteAddress: '203.0.113.195' },
      headers: {},
    } as unknown as Request;

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.195');
  });

  it('normalizes IPv6 localhost ::1 to 127.0.0.1', () => {
    const req = {
      socket: { remoteAddress: '::1' },
      headers: {},
    } as unknown as Request;

    const ip = getClientIp(req);
    expect(ip).toBe('127.0.0.1');
  });

  it('normalizes ::ffff: IPv4-mapped IPv6 address', () => {
    const req = {
      socket: { remoteAddress: '::ffff:198.51.100.44' },
      headers: {},
    } as unknown as Request;

    const ip = getClientIp(req);
    expect(ip).toBe('198.51.100.44');
  });

  it('IGNORES forged X-Forwarded-For when directly exposed (remoteAddress is not a trusted proxy)', () => {
    // Untrusted public client sends a fake X-Forwarded-For
    const req = {
      socket: { remoteAddress: '198.51.100.77' }, // Public untrusted IP
      headers: {
        'x-forwarded-for': '10.0.0.1, 192.168.1.1',
      },
    } as unknown as Request;

    const ip = getClientIp(req, { trustedProxies: ['127.0.0.1', '10.0.0.100'] });
    // Must return the actual connection IP, NOT the spoofed header
    expect(ip).toBe('198.51.100.77');
  });

  it('TRUSTS X-Forwarded-For when connection originates from a configured trusted proxy', () => {
    const req = {
      socket: { remoteAddress: '10.0.0.100' }, // Reverse proxy IP
      headers: {
        'x-forwarded-for': '203.0.113.50, 10.0.0.100',
      },
    } as unknown as Request;

    const ip = getClientIp(req, { trustedProxies: ['10.0.0.100', '127.0.0.1'] });
    // First client IP in the chain
    expect(ip).toBe('203.0.113.50');
  });

  it('handles array format in x-forwarded-for header safely', () => {
    const req = {
      socket: { remoteAddress: '127.0.0.1' },
      headers: {
        'x-forwarded-for': ['198.51.100.22', '127.0.0.1'] as unknown as string,
      },
    } as unknown as Request;

    const ip = getClientIp(req, { trustedProxies: ['127.0.0.1'] });
    expect(ip).toBe('198.51.100.22');
  });
});

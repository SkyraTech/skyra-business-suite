import { describe, it, expect, beforeEach } from 'vitest';
import { CsrfService } from './csrf.service.js';

describe('CsrfService - Lifecycle & Storage', () => {
  let service: CsrfService;

  beforeEach(() => {
    service = new CsrfService();
  });

  it('initializes with null or extracted cookie token', () => {
    expect(service.csrfToken()).toBeDefined();
  });

  it('Requirement 2: sets and rotates active CSRF token', () => {
    service.setToken('test-csrf-token-123');
    expect(service.csrfToken()).toBe('test-csrf-token-123');

    // Rotate token
    service.setToken('rotated-token-456');
    expect(service.csrfToken()).toBe('rotated-token-456');
  });

  it('Requirement 2: clears token upon session termination', () => {
    service.setToken('temp-token');
    expect(service.csrfToken()).toBe('temp-token');

    service.clear();
    expect(service.csrfToken()).toBeNull();
  });

  it('extracts token from document cookie when available', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'other=foo; sb_csrf=extracted-from-cookie-999; bar=baz',
    });

    const token = service.extractTokenFromCookie();
    expect(token).toBe('extracted-from-cookie-999');
    expect(service.csrfToken()).toBe('extracted-from-cookie-999');
  });
});

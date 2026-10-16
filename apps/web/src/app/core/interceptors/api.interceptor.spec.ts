import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpRequest, type HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { apiInterceptor } from './api.interceptor.js';
import { CsrfService } from '../services/csrf.service.js';
import { TenantContextService } from '../services/tenant-context.service.js';

describe('apiInterceptor - CSRF Token & Tenant Context Attachment', () => {
  let csrfService: CsrfService;
  let tenantService: TenantContextService;
  let injector: Injector;

  beforeEach(() => {
    csrfService = new CsrfService();
    tenantService = new TenantContextService();
    injector = Injector.create({
      providers: [
        { provide: CsrfService, useValue: csrfService },
        { provide: TenantContextService, useValue: tenantService },
      ],
    });
  });

  const runInterceptor = (req: HttpRequest<unknown>) => {
    let interceptedReq: HttpRequest<unknown> | null = null;
    const next: HttpHandlerFn = (r) => {
      interceptedReq = r;
      return of(new HttpResponse({ status: 200 }));
    };

    runInInjectionContext(injector, () => {
      apiInterceptor(req, next).subscribe();
    });

    return interceptedReq as HttpRequest<unknown> | null;
  };

  it('Requirement 2: safely attaches X-CSRF-Token on state-changing mutating requests (POST)', () => {
    csrfService.setToken('secure-csrf-token-abc');

    const req = new HttpRequest('POST', '/api/v1/organizations', { name: 'Acme' });
    const intercepted = runInterceptor(req);

    expect(intercepted).not.toBeNull();
    expect(intercepted?.headers.get('X-CSRF-Token')).toBe('secure-csrf-token-abc');
    expect(intercepted?.withCredentials).toBe(true);
  });

  it('Requirement 2: does NOT attach X-CSRF-Token on safe read requests (GET)', () => {
    csrfService.setToken('secure-csrf-token-abc');

    const req = new HttpRequest('GET', '/api/v1/organizations');
    const intercepted = runInterceptor(req);

    expect(intercepted).not.toBeNull();
    expect(intercepted?.headers.has('X-CSRF-Token')).toBe(false);
    expect(intercepted?.withCredentials).toBe(true);
  });

  it('Requirement 4: attaches X-Skyra-Org-ID target header when active tenant organization is selected', () => {
    tenantService.setActiveOrg({
      id: 'org-tenant-123',
      name: 'Acme Corp',
      slug: 'acme-corp',
      role: 'OWNER',
    });

    const req = new HttpRequest('GET', '/api/v1/organizations/org-tenant-123/dashboard');
    const intercepted = runInterceptor(req);

    expect(intercepted).not.toBeNull();
    expect(intercepted?.headers.get('X-Skyra-Org-ID')).toBe('org-tenant-123');
  });

  it('handles missing CSRF token safely without throwing', () => {
    csrfService.clear();

    const req = new HttpRequest('POST', '/api/v1/auth/login', {});
    const intercepted = runInterceptor(req);

    expect(intercepted).not.toBeNull();
    expect(intercepted?.headers.has('X-CSRF-Token')).toBe(false);
  });
});

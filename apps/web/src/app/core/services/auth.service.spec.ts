import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthService } from './auth.service.js';
import { CsrfService } from './csrf.service.js';
import { TenantContextService } from './tenant-context.service.js';

describe('AuthService - Angular Signals & Session Management', () => {
  let authService: AuthService;
  let csrfService: CsrfService;
  let tenantService: TenantContextService;
  let mockHttp: any;
  let injector: Injector;

  beforeEach(() => {
    csrfService = new CsrfService();
    tenantService = new TenantContextService();
    mockHttp = {
      post: vi.fn(),
      get: vi.fn(),
    };

    injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: CsrfService, useValue: csrfService },
        { provide: TenantContextService, useValue: tenantService },
        AuthService,
      ],
    });

    authService = runInInjectionContext(injector, () => injector.get(AuthService));
  });

  it('login updates currentUser signal and syncs csrfToken in CsrfService', async () => {
    mockHttp.post.mockReturnValue(
      of({
        user: {
          id: 'usr-1',
          email: 'test@skyra-tech.com',
          fullName: 'Tester',
          emailVerified: true,
        },
        csrfToken: 'csrf-session-token-xyz',
      }),
    );

    let loggedInUser: any = null;
    authService.login('test@skyra-tech.com', 'ValidPassword123!').subscribe((res) => {
      loggedInUser = res.user;
    });

    expect(loggedInUser.id).toBe('usr-1');
    expect(authService.currentUser()?.email).toBe('test@skyra-tech.com');
    expect(authService.isAuthenticated()).toBe(true);
    expect(csrfService.csrfToken()).toBe('csrf-session-token-xyz');
  });

  it('logout terminates session and clears local security signals', () => {
    csrfService.setToken('temp-csrf');
    tenantService.setActiveOrg({ id: 'org-1', name: 'Org 1', slug: 'org-1', role: 'OWNER' });
    mockHttp.post.mockReturnValue(of({ success: true }));

    authService.logout().subscribe();

    expect(authService.currentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.organizations()).toEqual([]);
    expect(csrfService.csrfToken()).toBeNull();
    expect(tenantService.activeOrg()).toBeNull();
  });

  it('fetchMe populates currentUser, organizations, and default active tenant', () => {
    mockHttp.get.mockReturnValue(
      of({
        user: { id: 'u1', email: 'u1@skyra-tech.com', fullName: 'User One', emailVerified: true },
        organizations: [
          { id: 'org-default', name: 'Default Corp', slug: 'default-corp', role: 'OWNER' },
        ],
      }),
    );

    authService.fetchMe().subscribe();

    expect(authService.currentUser()?.id).toBe('u1');
    expect(authService.organizations().length).toBe(1);
    expect(tenantService.activeOrg()?.id).toBe('org-default');
  });
});

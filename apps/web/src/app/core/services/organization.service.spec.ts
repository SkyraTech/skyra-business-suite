import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OrganizationService } from './organization.service.js';
import { TenantContextService } from './tenant-context.service.js';

describe('OrganizationService - Onboarding & Context Switching', () => {
  let orgService: OrganizationService;
  let tenantService: TenantContextService;
  let mockHttp: any;
  let injector: Injector;

  beforeEach(() => {
    tenantService = new TenantContextService();
    mockHttp = {
      post: vi.fn(),
      get: vi.fn(),
    };

    injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        { provide: TenantContextService, useValue: tenantService },
        OrganizationService,
      ],
    });

    orgService = runInInjectionContext(injector, () => injector.get(OrganizationService));
  });

  it('createOrganization provisions new organization and assigns active context', () => {
    mockHttp.post.mockReturnValue(
      of({
        organization: { id: 'new-org-1', name: 'New Corp', slug: 'new-corp', status: 'ACTIVE' },
        role: 'OWNER',
      }),
    );

    orgService.createOrganization('New Corp', 'new-corp').subscribe();

    expect(mockHttp.post).toHaveBeenCalledWith('/api/v1/organizations', {
      name: 'New Corp',
      slug: 'new-corp',
    });
    expect(tenantService.activeOrg()?.id).toBe('new-org-1');
  });

  it('switchOrganization updates active tenant context', () => {
    mockHttp.post.mockReturnValue(
      of({
        activeOrganization: {
          id: 'switched-org',
          name: 'Switched Corp',
          slug: 'switched-corp',
          role: 'ADMIN',
        },
      }),
    );

    orgService.switchOrganization('switched-org').subscribe();

    expect(mockHttp.post).toHaveBeenCalledWith('/api/v1/organizations/switch', {
      organizationId: 'switched-org',
    });
    expect(tenantService.activeOrg()?.id).toBe('switched-org');
  });
});

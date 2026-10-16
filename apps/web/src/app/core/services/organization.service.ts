import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service.js';
import type { Organization } from '../models/auth.models.js';

export interface CreateOrgResponse {
  organization: Organization;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface TenantDashboardResponse {
  organizationId: string;
  name: string;
  slug: string;
  status: string;
  userRole: string;
  totalActiveMembers: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly tenantContextService = inject(TenantContextService);
  private readonly baseUrl = '/api/v1/organizations';

  createOrganization(name: string, slug?: string): Observable<CreateOrgResponse> {
    return this.http.post<CreateOrgResponse>(this.baseUrl, { name, slug }).pipe(
      tap((res) => {
        this.tenantContextService.setActiveOrg(res.organization);
      }),
    );
  }

  listOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.baseUrl);
  }

  switchOrganization(organizationId: string): Observable<{ activeOrganization: Organization }> {
    return this.http
      .post<{ activeOrganization: Organization }>(`${this.baseUrl}/switch`, { organizationId })
      .pipe(
        tap((res) => {
          this.tenantContextService.setActiveOrg(res.activeOrganization);
        }),
      );
  }

  getDashboard(organizationId: string): Observable<TenantDashboardResponse> {
    return this.http.get<TenantDashboardResponse>(`${this.baseUrl}/${organizationId}/dashboard`);
  }
}

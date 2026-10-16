import { Injectable, signal, computed } from '@angular/core';
import type { Organization } from '../models/auth.models.js';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private readonly _activeOrg = signal<Organization | null>(null);

  readonly activeOrg = computed(() => this._activeOrg());
  readonly activeOrgId = computed(() => this._activeOrg()?.id ?? null);

  setActiveOrg(org: Organization | null): void {
    this._activeOrg.set(org);
  }

  clear(): void {
    this._activeOrg.set(null);
  }
}

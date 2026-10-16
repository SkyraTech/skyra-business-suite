import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../../core/services/organization.service.js';
import { AuthService } from '../../core/services/auth.service.js';
import { TenantContextService } from '../../core/services/tenant-context.service.js';
import type { Organization } from '../../core/models/auth.models.js';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <!-- Top Navigation -->
      <header
        class="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20"
          >
            S
          </div>
          <span class="font-bold tracking-tight text-white text-lg">Skyra Business Suite</span>
        </div>

        <div class="flex items-center gap-4">
          @if (currentUser()) {
            <div class="text-xs text-right hidden sm:block">
              <p class="font-medium text-slate-200">{{ currentUser()?.fullName }}</p>
              <p class="text-slate-400">{{ currentUser()?.email }}</p>
            </div>
          }
          <button
            (click)="onLogout()"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 flex items-center justify-center p-6 relative">
        <div class="aurora-bg"></div>

        <div class="relative z-10 w-full max-w-2xl space-y-8">
          <!-- Active Organizations List (if any exist) -->
          @if (organizations().length > 0) {
            <div class="glass-panel rounded-2xl p-6 sm:p-8">
              <h2 class="text-xl font-bold text-white mb-2">Your Workspaces</h2>
              <p class="text-xs text-slate-400 mb-6">
                Select an organization to manage your business modules
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                @for (org of organizations(); track org.id) {
                  <div
                    role="button"
                    tabindex="0"
                    (click)="selectOrganization(org)"
                    (keydown.enter)="selectOrganization(org)"
                    [class.border-blue-500]="activeOrgId() === org.id"
                    [class.bg-blue-950/20]="activeOrgId() === org.id"
                    class="p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <h4 class="font-semibold text-white group-hover:text-blue-400 transition">
                        {{ org.name }}
                      </h4>
                      <p class="text-xs text-slate-400 font-mono mt-0.5">/{{ org.slug }}</p>
                    </div>
                    <span
                      class="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30"
                    >
                      {{ org.role }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Create New Organization Card -->
          <div class="glass-panel rounded-2xl p-6 sm:p-8">
            <div class="mb-6">
              <h2 class="text-xl font-bold text-white">Create New Organization</h2>
              <p class="text-xs text-slate-400 mt-1">
                Set up a dedicated multi-tenant workspace for your company
              </p>
            </div>

            @if (errorMessage()) {
              <div
                class="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs"
              >
                {{ errorMessage() }}
              </div>
            }

            @if (createdSuccess()) {
              <div
                class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span
                  >Organization created! You have been granted the
                  <strong>OWNER</strong> role.</span
                >
              </div>
            }

            <form (ngSubmit)="onCreateOrganization()" class="space-y-4">
              <div>
                <label
                  for="orgName"
                  class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                  >Company / Organization Name</label
                >
                <input
                  id="orgName"
                  type="text"
                  [(ngModel)]="orgName"
                  name="orgName"
                  (ngModelChange)="onNameChange($event)"
                  required
                  placeholder="e.g. Acme Corporation"
                  class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                />
              </div>

              <div>
                <label
                  for="orgSlug"
                  class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                  >Workspace Identifier (Slug)</label
                >
                <div class="flex items-center rounded-lg glass-input px-3">
                  <span class="text-xs text-slate-500 select-none">skyra.app/</span>
                  <input
                    id="orgSlug"
                    type="text"
                    [(ngModel)]="orgSlug"
                    name="orgSlug"
                    placeholder="acme-corp"
                    class="w-full py-2.5 pl-1 pr-3 bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                [disabled]="isSubmitting() || !orgName.trim()"
                class="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                @if (isSubmitting()) {
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Provisioning Workspace...</span>
                } @else {
                  <span>Create Workspace & Assign Owner</span>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                }
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class OnboardingComponent implements OnInit {
  private readonly orgService = inject(OrganizationService);
  private readonly authService = inject(AuthService);
  private readonly tenantContextService = inject(TenantContextService);
  private readonly router = inject(Router);

  orgName = '';
  orgSlug = '';
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly createdSuccess = signal(false);

  readonly currentUser = this.authService.currentUser;
  readonly organizations = signal<Organization[]>([]);
  readonly activeOrgId = this.tenantContextService.activeOrgId;

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.orgService.listOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        if (orgs.length > 0 && !this.tenantContextService.activeOrg()) {
          this.tenantContextService.setActiveOrg(orgs[0] ?? null);
        }
      },
      error: () => null,
    });
  }

  onNameChange(name: string): void {
    if (!this.orgSlug || this.orgSlug === this.slugify(name.slice(0, -1))) {
      this.orgSlug = this.slugify(name);
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  onCreateOrganization(): void {
    if (!this.orgName.trim()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.createdSuccess.set(false);

    this.orgService.createOrganization(this.orgName, this.orgSlug || undefined).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.createdSuccess.set(true);
        this.orgName = '';
        this.orgSlug = '';
        this.loadOrganizations();
        this.tenantContextService.setActiveOrg(res.organization);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create organization.');
      },
    });
  }

  selectOrganization(org: Organization): void {
    this.orgService.switchOrganization(org.id).subscribe({
      next: () => {
        this.tenantContextService.setActiveOrg(org);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to switch workspace.');
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      void this.router.navigate(['/auth/login']);
    });
  }
}

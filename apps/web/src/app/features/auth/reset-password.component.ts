import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden"
    >
      <div class="aurora-bg"></div>

      <div class="relative z-10 w-full max-w-md glass-panel rounded-2xl p-8 sm:p-10">
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 mb-4 shadow-lg shadow-rose-500/10"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Create New Password</h1>
          <p class="text-sm text-slate-400 mt-1">Set a secure password for your account</p>
        </div>

        @if (errorMessage()) {
          <div
            class="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
          >
            {{ errorMessage() }}
          </div>
        }

        @if (success()) {
          <div
            class="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4"
          >
            <div
              class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 class="font-bold text-white text-base">Password Reset Completed</h3>
            <p class="text-xs text-slate-300">
              All prior active sessions have been safely revoked. Please sign in with your new
              credentials.
            </p>
            <a routerLink="/auth/login" class="w-full btn-primary block text-center">Sign In Now</a>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label
                for="token"
                class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >Reset Token</label
              >
              <input
                id="token"
                type="text"
                [(ngModel)]="token"
                name="token"
                required
                placeholder="Paste reset token"
                class="w-full px-4 py-2.5 rounded-lg glass-input text-sm font-mono"
              />
            </div>

            <div>
              <label
                for="newPassword"
                class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >New Password</label
              >
              <input
                id="newPassword"
                type="password"
                [(ngModel)]="newPassword"
                name="newPassword"
                required
                minlength="12"
                placeholder="Minimum 12 characters"
                class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                autocomplete="new-password"
              />
            </div>

            <div
              class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
            >
              <span class="font-semibold">Security Note:</span> Resetting your password immediately
              terminates and invalidates all active sessions on other devices.
            </div>

            <button
              type="submit"
              [disabled]="loading() || !token || !newPassword"
              class="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              @if (loading()) {
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
                <span>Resetting Password...</span>
              } @else {
                <span>Update Password</span>
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  token = '';
  newPassword = '';
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const queryToken = this.route.snapshot.queryParamMap.get('token');
    if (queryToken) {
      this.token = queryToken;
    }
  }

  onSubmit(): void {
    if (!this.token || !this.newPassword) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid or expired password reset token.');
      },
    });
  }
}

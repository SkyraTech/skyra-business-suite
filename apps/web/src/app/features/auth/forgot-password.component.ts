import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-forgot-password',
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
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 mb-4 shadow-lg shadow-amber-500/10"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p class="text-sm text-slate-400 mt-1">Enter your email for recovery instructions</p>
        </div>

        @if (submitted()) {
          <div class="p-5 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-4">
            <div
              class="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p class="text-sm text-slate-200">
              If an active account exists for
              <span class="font-semibold text-white">{{ email }}</span
              >, you will receive password reset instructions shortly.
            </p>
            <p class="text-xs text-slate-400">
              The link expires in 1 hour and can only be used once.
            </p>
            <div class="pt-2">
              <a
                routerLink="/auth/login"
                class="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >&larr; Return to Sign In</a
              >
            </div>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label
                for="email"
                class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >Work Email</label
              >
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="name@company.com"
                class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                autocomplete="email"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading() || !email"
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
                <span>Dispatching link...</span>
              } @else {
                <span>Send Reset Link</span>
              }
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            Remember your credentials?
            <a routerLink="/auth/login" class="text-amber-400 hover:text-amber-300 font-medium ml-1"
              >Sign in</a
            >
          </div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);

  email = '';
  readonly loading = signal(false);
  readonly submitted = signal(false);

  onSubmit(): void {
    if (!this.email) return;

    this.loading.set(true);
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        // Safe generic completion prevents user enumeration
        this.loading.set(false);
        this.submitted.set(true);
      },
    });
  }
}

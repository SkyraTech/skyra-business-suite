import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden"
    >
      <!-- Aurora Gradient Glow -->
      <div class="aurora-bg"></div>

      <div class="relative z-10 w-full max-w-md glass-panel rounded-2xl p-8 sm:p-10">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-4 shadow-lg shadow-blue-500/10"
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
          <h1 class="text-2xl font-bold tracking-tight text-white">Sign in to Skyra</h1>
          <p class="text-sm text-slate-400 mt-1">Enterprise Business Suite & Tenant Portal</p>
        </div>

        <!-- Error Notification -->
        @if (errorMessage()) {
          <div
            class="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label
              for="email"
              class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
              >Work Email</label
            >
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="name@company.com"
              class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              autocomplete="email"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label
                for="password"
                class="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >Password</label
              >
              <a
                routerLink="/auth/forgot-password"
                class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >Forgot password?</a
              >
            </div>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            [disabled]="isLoading() || !email || !password"
            class="w-full btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isLoading()) {
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
              <span>Authenticating...</span>
            } @else {
              <span>Sign In</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            }
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Don't have an account?
          <a routerLink="/auth/register" class="text-blue-400 hover:text-blue-300 font-medium ml-1"
            >Create one now</a
          >
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.errorMessage.set(null);
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        void this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        const message = err.error?.message || 'Authentication failed. Please verify credentials.';
        this.errorMessage.set(Array.isArray(message) ? message[0] : message);
      },
    });
  }
}

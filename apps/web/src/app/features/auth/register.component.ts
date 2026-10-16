import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-register',
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
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mb-4 shadow-lg shadow-purple-500/10"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Create Account</h1>
          <p class="text-sm text-slate-400 mt-1">Get started with Skyra Business Suite</p>
        </div>

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

        @if (successMessage()) {
          <div
            class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
          >
            <div class="font-semibold mb-1 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verification email sent!
            </div>
            <p class="text-xs text-slate-300">{{ successMessage() }}</p>
            <div class="mt-4 pt-3 border-t border-emerald-500/20">
              <a
                routerLink="/auth/login"
                class="text-xs text-emerald-300 font-semibold hover:underline"
                >Proceed to Sign In &rarr;</a
              >
            </div>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label
                for="fullName"
                class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >Full Name</label
              >
              <input
                id="fullName"
                type="text"
                name="fullName"
                [(ngModel)]="fullName"
                required
                placeholder="Alex Morgan"
                class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              />
            </div>

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
                placeholder="alex@company.com"
                class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                autocomplete="email"
              />
            </div>

            <div>
              <label
                for="password"
                class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >Password</label
              >
              <input
                id="password"
                type="password"
                name="password"
                [(ngModel)]="password"
                required
                minlength="12"
                placeholder="At least 12 characters"
                class="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
                autocomplete="new-password"
              />
              <p class="text-xs text-slate-500 mt-1.5">
                Minimum 12 characters, uppercase, number & symbol required.
              </p>
            </div>

            <button
              type="submit"
              [disabled]="isLoading() || !fullName || !email || !password"
              class="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>Creating Account...</span>
              } @else {
                <span>Register Account</span>
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
        }

        <div class="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Already registered?
          <a routerLink="/auth/login" class="text-purple-400 hover:text-purple-300 font-medium ml-1"
            >Sign in instead</a
          >
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);

  fullName = '';
  email = '';
  password = '';
  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) return;

    this.errorMessage.set(null);
    this.authService.register(this.email, this.password, this.fullName).subscribe({
      next: (res) => {
        this.successMessage.set(res.message);
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to create account. Please verify input.';
        this.errorMessage.set(Array.isArray(msg) ? msg[0] : msg);
      },
    });
  }
}

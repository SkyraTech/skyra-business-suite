import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service.js';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden"
    >
      <div class="aurora-bg"></div>

      <div class="relative z-10 w-full max-w-md glass-panel rounded-2xl p-8 sm:p-10 text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 class="text-2xl font-bold tracking-tight text-white mb-2">Email Verification</h1>
        <p class="text-sm text-slate-400 mb-6">Confirm your email to complete registration</p>

        @if (status() === 'verifying') {
          <div class="py-8 flex flex-col items-center justify-center gap-3">
            <svg class="animate-spin h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
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
            <p class="text-sm text-slate-300">Validating verification token...</p>
          </div>
        } @else if (status() === 'success') {
          <div
            class="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 mb-6"
          >
            <svg
              class="w-10 h-10 mx-auto mb-2 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="font-bold text-base text-white">Email Verified Successfully</h3>
            <p class="text-xs text-slate-300 mt-1">
              Your account is fully activated. You may now sign in.
            </p>
          </div>
          <a routerLink="/auth/login" class="w-full btn-primary block text-center">Sign In Now</a>
        } @else if (status() === 'error') {
          <div
            class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 mb-6 text-sm"
          >
            {{ errorMessage() }}
          </div>
          <div class="space-y-4">
            <input
              type="text"
              [(ngModel)]="manualToken"
              placeholder="Paste verification token here"
              class="w-full px-4 py-2.5 rounded-lg glass-input text-sm text-center font-mono"
            />
            <button (click)="verifyToken(manualToken)" class="w-full btn-primary">
              Verify Token
            </button>
          </div>
        } @else {
          <div class="space-y-4">
            <input
              type="text"
              [(ngModel)]="manualToken"
              placeholder="Paste verification token"
              class="w-full px-4 py-2.5 rounded-lg glass-input text-sm text-center font-mono"
            />
            <button (click)="verifyToken(manualToken)" class="w-full btn-primary">
              Confirm Email
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  manualToken = '';
  readonly status = signal<'idle' | 'verifying' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifyToken(token);
    }
  }

  verifyToken(token: string): void {
    if (!token) return;

    this.status.set('verifying');
    this.errorMessage.set(null);

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(err.error?.message || 'Verification token is invalid or expired.');
      },
    });
  }
}

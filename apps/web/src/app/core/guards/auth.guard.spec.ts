import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { authGuard, onboardingGuard } from './auth.guard.js';
import { AuthService } from '../services/auth.service.js';

describe('Route Guards - Auth & Onboarding Protection', () => {
  let authService: any;
  let router: any;
  let injector: Injector;

  beforeEach(() => {
    authService = {
      isAuthenticated: vi.fn(),
      organizations: vi.fn(),
    };

    router = {
      parseUrl: vi.fn((url: string) => ({ url })),
    };

    injector = Injector.create({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('authGuard: allows navigation when user is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = runInInjectionContext(injector, () => authGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('authGuard: redirects to /auth/login when user is unauthenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = runInInjectionContext(injector, () => authGuard({} as any, {} as any));
    expect(result).toEqual({ url: '/auth/login' });
  });

  it('onboardingGuard: redirects unauthenticated users to /auth/login', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = runInInjectionContext(injector, () => onboardingGuard({} as any, {} as any));
    expect(result).toEqual({ url: '/auth/login' });
  });

  it('onboardingGuard: redirects users with 0 organizations to /onboarding', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.organizations.mockReturnValue([]);

    const result = runInInjectionContext(injector, () => onboardingGuard({} as any, {} as any));
    expect(result).toEqual({ url: '/onboarding' });
  });

  it('onboardingGuard: allows navigation when user has active organizations', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.organizations.mockReturnValue([{ id: 'org-1', name: 'Alpha Corp' }]);

    const result = runInInjectionContext(injector, () => onboardingGuard({} as any, {} as any));
    expect(result).toBe(true);
  });
});

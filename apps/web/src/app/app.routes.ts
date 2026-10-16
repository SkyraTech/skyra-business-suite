import type { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component.js';
import { RegisterComponent } from './features/auth/register.component.js';
import { VerifyEmailComponent } from './features/auth/verify-email.component.js';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component.js';
import { ResetPasswordComponent } from './features/auth/reset-password.component.js';
import { OnboardingComponent } from './features/onboarding/onboarding.component.js';
import { authGuard } from './core/guards/auth.guard.js';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/verify-email', component: VerifyEmailComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent },
  { path: 'auth/reset-password', component: ResetPasswordComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'auth/login' },
];

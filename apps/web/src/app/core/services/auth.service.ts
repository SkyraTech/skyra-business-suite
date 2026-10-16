import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { of, type Observable } from 'rxjs';
import { CsrfService } from './csrf.service.js';
import { TenantContextService } from './tenant-context.service.js';
import type { User, Organization, AuthSessionResponse, MeResponse } from '../models/auth.models.js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly csrfService = inject(CsrfService);
  private readonly tenantContextService = inject(TenantContextService);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _organizations = signal<Organization[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  readonly currentUser = computed(() => this._currentUser());
  readonly organizations = computed(() => this._organizations());
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isLoading = computed(() => this._isLoading());

  private readonly baseUrl = '/api/v1/auth';

  login(email: string, password: string): Observable<AuthSessionResponse> {
    this._isLoading.set(true);
    return this.http.post<AuthSessionResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap((res) => {
        this._currentUser.set(res.user);
        if (res.csrfToken) {
          this.csrfService.setToken(res.csrfToken);
        }
        this._isLoading.set(false);
      }),
      catchError((err) => {
        this._isLoading.set(false);
        throw err;
      }),
    );
  }

  register(
    email: string,
    password: string,
    fullName: string,
  ): Observable<{ success: boolean; message: string }> {
    this._isLoading.set(true);
    return this.http
      .post<{
        success: boolean;
        message: string;
      }>(`${this.baseUrl}/register`, { email, password, fullName })
      .pipe(
        tap(() => this._isLoading.set(false)),
        catchError((err) => {
          this._isLoading.set(false);
          throw err;
        }),
      );
  }

  verifyEmail(token: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/verify-email`, {
      token,
    });
  }

  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/forgot-password`,
      { email },
    );
  }

  resetPassword(
    token: string,
    newPassword: string,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/reset-password`, {
      token,
      newPassword,
    });
  }

  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this._currentUser.set(null);
        this._organizations.set([]);
        this.csrfService.clear();
        this.tenantContextService.clear();
      }),
      catchError(() => {
        // Even if network fails, clear local security state
        this._currentUser.set(null);
        this._organizations.set([]);
        this.csrfService.clear();
        this.tenantContextService.clear();
        return of({ success: true });
      }),
    );
  }

  fetchMe(): Observable<MeResponse | null> {
    return this.http.get<MeResponse>(`${this.baseUrl}/me`).pipe(
      tap((res) => {
        this._currentUser.set(res.user);
        this._organizations.set(res.organizations);
        if (res.organizations.length > 0 && !this.tenantContextService.activeOrg()) {
          this.tenantContextService.setActiveOrg(res.organizations[0] ?? null);
        }
      }),
      catchError(() => {
        this._currentUser.set(null);
        this._organizations.set([]);
        return of(null);
      }),
    );
  }
}

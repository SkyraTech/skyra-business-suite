import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  private readonly _csrfToken = signal<string | null>(null);

  /**
   * Read-only signal exposing active CSRF token.
   */
  readonly csrfToken = computed(() => this._csrfToken());

  constructor() {
    this.extractTokenFromCookie();
  }

  /**
   * Sets or rotates the active CSRF token in memory.
   */
  setToken(token: string | null): void {
    this._csrfToken.set(token);
  }

  /**
   * Extracts the CSRF token from the browser document cookie 'sb_csrf'.
   */
  extractTokenFromCookie(): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const matches = document.cookie.match(/(?:^|;\s*)sb_csrf=([^;]*)/);
    const token = matches && matches[1] ? decodeURIComponent(matches[1]) : null;
    if (token) {
      this._csrfToken.set(token);
    }
    return token;
  }

  /**
   * Clears the CSRF token upon logout or session invalidation.
   */
  clear(): void {
    this._csrfToken.set(null);
  }
}

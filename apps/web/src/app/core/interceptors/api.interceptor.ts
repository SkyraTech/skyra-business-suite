import { inject } from '@angular/core';
import type { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { CsrfService } from '../services/csrf.service.js';
import { TenantContextService } from '../services/tenant-context.service.js';

export const apiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const csrfService = inject(CsrfService);
  const tenantContextService = inject(TenantContextService);

  const method = req.method.toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  let headers = req.headers;

  // Security Gate Clarification 2: Safely obtain and attach CSRF token to state-changing requests
  if (isMutating) {
    const csrfToken = csrfService.csrfToken() ?? csrfService.extractTokenFromCookie();
    if (csrfToken) {
      headers = headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Security Gate Clarification 4: Attach tenant identifier target header if selected
  const activeOrgId = tenantContextService.activeOrgId();
  if (activeOrgId && !headers.has('X-Skyra-Org-ID')) {
    headers = headers.set('X-Skyra-Org-ID', activeOrgId);
  }

  // Always enable credentials (HttpOnly session cookies) for stateful API requests
  const clonedRequest = req.clone({
    headers,
    withCredentials: true,
  });

  return next(clonedRequest);
};

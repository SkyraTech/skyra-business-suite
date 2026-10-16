# Security Baseline & Tenant Isolation Specification

**Project:** Skyra Business Suite  
**Phase:** 0 — Security Architecture & Baseline Requirements  
**Date:** October 16, 2026  
**Auditor Roles:** Application Security Engineer, Cloud Security Architect  

---

## 1. Security Architecture Principles

In a multi-tenant commercial SaaS platform, security controls cannot be deferred or bolted on after feature development. The following non-negotiable security principles govern Skyra Business Suite:

1. **Zero-Trust Multi-Tenancy:** Every request is untrusted. Organization membership and tenant context must be explicitly validated on every single HTTP and MCP request.
2. **Defense in Depth:** Perimeter middleware, framework guards, domain application validation, and database-level tenancy extensions independently enforce access boundaries.
3. **Fail-Closed Authorization:** If an authorization rule, role permission, or subscription entitlement check fails, the default response is immediate denial (`HTTP 403 Forbidden` / `HTTP 401 Unauthorized`).
4. **Immutable Auditability:** All financial mutations, document status changes, privilege escalations, and administrative actions must generate tamper-resistant audit logs.

---

## 2. Threat Vector Remediation (Lessons from Legacy Audit)

The security audit of `skyra-erp` uncovered critical vulnerabilities that must be rigorously prevented in `skyra-business-suite`:

| Legacy Vulnerability Identified | Root Cause in ERP | Mandatory Defense in Skyra Business Suite |
|---|---|---|
| **Unauthenticated Organization Deletion (P0)** | `src/app/api/organization/[id]/route.ts` lacked session checks and bypassed middleware. | All API routes are protected by global NestJS `AuthGuard` by default. Only endpoints explicitly decorated with `@Public()` bypass authentication. |
| **Cross-Tenant Storage Purge (P0)** | `src/app/api/upload/route.ts` accepted client-supplied `organizationId` without membership verification. | `organizationId` is **never** accepted from client request bodies. It is extracted strictly from the authenticated session context (`@TenantId()`). |
| **Dead RBAC Authorization (P1)** | Helper functions in `src/lib/permissions.ts` were never invoked in route handlers. | NestJS `@Roles()` and `@RequirePermissions()` decorators are bound to a global `PermissionsGuard` that automatically intercepts all mutating operations. |
| **Financial Concurrency Race Condition (P1)** | Payments read invoice balances outside transactions without row-level locks. | All payment and balance modifications must execute inside database interactive transactions with row-level locking (`SELECT ... FOR UPDATE`). |
| **Floating-Point Financial Math (P1)** | Prisma `Decimal` cast to JS `Number()` with epsilon hacks (`+ 0.009`). | Currency arithmetic must use Prisma `Decimal` methods or an arbitrary-precision library (`decimal.js`). Casting to native `Number` is strictly forbidden in financial paths. |

---

## 3. Core Security Controls Specification

### 3.1 Authentication & Session Management
* **Web Sessions (Browser Client):**
  * Generated with 32 bytes of cryptographically secure random bytes (`crypto.randomBytes(32)`).
  * Stored in the database **only as a SHA-256 hash** (`tokenHash`); raw session tokens are never persisted in the database or logged.
  * Transmitted to the browser via an `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookie named `sb_session`.
  * Accompanied by a cryptographically random CSRF token (`sb_csrf`) or returned in session metadata.
* **CSRF Defense (Synchronizer / Header Verification):**
  * SameSite cookies are a baseline defense, but not sufficient on their own.
  * All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookie **must** supply an `X-CSRF-Token` header.
  * The API validates that `X-CSRF-Token` matches the session's active CSRF secret.
  * Requests that fail CSRF verification are immediately rejected with `403 Forbidden`.
* **Machine & Agent (MCP) Credentials:**
  * Passed via `Authorization: Bearer <token>` headers.
  * Machine clients bypassing cookies do not require CSRF headers because cross-origin browsers do not automatically send custom `Authorization` headers.
  * **Precedence Rule:** If both cookie and `Authorization: Bearer` header are present on a request, the `Authorization` header takes precedence.
* **Single-Use Recovery Tokens (Email Verification & Password Reset):**
  * Generated with 32 cryptographically random bytes.
  * Persisted in PostgreSQL as SHA-256 hashes (`tokenHash`).
  * Token redemption is strictly atomic using conditional updates (`WHERE tokenHash = $1 AND redeemedAt IS NULL AND expiresAt > NOW()`) inside database transactions to eliminate race conditions and double-spending.
  * Successful password reset immediately revokes **all** active sessions for the user (`DELETE FROM sessions WHERE userId = $1`).
* **Brute-Force & Abuse Mitigation:**
  * Password hashing uses Argon2id (`memoryCost: 65536, timeCost: 3, parallelism: 4`).
  * Generic responses on password recovery (`200 OK` regardless of whether the email exists) to eliminate account enumeration vectors.
  * Timing-safe authentication failure errors (`401 Unauthorized: Invalid email or password`).
  * Rate limiting configured on all authentication routes:
    * Login: 5 requests / 5 minutes / IP.
    * Registration: 3 requests / 1 hour / IP.
    * Password recovery: 3 requests / 1 hour / IP.
  * Trusted proxy configuration enabled for accurate client IP resolution behind reverse proxies.

### 3.2 Tenant Isolation Guards & Request Context
Every incoming API request passes through a multi-stage tenant resolution interceptor:
```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenancyService: TenancyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    const targetOrgId = req.headers['x-skyra-org-id'] || req.user?.defaultOrgId;

    if (!targetOrgId) {
      throw new BadRequestException('Missing organization context header (X-Skyra-Org-ID)');
    }

    // Verify active membership in the target organization
    const membership = await this.tenancyService.verifyMembership(userId, targetOrgId);
    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Access to organization workspace denied');
    }

    // Bind validated tenant context to request
    req.tenantContext = {
      organizationId: targetOrgId,
      role: membership.role,
      permissions: membership.role.permissions,
    };

    return next.handle();
  }
}
```

### 3.3 File Upload & Document Storage Security
* **Presigned URLs / Server Proxies:** Uploads to cloud storage (S3 / Supabase) must never expose administrative service keys (`SERVICE_ROLE_KEY`) to clients.
* **Tenant Path Sandboxing:** Storage paths must strictly enforce tenant sandboxing:  
  `tenants/${organizationId}/${module}/${documentId}/${filename}`.
* **MIME-Type & Magic Byte Validation:** File uploads must validate both the declared Content-Type and real magic bytes (e.g. rejecting executable files disguised as `.png`).
* **Deletion Authorization:** Any asset deletion request must verify in the database that the asset belongs to the caller’s `organizationId`.

### 3.4 Input Validation & Sanitization
* All incoming request payloads must be defined as strongly-typed DTO classes with `class-validator` and `class-transformer` decorators, or validated via Zod schemas.
* Global `ValidationPipe` with options:
  * `whitelist: true` (strips undeclared properties, preventing mass-assignment attacks).
  * `forbidNonWhitelisted: true` (rejects payloads containing extraneous fields).
  * `transform: true` (casts query strings and payloads into declared DTO types).

---

## 4. Automated CI Security Testing Requirements

Before any release or module merges, the following automated security tests must execute in the CI pipeline:
1. **Cross-Tenant Read Test:** Tenant A user attempts to fetch Tenant B’s invoice by ID. Assert: `404 Not Found` or `403 Forbidden`.
2. **Cross-Tenant Mutation Test:** Tenant A user attempts to update Tenant B’s client. Assert: `403 Forbidden`.
3. **Privilege Escalation Test:** Staff member with read-only role attempts to invoke `POST /api/v1/invoices`. Assert: `403 Forbidden`.
4. **Entitlement Gate Test:** Organization without active `hr` module subscription attempts to fetch `/api/v1/employees`. Assert: `403 Forbidden`.
5. **Dependency Vulnerability Scan:** `pnpm audit --audit-level=high` runs in every CI build.

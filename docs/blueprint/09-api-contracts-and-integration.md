# 09 --- API Contracts and Integration Standards

**Version:** 1.1 \| **Status:** Draft for approval

## API baseline

NestJS REST API, explicit validated DTOs, OpenAPI/Swagger, safe error
contract, bounded pagination and versioned public routes (proposed
`/api/v1`). API contract is part of every module's acceptance criteria.

## Module 1 Identity & Organization Onboarding Endpoints

``` text
# Public Authentication Endpoints (Rate Limited, No Session Required)
POST /api/v1/auth/register               # Register user account, emits verification token
POST /api/v1/auth/verify-email           # Redeem single-use verification token
POST /api/v1/auth/login                  # Email/password authentication, sets sb_session & sb_csrf cookies
POST /api/v1/auth/forgot-password        # Generic 200 response, generates single-use reset token
POST /api/v1/auth/reset-password         # Redeem reset token, revokes all active sessions

# Authenticated Session Endpoints (Session Cookie or Bearer Header Required)
GET  /api/v1/auth/me                     # Get authenticated user profile & memberships
POST /api/v1/auth/logout                 # Revoke active session, clears cookies

# CSRF Token Endpoint (Browser Client)
GET  /api/v1/auth/csrf                   # Generates/returns CSRF token for cookie clients

# Organization & Tenancy Endpoints (Session Required)
POST /api/v1/organizations               # Create organization + OWNER membership (Atomic Transaction)
GET  /api/v1/organizations               # List organizations user belongs to
POST /api/v1/organizations/switch        # Switch active organization context (Validates membership)
```

### Security Headers and Cookies Contract
* **Cookies:**
  * `sb_session`: `HttpOnly; Secure; SameSite=Lax; Path=/` (Raw 32-byte secret; database stores SHA-256 hash).
  * `sb_csrf`: `SameSite=Lax; Path=/` (Exposed to JavaScript for `X-CSRF-Token` header transmission).
* **Headers:**
  * `X-CSRF-Token`: Mandatory on state-changing cookie requests (`POST`, `PUT`, `PATCH`, `DELETE`).
  * `X-Skyra-Org-ID`: Indicates targeted tenant context for tenant-scoped operations; verified server-side against DB membership.
  * `Authorization`: `Bearer <rawToken>` for machine clients. Takes precedence over cookies if both provided.
* **Social Login (Google, LinkedIn, Facebook):** Explicitly deferred to future release.

## Subscription/entitlement endpoints (illustrative)

``` text
GET  /api/v1/catalog/plans
GET  /api/v1/catalog/modules
GET  /api/v1/catalog/features
POST /api/v1/subscriptions/quote
POST /api/v1/subscriptions
GET  /api/v1/subscriptions/current
POST /api/v1/subscriptions/{subscriptionId}/change
GET  /api/v1/organizations/{organizationId}/entitlements
```

Platform-owner catalog-management routes must be separate and strongly
permissioned. Customer selection must be validated server-side against
available plans, effective dates and pricing rules.

## Error contract

Stable machine-readable code, safe message, correlation ID and field
validation details as appropriate. Never expose stack traces, SQL,
secrets or internal paths.

## Contracts and validation

Validate params, body, headers and nested structures. Use allowlisted
writable fields, stable date/time/currency formats, bounded page size
and allowlisted sorting/filtering. Do not accept server-controlled
fields through generic body binding.

## Idempotency/concurrency

Define key scope, outcome storage, concurrent duplicate behavior and
payload mismatch handling for retry-sensitive actions. Apply concurrency
control where needed for numbering, subscription changes, payroll runs
and financial posting.

## Documents and files

Validate type/size, generate storage keys server-side, check
tenant/resource ownership before upload/overwrite/delete/download, and
keep private docs private. Export authorization must match ordinary
reads.

## MCP

Each tool defines input/output schema, scopes and side-effect
classification. Tools call application services/API only; no direct
database or arbitrary SQL. Confirm high-impact writes according to
policy. Validate inputs and audit actor, organization, tool, resource
and outcome.

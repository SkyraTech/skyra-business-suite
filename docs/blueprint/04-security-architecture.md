# 04 --- Security Architecture

**Version:** 1.1 \| **Status:** Draft for approval

## Security baseline

Deny by default. API is authoritative. UI visibility and route guards
are not security controls. Threat model includes account takeover,
social identity linking errors, IDOR, tenant leakage, privilege
escalation, token abuse, injection, unsafe file access, duplicate
financial operations and unsafe AI tools.

## Local and social authentication

-   Use a mature supported identity/auth library; do not invent
    OAuth/OIDC or cryptography.
-   Support local sign-in/registration only with an approved secure
    password and recovery policy.
-   Social providers planned: Google, LinkedIn and Facebook, subject to
    current provider support and app configuration.
-   Use OAuth 2.0 / OpenID Connect where supported and provider-specific
    documented flows otherwise; validate state, nonce when applicable,
    redirect URI, issuer/audience and tokens according to the selected
    library/provider.
-   Store external identity by stable provider subject/ID, not email
    alone.
-   Do not automatically merge accounts because email strings match.
    Require verified identity and an explicit secure account-linking
    flow.
-   First sign-in must create or join an organization through a
    controlled onboarding/invitation workflow; social login alone does
    not grant organization access.
-   Store client secrets in environment/secret manager. Configure
    distinct callback URLs per environment; never commit secrets.
-   Apply rate limits, safe errors, session expiry/revocation and
    security audit.

## Human sessions & Token Security

-   **Session Tokens:** Generated using `crypto.randomBytes(32)` (256-bit entropy).
-   **Storage at Rest:** Only SHA-256 cryptographic hashes (`tokenHash`) are stored in the database; raw session tokens are never persisted.
-   **Lookup & Rotation:** Incoming session tokens are hashed with SHA-256 to query active sessions. Sessions carry an expiration timestamp and are sliding-window extended or rotated upon privilege change.
-   **Dual Authentication Contract:**
    * **Web Browser Client:** Transmitted via secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`sb_session`).
    * **Machine / Mobile / MCP Clients:** Transmitted via `Authorization: Bearer <token>` header. If both are supplied, the `Authorization` header takes precedence for explicit API requests.
-   **CSRF Protection:** State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) authenticating via cookie must supply an `X-CSRF-Token` header matching the session's cryptographically bound CSRF secret. SameSite cookies are treated as defense-in-depth, not the sole barrier.
-   **Lifecycle & Revocation:** Session tokens can be explicitly revoked at logout (`DELETE /api/v1/auth/logout`). Password reset operations immediately revoke **all** active sessions for that user.
-   **Single-Use Recovery Tokens:** Email verification and password reset tokens are cryptographically random, stored as SHA-256 hashes, strictly single-use, and redeemed conditionally inside atomic transactions to prevent race conditions. Password reset tokens expire in 1 hour; email verification tokens in 24 hours.
-   **Password Hashing:** Passwords hashed with Argon2id (`memoryCost: 65536, timeCost: 3, parallelism: 4`).
-   **Abuse Prevention:** Rate limiting on auth endpoints with trusted proxy header resolution, timing-safe authentication errors ("Invalid email or password"), and generic responses on password recovery to prevent account enumeration.

## Machine/API credentials

Separate machine credentials from user sessions. Store owner,
organization, purpose, scopes, expiry, status and last-used metadata.
Generate high-entropy secrets; store only cryptographic hashes of opaque
tokens and display raw secret once. Support rotation/replacement and
revocation. Enforce scope, tenant and resource policy per request. Never
log secrets.

## Authorization and entitlements

Each request evaluates applicable principal/session status, organization
membership, permission, machine scope, module/feature entitlement,
resource ownership and approval requirements. Subscription entitlements
and user permissions are separate checks. Plan configuration must never
grant access outside the customer's active subscription or the user's
assigned authority.

## Tenant isolation

Never trust a client-supplied organization ID alone. Scope all database,
document, export, job and integration operations. Test cross-tenant
reads/updates/deletes, social login onboarding, invitation acceptance,
account linking, exports and document access.

## MCP/AI

Tools call authorized application services/API only. Validate inputs and
require scopes/permissions/entitlements. Separate read/write tools when
useful. Confirm high-impact actions according to policy. Audit actor,
organization, tool, target and outcome. No direct database access.

## Logs and audit

Audit material business/security changes with actor, organization,
action, target, outcome, timestamp and correlation ID. Never log
passwords, provider tokens, refresh tokens, cookies, API secrets or
sensitive payloads. Apply dependency/secret scans and block releases
with unresolved P0/P1 security issues.

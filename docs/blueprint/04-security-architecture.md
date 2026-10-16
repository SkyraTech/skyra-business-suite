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

## Human sessions

Use short-lived access credentials or secure server-side sessions. If
refresh tokens are used, rotate and detect reuse where supported. Prefer
Secure, HttpOnly, SameSite cookies when suitable and protect
state-changing requests against CSRF. Do not store long-lived secrets in
localStorage. Hash passwords with an approved algorithm.

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

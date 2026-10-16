# 09 --- API Contracts and Integration Standards

**Version:** 1.1 \| **Status:** Draft for approval

## API baseline

NestJS REST API, explicit validated DTOs, OpenAPI/Swagger, safe error
contract, bounded pagination and versioned public routes (proposed
`/api/v1`). API contract is part of every module's acceptance criteria.

## Identity/social endpoints (illustrative only)

``` text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/recovery/request
POST /api/v1/auth/recovery/complete
GET  /api/v1/auth/providers
GET  /api/v1/auth/{provider}/start
GET  /api/v1/auth/{provider}/callback
POST /api/v1/organizations/onboarding
POST /api/v1/organizations/{organizationId}/invitations
POST /api/v1/invitations/{invitationToken}/accept
```

Exact routes depend on selected auth library and provider callback
requirements. OAuth redirects/callbacks need documented sequence
diagrams and configuration notes as well as OpenAPI where applicable.

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

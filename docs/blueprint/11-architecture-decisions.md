# 11 --- Architecture Decision Records

**Version:** 1.1 \| **Status:** Proposed decisions; approval required
where marked

## ADR-001 --- New project boundary

**Accepted.** Build `skyra-business-suite` from scratch. `skyra-erp`
remains read-only reference material.

## ADR-002 --- Framework

**Proposed.** Angular 22.2.x standalone/lazy frontend with Tailwind CSS 4.3.x configured without
Zone.js (`provideExperimentalZonelessChangeDetection()`); NestJS 12.x REST API on Node.js 24 LTS.

## ADR-003 --- Architecture

**Proposed.** Modular monolith first; separate web/API deployment units
and optional worker.

## ADR-004 --- Database/tenancy

**Proposed.** PostgreSQL shared database with tenant-scoped rows and
strict authorization.

## ADR-005 --- ORM

**Proposed.** Prisma 6.8.x + Prisma Migrate with tenant extensions; do not mix ORM approaches.

## ADR-006 --- Auth

**Security review required.** Mature supported identity solution;
separate human sessions from scoped machine credentials. Support Google,
LinkedIn and Facebook through provider adapters after provider
configuration is verified.

## ADR-007 --- Platform reuse

**Accepted with audit gate.** Reuse framework-independent Skyra Platform
packages only after package readiness checks.

## ADR-008 --- Quality

**Proposed.** Utilities 95% line, critical domain/application logic 90%
line, backend modules 80% line, frontend 80% where meaningful, critical
paths 90% branch plus scenario tests.

## ADR-009 --- API

**Proposed.** REST, explicit DTOs, OpenAPI, safe errors, bounded
pagination and idempotency; `/api/v1` proposed.

## ADR-010 --- Accessibility

**Proposed.** WCAG 2.2 AA.

## ADR-011 --- Workspace

**Proposed.** pnpm; evaluate Turborepo only if useful.

## ADR-012 --- Financial/payroll integrity

**Required before implementation.** Decimal-safe money; approved tax,
currency, payroll jurisdiction, salary, deduction, rounding, period,
correction and retention rules; transactions/idempotency/audit.

## ADR-013 --- MCP

**Accepted.** Authorized application services/API only, never direct
database access.

## ADR-014 --- Dynamic module catalog and entitlements

**Proposed.** Product catalog, plan versions, module/feature
entitlements, shared bundles and add-ons are data-driven. Customer
choices are validated server-side; entitlement is distinct from user
authorization. Effective subscription entitlements are auditable and
time-aware. Pricing, payment, proration, tax and renewal rules remain
open.

## ADR-015 --- Complete-module delivery

**Accepted.** Do not move to the next major module until current
module's UI, API, database/migrations, Swagger/OpenAPI, tests,
security/accessibility checks, docs and acceptance criteria pass.

## ADR template

``` text
# ADR-NNN — Title
Status:
Date:
Owner:
## Context
## Decision
## Alternatives
## Consequences
## Security / tenant impact
## Testing / operations impact
## Follow-up
```

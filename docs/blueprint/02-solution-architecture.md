# 02 --- Solution Architecture

**Version:** 1.1 \| **Status:** Draft for approval

## Technology proposal

-   Angular 22.2.x standalone components, lazy-loaded feature routes, Tailwind CSS 4.3.x,
    zoneless configuration (`provideExperimentalZonelessChangeDetection()`), no Zone.js dependency.
-   NestJS 12.x REST API on Node.js 24 LTS (`>=24.15.0 <25.0.0`), strict TypeScript 6.0.x.
-   PostgreSQL 16+.
-   Prisma 6.8.x + Prisma Migrate with tenant extension; approve via ADR and do not
    mix ORM strategies.
-   `pnpm@12.3.4` workspace; Turborepo only if justified.
-   Separate testing toolchains: Vitest 5.x for web frontend, Vitest 4.1.x for API;
    Playwright E2E.
-   Distinct linting: Oxlint for API, ESLint 10.x / Angular ESLint for web.
-   Skyra Platform packages only after package-level readiness audit.

## Architecture

``` text
Angular zoneless web app
  ├─ Identity and organization onboarding
  ├─ Subscription/catalog/entitlement UI
  ├─ Lazy-loaded business modules
  └─ Typed API services + audited Skyra Platform adapters
                 │ HTTPS
                 ▼
NestJS REST API
  ├─ Authentication / sessions / social provider adapters
  ├─ Organization context / guards / policies
  ├─ Subscription catalog / entitlement evaluation
  ├─ Application use cases / domain modules
  ├─ DTO validation / exception filters / audit
  └─ Module-owned persistence adapters
                 │
                 ▼
PostgreSQL + versioned migrations
```

## Architectural boundaries

-   Modular monolith first; do not create a microservice for every
    module.
-   Controllers handle HTTP and delegate to application use cases.
-   DTOs validate untrusted inputs; persistence models are not public
    API contracts.
-   Business invariants live server-side.
-   Each module owns its rules, endpoints, data access, tests and docs.
-   Shared services (for example document rendering) expose explicit
    contracts and do not absorb module-specific rules.
-   Subscription catalog defines what can be purchased; entitlements
    define what a subscription has; authorization defines what a user
    may do.
-   A feature is accessible only when all relevant checks pass:
    authenticated identity, organization membership/context, permission,
    entitlement, resource policy and any approval requirement.
-   MCP calls authorized application services/API only.

## Module boundary examples

-   Identity owns users, external provider identities, sessions and
    credential recovery.
-   Organizations owns organizations, memberships, invitations and
    settings.
-   Subscription/Entitlements owns plan catalog, plan versions, add-ons,
    subscription selections and entitlement evaluation.
-   Client/CRM owns client/company/contact records.
-   Business Documents owns generic template management and rendering
    primitives.
-   Billing owns quotes, invoices, tax/currency rules, numbering,
    payment allocation and financial lifecycle.
-   HR owns employee, leave and attendance data.
-   Payroll owns salary structures, payroll runs, calculations,
    approvals, payslips and payroll records.
-   Payroll supplies approved payslip data to the document engine;
    document rendering does not calculate payroll.

## Module delivery rule

Each module must ship as a complete vertical slice: frontend
routes/pages/components; API
endpoints/DTOs/guards/services/repositories; schema/migrations/seeds;
Swagger/OpenAPI; unit/integration/E2E/security/accessibility tests;
audit; docs; CI pass and sign-off. No "UI-only complete" status.

## Data and concurrency

Use transactions for multi-record invariants; decimal-safe amounts;
idempotency for retry-sensitive operations; concurrency control for
numbering, payroll runs, posting and subscription changes. Use
outbox/jobs only when a real durable asynchronous workflow requires
them.

## Deployment

Separate web/API deployables, PostgreSQL, and optional worker when
needed. Environments and secrets are isolated. Build versions are pinned
and validated before scaffolding.

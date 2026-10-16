# 06 --- Testing and Quality Strategy

**Version:** 1.1 \| **Status:** Draft for approval

## Module completeness

Every module is a vertical slice and must include UI, API, database
migrations/tables, validation, authorization, Swagger/OpenAPI, tests,
audit, docs and quality gate results before the next module begins.

## Test layers

-   Unit: domain rules, calculations, validators, entitlement
    evaluation, policies.
-   Integration: API, repositories, migrations, transaction behavior,
    database constraints and authorization.
-   E2E: Playwright flows for registration, social login callbacks
    (using provider test/mocks safely), organization creation/joining,
    plan selection, module gating and business workflows.
-   Contract: OpenAPI schemas and API error/response formats.
-   Security: tenant isolation, IDOR, account linking, session
    lifecycle, scope/entitlement bypass, subscription changes, file
    access and MCP permissions.
-   Accessibility/visual: automated Axe plus manual checks and stable
    Playwright screenshots.
-   Performance: reports, large tables, exports, payroll runs and
    high-contention operations.

## Proposed coverage gates

-   Shared pure utilities: 95% line.
-   Critical domain/application logic: 90% line.
-   Backend module overall: 80% line.
-   Frontend components/services: 80% where meaningful.
-   Critical auth, tenant, entitlement, financial and payroll paths: 90%
    branch coverage for identified critical logic plus scenario-based
    integration tests. Approve final thresholds in an ADR; coverage is
    not a substitute for meaningful tests.

## Identity/social test matrix

Registration validation, duplicate account, wrong/expired callback
state, invalid provider token, provider unavailable, user cancellation,
verified/unverified email, safe account linking, no accidental
email-only merge, invitation acceptance, organization creation,
multi-org membership, revoked session, rate limits and audit without
secrets.

## Entitlement test matrix

Plan includes feature; plan excludes feature; add-on grants feature;
expired/suspended subscription; upgrade/downgrade effective time; stale
client cache; user lacks permission despite entitlement; user has
permission but subscription lacks entitlement; customer cannot alter
plan catalog; shared capability is not double-charged by dependent
modules.

## Billing/payroll test matrix

Decimal precision, tax and rounding, numbering concurrency, idempotency,
invoice lifecycle, balanced journals, payroll cutoffs, salary
components, statutory calculations as approved, leave/attendance inputs,
rounding, retroactive corrections, duplicate payroll prevention,
approval state, payslip access and tenant isolation.

## CI gates

Formatting, lint, strict typecheck, unit/coverage, integration tests,
clean migration validation, frontend/API builds, Swagger/OpenAPI
generation/validation, Playwright critical flows, accessibility scans,
dependency and secret scans. Fail required gates; exceptions need owner,
compensating control and expiry.

## Definition of Done

Requirements met; UI/API/database/migrations/Swagger complete;
authorization and tenant tests pass; relevant unit/integration/E2E tests
pass; coverage gates pass; accessibility checked; audit/logging safe;
docs updated; no P0/P1 defects; CI passes; module sign-off recorded.

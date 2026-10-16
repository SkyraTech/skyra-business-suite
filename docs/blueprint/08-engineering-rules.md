# 08 --- Engineering Rules and Coding Standards

**Version:** 1.1 \| **Status:** Draft for approval

## Scope boundaries

Work in the new `skyra-business-suite` project. Do not modify
`skyra-erp`; it is read-only. Do not modify Skyra Platform unless a
separate scoped task authorizes it. No unrelated refactors, renames,
dependency upgrades, routes, styling or migrations. Inspect before
editing. Never claim a check passed unless it was run.

## TypeScript

Strict mode; no unexplained `any`; prefer `unknown` plus validation.
Avoid unsafe casts, non-null assertions and `@ts-ignore` without a
documented reason and tests. No swallowed exceptions or fake success.

## NestJS backend

Controllers handle HTTP and delegate. DTOs validate. Guards/policies
authorize. Application services/use cases orchestrate. Module-owned
persistence adapters access the ORM. Exception filters return safe error
contracts. Do not put business logic in controllers or let MCP access
repositories directly.

Suggested layout:

``` text
src/common/{auth,authorization,config,errors,logging,validation}/
src/modules/<feature>/
  api/{controllers,dto}/
  application/{services,use-cases}/
  domain/{entities,policies,value-objects}/
  infrastructure/{persistence,repositories}/
```

Introduce abstractions where they improve domain clarity, testing or
change isolation---not just for appearance.

## Angular

Standalone components, lazy routes, supported zoneless setup without
Zone.js. HTTP calls in typed data-access services/facades. API is
authoritative. Guards are UX only. Do not store long-lived secrets in
browser storage. Keep API DTOs, persistence models and view models
distinct.

## Database/API

Every schema change has a migration; no untracked production schema
push. Use transaction-safe operations, decimal money, bounded
pagination, allowlisted sorting and explicit DTOs. No mass assignment of
server-controlled fields. Document endpoints in Swagger/OpenAPI. Test
all success, failure, forbidden and tenant cases.

## Entitlement rules

Never hardcode subscription plan logic in individual components. Use a
central entitlement evaluation contract, cached only with defined
invalidation/expiry. Every protected API operation must check permission
and entitlement separately where applicable. A client cannot edit its
own plan catalog or grant itself access.

## Logs and reviews

Structured logs/correlation IDs; never log passwords, tokens, cookies,
provider secrets or sensitive payloads. Audit material state changes.
Every new tenant-owned entity gets cross-tenant tests. Auth,
subscription, finance and payroll changes require additional review.

## AI coding-agent prompt requirements

Every task names exact objective, allowed/forbidden paths, acceptance
criteria, expected schema/API/UI, test cases and commands, Swagger
changes, security/tenant implications and documentation updates. Agent
must inspect first, avoid unrelated changes, report actual test outputs
and stop when business/legal rules are missing.

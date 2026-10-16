# Skyra Business Suite --- Blueprint Pack

**Version:** 1.1 \| **Date:** 16 October 2026 \| **Status:** Planning
baseline for approval

## Purpose

This pack defines the product requirements, architecture, security
model, engineering standards, database strategy, module delivery
process, dynamic subscription/entitlement model, testing gates, and
rollout plan for the new Skyra Business Suite.

## Non-negotiable boundaries

-   Build `skyra-business-suite` as a new project from scratch.
-   Keep `skyra-erp` read-only. Use it only to understand workflows such
    as invoice/quotation flows, GST behavior, numbering, templates and
    PDFs. Do not copy its security weaknesses or modify its source.
-   Reuse Skyra Platform capabilities only after verifying source,
    exports, build, tests, accessibility, theme support and
    compatibility.
-   Frontend: Angular configured without Zone.js. Backend: NestJS REST
    API.
-   Start with a modular monolith, with separate web/API deployment
    units and optional worker only when justified.
-   Complete one module end-to-end before moving to the next.
-   MCP/AI must call authorized application services/API; never access
    the database directly.
-   Treat shared reusable capabilities and subscription-entitled
    business features as distinct concepts.

## Document index

  --------------------------------------------------------------------------------
  File                                         Purpose
  -------------------------------------------- -----------------------------------
  `01-product-requirements.md`                 Vision, users, scope, product
                                               requirements

  `02-solution-architecture.md`                Architecture and module boundaries

  `03-database-design.md`                      Tenancy, schema and migrations

  `04-security-architecture.md`                Authentication, authorization,
                                               tokens and security

  `05-design-system-platform-integration.md`   Angular UI and Skyra Platform rules

  `06-testing-quality-strategy.md`             Testing, coverage and release gates

  `07-module-implementation-plan.md`           Complete end-to-end module order

  `08-engineering-rules.md`                    Coding standards and scope
                                               boundaries

  `09-api-contracts-and-integration.md`        REST/OpenAPI/MCP contracts

  `10-deployment-and-operations.md`            CI/CD, logging, backups and release

  `11-architecture-decisions.md`               ADRs and proposed decisions

  `12-open-decisions-and-assumptions.md`       Decisions that require approval

  `13-project-execution-checklist.md`          Phase/module sign-off checklist

  `14-module-catalog-and-entitlements.md`      Shared capabilities, module
                                               catalog, plans, add-ons and feature
                                               access

  `CHANGELOG.md`                               Pack history
  --------------------------------------------------------------------------------

## Recommended project location

Store these files in `skyra-business-suite/docs/blueprint/`.

## Development method

For each module: approve requirements → design data/API/security →
implement UI/API/database → write Swagger/OpenAPI docs → add tests → run
quality/security gates → update docs → sign off. Do not begin the next
major module until the current module's acceptance criteria pass.

The first complete product slice is Identity & Organization Onboarding,
including email/password and social sign-in providers, organization
creation/joining, secure sessions, authorization, database migrations,
UI, tests, and OpenAPI documentation. Social providers must be
configurable; no provider secret may be committed.

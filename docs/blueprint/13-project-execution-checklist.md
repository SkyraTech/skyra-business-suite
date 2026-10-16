# 13 --- Project Execution Checklist

**Version:** 1.1 \| **Status:** Living checklist

## Gate 0 --- Blueprint

-   [ ] Create new repository and place this pack at `docs/blueprint/`.
-   [ ] Confirm old ERP remains read-only.
-   [ ] Approve framework, auth, tenancy, ORM, API and quality ADRs.
-   [ ] Audit Skyra Platform packages and commit readiness matrix.
-   [ ] Confirm social provider registration/configuration requirements.
-   [ ] Define first-release scope and shared default bundle.

## Gate 1 --- Engineering foundation

-   [ ] Reproducible workspace and lockfile.
-   [ ] Angular zoneless; no Zone.js dependency.
-   [ ] NestJS config validation and health/readiness endpoints.
-   [ ] PostgreSQL local/test setup and migrations.
-   [ ] Strict TypeScript, lint, format, logs and safe error contract.
-   [ ] Unit/integration/Playwright infrastructure.
-   [ ] Swagger/OpenAPI generation/validation in CI.
-   [ ] CI security/dependency/secret gates.
-   [ ] Clean-clone setup, tests, build and migrations verified.

## Module 1 --- Identity, social login and organization onboarding

-   [ ] Registration/sign-in/recovery UI and API.
-   [ ] Google/LinkedIn/Facebook provider adapters and env setup docs.
-   [ ] External identity persistence and secure account linking.
-   [ ] Organization create/join/invitation flow.
-   [ ] Sessions/logout/revocation/rate limiting.
-   [ ] Schema/migrations/seeds and Swagger/OpenAPI.
-   [ ] Unit/integration/E2E/security/accessibility tests.
-   [ ] Coverage and security review signed off.

## Module 2 --- Organization management

-   [ ] Profile/settings, memberships/invitations and roles.
-   [ ] Tenant context and cross-tenant tests.
-   [ ] UI/API/schema/OpenAPI/tests/audit complete.

## Module 3 --- Plans, catalog, add-ons and entitlements

-   [ ] Versioned plan catalog and feature/module catalog.
-   [ ] Shared bundle and add-on configuration.
-   [ ] Customer plan selection and price preview.
-   [ ] Server-side entitlement evaluation and audit.
-   [ ] Permission-vs-entitlement negative tests.
-   [ ] Upgrade/downgrade/expiry behavior documented and tested.

## Every module after that

-   [ ] Requirements/acceptance criteria approved.
-   [ ] Data ownership/ERD/threat model reviewed.
-   [ ] API contract and permission matrix documented.
-   [ ] Tables/migrations/constraints tested.
-   [ ] UI and API implemented and integrated.
-   [ ] Swagger/OpenAPI complete and validated.
-   [ ] Unit/integration/E2E/security/accessibility tests pass.
-   [ ] Coverage gates pass.
-   [ ] Audit/docs/runbook updated.
-   [ ] CI passes and module sign-off recorded.

## Release gate

-   [ ] No known P0/P1 security issues.
-   [ ] Regression, performance and accessibility reviews complete.
-   [ ] Migration/recovery rehearsal and backup restore passed.
-   [ ] Monitoring/support/privacy/retention defined.
-   [ ] Pilot acceptance recorded.

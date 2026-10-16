# 07 --- Module-by-Module Implementation Plan

**Version:** 1.1 \| **Status:** Draft for approval

## Core rule

Complete the current module end-to-end before starting the next major
module. Do not call a module complete when only its UI or API exists.

## Module 0 --- Repository/platform readiness

Create new repository, store blueprint, confirm tool versions/ADRs,
audit Skyra Platform packages and record compatibility. Keep `skyra-erp`
read-only. **Exit:** approved architecture decisions and Platform
consumption matrix.

## Module 1 --- Identity, Registration, Social Login and Organization Onboarding

This is the first complete product module. - UI: sign-in, registration,
password recovery, provider buttons, callback/error states, session
states, first-login organization create/join, invitation acceptance,
organization selection/switching. - Providers: Google, LinkedIn,
Facebook via provider adapters; exact flow depends on provider support
and configuration. Use test identities/mocks in automated tests. - API:
auth endpoints/callback handlers, provider identity linking,
session/logout/revocation, recovery/rate limits, organization
onboarding/invitation operations. - Database: users, external
identities, sessions/token-family metadata, organizations, memberships,
invitations and audit events; migrations and test seeds. - Security:
state/nonce/redirect validation as applicable, verified identity
handling, no email-only account merging, tenant checks, rate limits,
secrets redaction. - Swagger/OpenAPI: document all API endpoints, auth
schemes, errors, callback/flow notes and permission requirements. OAuth
provider callback behavior may need supplemental sequence diagrams
because provider redirects are not ordinary JSON APIs. - Tests: unit,
integration, E2E, security, accessibility, migration and coverage gates.
**Exit:** new user can register/sign in using supported methods, create
or join an organization, access only authorized organization data, and
CI/security checks pass.

## Module 2 --- Organization Management

Organization profile/settings, memberships, invitations, role
assignments, organization switch/context, administrative audit and
ownership transfer rules if in scope. Full UI/API/schema/OpenAPI/tests.
**Exit:** tenant boundary and organization admin permissions pass
negative tests.

## Module 3 --- Subscription Catalog, Plans, Add-ons and Entitlements

Build platform-owner plan catalog UI/API, versioned plans, configurable
included modules/features, shared bundle, add-ons, customer
selection/checkout configuration, entitlement evaluation,
upgrade/downgrade/suspend/expiry behavior and audit. Payment provider,
proration and tax rules are separate approved decisions. **Exit:** API
enforces entitlements independently of user permissions; customer cannot
self-grant features; plan changes are auditable and tested.

## Module 4 --- Client/CRM Management

Clients/companies/contacts, assignments, search, filters, activities and
notes as approved. Tenant-safe CRUD, API, migrations, Swagger, tests and
audit.

## Module 5 --- Shared Business Document Engine

Reusable template definitions/versioning, tenant branding,
variables/schema validation, preview/render/PDF generation where
approved, storage metadata, permissions and audit. It is a
rendering/template capability, not the owner of billing or payroll
calculations. **Exit:** secure template access, versioning, rendering
and generated-document access tested.

## Module 6 --- Quotations and Invoicing (Core Shared Business Capability)

Make quotations/invoices available as part of the standard shared bundle
when the active plan includes that bundle; allow product-owner
configuration. Implement quote/invoice domain rules,
currency/tax/rounding/numbering/lifecycle/payment handling as approved,
with shared document engine for PDFs. **Exit:** financial test matrix,
concurrency/idempotency, authorization, audit, OpenAPI, migrations and
E2E pass.

## Module 7 --- Employee Management

Employee profiles, employment data, documents and access permissions.
Establish payroll data ownership and privacy boundaries. Full vertical
slice and tests.

## Module 8 --- Leave and Attendance

Leave types, requests, balances, approvals if approved, holidays and
attendance inputs if in scope. Define policy and calendar behavior
before coding. Full vertical slice.

## Module 9 --- Payroll Management and Payslips (High Priority)

Do not start calculations until supported country/jurisdiction, pay
periods, earnings/deductions, statutory rules, rounding, approvals,
corrections, bank/payment output and retention are approved. Implement
salary structures/components, payroll run, input validation, calculation
engine with test vectors, approval/lock lifecycle, correction runs,
audit, access control and payslip delivery. Payslips use the shared
document engine but Payroll owns calculation/results. **Exit:**
independently reviewed calculation test matrix, duplicate-run
protection, tenant/employee access controls, payroll audit, OpenAPI and
E2E tests pass.

## Module 10 --- Expenses and Accounts Payable

Expense records, vendors/bills, attachments and payment status; approval
flows only if approved. Full vertical slice.

## Module 11 --- Accounting and Banking

Double-entry ledger, accounts, journal posting, fiscal periods, bank
transactions and reconciliation. Approve accounting standard and rules
before implementation.

## Module 12 --- Projects and Inventory

Projects/tasks/time tracking; inventory
items/locations/movements/valuation after approved rules.

## Module 13 --- Reporting, Integrations and MCP

Role/tenant-aware real dashboards, scoped API credentials, MCP tools via
authorized application services, optional webhooks/jobs and audit.

## Module 14 --- Release readiness

Security review, full regression, performance, accessibility, backup
restore, migration rehearsal, monitoring, operational runbooks and pilot
acceptance.

## Repeatable module cycle

1.  Requirements and acceptance criteria.
2.  Domain/data ownership/ERD and threat model.
3.  API contract, permissions and Swagger outline.
4.  Schema/migrations/seeds.
5.  Domain/application logic and unit tests.
6.  Persistence/API integration tests.
7.  Angular UI/services/routes and UX states.
8.  OpenAPI generation/validation.
9.  E2E, security, accessibility and regression.
10. Run all quality gates, update docs and sign off.

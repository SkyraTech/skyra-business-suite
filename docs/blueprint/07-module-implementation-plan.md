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

## Module 1 --- Identity, Authentication, Security Controls & Organization Onboarding

This is the first complete product module.
- **Scope:** Email and password authentication (Argon2id), secure session management, token recovery, and atomic organization onboarding. Social login (Google, LinkedIn, Facebook) is explicitly deferred until provider credentials and redirect endpoints are provisioned.
- **Security Invariants:**
  * Session tokens: cryptographically random 32-byte tokens; SHA-256 hashed at rest; HttpOnly/Secure/SameSite cookies for web browser sessions; Authorization header for machine clients.
  * CSRF defense: Double-submit / synchronizer token (`X-CSRF-Token` header) mandatory for state-changing requests using cookie authentication.
  * Tenant isolation: Organization context derived strictly from authenticated user ID and verified DB membership (`OrganizationMembership`). Client-supplied organization IDs are never trusted as authorization.
  * Token lifecycle: Single-use, expiring, hashed at rest (`tokenHash`), conditional atomic update to eliminate race conditions. Password reset immediately revokes all user sessions.
  * Abuse mitigation: Rate limiting with trusted proxy support, timing-safe auth errors ("Invalid email or password"), generic password recovery responses (no account enumeration).
- **UI:** Sign-in, registration, email verification notice, password recovery, session states, organization onboarding wizard, organization selection and switching. Built with Angular 22 Standalone Zoneless components and reactive Signals.
- **API:** REST `/api/v1/auth/*` and `/api/v1/organizations/*` with strict class-validator DTOs and OpenAPI documentation.
- **Database:** Prisma schema defining `User`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `Organization`, `OrganizationMembership`. Atomic transactions for onboarding and token redemption.
- **Tests:** Unit, integration, security/cross-tenant, concurrency, and E2E journeys.
- **Exit:** New user registers, verifies email, authenticates securely, creates organization with atomic OWNER membership, switches tenant context, passes all cross-tenant negative tests, with CI/build/lint gates at 100% pass.

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

# 03 --- Database Design and Data Governance

**Version:** 1.1 \| **Status:** Draft for approval

## Principles

PostgreSQL proposed; Prisma Migrate provisionally. Every schema change
has a reviewed migration tested from a clean database and previous
supported version. Do not create a database/schema per module by
default.

## Tenant model

Initial proposal: shared database, tenant-owned rows have
`organization_id`, platform-global catalog/configuration is explicitly
classified. Every request resolves organization context from
authenticated identity and membership; client-supplied organization IDs
are never authorization proof. Tenant-scoped queries, exports,
documents, jobs and integrations are mandatory. Use tenant-aware unique
constraints and prevent cross-tenant foreign-key references. RLS may add
defense in depth but does not replace application checks.

## Conceptual Identity/Organization entities

-   `users`: `id`, `email` (unique), `password_hash`, `full_name`, `email_verified`, `created_at`, `updated_at`.
-   `sessions`: `id`, `user_id`, `token_hash` (unique, SHA-256), `csrf_secret` (cryptographic secret), `expires_at`, `created_at`, `last_active_at`. Raw session secrets are never stored.
-   `email_verification_tokens`: `id`, `user_id`, `token_hash` (unique, SHA-256), `expires_at`, `redeemed_at`, `created_at`. Strictly single-use.
-   `password_reset_tokens`: `id`, `user_id`, `token_hash` (unique, SHA-256), `expires_at`, `redeemed_at`, `created_at`. Strictly single-use.
-   `organizations`: `id`, `name`, `slug` (unique), `status` (`ACTIVE | SUSPENDED`), `created_at`, `updated_at`.
-   `organization_memberships`: `id`, `organization_id`, `user_id`, `role` (`OWNER | ADMIN | MEMBER`), `is_active`, `created_at`, `updated_at`. Composite unique on `[organization_id, user_id]`.
-   `audit_events`: `id`, `actor_id`, `organization_id`, `action`, `resource_type`, `resource_id`, `outcome`, `ip_address`, `created_at`.
-   `external_identities`: (Deferred to future social login phase). Raw provider tokens never stored.

## Subscription catalog and entitlements

Conceptual tables to refine during the module design: -
`product_modules` --- catalog of purchasable/available modules -
`product_features` --- granular business capabilities/features - `plans`
and `plan_versions` - `plan_module_entitlements` -
`plan_feature_entitlements` - `plan_addons` / `addons` -
`subscriptions` - `subscription_items` or selected modules/add-ons -
`subscription_entitlement_snapshots` / effective entitlement records -
`subscription_change_events` / audit references - `usage_counters` only
for defined metered limits - price/currency/tax tables only after
commercial rules are approved

Do not treat a UI component name as a security permission. Entitlements
should represent business capabilities and limits (for example,
`billing.invoices.create`, `documents.templates.customize`,
`payroll.payslips.generate`) rather than arbitrary visual widgets. Keep
plan configuration versioned and auditable. Avoid hardcoding plan/module
access in frontend conditionals.

## Business module entities

Client/CRM: companies, clients, contacts, leads, activities. Documents:
templates, template versions, generated document metadata,
access/retention metadata. Billing: quotations/lines, invoices/lines,
credit notes, payments, tax config, document sequences. HR: employees,
employee documents, leave types/requests/balances, attendance if in
scope. Payroll: salary structures/components, payroll
periods/runs/lines, deductions/earnings, approvals, payslip metadata and
audit records. Accounting: accounts, journal entries/lines, periods,
reconciliation. Other modules as separately designed.

## Database conventions

Consistent snake_case; UUIDs proposed; explicit foreign keys, checks,
indexes and unique constraints. Use NUMERIC/DECIMAL for money and exact
quantities, currency codes, UTC timestamps and business timezone where
relevant. JSON only for genuinely flexible metadata. Soft/hard delete is
decided per entity and retention requirements.

## Migrations

Each module owns its migration sequence; all migrations run in CI from
an empty database. Include safe constraints/indexes, test data fixtures,
upgrade/recovery notes, and a reviewed plan for destructive changes.
Never use untracked production schema pushes.

## Financial/payroll integrity

Before billing approve currencies, tax jurisdiction, rounding,
numbering, lifecycle, corrections and payment allocation. Before payroll
approve jurisdiction, salary rules, statutory deductions, tax treatment,
rounding, cutoff/period, approval, correction and payslip retention
rules. Use transactions and idempotency/concurrency controls.
Posted/approved records remain traceable and are corrected through
explicit workflows.

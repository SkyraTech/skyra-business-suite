# 12 --- Open Decisions and Assumptions

**Version:** 1.1 \| **Status:** Review before feature implementation

  ---------------------------------------------------------------------------
  ID                      Decision                    Proposed status
  ----------------------- --------------------------- -----------------------
  D-01                    First sellable release      Identity/tenancy +
                          scope                       plan/entitlements +
                                                      CRM + shared document
                                                      capability +
                                                      quotations/invoices;
                                                      confirm

  D-02                    Angular version/zoneless    Supported stable
                          configuration               version; verify library
                                                      compatibility

  D-03                    Node/Nest versions          Supported stable
                                                      versions pinned in
                                                      lockfile

  D-04                    ORM/migrations              Prisma + Prisma Migrate
                                                      proposal

  D-05                    Workspace                   pnpm; Turborepo if
                                                      justified

  D-06                    Authentication              Select mature solution
                          library/provider            after security review

  D-07                    Session transport           Secure HttpOnly cookies
                                                      and CSRF controls where
                                                      applicable

  D-08                    Tenant model                Shared PostgreSQL with
                                                      `organization_id` and
                                                      strict policy

  D-09                    Membership                  Many-to-many
                                                      user/organization
                                                      proposal

  D-10                    Roles/permissions           Platform-level and
                                                      organization-scoped
                                                      policies

  D-11                    Social providers            Google, LinkedIn,
                                                      Facebook; verify app
                                                      registration, current
                                                      API/OIDC support and
                                                      terms

  D-12                    Subscription payment        Not selected
                          provider                    

  D-13                    Hosting/cloud               Not selected

  D-14                    Logging stack               Structured JSON;
                                                      ELK-compatible if
                                                      selected

  D-15                    Accessibility               WCAG 2.2 AA proposal

  D-16                    API versioning              `/api/v1` proposal

  D-17                    Shared default bundle       Decide exactly which
                                                      capabilities every plan
                                                      includes;
                                                      invoice/quotation
                                                      bundle is configurable

  D-18                    Plan pricing/limits/add-ons Not finalized; dynamic
                                                      catalog required

  D-19                    Subscription lifecycle      Upgrade/downgrade,
                                                      proration, suspension,
                                                      cancellation, grace
                                                      period, renewal and
                                                      effective dates require
                                                      decision

  D-20                    Currency/countries/tax      Must be approved before
                                                      billing

  D-21                    Accounting standard/fiscal  Not finalized
                          periods                     

  D-22                    Payroll                     Must be approved before
                          jurisdiction/statutory      payroll calculations
                          rules                       

  D-23                    Payroll scope               Pay periods, salary
                                                      components, deductions,
                                                      approvals, corrections
                                                      and outputs to be
                                                      defined

  D-24                    Inventory valuation         Not finalized

  D-25                    Object storage              Provider/private access
                                                      model before documents

  D-26                    Data                        Product/legal decision
                          retention/export/deletion   

  D-27                    Test frameworks/coverage    Proposed thresholds in
                                                      ADR-008

  D-28                    Platform package versions   Audit and pin each
                                                      approved package
  ---------------------------------------------------------------------------

## Assumptions

-   Commercial multi-tenant product.
-   Complete one module at a time.
-   Shared document generation is reusable, while billing and payroll
    own their calculations and lifecycle.
-   The common invoice/quotation bundle can be included with other
    modules according to configurable plan policy; do not double-charge
    a shared capability merely because multiple modules consume it.
-   UI component visibility is not a security boundary.
-   Customer customization is limited to catalog-supported options and
    server-validated.
-   Old ERP is workflow reference only.
-   AI/MCP write access follows identity, scope, permission, entitlement
    and audit controls.

## Implementation blockers

Before foundation coding: approve framework/auth/tenancy/ORM/API/quality
decisions. Before plan catalog: decide commercial catalog ownership,
plan versioning and customer selection behavior. Before checkout: select
payment provider and pricing/tax/proration rules. Before billing:
approve jurisdiction/currency/tax/rounding. Before payroll: approve
jurisdiction and payroll rules. Before production: approve hosting,
storage, retention, backup/recovery and operational ownership.

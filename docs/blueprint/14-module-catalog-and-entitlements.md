# 14 --- Module Catalog, Shared Capabilities and Dynamic Entitlements

**Version:** 1.1 \| **Status:** Proposed product model

## 1. Purpose

Allow Skyra Tech to define product plans dynamically and allow customers
to choose eligible modules, add-ons and supported customizations at
purchase. Shared capabilities should be reused across modules and
included according to plan policy, not duplicated or hardcoded.

## 2. Four separate concepts

1.  **Module:** a business domain/package of workflows, such as CRM,
    Billing, HR or Payroll.
2.  **Feature entitlement:** a business capability or limit, such as
    invoice creation, custom template editing, payroll run execution,
    maximum employee count or document volume.
3.  **User permission:** what a particular user may do within their
    organization and role.
4.  **UI component:** a reusable visual/interaction element. It is not
    itself a security permission.

Effective access requires the active subscription to entitle the
capability AND the user to be authorized AND the request to pass
tenant/resource policy.

## 3. Proposed product layers

### Core Platform (technical foundation)

Identity, organizations, access policies, audit, subscription
evaluation, notifications, integration boundary and shared UI shell.
These are required to operate the product.

### Shared Business Bundle (commercially configurable)

Candidate shared capabilities: document generation/templates,
print/download/export, quotations and invoices. Product owner can
include these in standard plans or configure availability. Do not
hardcode that every plan must include every item before pricing/product
approval.

### Paid business modules

CRM/client management; HR/employee management; leave/attendance;
payroll/payslips; accounting; banking; expenses/payables; projects;
inventory; reporting; integrations.

A customer who buys an eligible module receives the shared capabilities
included in their plan. Example: a Payroll subscription may include the
shared document renderer and invoice/quotation bundle according to plan
rules, while Payroll itself supplies payroll data and payslip rules.

## 4. Plan model

A plan version may define: - plan name/description/status and sale
availability; - included modules; - included shared capabilities; -
granular feature entitlements; - add-ons and compatible combinations; -
usage limits/quotas; - allowed customization options; - billing cadence,
price, currency, taxes and effective dates once commercial rules are
approved; - upgrade/downgrade and grace-period policy; - version and
audit metadata.

Plans should be versioned. Changes to a plan must define whether
existing subscribers retain a snapshot, migrate to a new version, or
receive a scheduled entitlement change. Do not silently change existing
customer access or price.

## 5. Customer purchase/configuration flow

1.  Browse published plans and modules.
2.  Choose a base plan.
3.  Select eligible modules/add-ons.
4.  Configure supported options (for example, template branding, enabled
    workflows, user/employee limits, or approved custom fields).
5.  See included capabilities, limits and price breakdown.
6.  Validate compatibility and price on the server.
7.  Confirm checkout using the selected payment provider after it is
    approved.
8.  Create subscription and effective entitlement snapshot only after
    the defined payment/activation condition.
9.  Display subscription, modules, features, limits, renewal/change
    policy and audit history.
10. Handle upgrades, downgrades, expiry, suspension and cancellation
    according to approved effective-date rules.

Do not let the client submit arbitrary price, module IDs not for sale,
or custom entitlement flags. Server derives price and allowed
entitlements from the published catalog.

## 6. Entitlement evaluation

A central policy service evaluates a request such as
`billing.invoices.create` or `payroll.payslips.generate`. It checks: -
organization has an active entitlement; - entitlement is effective now
and not suspended; - usage limits, if any, are not exceeded; - user has
the required permission; - resource belongs to the authorized
organization; - action-specific approvals are satisfied.

Use stable feature keys, not display names or UI component labels.
Centralize evaluation and cache only with defined TTL/invalidation so
revoked entitlements do not remain effective indefinitely.

## 7. Shared capability reuse

-   Build generic document rendering/template infrastructure once.
-   Billing owns invoice/quotation rules and data.
-   HR owns employee data.
-   Payroll owns salary calculation and payslip data.
-   Contract workflow owns contract-specific states if introduced.
-   Shared engine receives validated input and renders the relevant
    template.
-   Do not make the document engine decide whether a tax amount or
    salary deduction is correct.
-   Do not charge for the same shared capability multiple times simply
    because multiple modules use it; pricing is plan/catalog policy.

## 8. Customer customization boundaries

Supported customization can include branding, templates, selected
options, workflow settings and defined limits. Configuration is
schema-validated, versioned, tenant-scoped, audited and reversible where
practical. Customers cannot customize code, bypass authorization, alter
protected financial/payroll calculations, or grant themselves
unpurchased entitlements.

## 9. Platform-owner vs customer admin

Platform owner manages product catalog, plan versions, pricing,
module/feature availability and default shared bundles. Customer admin
chooses from eligible offers and manages permitted organization
configuration. These are separate APIs and permission sets.

## 10. Required tests

-   Included feature is granted.
-   Excluded feature is denied.
-   Add-on grants only the intended capability.
-   Expired/suspended subscription loses access at defined effective
    time.
-   Upgrade/downgrade handles existing access according to policy.
-   User permission denial still wins even when the subscription
    includes the feature.
-   Subscription entitlement denial wins even if the user role has the
    permission.
-   Customer cannot edit platform catalog or forge a price.
-   Shared capability is not duplicated/double-charged by dependent
    module behavior.
-   Tenant A cannot inspect or alter Tenant B's
    subscription/entitlements.
-   Cache invalidation/effective-date behavior is tested.

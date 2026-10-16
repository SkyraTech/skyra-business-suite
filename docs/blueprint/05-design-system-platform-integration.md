# 05 --- Design System and Skyra Platform Integration

**Version:** 1.1 \| **Status:** Draft for approval

## UX principles

Create a consistent, responsive and accessible business UI. Support
clear loading, empty, error, forbidden and success states. Build shared
navigation, form patterns, tables, document preview/print/download,
notifications and theme tokens. Light/dark mode is included if approved
for the first release.

## Angular

Use standalone components, lazy-loaded feature routes and supported
zoneless configuration; no Zone.js dependency. Keep HTTP calls in typed
API services/facades, not reusable UI components. Server owns
business/security rules. Guards improve navigation UX only. Verify
third-party libraries work without Zone.js.

## Skyra Platform adoption

Before using a package, inspect source/exports, build, declarations,
tests, accessibility, responsive/theme behavior, browser compatibility,
license and dependencies. Record package readiness as approved / limited
/ not approved. Keep framework-independent primitives in Platform;
Angular adapters and product-specific workflows stay in Business Suite.
Do not silently duplicate existing generic components.

## Shared component vs entitlement

A visual/UI component is not itself an authorization boundary. Gate
business capabilities and operations such as invoice creation, template
customization or payroll execution. Shared visual controls may render
across screens, while the API decides whether the user and subscription
can perform a business action.

## Dynamic module/feature UX

-   Plan catalog and checkout UI render from server-provided catalog
    data, not hardcoded plan names.
-   Show included modules, shared capabilities, add-ons, limits and
    price changes before confirmation.
-   Only show choices the platform has marked available for sale; server
    validates every submitted selection.
-   Organization admins see their active plan, included entitlements,
    configurable options, usage/limits, and upgrade paths allowed by
    policy.
-   On subscription changes, refresh entitlement state and handle
    revoked access safely; do not leave stale privileged screens/actions
    active.
-   Do not expose platform-owner plan-editing controls to customer
    organization admins.

## Templates/documents

Provide a reusable template editor/preview experience where allowed.
Tenant-customizable templates must be isolated by organization,
versioned, permissioned and auditable. Shared rendering engine does not
own invoice tax or payroll calculation rules.

## Accessibility

WCAG 2.2 AA is proposed. Run automated Axe checks plus manual keyboard,
focus, labels, contrast, zoom/reflow and reduced-motion checks. Dialogs
manage and restore focus. Never convey status by color alone.

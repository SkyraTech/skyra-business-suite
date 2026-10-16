# Skyra Platform Reuse & Angular Zoneless Compatibility Matrix

**Project:** Skyra Business Suite  
**Target Frontend:** Angular Standalone Components (Zoneless Change Detection)  
**Date:** October 16, 2026  
**Auditor Roles:** Senior Frontend Architect, Design Systems Engineer  

---

## 1. Evaluation Methodology for Angular Zoneless Frontend

The proposed frontend stack for Skyra Business Suite uses:
* **Angular Standalone Components:** Modular, self-contained components without `NgModule`.
* **Zoneless Change Detection:** Configured via `provideExperimentalZonelessChangeDetection()`; Zone.js is completely omitted from the runtime bundle.
* **W3C Custom Elements (Web Components):** Embedded via Angular's `CUSTOM_ELEMENTS_SCHEMA`.

### 1.1 Compatibility Criteria
1. **Property Binding:** Custom elements must accept complex object and array data via standard DOM property reflection (`[data]="myData"`).
2. **Event Dispatch in Zoneless Mode:** Custom Elements must emit standard DOM `CustomEvent` instances. In Angular zoneless mode, event listeners registered in Angular templates (`(skyra-change)="onEvent($event)"`) naturally trigger Angular change detection cycles without Zone.js.
3. **Packaging & Exports:** Package manifests (`package.json`) must provide modern, valid ESM export maps (`"exports"`) with `"types"` specified first for Angular CLI and TypeScript strict type resolution.
4. **Theme Customization:** Custom elements must expose styling hooks via CSS custom properties (`var(--skyra-*)`) and standard Shadow DOM `::part()` selectors.

---

## 2. Package-by-Package Evaluation Matrix

| # | Package Name | Architectural Type | Classification | Angular Zoneless Compatibility | Discovered Gaps & Adaptation Needed |
|---|---|---|:---:|---|---|
| 1 | `@skyra-tech-platform/design-tokens` | Pure CSS / TS Tokens | **Reusable** | 100% Native. Injected into `styles.css` / root Angular styles. | None. Production ready. |
| 2 | `@skyra-tech-platform/utils` | Pure TypeScript | **Reusable** | 100% Native. Date, string, currency, and shortcut functions work directly in Angular services. | None. Production ready. |
| 3 | `@skyra-tech-platform/data-export` | Pure TypeScript | **Reusable** | 100% Native. Browser Blob/CSV/Excel download triggers directly from Angular components. | None. Production ready. |
| 4 | `@skyra-tech-platform/validation` | Pure TypeScript | **Reusable** | 100% Native. Zod schemas integrate seamlessly with Angular reactive forms or standalone facades. | Domain-specific business schemas (invoices, GST) stay in Business Suite. |
| 5 | `@skyra-tech-platform/button` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-button>`. Emits native click events. Supports ElementInternals. | None. Fully compatible. |
| 6 | `@skyra-tech-platform/checkbox` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-checkbox>`. Supports indeterminate state and change events. | None. Fully compatible. |
| 7 | `@skyra-tech-platform/input` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-input>`. Value and input events bind cleanly. | None. Fully compatible. |
| 8 | `@skyra-tech-platform/textarea` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-textarea>`. Value binding works natively. | None. Fully compatible. |
| 9 | `@skyra-tech-platform/radio` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-radio>`, `<skyra-tech-radio-group>`. | None. Fully compatible. |
| 10 | `@skyra-tech-platform/switch` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-switch>`. Boolean checked property binds directly. | None. Fully compatible. |
| 11 | `@skyra-tech-platform/dynamic-select` | Form-Associated Custom Element | **Reusable** | Native via `<skyra-tech-dynamic-select>`. Supports search, multi-select, and custom events. | None. Fully compatible. |
| 12 | `@skyra-tech-platform/dialog` | Modal Overlay Custom Element | **Adaptation required** | `<skyra-tech-dialog>` is DOM-ready, but package currently has **0 automated unit tests**. | Recommend adding unit test suite in Platform before critical modal use. |
| 13 | `@skyra-tech-platform/app-shell` | Layout Scaffold Custom Element | **Reusable** | Native via `<skyra-tech-app-shell>`. Slots project Angular template content. | Ensure navigation routing links integrate with Angular Router (`routerLink`). |
| 14 | `@skyra-tech-platform/data-table` | Data Grid Custom Element | **Not reusable yet** | `<skyra-tech-data-table>` has rich client sorting/filtering, but **fails TypeScript compilation (`tsc --noEmit`) in Platform**. | **Blocker:** Must fix Platform compilation errors and add server-side pagination events before adoption. |
| 15 | `@skyra-tech-platform/tabs` | Navigation Custom Elements | **Not reusable yet** | `<skyra-tabs>` is DOM-ready, but **package.json completely omits `"exports"` field**, causing Angular CLI import resolution failure. | **Blocker:** Add canonical `"exports"` map in Platform. Standardize `<skyra-tech-tabs>` tag name. |
| 16 | `@skyra-tech-platform/date-time` | Form Controls Custom Elements | **Adaptation required** | Functional, but package omits `"test"` script in `package.json`, escaping workspace verification. | Register test script in Platform. |
| 17 | `@skyra-tech-platform/dynamic-form` | Schema Form Custom Element | **Adaptation required** | Schema engine is powerful, but needs an Angular `ControlValueAccessor` directive for seamless integration with Angular Signals / Reactive Forms. | Provide light Angular facade directive in Business Suite. |
| 18 | `@skyra-tech-platform/accordion` | Disclosure Custom Element | **Adaptation required** | Functional, but uses legacy prefix `<skyra-accordion>` instead of `<skyra-tech-accordion>`. Local lint script crashes. | Fix local lint script and standardize canonical prefix. |
| 19 | `@skyra-tech-platform/collapsible` | Disclosure Custom Element | **Adaptation required** | Functional, but uses legacy prefix `<skyra-collapsible>`. | Standardize canonical prefix in Platform. |
| 20 | `@skyra-tech-platform/command-palette` | Global Search Custom Element | **Reusable** | Dual tag aliases `<skyra-tech-command-palette>`. Keyboard events work natively. | Bind search results via Angular signals. |
| 21 | `@skyra-tech-platform/context-menu` | Popup Menu Custom Element | **Reusable** | Dual tag aliases `<skyra-tech-context-menu>`. Coordinates bind cleanly. | Compatible. |
| 22 | `@skyra-tech-platform/dropdown-menu` | Floating Menu Custom Element | **Reusable** | Dual tag aliases `<skyra-tech-dropdown-menu>`. Emits select custom events. | Compatible. |
| 23 | `@skyra-tech-platform/popover` | Floating Overlay Custom Element | **Reusable** | Dual tag aliases `<skyra-tech-popover>`. | Compatible. |
| 24 | `@skyra-tech-platform/loader` | Skeletons / Spinners | **Adaptation required** | Functional, but only registers legacy `<skyra-spinner>`, `<skyra-progress>`. | Add canonical `<skyra-tech-*>` aliases in Platform. |
| 25 | `@skyra-tech-platform/notification` | Alert Bar Custom Element | **Adaptation required** | Functional, but committed tarball in package folder is wrong (`button.tgz`). | Clean package directory in Platform. |
| 26 | `@skyra-tech-platform/toast` | Imperative Toast Engine | **Adaptation required** | Imperative `toast()` function is usable, but committed tarball in package folder is wrong (`button.tgz`). | Clean package directory in Platform. |
| 27 | `@skyra-tech-platform/pdf-viewer` | Media Canvas Custom Element | **Reusable** | `<skyra-tech-pdf-viewer>` renders PDF buffers in client canvas cleanly. | Compatible for document preview screens. |
| 28 | `@skyra-tech-platform/qr` | QR Code Matrix Engine | **Not relevant (Initial)** | Matrix generation and SVG rendering work, but not required in initial Phase 0/1 core. | Available for future receipt / E-invoice QR rendering. |

---

## 3. Platform Package Gaps Requiring Extraction

The following capabilities are missing from `@skyra-tech-platform/*` and must be extracted into Platform or provided as temporary shared components:
1. **`@skyra-tech-platform/pagination` (High Priority):**
   * Missing as a standalone package. Needed for all server-paginated tables and audit lists.
2. **`@skyra-tech-platform/phone-input` (Medium Priority):**
   * Missing from `packages/*` (only exists as React code in `dashboard`). Needed for international user onboarding and client creation.
3. **`@skyra-tech-platform/signature-pad` (Medium Priority):**
   * Missing from Platform. Needed for invoice approvals, contracts, and delivery confirmations.

---

## 4. Recommendations for Platform Team (Separate Approval Track)

1. **Fix P0 Build & Export Defects:**
   * Repair `@skyra-tech-platform/data-table` tsconfig exclusion.
   * Add `"exports"` map to `@skyra-tech-platform/tabs`.
   * Re-order package exports condition order (`"types"` first).
2. **Repository Cleanliness:**
   * Delete stale empty directories `packages/ui` and `packages/dialogs`.
   * Remove binary `.tgz` archive files committed to git across 20 packages.
3. **Standardize Tag Registration:**
   * Ensure all 24 UI packages define canonical `<skyra-tech-*>` Custom Elements while retaining deprecated aliases.

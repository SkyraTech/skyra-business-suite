# Engineering Standards & Repository Rules

**Project:** Skyra Business Suite  
**Version:** 1.0  
**Date:** October 16, 2026  
**Status:** Non-Negotiable Engineering Contract  

---

## 1. General Principles

1. **Production-First Mindset:** No temporary mock data, stubbed return values, or hardcoded metrics in production paths. If a feature or integration is incomplete, return an explicit error or hide the UI element behind a feature gate.
2. **Defensive Programming:** Never trust user input, client-side calculations, or third-party webhooks. Business invariants live strictly on the server.
3. **Module Independence:** High cohesion, loose coupling. Modules communicate through explicit domain services and contracts, never through direct database cross-joins.

---

## 2. TypeScript & Code Standards

* **Strict Mode:** `tsconfig.base.json` must enforce:
  * `"strict": true`
  * `"noImplicitAny": true`
  * `"strictNullChecks": true`
  * `"noUncheckedIndexedAccess": true`
  * `"exactOptionalPropertyTypes": true`
* **Zero `any` Policy:** Explicit types are mandatory. Use `unknown` with type guards or Zod parsing if the incoming structure is dynamic. Disallow `as any` casting.
* **Error Handling:**
  * In NestJS: Throw standard HTTP exceptions (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`). Never return raw 500 errors or uncaught promise rejections.
  * In Angular: Use a global error interceptor that maps API errors into user-friendly notifications while logging technical details.
* **Financial Decimal Safety:**
  * Never cast Prisma `Decimal` to JavaScript `Number` in accounting or billing code.
  * Always perform calculations using `Decimal.add()`, `Decimal.sub()`, `Decimal.mul()`, `Decimal.div()`.
  * Ensure all monetary database columns define explicit precision: `@db.Decimal(14, 2)`.

---

## 3. Angular Standalone (Zoneless) Standards

* **Standalone Architecture:** Every component, directive, and pipe must specify `standalone: true`.
* **Zoneless State Management:**
  * Bootstrap via `provideExperimentalZonelessChangeDetection()`.
  * Zone.js must **not** be included in `polyfills` or `angular.json`.
  * Component state must use **Signals** (`signal()`, `computed()`) and RxJS observables converted via `toSignal()`.
* **Custom Elements Integration:**
  * Components consuming `@skyra-tech-platform/*` must declare `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
  * Property bindings pass data directly: `[data]="tableRows()"`.
  * Event bindings capture custom events: `(skyra-change)="onFilterChange($event)"`.
* **Template Best Practices:**
  * Use the new built-in control flow (`@if`, `@for`, `@switch`). Legacy `*ngIf` and `*ngFor` are prohibited.
  * Track all `@for` loops by unique identifier: `@for (item of items(); track item.id)`.

---

## 4. NestJS Standards

* **Layered Architecture:**
  1. `*.controller.ts`: Handles HTTP routing, parameters, Swagger decorators, and delegates to services. No database queries.
  2. `*.service.ts`: Implements application use cases, transaction orchestration, and business logic.
  3. `*.repository.ts`: Wraps Prisma ORM data access queries with tenant filtering.
  4. `dto/*.dto.ts`: Declares validation schemas using `class-validator` and `class-transformer`.
* **Tenant Scoping Decorator:**
  * Handlers must receive the validated tenant context via custom parameter decorators:
    ```typescript
    @Post()
    async createInvoice(
      @TenantId() orgId: string,
      @CurrentUser() user: AuthenticatedUser,
      @Body() dto: CreateInvoiceDto,
    ) { ... }
    ```
* **Dependency Injection:** Inject repositories and services through constructor parameters; do not instantiate singletons manually.

---

## 5. Database & Migration Rules

1. **Additive Migrations:** Production database migrations must be purely additive. Never drop columns, tables, or rename active models without a multi-phase migration strategy (expand -> migrate data -> contract).
2. **Mandatory Tenant Scoping:** Every new business model must define `organizationId String` and an index starting with `organizationId`.
3. **Transaction Boundaries:** Any business operation that alters more than one table (e.g. creating an invoice with line items, recording a payment and updating invoice balance, posting a journal entry) must execute inside `prisma.$transaction()`.
4. **Row-Level Locking:** When updating a balance (invoice balance, account balance, stock quantity), execute a row-level lock (`SELECT ... FOR UPDATE`) before calculating the updated value.

---

## 6. Git, Branching & CI Requirements

* **Branch Strategy:**
  * `main`: Production-ready, deployable baseline.
  * `feature/<module>-<task>`: Isolated feature branches.
* **Conventional Commits:** All commit messages must follow Conventional Commits:  
  `feat(billing): add sequential invoice number generator`  
  `fix(security): enforce tenant isolation on asset deletion`  
  `docs(blueprint): add security baseline document`
* **Pull Request Gates:** Every PR must pass:
  1. `pnpm lint` (0 errors).
  2. `pnpm typecheck` (0 errors).
  3. `pnpm test` (100% test pass rate, meeting coverage thresholds).
  4. `pnpm audit` (0 High or Critical vulnerabilities).

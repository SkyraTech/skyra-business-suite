# Architecture Decision Register (ADR) — Skyra Business Suite

**Project:** Skyra Business Suite  
**Date:** October 16, 2026  
**Status Legend:**
* `ACCEPTED`: Formally agreed architectural decision.
* `PROPOSED`: Proposed baseline pending Phase 0 technical sign-off.
* `REJECTED`: Alternative explicitly evaluated and rejected with recorded rationale.
* `REQUIRES_REVIEW`: Requires security, legal, or stakeholder approval.

---

## ADR-001: New Repository Boundary for Skyra Business Suite
* **Status:** `ACCEPTED`
* **Context:** Skyra ERP contains legacy prototype code, dead authorization paths, unauthenticated deletion endpoints, and coupled React route handlers.
* **Decision:** Create `skyra-business-suite` as a new, completely isolated project. Keep `skyra-erp` strictly read-only for business workflow reference.
* **Rationale:** Prevents polluting the new commercial SaaS codebase with technical debt, unauthenticated endpoints, and floating-point financial bugs.
* **Consequences:** New project starts clean with zero legacy baggage; established domain calculation rules (Indian GST, invoice sequencing) are referenced cleanly.

---

## ADR-002: Frontend Framework Selection — Angular 22.2.x Standalone (Zoneless) & Tailwind CSS 4.3.x
* **Status:** `PROPOSED`
* **Context:** Evaluate frontend stack for enterprise multi-tenant suite based on verified Bachina Labs baseline.
* **Decision:** Adopt Angular 22.2.x (`@angular/core@^22.2.0`, `@angular/cli@^22.2.2`), TypeScript `~6.0.2`, Tailwind CSS `^4.3.3` with `@tailwindcss/postcss`, configured with zoneless change detection (`provideExperimentalZonelessChangeDetection()`). Completely exclude Zone.js.
* **Rationale:** Eliminates Zone.js runtime bundle overhead (~100KB), removes monkey-patching of browser APIs, leverages modern Angular 22 Signals reactivity, and natively supports W3C Custom Elements from Skyra Platform via `CUSTOM_ELEMENTS_SCHEMA`.
* **Alternatives Considered:**
  * *React 19 / Next.js:* Rejected for new project to align with Angular enterprise structure and zoneless reactivity.
  * *Angular with Zone.js:* Rejected to avoid legacy change detection overhead.
* **Consequences:** All third-party libraries must be certified to run without Zone.js.

---

## ADR-003: Backend Framework Selection — NestJS 12.x Modular REST API
* **Status:** `PROPOSED`
* **Context:** The backend must support strict domain boundaries, automated OpenAPI generation, dependency injection, and enterprise authorization guards.
* **Decision:** Adopt NestJS 12.x (`@nestjs/core@^12.0.1`, `@nestjs/common@^12.0.1`) with TypeScript `^6.0.2` targeting Node.js 24 LTS (`>=24.15.0 <25.0.0`).
* **Rationale:** NestJS natively enforces separation of concerns (Controllers, Services, Repositories, Guards, Interceptors) and provides out-of-the-box Swagger/OpenAPI 3.1 documentation, DTO validation pipes, and rate limiting.
* **Alternatives Considered:**
  * *Express without framework:* Rejected due to lack of enforced architectural structure and manual boilerplate.
  * *Fastify standalone:* Viable, but NestJS can run atop Fastify or Express while providing enterprise DI. Express platform selected for seamless ecosystem compatibility.
* **Consequences:** Developers must adhere to NestJS module and provider conventions.

---

## ADR-004: Architecture Style — Modular Monolith First
* **Status:** `ACCEPTED`
* **Context:** The application spans CRM, Billing, Invoicing, Accounting, HR, Payroll, and Inventory. We must choose between microservices and a modular monolith.
* **Decision:** Build as an **Enterprise Modular Monolith** with independently deployable frontend (`web`) and backend (`api`) units. Do not build microservices in Phase 0/1.
* **Rationale:** Microservices introduce distributed transaction overhead, network latency, and deployment complexity that are unnecessary and counter-productive for early-stage commercial scaling. A modular monolith preserves ACID transaction guarantees between Billing and the General Ledger.
* **Consequences:** Modules must strictly avoid cross-table queries and communicate only via exported Domain Services or in-memory domain events.

---

## ADR-005: Multi-Tenancy Strategy — Shared PostgreSQL Database with Discriminator
* **Status:** `PROPOSED`
* **Context:** Commercial SaaS multi-tenancy model selection.
* **Decision:** Adopt a shared PostgreSQL database where all tenant-owned entities carry an `organizationId` foreign key, backed by composite unique indexes and an automated Prisma Client tenancy extension (`prisma.$extends`).
* **Rationale:** Cost-effective, scalable, and manageable within connection pool limits. Prisma extensions eliminate developer error by automatically scoping all queries to the active tenant.
* **Alternatives Considered:**
  * *Database-per-tenant:* Rejected due to severe connection pool limits and schema migration complexity across hundreds of small businesses.
* **Consequences:** Every database query must have tenant context enforced; cross-tenant automated integration tests are mandatory in CI.

---

## ADR-006: Persistence & ORM — Prisma 6.8.x & Prisma Migrate
* **Status:** `PROPOSED`
* **Context:** Selection of ORM and migration tool for NestJS.
* **Decision:** Adopt Prisma ORM and Prisma Client 6.8.x (`prisma@^6.8.2`, `@prisma/client@^6.8.2`), subject to strict guidelines:
  1. Do not use raw SQL strings without parameterization.
  2. Implement interactive transactions with row-level locking for all financial mutations.
  3. Prohibit floating-point casting (`Number()`) on `Decimal` fields.
  4. Enforce tenant isolation via Prisma Client Extensions (`prisma.$extends`).
* **Rationale:** Strong type safety, auto-generated TypeScript clients, robust declarative migration engine, and established compatibility with NestJS 12.x and Node.js 24 LTS.
* **Alternatives Considered:**
  * *TypeORM:* Rejected due to active maintenance concerns and complex migration tooling.
  * *Drizzle ORM:* Fast and lightweight, but Prisma provides superior schema declaration and migration ergonomics for this phase.
* **Consequences:** Prisma client will be wrapped inside repository classes rather than leaked directly into HTTP controllers.

---

## ADR-007: Skyra Platform Reuse Strategy — Custom Elements & Pure TS
* **Status:** `ACCEPTED`
* **Context:** Leveraging shared packages from `skyra-platform`.
* **Decision:** Consume Skyra Platform’s W3C Custom Elements (`<skyra-tech-*>`) and pure TypeScript packages (`design-tokens`, `utils`, `data-export`, `validation`) directly in Angular via `CUSTOM_ELEMENTS_SCHEMA`.
* **Rationale:** Platform packages have zero runtime framework coupling and integrate seamlessly into Angular templates without React wrappers.
* **Consequences:** Platform packages with build or packaging defects (e.g. `@skyra-tech-platform/tabs` missing `exports`, `data-table` compile error) must be remediated in Platform before being imported.

---

## ADR-008: Double-Entry Accounting Foundation
* **Status:** `PROPOSED`
* **Context:** Moving from single-entry receipt tracking to commercial enterprise ERP.
* **Decision:** Model all financial transactions (invoices, payments, credit notes, expenses, vendor bills) through balanced double-entry journal entries (`JournalEntry`, `JournalLine`) referencing an immutable `ChartOfAccounts`.
* **Rationale:** Required for auditable financial statements (Balance Sheet, P&L, Trial Balance) and tax compliance.
* **Consequences:** Invoices and payments must trigger automated journal posting rules with database transaction isolation.

---

## ADR-009: Model Context Protocol (MCP) Interface for Skyra Jarvis
* **Status:** `PROPOSED`
* **Context:** Exposing ERP capabilities to agentic AI assistants.
* **Decision:** Build an authorized `McpModule` in the NestJS API that delegates directly to Domain Services, enforcing tenant authentication, RBAC, input validation, two-step confirmation for sensitive actions, and immutable audit logging.
* **Rationale:** Allows Skyra Jarvis to query and execute business actions safely without direct database access.
* **Consequences:** MCP tools share identical domain logic and validation rules with the REST API.

---

## ADR-010: Session Transport, Token Hashing & CSRF Defense
* **Status:** `ACCEPTED`
* **Context:** Securing browser sessions and API requests against token theft, session hijacking, race conditions, and cross-site request forgery.
* **Decision:**
  1. **Session Storage at Rest:** Store only SHA-256 hashes of opaque session tokens in the database; raw tokens are never persisted.
  2. **Web Browser Sessions:** Use `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`sb_session`).
  3. **CSRF Protection:** State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookie must include an `X-CSRF-Token` header validated against the session's CSRF secret.
  4. **Machine & MCP Clients:** Support `Authorization: Bearer <rawToken>` with precedence over cookies if both are present.
  5. **Token Lifecycle:** Email verification and password reset tokens are single-use, expiring, hashed with SHA-256 at rest, and redeemed conditionally inside transactions. Password reset immediately revokes all active sessions for the user.
* **Rationale:** Protects session tokens from XSS theft, mitigates database breach token extraction, eliminates CSRF vectors beyond simple SameSite heuristics, and ensures clean multi-client compatibility.
* **Consequences:** Frontend HTTP client must configure `withCredentials: true` and intercept mutating requests to attach the `X-CSRF-Token` header.

---

## ADR-011: Workspace & Monorepo Tooling — pnpm@12.3.4 & Node.js 24 LTS
* **Status:** `ACCEPTED`
* **Context:** Monorepo package management and engine constraints.
* **Decision:** Use `pnpm@12.3.4` with `pnpm-workspace.yaml` and enforce Node.js `>=24.15.0 <25.0.0` across all packages. Configure explicit `allowBuilds` in `pnpm-workspace.yaml` for native packages (`@prisma/client`, `argon2`, `prisma`, `esbuild`, `oxlint-tsgolint`).
* **Rationale:** Strict dependency isolation, zero phantom dependencies, rapid disk-efficient installation, and deterministic build scripts under pnpm 12 security rules.
* **Consequences:** Workspace commands run via native `pnpm --filter <app> <cmd>`. Build scripts require explicit approval via `allowBuilds`.

---

## ADR-012: Testing & Quality Gate Thresholds
* **Status:** `PROPOSED`
* **Context:** Automated testing coverage and CI release gates.
* **Decision:** Enforce mandatory CI quality gates:
  * Minimum 90% branch coverage on financial calculation services and accounting posting rules.
  * Minimum 80% line coverage on backend domain services.
  * Automated Playwright E2E tests for tenant isolation and invoice lifecycles.
* **Rationale:** Ensures zero regression in financial calculations and security boundaries.
* **Consequences:** PRs failing coverage thresholds or security scans are automatically blocked.

---

## ADR-013: Separate Testing Toolchains — Vitest 5.x (Web) & Vitest 4.1.x (API)
* **Status:** `ACCEPTED`
* **Context:** The frontend (`apps/web`) and backend (`apps/api`) possess distinct runtime and bundling ecosystems (Angular 22 Vite/ESM compilation vs. NestJS CommonJS/ESM decorator reflection).
* **Decision:** Preserve separate testing toolchains:
  * `apps/web`: Vitest `^5.0.0` with `@vitest/coverage-v8` `^5.0.0` aligned with Angular 22.2.x build toolchain.
  * `apps/api`: Vitest `^4.1.2` with `@vitest/coverage-v8` `^4.1.2` and `unplugin-swc` for NestJS 12.x TypeScript decorator metadata.
* **Rationale:** Guarantees stable test runners for each application without forcing incompatible Vitest major versions across frontend and backend.
* **Consequences:** Web and API tests run in isolated workspace contexts via `pnpm test:web` and `pnpm test:api`.

---

## ADR-014: Distinct Linting & Static Analysis — Oxlint (API) & ESLint 10.x / Angular ESLint (Web)
* **Status:** `ACCEPTED`
* **Context:** Balancing fast sub-second backend linting with strict Angular AST templates and accessibility rules.
* **Decision:**
  * `apps/api`: Oxlint `^1.58.0` with `oxlint-tsgolint` `^7.0.2001` for high-performance Rust-based linting and type checking.
  * `apps/web`: ESLint 10.x with Angular ESLint `22.6.0`, `typescript-eslint` `8.71.0`, and Prettier.
* **Rationale:** Provides optimal developer velocity for the API backend while ensuring Angular template semantics and accessibility rules are validated on the frontend.
* **Consequences:** Developers run `pnpm lint:api` and `pnpm lint:web` with dedicated configs (`.oxlintrc.json` and `eslint.config.js`).

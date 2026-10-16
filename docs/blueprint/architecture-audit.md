# Architecture & Workspace Audit Report

**Project:** Skyra Business Suite  
**Phase:** 0 — Repository Foundation & Architecture Audit  
**Date:** October 16, 2026  
**Auditor Roles:** Principal Software Architect, DevOps & Quality Auditor, Security Engineer  

---

## 1. Workspace Inventory & Git State

### 1.1 Parent Workspace Structure
The parent directory `apps/` contains 19 subdirectories representing individual Skyra Tech services, products, and platforms. As documented in [`apps/REPOSITORIES.md`](file:///c:/Users/hp/OneDrive/Documents/My%20Docs/Personal%20Projects/Skyra-Tech/skyra-tech-Jarvis/apps/REPOSITORIES.md), `apps/` is a collection of independent local project folders rather than a parent Git repository.

### 1.2 Git Repository Verification
Commands executed and real outcomes:
```bash
# In apps/
$ git status
fatal: not a git repository (or any of the parent directories): .git (Exit code: 1)

# In apps/skyra-platform/
$ git status --short
# (Clean working tree, Exit code: 0)

# In apps/skyra-erp/
$ git status --short
# (Clean working tree, Exit code: 0)

# In apps/skyra-business-suite/
$ git status
fatal: not a git repository (or any of the parent directories): .git (Exit code: 1)
```

**Verified Facts:**
1. `skyra-erp` is an independent Git repository, currently untouched and clean.
2. `skyra-platform` is an independent Git repository, currently untouched and clean.
3. `skyra-business-suite` is an independent sibling folder created from scratch, completely separated from `skyra-erp` and `skyra-platform`.

---

## 2. Runtime & Tooling Environment

Commands executed and real outcomes:
```bash
$ Write-Output "Node: $(node -v)"; Write-Output "pnpm: $(pnpm -v)"; Write-Output "npm: $(npm -v)"
Node: v24.21.0
pnpm: 12.3.4
npm: 11.19.0
```

### 2.1 Tooling Observations
* **Node.js:** The local environment runs Node.js `v24.21.0`. While modern and performant, production deployments must target an Active LTS Node version (`>= 20.18.0` or `22.x LTS`).
* **pnpm:** `pnpm` is available at version `12.3.4`. Skyra Platform packages declare `"packageManager": "pnpm@9.12.0"`. `skyra-business-suite` will enforce `pnpm >= 9.0.0` in its `package.json` engines field.
* **TypeScript:** Node v24 supports ES2022+ features natively. TypeScript 5.7+ is recommended across both frontend and backend.

---

## 3. Existing Project Audits & Tooling Analysis

### 3.1 Skyra ERP (`apps/skyra-erp`)
* **Framework:** Next.js 16.2.12 with React 19.2.4.
* **Database & ORM:** PostgreSQL accessed via Prisma ORM 5.21.1 (`prisma/schema.prisma`).
* **Auth & Sessions:** NextAuth 4.24.15 with JWT session strategy and Prisma adapter.
* **Testing Infrastructure:** **Completely absent**. No test dependencies, no test scripts, zero unit, integration, or E2E test files.
* **Typecheck Status:** `node ./node_modules/typescript/bin/tsc --noEmit` runs with **0 errors**.
* **Linting:** Configured with ESLint 9 (`eslint.config.mjs`) extending `eslint-config-next`.
* **Critical Findings to Avoid Copying:**
  1. *Unauthenticated Endpoints:* `src/app/api/organization/[id]/route.ts` lacks authentication entirely, allowing unauthenticated organization deletion.
  2. *Cross-Tenant Storage Purge:* `src/app/api/upload/route.ts` allows any user to supply any `organizationId` and wipe stored assets.
  3. *Dead RBAC:* Permissions in `src/lib/permissions.ts` are never evaluated by route handlers.
  4. *Financial Concurrency:* Payments in `src/app/api/invoices/[id]/payments/route.ts` lack database row-level locking (`FOR UPDATE`), leading to race conditions.
  5. *Mocked Dashboard:* Main executive dashboard (`OperationsAnalyticsView.tsx`) renders static hardcoded dummy data.

### 3.2 Skyra Platform (`apps/skyra-platform`)
* **Monorepo Architecture:** Turborepo 2.3.3 and pnpm workspace managing 28 packages under `@skyra-tech-platform/*`.
* **Framework Independence:** Fully certified. Zero runtime dependencies on React, Angular, or Vue inside reusable packages.
* **Component Paradigm:** Standard W3C Custom Elements (Web Components) extending `HTMLElement` with Shadow DOM.
* **Tooling & Build:** `tsup` 8.5.1 targeting dual ESM/CJS outputs.
* **Discovered Packaging Defects (Blockers for Direct Consumption):**
  1. `@skyra-tech-platform/data-table` fails TypeScript compilation due to untyped test globals in tsconfig.
  2. `@skyra-tech-platform/tabs` completely omits the `"exports"` field in its `package.json`.
  3. 10 packages place `"import"` or `"require"` before `"types"` in their export conditions, triggering NodeNext bundler warnings.
  4. 20 packages contain committed binary `.tgz` tarballs in Git.
  5. Standalone `@skyra-tech-platform/pagination` is missing (split between dashboard React code and table internal logic).

---

## 4. Environment & Secret-Handling Baseline

### 4.1 Existing Conventions Inspected
* `skyra-erp/.env.example`: Exposes variable names for Prisma connection pooling (`DATABASE_URL`, `DIRECT_URL`), NextAuth (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`), and Supabase storage.
* **Vulnerability Found in ERP Example:** Line 11 provides a pre-filled secret labeled "production": `NEXTAUTH_SECRET="skyra-super-secret-key-2026-production"`.
* **ERP Variables Omitted from Example:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `RESEND_API_KEY`, `SUPABASE_SECRET_KEY` are used in source code but missing from `.env.example`.

### 4.2 Rules for Skyra Business Suite
1. `.env.example` must contain **all** required environment variable names with descriptive placeholders and documentation, and **zero** default secret values.
2. `.env` and `.env.*.local` must be strictly ignored in `.gitignore`.
3. Secrets must be injected at runtime via environment variables or secret managers (e.g. AWS Secrets Manager, Doppler), never hardcoded or checked into Git.

---

## 5. Potential Tooling & Dependency Conflicts

| Tool / Dependency | Potential Conflict | Mitigation for Skyra Business Suite |
|---|---|---|
| **Node.js 24 LTS vs. Angular 22 / NestJS 12** | Node engines must strictly match project baseline. | Standardize on Node `>= 24.15.0 < 25.0.0` LTS in `package.json` engines and CI container images (`24.21.0`), managed via `pnpm@12.3.4`. |
| **Zone.js vs. Zoneless Angular** | Third-party Angular libraries often rely on `NgZone.run()` or Zone.js monkey-patching. | Strict rule: Only standalone libraries verified to function without Zone.js will be permitted. |
| **Prisma vs. NestJS Fastify** | Standard NestJS boilerplate uses Express. If Fastify is used, Fastify middleware differs. | Standardize NestJS on Express or Fastify during Phase 0; Prisma works identically across both. |
| **pnpm Workspace Resolution** | Cross-linking packages between sibling directories outside the git boundary breaks CI/CD. | `skyra-business-suite` must remain a completely self-contained monorepo with its own lockfile. |

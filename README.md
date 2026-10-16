# Skyra Business Suite

**Phase:** 0 — Repository Foundation & Architecture Audit  
**Status:** Minimal Foundation Initialized · Architecture Under Review  
**Aligned Baseline:** Angular 22.2.x Standalone (Zoneless) · NestJS 12.x Modular REST API · Prisma 6.8.x · PostgreSQL · Tailwind CSS 4.3.x · TypeScript 6.0.x · pnpm 12.3.4 (Node >=24.15.0 <25.0.0)  

---

## 1. Project Purpose

Skyra Business Suite is the next-generation commercial, multi-tenant business management SaaS platform by Skyra Tech. Built from the ground up to overcome the architectural, security, and scalability limitations of legacy prototypes, it introduces:

* **Strict Multi-Tenancy:** Automated tenant-isolation guards ensuring zero cross-tenant data leakage.
* **Dynamic Entitlement & Module Engine:** Data-driven plan management where organizations dynamically activate business modules (CRM, Invoicing, Accounting, HR, Payroll, Inventory) based on commercial subscriptions.
* **Double-Entry Financial Backbone:** Auditable general ledger ensuring all financial activities are mathematically balanced.
* **Framework-Independent UI Reuse:** Direct integration with Skyra Platform Web Components and design tokens.
* **AI-Ready Agentic Interface:** Safe, scoped, and auditable Model Context Protocol (MCP) server for Skyra Jarvis.

---

## 2. Non-Negotiable Boundaries & Rules

1. **New Repository Isolation:** `skyra-business-suite` is completely isolated from `skyra-erp` and `skyra-platform`.
2. **Read-Only Reference:** `skyra-erp` is treated strictly as read-only domain reference material. No legacy security vulnerabilities or untyped patterns are copied.
3. **No Unapproved Business Logic in Phase 0:** Invoicing, payroll, and CRM feature modules will not be implemented until Phase 0 architecture and audit findings are formally approved.
4. **Zoneless Angular:** The web frontend strictly uses Angular standalone components with zoneless change detection (`provideExperimentalZonelessChangeDetection()`). Zone.js is completely excluded.
5. **No Secret Ingestion:** Real credentials, production keys, and active API tokens must never be committed to git.

---

## 3. Technology Version Alignment Baseline

Following verified client specifications from the established Bachina Labs baseline:

| Component / Subsystem | Aligned Version Baseline | Testing & Tooling Framework |
|---|---|---|
| **Root Package Manager** | `pnpm@12.3.4` (`pnpm-workspace.yaml` with `allowBuilds`) | Prettier `^3.5.3` |
| **Node.js Runtime** | `>=24.15.0 <25.0.0` (Active: `v24.21.0`) | `.node-version` (24.21.0) |
| **Web Frontend** | **Angular 22.2.x** (`@angular/core`: `^22.2.0`, `@angular/cdk`: `^22.2.2`, `@angular/cli`: `^22.2.2`) | **Vitest 5.x** (`^5.0.0`), ESLint 10.x, Angular ESLint `22.6.0` |
| **Styling & CSS** | **Tailwind CSS 4.3.x** (`@tailwindcss/postcss`: `^4.3.3`, `postcss`: `^8.5.29`) | PostCSS Plugin |
| **Frontend TypeScript** | TypeScript `~6.0.2` | Strict Typecheck (`tsc --build --noEmit`) |
| **API Backend** | **NestJS 12.x** (`@nestjs/common`: `^12.0.1`, `@nestjs/core`: `^12.0.1`, `@nestjs/platform-express`: `^12.0.1`) | **Vitest 4.1.x** (`^4.1.2`), Oxlint `^1.58.0`, `oxlint-tsgolint`: `^7.0.2001` |
| **Database ORM** | **Prisma 6.8.x** (`@prisma/client`: `^6.8.2`, `prisma`: `^6.8.2`) | PostgreSQL 16+ |
| **Backend TypeScript** | TypeScript `^6.0.2` | Strict Typecheck (`tsc --noEmit`) |

---

## 4. Repository Architecture & Layout

This repository is organized as a lightweight pnpm monorepo:

```
skyra-business-suite/
├── .github/
│   └── workflows/
│       └── ci.yml             # Automated CI: install, lint, typecheck, build
├── apps/
│   ├── web/                   # Angular 22.2.x Standalone (Zoneless) Application
│   │   ├── src/
│   │   │   ├── app/           # Root App Component, Config & Routes
│   │   │   └── main.ts        # Bootstrap with zoneless change detection
│   │   ├── .postcssrc.json    # Tailwind CSS 4.3.x PostCSS plugin
│   │   ├── tsconfig.json      # Strict Angular TypeScript configuration
│   │   └── package.json       # Angular 22.2.x, Vitest 5.x, TypeScript ~6.0.2
│   └── api/                   # NestJS 12.x Modular REST API
│       ├── src/
│       │   ├── app.module.ts  # Root application module
│       │   ├── app.controller.ts
│       │   ├── app.service.ts
│       │   └── main.ts        # Bootstrap with CORS, Helmet, ValidationPipe
│       ├── .oxlintrc.json     # Oxlint type-aware configuration
│       ├── tsconfig.json      # Strict NestJS TypeScript configuration
│       └── package.json       # NestJS 12.x, Prisma 6.8.x, Vitest 4.1.x, TypeScript 6.0.x
├── docs/
│   └── blueprint/             # Complete Phase 0 Architecture Blueprint Pack
├── .env.example               # Sanitized environment configuration template
├── .gitignore                 # Standardized repository ignore rules
├── .node-version              # Pinned Node version (24.21.0)
├── .prettierrc.json           # Prettier configuration
├── package.json               # Root workspace scripts and tooling
├── pnpm-workspace.yaml        # Monorepo workspace with pnpm 12 allowBuilds policy
├── README.md                  # This file
└── tsconfig.base.json         # Strict base TypeScript compiler options
```

---

## 5. Phase 0 Architecture Blueprint Pack

All foundational architecture, audit evidence, engineering standards, and security specifications are located in [`docs/blueprint/`](docs/blueprint/):

* [01 — Architecture Audit Report](docs/blueprint/architecture-audit.md)
* [02 — Skyra Platform Reuse Matrix](docs/blueprint/platform-reuse-matrix.md)
* [03 — Solution Architecture](docs/blueprint/solution-architecture.md)
* [04 — Architecture Decisions Register (ADRs)](docs/blueprint/architecture-decisions.md)
* [05 — Security Baseline](docs/blueprint/security-baseline.md)
* [06 — Engineering Rules](docs/blueprint/engineering-rules.md)
* [07 — Phase 0 Verification Checklist](docs/blueprint/phase-0-checklist.md)

---

## 6. Development Getting Started

### Prerequisites
* Node.js: `>=24.15.0 <25.0.0` (verified with Node.js v24.21.0)
* Package Manager: `pnpm@12.3.4`

### Quick Start
```bash
# 1. Install workspace dependencies
pnpm install

# 2. Run typecheck across all applications
pnpm typecheck

# 3. Build all applications
pnpm build
```

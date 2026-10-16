# 10 --- Deployment and Operations

**Version:** 1.1 \| **Status:** Draft for approval

Separate local, test/CI, staging and production environments and
credentials. Validate configuration at startup, use secret management,
least-privilege accounts and sanitized `.env.example`. Provider secrets
and signing keys are never committed.

CI: lockfile install; format/lint/typecheck; unit and integration tests;
coverage; migration validation; frontend/API builds; Swagger/OpenAPI
validation; Playwright critical flows; accessibility scans;
dependency/secret scans. Required gates block merges/releases.

Review migration diffs, test clean install and upgrades, assess
locks/downtime, back up before risky changes, and document
forward-fix/recovery. Do not run unreviewed production migrations from a
workstation.

Use structured logs with correlation IDs, safe actor/tenant metadata,
metrics for API latency/errors/database/job failures, and alerts for
suspicious authentication, cross-tenant denials, failed payroll runs and
production error spikes. Never log credentials or sensitive payloads.
ELK-compatible logging is a possible direction, not a mandatory stack
before approval.

Before production, approve RPO/RTO, backup
schedule/retention/encryption, point-in-time recovery and restore-test
frequency. Release notes include migrations, known issues, health checks
and rollback/forward-fix notes. Operational checklist includes TLS,
CORS/cookies/CSRF, monitoring, backup restore, incident ownership,
privacy and retention.

# Release Readiness

## Current Status

ASUN Migrations is a working full-stack SaaS CRM with local development, database seeding, API tests, frontend tests, production builds, CI, and a free-friendly deployment path.

## Completed Product Areas

### Foundation

- React + Vite client
- Express + TypeScript API
- npm workspaces
- Tailwind CSS
- Shared TypeScript package
- Health endpoint
- Docker Compose PostgreSQL
- Prisma schema and seed data

### Access And App Shell

- Workspace role selector
- Current-user context
- Role switcher
- Role-specific navigation
- Protected frontend routes
- Server-side RBAC middleware

### Dashboard

- Dashboard API endpoint
- Workload metrics
- Priority tasks
- Pipeline chart
- Alerts
- Recent messages
- Revenue and deadline signals

### Clients

- Client list
- Client detail
- Client create/edit form
- Consent status
- Conflict status
- Dependants
- Passport masking
- Client audit events

### Matters And Workflows

- Matter list
- Matter detail workspace
- Workflow template seed data
- Matter creation from template
- Generated tasks and checklist items
- Stage updates
- Task status updates
- Checklist status updates
- AI intake plan
- AI matter brief
- AI workflow suggestions
- AI message drafting

### Documents

- Document upload metadata
- Optional base64 file persistence
- Local storage metadata
- Mock virus scanning
- Checklist status syncing
- Document verification and rejection
- AI document review
- Mock DocuSign envelope creation
- DocuSign webhook-ready status endpoint

### Client Portal

- Portal summary endpoint
- Matter progress
- Requested documents
- Secure messages
- Invoice payment
- AI portal guidance

### Billing

- Invoice list
- Invoice creation from matter workspace
- Mock payment action
- Mock checkout session
- Stripe webhook-ready payment endpoint
- Payment records
- Paid invoice status
- PDF receipts

### Reports And Audit

- Reports dashboard
- Pipeline, revenue, SLA, deadline, and workload sections
- AI report insights
- CSV export
- XLSX export
- Audit event filters
- Audit events for material workflow actions

### Compliance

- Compliance centre
- Tenant settings
- AI compliance review
- Retention and erasure requests
- Safe client anonymization
- Notification logs
- Integration event logs

### Engineering

- TypeScript typechecks across workspaces
- Vitest and Supertest API coverage
- Frontend test coverage
- Production builds
- GitHub Actions CI
- Free deployment guide
- Manual browser QA script

## Release Checks

Run before sharing or deploying:

```bash
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
```

## Operational Notes

- Local uploads are stored under `server/uploads/`.
- Free Render services have cold starts and ephemeral storage.
- Use `AI_PROVIDER=local` for deterministic AI behavior with no external API cost.
- Use `AI_PROVIDER=openai` with `OPENAI_API_KEY` for live OpenAI-generated output.
- Real Stripe, DocuSign, email, MFA, and persistent object storage remain integration upgrades.

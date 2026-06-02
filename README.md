# ASUN Migrations Platform

[![CI](https://github.com/gorvensalaveria/crm-modern/actions/workflows/ci.yml/badge.svg)](https://github.com/gorvensalaveria/crm-modern/actions/workflows/ci.yml)

A modern full-stack product based on the ASUN Migrations BRD. The application models a SaaS CRM for Australian migration agencies: client intake, visa matters, workflow templates, document compliance, billing, reporting, audit logs, and a client portal.

Instead of a login screen, the landing page lets users choose a role and immediately access the correct workspace.

## Product Capabilities

- Full-stack TypeScript delivery across React, Express, Prisma, and shared contracts
- Product thinking from a real BRD, not a generic CRUD sample
- Role-aware UX for RMA, case officer, finance, admin, and client portal users
- Server-side RBAC, validation, consistent API errors, and audit-friendly workflows
- PostgreSQL-backed CRM workflows with Prisma models and seeded product data
- Automated tests, production build checks, and GitHub Actions CI

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS
- TanStack Query
- React Router
- Recharts
- Lucide React
- Node.js + Express + TypeScript
- OpenAI Responses API for optional live AI intake plans, case briefs, workflow recommendations, report insights, compliance reviews, and portal guidance
- Prisma + PostgreSQL
- Zod validation
- Vitest + Supertest
- Docker Compose
- GitHub Actions

## Core Features

- Role selector for workspace access
- Staff dashboard with workload, pipeline, deadline, and revenue signals
- Client directory with create/edit/detail workflows
- Matter creation from visa workflow templates
- Matter workspace with stages, tasks, checklist items, documents, messages, and invoices
- AI matter intake planning before matter creation, with readiness checks, suggested tasks, checklist items, client questions, and automation ideas
- AI Matter Assistant that generates case briefs, blockers, next actions, compliance notes, automation suggestions, and client-message drafts from live matter data
- AI workflow suggestions for staff-reviewed stage, task, checklist, automation, and risk guidance
- AI client-message drafting for document requests, invoice follow-ups, and status updates, with editable internal/client visibility
- AI document review notes with verification/rejection guidance, risk flags, and compliance reminders
- AI report insights for manager-friendly pipeline, revenue, deadline, SLA, and workload summaries
- AI compliance review for privacy settings, retention, document security, provider logs, notifications, and audit findings
- AI portal guidance for client-friendly matter status, document, invoice, and next-step summaries
- Document upload metadata, mock virus scanning, local storage metadata, checklist syncing, verification, rejection, and e-signature states
- Billing page with invoice list, mock Stripe checkout, webhook-ready payment handling, paid status updates, and PDF receipts
- Client portal for matter status, uploads, secure messages, and payments
- Reporting dashboard with pipeline, revenue, SLA, deadline, and workload views
- CSV and XLSX report exports with audit logging
- Workflow template administration
- Compliance centre for tenant settings, retention/erasure requests, document security, notifications, and integration event logs
- Safe erasure flow that anonymizes client records instead of hard-deleting data
- Audit event filtering
- Frontend and backend RBAC for product roles
- Route-level code splitting for smaller initial client bundles

## Optional OpenAI Setup

The AI Matter Assistant works without external services by using a deterministic local fallback. To enable live OpenAI-generated intake plans, case briefs, workflow suggestions, message drafts, document review notes, report insights, compliance reviews, and portal guidance, add these values to `.env`:

```bash
OPENAI_API_KEY="your_api_key_here"
OPENAI_MODEL="gpt-5.4-mini"
AI_PROVIDER="openai"
```

Set `AI_PROVIDER="local"` when you want to force deterministic local AI mode.

## Product Roles

The app uses selectable product roles so each workspace can be accessed from the appropriate user perspective.

| Role | What to Review |
| --- | --- |
| ASUN Admin | Global admin areas, workflows, audit logs, reports |
| Agency Admin | Agency-wide operations, workflow setup, compliance settings, retention requests, reporting |
| RMA | Client and matter management, document review, e-signature workflow, reporting |
| Case Officer | Matter execution, checklist updates, document uploads |
| Finance Officer | Billing, invoice creation, payment tracking |
| Client | Portal status, document upload, messages, invoice payment |

## Getting Started

### Prerequisites

- Node.js 20 or newer
- Docker Desktop or another Docker runtime
- npm

### Local Setup

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

The app runs at:

- Client: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## Useful Scripts

```bash
npm run dev          # Start React and Express locally
npm run typecheck    # Typecheck shared, server, and client workspaces
npm run test         # Run Vitest/Supertest API tests
npm run build        # Build shared, server, and client workspaces
npm run db:generate  # Generate Prisma client
npm run db:push      # Apply Prisma schema to local DB
npm run db:seed      # Seed tenant, users, clients, matters, invoices, compliance logs
npm run db:studio    # Open Prisma Studio
```

## Testing

The server test suite uses Vitest and Supertest against the Express app. It includes lightweight API contract checks and a PostgreSQL-backed CRM integration workflow:

1. Create client
2. Fetch workflow template
3. Create matter from template
4. Generate an AI matter brief
5. Upload document metadata with local file storage
6. Verify scan-aware document review
7. Create invoice
8. Mock-pay invoice
9. Generate receipt/export reports
10. Confirm audit events

Run tests with:

```bash
npm run test
```

## CI

GitHub Actions runs on pushes to `main`/`master` and on pull requests. The workflow starts PostgreSQL, installs dependencies, prepares Prisma, typechecks, tests, and builds the full stack.

Workflow file: [.github/workflows/ci.yml](./.github/workflows/ci.yml)

## Browser QA

Use [docs/qa-script.md](./docs/qa-script.md) for a manual browser QA walkthrough. It covers the full local workflow, including:

- role selection
- RBAC checks
- client and matter workflows
- AI Matter Assistant case brief generation
- AI client-message drafting
- AI document review notes
- document scanning and review
- mock DocuSign envelope creation
- mock Stripe checkout/payment flows
- PDF receipts and CSV/XLSX report exports
- compliance settings
- retention/erasure requests
- notification and integration logs
- audit log verification

## Product Showcase

Use [docs/product-showcase.md](./docs/product-showcase.md) when preparing screenshots, a walkthrough, or a product review deck. It includes the recommended screenshot order, pages to capture, and a short presentation script.

## Free Deployment

Use [docs/free-deployment-guide.md](./docs/free-deployment-guide.md) to deploy the product with a free-friendly stack: Vercel for the React frontend, Render for the Express API, and Supabase for Postgres.

## Architecture

```text
client/
  React + Vite frontend
  Role state, route guards, pages, API client, Tailwind UI

server/
  Express API
  RBAC middleware, Zod validation, Prisma repository, API tests

shared/
  Shared TypeScript domain types and schemas

prisma/
  PostgreSQL schema and seed data

docs/
  BRD implementation plan, architecture, API plan, UX plan, roadmap
```

## API Highlights

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/matters`
- `POST /api/matters/ai-intake-plan`
- `POST /api/matters/from-template`
- `POST /api/matters/:matterId/ai-brief`
- `POST /api/matters/:matterId/ai-workflow-suggestions`
- `POST /api/matters/:matterId/ai-message-draft`
- `POST /api/matters/:matterId/documents`
- `PATCH /api/documents/:documentId/review`
- `POST /api/envelopes`
- `POST /api/webhook/docusign/status`
- `POST /api/matters/:matterId/invoices`
- `POST /api/invoices/:invoiceId/pay`
- `GET /api/invoices/:invoiceId/receipt.pdf`
- `POST /api/checkout/session/create`
- `POST /api/webhook/stripe/payment`
- `GET /api/reports`
- `POST /api/reports/ai-insights`
- `GET /api/reports/export`
- `GET /api/reports/export-xlsx`
- `GET /api/audit-events`
- `GET /api/compliance`
- `POST /api/compliance/ai-review`
- `PATCH /api/compliance/settings`
- `POST /api/compliance/retention-requests`
- `PATCH /api/compliance/retention-requests/:retentionRequestId`
- `GET /api/portal/summary`
- `POST /api/portal/ai-guidance`

Errors follow a consistent shape:

```json
{
  "error": {
    "code": "RBAC_403",
    "message": "Role CLIENT cannot access this API endpoint"
  }
}
```

## Documentation

The implementation plan lives in [docs/README.md](./docs/README.md), with supporting documents for:

- Product implementation plan
- Technical architecture
- Data model
- API contract plan
- Frontend UX plan
- Role strategy
- Development roadmap
- Browser QA script

## Notes

This project uses provider-ready mock integrations for Stripe, DocuSign, email notifications, and virus scanning. The AI features can use OpenAI when configured and fall back to deterministic local generation when no key is present. The code records integration events, notification delivery, scan status, and audit events so those mocks can be replaced with real providers in a production phase without changing the core CRM workflows.

# ASUN Migrations Platform

A modern full-stack portfolio product based on the ASUN Migrations BRD. It demonstrates a multi-tenant SaaS CRM for Australian migration agencies: clients, matters, workflows, document compliance, billing, reporting, and a client portal.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Node.js + Express + TypeScript
- Shared TypeScript domain contracts
- Zod validation
- TanStack Query
- Recharts
- Lucide icons

## Product Focus

The app is designed to show employer-ready product thinking:

- Operational dashboard for RMAs, case officers, finance, and admins
- Client and matter management around visa subclasses
- MARA and APP compliance signals with audit-ready activity
- Document verification and e-signature workflow states
- Stripe-ready billing and payment status modelling
- Reporting views for pipeline, deadlines, SLA risks, and revenue

## Implementation Docs

The implementation plan is documented in [`docs/README.md`](./docs/README.md). Start there for the product plan, architecture, data model, API plan, frontend UX plan, demo role strategy, and development roadmap.

## Getting Started

```bash
npm install
npm run dev
```

The client runs on `http://localhost:5173` and the API runs on `http://localhost:4000`.

## Useful Scripts

```bash
npm run build
npm run typecheck
npm run lint
```

## Repository Layout

```text
client/   React application and Tailwind UI
server/   Express API with mock service layer
shared/   Shared domain types and Zod schemas
```

## Demo API

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/clients`
- `GET /api/matters`
- `GET /api/reports`
- `GET /api/audit-events`
- `POST /api/checkout/session/create`
- `POST /api/webhook/stripe/payment`
- `POST /api/envelopes`

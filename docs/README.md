# ASUN Migrations CRM Implementation Docs

This folder defines the implementation plan for the ASUN Migrations portfolio CRM. It translates the BRD into a practical modern full-stack build using React, Vite, Node.js, Express, TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

## Document Map

- [Product Implementation Plan](./product-implementation-plan.md)
- [Technical Architecture](./technical-architecture.md)
- [Data Model Plan](./data-model-plan.md)
- [API Contract Plan](./api-contract-plan.md)
- [Frontend UX Plan](./frontend-ux-plan.md)
- [Demo Role Strategy](./demo-role-strategy.md)
- [Development Roadmap](./development-roadmap.md)

## Product Goal

Build a credible SaaS CRM for Australian migration agencies that can be presented to future employers as a full-stack portfolio product. The app should demonstrate product thinking, clean architecture, role-based experiences, workflow automation, compliance awareness, billing, reporting, and client self-service.

## Chosen Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- Recharts
- Lucide React

Backend:

- Node.js
- Express.js
- TypeScript
- Prisma
- PostgreSQL
- Zod
- Stripe SDK

Development and deployment:

- npm workspaces
- Docker Compose for local database
- GitHub Actions later for CI
- Vercel for frontend deployment
- Render, Railway, or Fly.io for backend deployment
- Neon, Supabase, or Railway PostgreSQL for hosted database


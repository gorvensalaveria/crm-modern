# ASUN Migrations CRM Product Docs

This folder documents the ASUN Migrations SaaS CRM product: architecture, data model, API contract, role access, user experience, release readiness, QA, deployment, and product showcase material.

## Document Map

- [Product Overview](./product-overview.md)
- [Technical Architecture](./technical-architecture.md)
- [Data Model](./data-model.md)
- [API Contract](./api-contract.md)
- [Frontend UX](./frontend-ux.md)
- [Role Access Strategy](./role-access-strategy.md)
- [Release Readiness](./release-readiness.md)
- [Browser QA Script](./qa-script.md)
- [Free Deployment Guide](./free-deployment-guide.md)
- [Product Showcase](./product-showcase.md)

## Product Goal

Provide a credible SaaS CRM for Australian migration agencies with clean architecture, role-based experiences, AI-assisted casework, workflow automation, compliance awareness, local document handling, billing, reporting, and client self-service.

## Chosen Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Recharts
- Lucide React

Backend:

- Node.js
- Express.js
- TypeScript
- Prisma
- PostgreSQL
- Zod
- OpenAI SDK
- CSV and XLSX-compatible report exports

Development and deployment:

- npm workspaces
- Docker Compose for local database
- GitHub Actions CI
- Vercel for frontend deployment
- Render, Railway, or Fly.io for backend deployment
- Neon, Supabase, or Railway PostgreSQL for hosted database

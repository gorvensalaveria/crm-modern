# Technical Architecture

## Architecture Style

The project uses a separated full-stack architecture:

```txt
React + Vite frontend
        |
        | REST API over HTTP
        v
Node.js + Express API
        |
        | Prisma ORM
        v
PostgreSQL database
```

The frontend and backend are separate applications inside one npm workspace. Shared TypeScript contracts live in the `shared` package.

## Repository Layout

```txt
client/
  src/
    auth/
    components/
    pages/
    services/
    state/
    test/
    utils/
    App.tsx
    main.tsx
    styles.css
    types.ts

server/
  src/
    controllers/
    data/
    errors/
    lib/
    middleware/
    routes/
    services/
    utils/
    validators/
    app.ts
    app.test.ts
    server.ts

shared/
  src/
    index.ts

prisma/
  schema.prisma
  seed.ts

docs/
  *.md
```

## Frontend Responsibilities

The React app owns:

- Routing and page layout
- Workspace role selection
- Role-specific navigation
- Dashboard and report visualizations
- Forms and client-side validation
- API data fetching and mutation states
- Responsive Tailwind UI

Frontend libraries:

- `react`
- `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `recharts`
- `lucide-react`
- `tailwindcss`
- `vitest`
- `@testing-library/react`

## Backend Responsibilities

The Express API owns:

- REST routes
- Business logic
- Database access through Prisma
- Request validation
- Role and tenant scoping
- Audit logging
- Mock Stripe checkout/payment boundaries
- Mock DocuSign envelope boundaries
- Document metadata and local file persistence
- Integration and notification event records
- AI generation with OpenAI or deterministic local fallback

Backend libraries:

- `express`
- `cors`
- `helmet`
- `dotenv`
- `zod`
- `prisma`
- `@prisma/client`
- `openai`
- `vitest`
- `supertest`

## Shared Package

The `shared` package contains cross-workspace TypeScript and Zod exports. The client carries product view-model types in `client/src/types.ts`, while the server validates request payloads in `server/src/validators/request-schemas.ts`.

## Multi-Tenant Design

The data model includes `tenantId` on business records so the product behaves like SaaS software even when running with a single seeded tenant.

Tenant-scoped records include:

- Users
- Clients
- Family links
- Matters
- Key dates
- Tasks
- Checklist items
- Documents
- Signature envelopes
- Invoices
- Payments
- Messages
- Workflow templates
- Audit events
- Notifications
- Retention requests
- Integration events

## Access Strategy

The current product access layer uses selectable workspace roles. The selected user is stored locally and sent to the API through `x-user-id`.

The backend resolves the role from that user ID and enforces route access with central `requireRoles` middleware. This keeps the application ready for a later real authentication provider without changing the domain workflows.

## Integration Boundaries

Current external-service boundaries:

- OpenAI Responses API when `AI_PROVIDER=openai` and `OPENAI_API_KEY` is configured.
- Deterministic local AI when `AI_PROVIDER=local` or no key is configured.
- Mock Stripe checkout session and webhook-ready payment handler.
- Mock DocuSign envelope creation and webhook-ready status handler.
- Mock AV file scanning.
- Local upload persistence under `server/uploads/`.

## Authentication Upgrade Path

The architecture supports replacement of the role selector with real auth:

- Email/password or SSO
- MFA
- Sessions or JWTs
- Password reset
- User invitation
- Client portal account activation
- Tenant-aware user provisioning

Existing RBAC, tenant scoping, audit events, and product workflows can remain in place.

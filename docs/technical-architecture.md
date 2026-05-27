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

Planned structure:

```txt
client/
  src/
    app/
    components/
    features/
    layouts/
    routes/
    services/
    styles/

server/
  src/
    app.ts
    server.ts
    config/
    controllers/
    middleware/
    routes/
    services/
    validators/
    prisma/

shared/
  src/
    index.ts

docs/
  *.md

prisma/
  schema.prisma
```

## Frontend Responsibilities

The React app owns:

- Routing and page layout
- Demo role selection
- Role-specific navigation
- Dashboard and report visualizations
- Forms and client-side validation
- API data fetching and mutation states
- Responsive Tailwind UI

Recommended frontend libraries:

- `react-router-dom` for routing
- `@tanstack/react-query` for server state
- `react-hook-form` for forms
- `zod` for validation schemas
- `recharts` for charts
- `lucide-react` for icons

## Backend Responsibilities

The Express API owns:

- REST routes
- Business logic
- Database access through Prisma
- Request validation
- Role and tenant scoping
- Audit logging
- Stripe webhook processing
- File metadata persistence
- Integration adapter boundaries

Recommended backend libraries:

- `express`
- `cors`
- `helmet`
- `zod`
- `prisma`
- `@prisma/client`
- `stripe`
- `multer` for local file upload MVP

## Shared Package

The `shared` package should contain:

- Role enums
- Matter stage enums
- Status enums
- Zod schemas
- Shared TypeScript types
- API response contracts where useful

This prevents duplicated frontend/backend assumptions.

## Multi-Tenant Design

Even in demo mode, the data model should include `tenantId` on business records. This makes the system credible as SaaS software.

Tenant-scoped records include:

- Users
- Clients
- Matters
- Tasks
- Documents
- Invoices
- Payments
- Messages
- Audit events
- Workflow templates

## Authentication Strategy for Portfolio Demo

The app will not use a traditional login screen in the MVP. Instead:

- The landing page shows a role selector.
- Selecting a role creates a local demo session.
- The selected role is sent to the API through a demo header or query context.
- The backend scopes returned data based on the demo user.

This keeps the presentation smooth while preserving RBAC behavior.

## Future Real Auth Upgrade

The architecture should allow later replacement with real auth:

- Email/password
- MFA
- Sessions or JWTs
- Password reset
- User invitation
- Client portal accounts

The demo user strategy should be isolated so it can be replaced cleanly.


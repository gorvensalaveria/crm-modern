# CODEX Full-Stack Architecture Audit

Audit date: 2026-06-18  
Repository root: `/Users/gorven/Documents/Modern Fullstack`

## 1. Executive Summary

This repository is a full-stack TypeScript npm-workspace monorepo for an ASUN Migrations CRM product.

Confirmed architecture:

- Frontend: React 19 + Vite + TypeScript SPA in `client/`.
- Backend: Node.js + Express 5 + TypeScript REST API in `server/`.
- Database: PostgreSQL via Prisma ORM in `prisma/schema.prisma`.
- Shared package: `@asun/shared` exports Zod schemas and shared domain types from `shared/src/index.ts`.
- API style: REST over HTTP under `/api/*`.
- Auth/access model: selectable product role stored in browser `localStorage`, sent as `x-user-id`, enforced on the server by role middleware.
- Integrations: optional OpenAI, mock Stripe checkout/payment, mock DocuSign envelope/status flow, mock AV scanning, local upload persistence, email notification records.
- Deployment setup: Vercel SPA rewrite config, Docker Compose PostgreSQL, GitHub Actions CI.

Overall architectural shape:

- Separated full-stack monorepo.
- API-driven, client-rendered React application.
- Prisma-backed domain service layer.
- Tenant-aware data model with a currently hardcoded default tenant in the service layer.
- Feature/page-oriented frontend.
- Centralized backend route registration and a large repository/service module.

## 2. Repository Structure

Confirmed top-level structure:

```text
.
├── client/
├── server/
├── shared/
├── prisma/
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── vercel.json
├── .env
├── .env.example
├── .gitignore
└── .dockerignore
```

Key root files:

- `package.json`: npm workspace root, scripts for dev/build/test/typecheck/db tasks.
- `package-lock.json`: npm lockfile; npm is the package manager.
- `tsconfig.base.json`: strict shared TypeScript base config.
- `docker-compose.yml`: local PostgreSQL service.
- `.github/workflows/ci.yml`: CI with Postgres, Prisma, typecheck, tests, build.
- `vercel.json`: SPA rewrite to `/index.html`.
- `.env`: present and contains sensitive configuration keys. Values are intentionally not reproduced.
- `.env.example`: present and documents required local/deployment keys.

No confirmed `turbo.json`, `nx.json`, `next.config.*`, `webpack.config.*`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`, `netlify.toml`, `render.yaml`, `railway.json`, or `fly.toml` were found in the scanned root.

## 3. Evidence Map

Representative source anchors used for this audit:

- Workspace scripts and package manager: `package.json:7`, `package.json:20`, `package-lock.json`.
- Node engine: `package.json:31`.
- Frontend dependencies and scripts: `client/package.json:6`, `client/package.json:14`.
- Backend dependencies and scripts: `server/package.json:7`, `server/package.json:15`.
- Shared package: `shared/package.json`, `shared/src/index.ts`.
- Frontend app route map: `client/src/App.tsx:46`.
- Frontend current-user state: `client/src/state/current-user.tsx:14`.
- Frontend API client surface: `client/src/services/api.ts:97`.
- Frontend route permissions: `client/src/auth/permissions.ts:3`.
- Backend middleware setup: `server/src/app.ts:82`, `server/src/app.ts:83`, `server/src/app.ts:84`, `server/src/app.ts:85`.
- Backend API route registration: `server/src/app.ts:87` through `server/src/app.ts:499`.
- Backend RBAC middleware: `server/src/middleware/auth.ts:34`.
- Backend default tenant constant: `server/src/services/crm-repository.ts:17`.
- Backend representative service functions: `server/src/services/crm-repository.ts:467`, `server/src/services/crm-repository.ts:688`, `server/src/services/crm-repository.ts:3061`, `server/src/services/crm-repository.ts:3148`.
- PostgreSQL datasource: `prisma/schema.prisma:5`.
- Core Prisma models: `prisma/schema.prisma:118`, `prisma/schema.prisma:152`, `prisma/schema.prisma:178`, `prisma/schema.prisma:216`, `prisma/schema.prisma:299`, `prisma/schema.prisma:348`, `prisma/schema.prisma:481`.
- Local Docker database: `docker-compose.yml`.
- CI pipeline: `.github/workflows/ci.yml`.
- SPA deployment rewrites: `vercel.json`, `client/vercel.json`.
- Environment files: `.env`, `.env.example`; values were not copied.

## 4. Project Classification

Confirmed:

- Full-stack monorepo: root `package.json` has workspaces `client`, `server`, and `shared`.
- Vite React frontend with Express/Node API.
- TypeScript project across all workspaces.
- REST API-driven application.
- PostgreSQL + Prisma project.
- Dockerized local database only; no application Dockerfile found.
- Client-rendered SPA, not Next.js and not server-rendered.
- Not GraphQL, not tRPC, not microservices, not serverless functions in the current code.

Needs confirmation:

- Production hosting target for the API. Docs mention Render/Supabase/Vercel, but only Vercel rewrite config and CI are present in executable config.
- Real production authentication provider. Current code uses role selection, not real login sessions.

## 5. Package and Build Architecture

Root workspace: `package.json`

- `dev`: starts server and client concurrently.
- `build`: builds shared, server, and client in order.
- `lint`: runs TypeScript no-emit checks for server and client.
- `test`: runs server and client test suites.
- `typecheck`: checks shared, server, and client.
- `db:*`: Prisma generate/migrate/push/seed/studio commands.
- `engines.node`: `>=20.0.0`.
- Root dependencies include `@prisma/client`.

Frontend package: `client/package.json`

- React 19, React DOM 19.
- Vite 7 and `@vitejs/plugin-react`.
- React Router DOM 7.
- TanStack React Query 5.
- Tailwind CSS 3.
- Recharts 3.
- Lucide React.
- Vitest + Testing Library.

Backend package: `server/package.json`

- Express 5.
- CORS and Helmet.
- Dotenv.
- Prisma client.
- OpenAI SDK.
- Zod.
- Vitest + Supertest.

Shared package: `shared/package.json`

- Zod.
- TypeScript build outputs to `dist`.

## 6. Frontend Architecture

Frontend entry points:

- `client/src/main.tsx`: creates `QueryClient`, wraps app with `QueryClientProvider`, `BrowserRouter`, and `CurrentUserProvider`.
- `client/src/App.tsx`: lazy-loads pages and declares all client routes.

Frontend framework and libraries:

- React: confirmed in `client/package.json`.
- Vite: confirmed by `client/vite.config.ts`.
- TypeScript: confirmed by `.tsx` sources and `client/tsconfig.json`.
- React Router: `Routes`, `Route`, `Navigate`, `NavLink`, `Outlet`, and `useNavigate`.
- TanStack Query: `useQuery`, `useMutation`, `useQueryClient`.
- Tailwind CSS: `client/tailwind.config.js`, `client/src/styles.css`, Tailwind utility classes.
- Recharts: dependency present and used for reporting/dashboard visualization needs.
- Lucide React: icons in `client/src/components/AppLayout.tsx` and pages.
- Fetch API: centralized in `client/src/services/api.ts`.

Not confirmed in active app code:

- Redux.
- Zustand.
- SWR.
- Axios.
- Material UI.
- Bootstrap.
- PrimeReact.
- ShadCN UI.
- Radix UI.
- Styled Components.
- CSS Modules.
- SCSS/SASS.
- Formik.
- React Hook Form.
- Yup/Joi.
- Framer Motion.

### Frontend Routing and Screens

Routes are defined in `client/src/App.tsx`.

Confirmed screens/pages:

- `/`: `LandingPage`, role selection and workspace entry.
- `/app`: `DashboardPage` for staff roles, `PortalPage` for client role.
- `/app/clients`: `ClientsPage`.
- `/app/clients/new`: `ClientFormPage`.
- `/app/clients/:clientId`: `ClientDetailPage`.
- `/app/clients/:clientId/edit`: `ClientFormPage`.
- `/app/matters`: `MattersPage`.
- `/app/matters/new`: `MatterFormPage`.
- `/app/matters/:matterId`: `MatterDetailPage`.
- `/app/billing`: `BillingPage`.
- `/app/reports`: `ReportsPage`.
- `/app/workflows`: `WorkflowsPage`.
- `/app/audit`: `AuditPage`.
- `/app/compliance`: `CompliancePage`.
- `/app/portal`: `PortalPage`.
- `*`: redirects to `/`.

Access-denied behavior:

- `client/src/components/RequireRole.tsx` renders `AccessDeniedPage` when `canAccess()` fails.

### Frontend State and Data Flow

Role/session state:

- `client/src/state/current-user.tsx` stores selected user under `localStorage` key `asun-current-user`.
- `client/src/services/api.ts` reads that object and sends `x-user-id` on API requests.

Server data:

- `client/src/services/api.ts` centralizes all API calls.
- Pages use TanStack Query for reads and mutations.

Frontend API coverage includes:

- Role users.
- Dashboard.
- Clients create/update/detail/list.
- Matters list/detail/create from workflow template.
- Matter AI intake plan, AI brief, AI workflow suggestions, AI message drafts.
- Stage/task/checklist/document updates.
- E-signature envelope creation.
- Invoice creation/payment/download receipt.
- Workflow templates.
- Reports, CSV export, XLSX export, AI report insights.
- Audit events.
- Compliance settings, retention requests, retention decisions, AI compliance review.
- Portal summary, upload, message, payment, AI portal guidance.

### Frontend Business Workflows

Confirmed workflows:

- Product role selection.
- Role-aware workspace navigation.
- Staff dashboard.
- Client directory, detail, create, edit.
- Matter creation from workflow templates.
- Matter workspace with stage progression, task updates, checklist updates, document upload/review, e-signature, invoicing, messages, AI assistance.
- Billing list, invoice payment, receipt download.
- Reports view and CSV/XLSX export.
- Workflow template administration.
- Audit log filtering.
- Compliance center settings, document security, notification/integration logs, retention requests.
- Client portal status, document upload, invoice payment, secure messages, AI guidance.

## 7. Backend Architecture

Backend entry points:

- `server/src/server.ts`: starts the Express app on `process.env.PORT ?? 4000`.
- `server/src/app.ts`: constructs the Express app, middleware, routes, and error handlers.

Backend framework and middleware:

- Express 5: confirmed by `server/package.json` and `server/src/app.ts`.
- Helmet: `app.use(helmet())`.
- CORS: `cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" })`.
- JSON body parser: `express.json({ limit: "30mb" })`.
- Zod validation: `server/src/validators/request-schemas.ts`.
- Error handling: `server/src/middleware/error-handler.ts`.
- RBAC middleware: `server/src/middleware/auth.ts`.
- Prisma singleton: `server/src/lib/prisma.ts`.

Backend organization:

- `controllers/`: currently system/health/role controller.
- `routes/`: currently system routes.
- `middleware/`: auth and error handling.
- `validators/`: request schemas.
- `services/crm-repository.ts`: primary business logic, database access, AI, integrations, reporting, audit, notifications, document persistence.
- `data/`: fallback/static product and role data.

Architecture risk:

- `server/src/services/crm-repository.ts` is a large central module with many responsibilities. It functions as data access layer, domain service, integration adapter, report generator, AI adapter, file persistence layer, audit writer, and notification queue. This is workable for a prototype/product baseline, but it is the highest maintainability pressure point.

## 8. API Architecture

API style:

- REST JSON endpoints under `/api`.
- Response envelope generally uses `{ data: ... }`.
- Error envelope uses `{ error: { code, message } }`.
- File responses for PDF, CSV, and XLSX downloads.

System routes:

- `GET /api/health`
- `GET /api/role-users`
- `POST /api/role-session`

Core CRM routes:

- `GET /api/dashboard`
- `GET /api/clients`
- `GET /api/clients/:clientId`
- `POST /api/clients`
- `PATCH /api/clients/:clientId`
- `GET /api/matters`
- `GET /api/matters/:matterId`
- `POST /api/matters/ai-intake-plan`
- `POST /api/matters/from-template`
- `PATCH /api/matters/:matterId/stage`
- `POST /api/matters/:matterId/ai-brief`
- `POST /api/matters/:matterId/ai-workflow-suggestions`
- `POST /api/matters/:matterId/ai-message-draft`
- `PATCH /api/tasks/:taskId/status`
- `PATCH /api/checklist-items/:checklistItemId/status`
- `POST /api/matters/:matterId/tasks`
- `POST /api/matters/:matterId/checklist-items`
- `POST /api/matters/:matterId/documents`
- `PATCH /api/documents/:documentId/review`
- `POST /api/documents/:documentId/ai-review`
- `POST /api/matters/:matterId/invoices`
- `POST /api/invoices/:invoiceId/pay`
- `POST /api/matters/:matterId/messages`
- `GET /api/invoices`
- `GET /api/workflow-templates`
- `POST /api/workflow-templates`
- `GET /api/reports`
- `POST /api/reports/ai-insights`
- `GET /api/reports/export`
- `GET /api/reports/export-xlsx`
- `GET /api/invoices/:invoiceId/receipt.pdf`
- `GET /api/audit-events`
- `GET /api/portal/summary`
- `POST /api/portal/ai-guidance`
- `POST /api/checkout/session/create`
- `POST /api/webhook/stripe/payment`
- `POST /api/envelopes`
- `POST /api/webhook/docusign/status`
- `GET /api/compliance`
- `POST /api/compliance/ai-review`
- `PATCH /api/compliance/settings`
- `POST /api/compliance/retention-requests`
- `PATCH /api/compliance/retention-requests/:retentionRequestId`

No GraphQL, tRPC, WebSockets, Socket.io, or queue worker implementation is present.

Background jobs:

- No separate worker or cron scheduler was found.
- Notifications are recorded by `queueNotification()` in `server/src/services/crm-repository.ts`, but this is database persistence, not an asynchronous queue system.

## 9. Authentication and Authorization

Confirmed current behavior:

- Frontend role selection from `/api/role-users`.
- Selected user stored in browser `localStorage`.
- `client/src/services/api.ts` sends `x-user-id`.
- `server/src/middleware/auth.ts` resolves a role from `x-user-id`.
- `requireRoles()` blocks unauthorized roles with `RBAC_403`.
- `client/src/auth/permissions.ts` mirrors route permissions in the browser.

Roles:

- `ASUN_ADMIN`
- `AGENCY_ADMIN`
- `RMA`
- `CASE_OFFICER`
- `FINANCE`
- `CLIENT`

Important security finding:

- This is not production-grade authentication. Any caller can spoof `x-user-id` unless protected by an upstream auth layer that is not present in the code.
- `POST /api/webhook/stripe/payment` and `POST /api/webhook/docusign/status` validate payload shape but do not verify provider signatures in the current code.
- Needs confirmation before production: session/JWT provider, password/SSO/MFA flow, account lifecycle, client portal activation, webhook signature verification, and tenant-aware auth binding.

## 10. Database and Data Layer

Database:

- PostgreSQL, confirmed by `prisma/schema.prisma` datasource provider.
- Prisma ORM, confirmed by `@prisma/client`, `prisma/schema.prisma`, and `server/src/lib/prisma.ts`.

Prisma models:

- `Tenant`
- `User`
- `Client`
- `FamilyLink`
- `Matter`
- `MatterKeyDate`
- `Task`
- `ChecklistItem`
- `Document`
- `SignatureEnvelope`
- `Invoice`
- `Payment`
- `Notification`
- `RetentionRequest`
- `IntegrationEvent`
- `Message`
- `WorkflowTemplate`
- `WorkflowTemplateItem`
- `AuditEvent`

Prisma enums:

- `Role`
- `UserStatus`
- `ConsentStatus`
- `ConflictCheckStatus`
- `MatterStage`
- `TaskStatus`
- `ChecklistStatus`
- `DocumentStatus`
- `InvoiceStatus`
- `PaymentStatus`
- `WorkflowItemType`
- `MessageVisibility`
- `DocumentScanStatus`
- `NotificationStatus`
- `RetentionRequestStatus`
- `IntegrationProvider`

Data model strengths:

- Tenant-scoped records across core business tables.
- Useful indexes for tenant/stage/status/date/action queries.
- Audit, integration, notification, and retention entities are first-class.
- Document model captures scan status, checksum, storage provider, verification state, and signature envelopes.
- Invoice/payment models are separated.

Data-layer risks:

- `server/src/services/crm-repository.ts` uses `defaultTenantId = "tenant-asun-primary"`, so tenant scoping exists in schema but is not dynamically resolved from authenticated context.
- No Prisma migration directory is present in the scanned tree. The project uses `db:push` in CI rather than migration history.
- `Client.passportEncrypted` exists, but the audit cannot confirm strong encryption without deeper cryptographic review. The client-facing API returns only masked passport values, which is positive.
- Fallback static data paths exist through `withFallback()`, which can hide database failures by returning product sample data for some reads.

## 11. Integrations

OpenAI:

- `server/src/services/crm-repository.ts` imports OpenAI and creates clients when `OPENAI_API_KEY` is configured and `AI_PROVIDER` is not local/test.
- AI features have deterministic local fallback behavior.
- AI workflows include matter intake plan, matter brief, workflow suggestions, message draft, document review, report insights, compliance review, and portal guidance.

Stripe:

- Mock checkout session creation through `createCheckoutSession()`.
- Mock payment action through `payInvoice()`.
- Webhook-ready route `POST /api/webhook/stripe/payment`.
- Integration events are recorded.
- No confirmed real Stripe SDK or signature verification.

DocuSign:

- Mock signature envelope creation through `createSignatureEnvelope()`.
- Webhook-ready route `POST /api/webhook/docusign/status`.
- Integration events and document signing states are recorded.
- No confirmed real DocuSign SDK or signature verification.

Email/notifications:

- `Notification` model and `queueNotification()` persistence exist.
- Tenant settings allow `mock`, `sendgrid`, or `ses` values.
- No confirmed SendGrid or SES SDK implementation.

Virus scanning:

- Mock AV behavior records `scanStatus`, `scanProvider`, `scanMessage`, and `scannedAt`.
- No real AV provider implementation confirmed.

File uploads:

- Metadata and optional base64 content are accepted.
- Files are persisted locally under `uploads/<tenant>/<matter>/...` by `persistUploadedDocument()` in `server/src/services/crm-repository.ts`.
- `.gitignore` and `.dockerignore` exclude `uploads` and `server/uploads`.

## 12. Deployment, Hosting, Docker, and CI/CD

Docker:

- `docker-compose.yml` runs PostgreSQL 16 Alpine.
- It exposes local port `5432`.
- It includes a healthcheck.
- It includes local development credentials. Treat as dev-only.
- No application Dockerfile was found.

Vercel:

- Root `vercel.json` and `client/vercel.json` both rewrite all routes to `/index.html`, suitable for SPA routing.

CI/CD:

- `.github/workflows/ci.yml` runs on push to `main`/`master` and pull requests.
- CI provisions PostgreSQL 16 Alpine.
- CI uses Node 22.
- CI runs `npm ci`, `db:generate`, `db:push`, `typecheck`, `test`, and `build`.

Deployment docs:

- `docs/free-deployment-guide.md` documents a Vercel frontend, Render API, and Supabase Postgres approach.

Needs confirmation:

- Production API hosting platform.
- Production database migration strategy.
- Production secret management.
- Production upload storage provider.
- Production auth provider.

## 13. Security Review

Confirmed positive controls:

- Helmet is enabled.
- CORS origin is configured from `CLIENT_ORIGIN`, with a localhost fallback.
- Zod request validation exists for key write operations.
- Server-side RBAC middleware exists for protected routes.
- API errors use a consistent shape.
- Client passport number is masked in returned payloads.
- Audit events are written for many state-changing workflows.
- Upload directories are ignored by Git and Docker context.
- Document upload size is capped at 25 MB in Zod validation.

Security risks and gaps:

- `.env` exists and includes sensitive keys such as `DATABASE_URL` and `OPENAI_API_KEY`. Values are not included here.
- Role selection plus `x-user-id` is spoofable and should not be used as production auth.
- Webhook endpoints do not confirm provider signatures.
- Local file upload persistence is not production-safe for horizontally scaled or ephemeral deployments.
- `express.json({ limit: "30mb" })` plus base64 upload handling can create memory pressure.
- CORS is origin-restricted but there is no CSRF/session model because real auth is not present.
- No rate limiting, request throttling, or abuse protection was found.
- No security headers beyond Helmet configuration were reviewed in detail.
- No real malware scanning provider was found.
- No row-level tenant enforcement at database level was found; tenant isolation is application-enforced.
- No password hashing or credential login model exists in the current product code.

## 14. Performance Review

Confirmed performance-friendly choices:

- Route-level lazy loading in `client/src/App.tsx`.
- TanStack Query handles fetch/mutation state and cache invalidation.
- Prisma includes indexes on common tenant/status/date/action dimensions.
- Server response models are shaped for UI consumption.

Performance risks:

- `crm-repository.ts` performs many relation-heavy Prisma reads; some views may grow expensive as tenant data grows.
- Report generation and export endpoints appear synchronous.
- PDF/CSV/XLSX generation is synchronous in request/response paths.
- Base64 upload flow increases payload size and server memory usage.
- Local file writes happen in API request handlers.
- No pagination was confirmed for client, matter, invoice, audit, or report lists except audit filtering.
- Fallback data may mask degraded database behavior during manual testing.

## 15. Maintainability Review

Strengths:

- Clear workspace separation.
- Strict TypeScript base config.
- Central API client on the frontend.
- Zod validation schemas are centralized.
- RBAC rules are centralized on the server.
- Tests cover important frontend shell and backend core workflow behavior.
- Product documentation is extensive under `docs/`.

Risks:

- The backend service layer is too broad. `server/src/services/crm-repository.ts` mixes repositories, domain rules, file storage, AI prompts, integrations, exports, notifications, and audit logging.
- Route registration in `server/src/app.ts` is centralized and long; domain route modules would be easier to maintain.
- Client view-model types live in `client/src/types.ts`, while shared schemas live in `shared/src/index.ts`; type ownership may drift.
- Frontend and backend RBAC rules are duplicated in separate files and can drift.
- No generated API contract or OpenAPI schema is present.
- No migration history was found; `db:push` is convenient but weaker for production change control.

## 16. Testing and Quality

Frontend tests:

- `client/src/App.test.tsx` covers role selection, redirect when unauthenticated, client RBAC denial, and client portal routing.
- `client/vitest.config.ts` uses jsdom and Testing Library setup.

Backend tests:

- `server/src/app.test.ts` uses Vitest and Supertest against the Express app.
- It covers health, role session, unknown user, RBAC denial, validation errors, malformed JSON, unknown routes, and a core CRM workflow from client creation through matter, document, invoice, payment, AI fallbacks, receipt, and export.

CI:

- Typecheck, test, and build run in GitHub Actions.

Test gaps:

- No browser/E2E automation found.
- No load tests found.
- No authorization matrix tests for every endpoint/role combination.
- No webhook signature tests because real signature verification is not implemented.
- No migration tests found.
- No real integration tests for Stripe, DocuSign, SES/SendGrid, AV, or production storage providers.

## 17. Business Domain Workflows

Confirmed business capabilities:

- Migration agency role selection.
- Staff dashboard with active matters, overdue tasks, upcoming deadlines, revenue, portal adoption, recent messages, alerts.
- Client onboarding and editing with consent and conflict check status.
- Matter creation from workflow templates.
- Matter stage management.
- Task creation/status update.
- Checklist creation/status update.
- Document upload metadata and local persistence.
- Mock scan-aware document review.
- E-sign envelope creation and status update flow.
- Invoice creation, payment, checkout session, receipt PDF.
- Secure/internal/external matter messaging.
- Workflow template administration.
- Reports and exports.
- Audit event filtering.
- Compliance center for tenant settings, retention requests, document security, notifications, and integration logs.
- Safe erasure flow that anonymizes client records rather than hard deleting.
- Client portal for status, uploads, payment, messaging, and guidance.

## 18. Architecturally Important Files

Frontend:

- `client/src/main.tsx`: app providers and router bootstrap.
- `client/src/App.tsx`: route map and route-level lazy loading.
- `client/src/services/api.ts`: frontend API contract surface.
- `client/src/state/current-user.tsx`: current role/user session state.
- `client/src/auth/permissions.ts`: browser route permissions.
- `client/src/components/AppLayout.tsx`: role-aware navigation shell.
- `client/src/pages/MatterDetailPage.tsx`: densest workflow screen.
- `client/src/pages/CompliancePage.tsx`: tenant/compliance operations.
- `client/src/types.ts`: frontend view-model types.

Backend:

- `server/src/app.ts`: middleware and API route registration.
- `server/src/server.ts`: runtime listener.
- `server/src/middleware/auth.ts`: role resolution and server RBAC.
- `server/src/middleware/error-handler.ts`: API error handling.
- `server/src/validators/request-schemas.ts`: Zod request validation.
- `server/src/services/crm-repository.ts`: primary business/data/integration service.
- `server/src/lib/prisma.ts`: Prisma client lifecycle.
- `server/src/controllers/system-controller.ts`: health/role endpoints.

Data/deployment/docs:

- `prisma/schema.prisma`: data model.
- `prisma/seed.ts`: seed data and local baseline data.
- `docker-compose.yml`: local Postgres.
- `.github/workflows/ci.yml`: CI pipeline.
- `README.md`: product and setup overview.
- `docs/technical-architecture.md`: existing architecture explanation.
- `docs/api-contract.md`: API contract documentation.
- `docs/role-access-strategy.md`: access strategy.
- `docs/free-deployment-guide.md`: deployment guidance.

## 19. Confirmed Findings vs Assumptions

Confirmed:

- This is a TypeScript npm-workspace monorepo.
- The frontend is React + Vite, not Next.js.
- The backend is Express, not NestJS/Fastify/Koa/Hapi.
- The API is REST, not GraphQL/tRPC.
- The database is PostgreSQL through Prisma.
- The frontend is client-rendered.
- Role-based access exists in both frontend and backend.
- Current auth is role-selection/demo-style, not real credential authentication.
- OpenAI is optional and has local fallback.
- Stripe/DocuSign/AV/email are provider-ready mock boundaries, not confirmed live integrations.
- Docker Compose only defines Postgres.
- CI exists and runs typecheck/test/build.
- `.env` exists and contains sensitive configuration keys.

Needs confirmation:

- Production API hosting and runtime topology.
- Production database migration strategy.
- Production authentication/authorization provider.
- Production webhook verification approach.
- Production file/object storage provider.
- Production AI model name and availability.
- Whether fallback sample data should remain enabled outside local/demo mode.
- Whether `defaultTenantId` is intentional for single-tenant deployment or a temporary scaffold.

## 20. Priority Recommendations

High priority:

- Replace role-selection auth with real authentication before production.
- Verify webhook signatures for Stripe and DocuSign before enabling public provider callbacks.
- Introduce dynamic tenant resolution from authenticated identity instead of hardcoded `defaultTenantId`.
- Move production secrets out of local files and into deployment secret management.
- Add Prisma migration history for production database changes.

Medium priority:

- Split `server/src/services/crm-repository.ts` into domain services/repositories: clients, matters, documents, billing, reports, compliance, integrations, AI.
- Split `server/src/app.ts` routes into domain routers.
- Add pagination/filtering for large lists and audit/report data.
- Move uploads to object storage for production.
- Add rate limiting and request-size strategy for upload/AI endpoints.
- Add endpoint-by-role authorization tests.

Lower priority:

- Generate or maintain an OpenAPI contract from routes/schemas.
- Consolidate frontend/backend/shared type contracts to reduce drift.
- Add E2E browser tests for the most important workflows.
- Add observability: structured logs, request IDs, metrics, and error tracking.

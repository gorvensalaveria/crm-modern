# Codex Phase 2 Docker Review Feedback

## 1. Scope

This is Phase 2 feedback for ChatGPT Architect review.

Phase 2 was Docker review only. The goal was to understand the current Docker and runtime setup before creating production Docker files.

No production Docker files were created.

No AWS, RDS, Terraform, CI/CD, DNS, SSL, or deployment work was performed.

No `.env` values were changed or exposed.

## 2. My Understanding Of The Phase 2 Goal

The goal is not to implement Docker production deployment yet.

The goal is to answer:

> What do we need to understand or change before creating production Docker files?

The user is the builder/operator. Codex is acting as a DevOps mentor and reviewer. The review was performed through manual, read-only inspection steps, with the user running commands and pasting outputs.

## 3. Files Reviewed

Reviewed through manual inspection:

- `docker-compose.yml`
- `package.json`
- `server/package.json`
- `client/package.json`
- `shared/package.json`
- `.env.example`
- `server/src/server.ts`
- `server/src/routes/system-routes.ts`
- `server/src/controllers/system-controller.ts`
- `server/src/app.ts`
- `client/vite.config.ts`
- `client/src/services/api.ts`
- `prisma/schema.prisma`
- `.gitignore`
- deployment-related references in `README.md` and `docs/`
- build output directories: `client/dist`, `server/dist`, `shared/dist`

Docker-related files found:

- `docker-compose.yml`

Docker-related files not found:

- `Dockerfile`
- `Dockerfile.dev`
- `.dockerignore`
- `docker-compose.yaml`
- `docker-compose.prod.yml`

## 4. Current Docker Setup Summary

The current `docker-compose.yml` runs PostgreSQL only.

Current service:

- service: `postgres`
- image: `postgres:16-alpine`
- container name: `asun-migrations-postgres`
- port mapping: `5432:5432`
- volume: `postgres_data`
- healthcheck: `pg_isready -U asun -d asun_migrations`
- restart policy: `unless-stopped`

There are no Dockerized frontend or backend services yet.

Conclusion:

The current Docker setup is local-development only. It supports local PostgreSQL for development and testing. It should not be treated as the production Docker architecture.

## 5. Database Architecture Confirmation

Local development database:

- Docker Compose PostgreSQL is correct.
- `docker-compose.yml` should remain focused on local development.

AWS production database:

- Amazon RDS PostgreSQL remains the approved production target.
- Production PostgreSQL must not run as a Docker container on EC2.
- Future production app containers should connect to RDS through `DATABASE_URL`.

Prisma confirms this is feasible:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

This means the same app can use Docker Compose PostgreSQL locally and RDS PostgreSQL in production by changing environment configuration.

## 6. Application Runtime Summary

The project is an npm workspace with:

- `client`
- `server`
- `shared`

Root scripts show:

- `build` builds `shared`, then `server`, then `client`
- `test` runs server and client tests
- `typecheck` checks all workspaces
- Prisma scripts exist for generate, migrate, push, seed, and studio

Important finding:

The root `dev` script shown during manual inspection appears to contain a typo:

```text
npm rundev --workspace client
```

It likely should be:

```text
npm run dev --workspace client
```

This was not fixed during Phase 2 because this phase is review-only.

## 7. Server Runtime Findings

Server package:

- dev command: `tsx watch src/server.ts`
- build command: `tsc -p tsconfig.json`
- main entrypoint: `dist/server.js`

Server entrypoint:

```ts
const port = Number(process.env.PORT ?? 4000);
```

Findings:

- API port is configurable through `PORT`.
- Default API port is `4000`.
- The built API entrypoint appears to be `server/dist/server.js`.
- There is no explicit production `start` script yet.

Phase 3 planning item:

- Add or define a production API start command, likely based on `node server/dist/server.js`.

## 8. Health Check Findings

The API health route exists.

Route chain:

- `systemRoutes.get("/health", getHealth)`
- `app.use("/api", systemRoutes)`

Final endpoint:

```text
GET /api/health
```

Health response:

```json
{
  "data": {
    "status": "ok",
    "service": "asun-migrations-api"
  }
}
```

Conclusion:

`/api/health` is suitable for basic process health checks, deployment smoke tests, and Nginx/API verification.

Nuance:

The current health endpoint does not check database connectivity. That is acceptable for first deployment verification, but a deeper readiness check could be considered later.

## 9. Frontend Runtime And Routing Findings

Client package:

- dev command: `vite --host 0.0.0.0`
- build command: `tsc -b && vite build`
- preview command: `vite preview`

Vite development proxy:

```ts
proxy: {
  "/api": "http://localhost:4000"
}
```

Frontend API helper:

```ts
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
```

Findings:

- In local development, Vite proxies `/api` to the backend.
- In production, Vite proxy does not apply.
- If `VITE_API_BASE_URL` is empty, the frontend calls same-origin `/api/...`.

Conclusion:

The frontend is compatible with the preferred production architecture:

```text
Nginx serves client/dist
Nginx proxies /api to the Express API container
```

This allows `VITE_API_BASE_URL` to remain empty for same-origin production routing.

## 10. Express App Findings

Express uses:

- `helmet()`
- `cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" })`
- JSON body limit of `30mb`
- API routes mounted directly under `/api`

Important finding:

The Express server currently exposes API routes only. It does not serve `client/dist` static frontend files.

Conclusion:

This supports the architect’s preferred production direction:

- Nginx should serve the React/Vite static files.
- Nginx should reverse-proxy `/api` to the Node/Express API container.

Production note:

The `30mb` JSON body limit may require matching Nginx body-size configuration later, especially because document uploads can include base64 content.

## 11. Environment Variable Summary

Safe names from `.env.example`:

- `DATABASE_URL`
- `CLIENT_ORIGIN`
- `PORT`
- `VITE_API_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AI_PROVIDER`

Additional code-referenced variable:

- `NODE_ENV`

Production interpretation:

- `DATABASE_URL` should point to RDS PostgreSQL in AWS production.
- `CLIENT_ORIGIN` should match the production HTTPS frontend domain.
- `PORT` should define the API container port, likely `4000`.
- `VITE_API_BASE_URL` can remain empty if Nginx serves frontend and proxies `/api` on the same domain.
- `OPENAI_API_KEY` should be optional and secret-managed if used.
- `AI_PROVIDER=local` is useful for demo and cost control.
- `NODE_ENV=production` should be set in production runtime.

No actual `.env` values were used in this report.

## 12. Build Artifact Findings

Build outputs exist from Phase 1:

Frontend:

- `client/dist/index.html`
- `client/dist/assets/`

Backend:

- `server/dist/server.js`
- `server/dist/app.js`
- compiled routes, controllers, services, middleware, and utilities

Shared:

- `shared/dist/index.js`
- `shared/dist/index.d.ts`

Findings:

- The project has clear production build artifacts.
- Nginx can serve `client/dist`.
- The API container can run the compiled server entrypoint after a production start command is defined.

Minor note:

`server/dist` currently includes compiled test output, such as `app.test.js`. This is not a blocker, but production images ideally avoid test artifacts.

## 13. `.dockerignore` And Build Context Findings

`.dockerignore` does not exist.

`.gitignore` currently excludes:

- `node_modules`
- `dist`
- `.env`
- `.env.local`
- `coverage`
- `*.log`
- `.DS_Store`
- `*.tsbuildinfo`
- `uploads`
- `server/uploads`

Important Docker security finding:

Git ignoring `.env` is not enough. Without `.dockerignore`, Docker build context may still include sensitive or unnecessary local files.

Phase 3 recommendation:

Add `.dockerignore` before building production images.

It should exclude at least:

- `.git`
- `.env`
- `.env.local`
- `node_modules`
- logs
- coverage
- local build artifacts where appropriate
- uploads
- OS/cache files

## 14. Upload Persistence Findings

The app can write uploaded files to local disk.

Relevant behavior found:

```ts
const storageDir = path.join(process.cwd(), "uploads", defaultTenantId, matterId);
const storageKey = path.join("uploads", defaultTenantId, matterId, safeFileName);
await mkdir(storageDir, { recursive: true });
await writeFile(path.join(storageDir, safeFileName), content);
```

Docs also state local uploads are stored under `server/uploads/`.

Finding:

Container filesystems are disposable. If the API container writes uploads into its own filesystem, files may be lost when the container is recreated.

Phase 3 decision needed:

- use a host-mounted EC2 volume for first-version uploads, or
- document upload persistence as a limitation, or
- defer durable object storage to a later S3 phase

S3 remains out of scope for the current phase.

## 15. Existing Documentation Findings

Current docs cover:

- local setup with Docker Compose PostgreSQL
- local health check
- free deployment path using Vercel, Render, and Supabase

Current docs do not yet cover:

- AWS EC2 deployment
- RDS PostgreSQL
- Nginx reverse proxy
- Certbot SSL
- Cloudflare DNS
- production Dockerfile
- production Compose file
- EC2 operational flow

Conclusion:

There is no direct conflict with the new AWS/RDS architecture, but new AWS-specific docs will be needed in later phases.

## 16. Security Notes

- `.env` must not be copied into Docker images.
- Production secrets must not be committed.
- RDS credentials must not be hardcoded into Dockerfiles, Compose files, docs, or scripts.
- Production secrets should come from environment variables, GitHub Secrets, GitHub Environments, AWS Secrets Manager, or SSM Parameter Store.
- The local OpenAI key previously observed during Phase 1 should be rotated before public sharing, screenshots, commits, or deployment.
- Public screenshots should use sanitized demo data only.
- Dependency vulnerabilities reported in Phase 1 should be reviewed separately.
- Do not run `npm audit fix --force` without explicit approval.
- Production containers should avoid unnecessary dev dependencies where practical.
- Production containers should run as a non-root user where practical.

## 17. Questions For ChatGPT Architect Before Phase 3

1. Should Phase 3 first add only `.dockerignore` and production start scripts, before Dockerfile work?
2. Should the first production API image be API-only, while Nginx on EC2 serves `client/dist` directly?
3. Should `client/dist` be copied to the EC2 host by CI/CD, or produced on EC2 during deployment?
4. Should the API Docker image include only backend runtime files, or include the whole monorepo build output for simplicity?
5. Should production database setup use Prisma migrations instead of `db:push`?
6. Should seeding ever run against production RDS, or only against local/dev/demo databases?
7. Should uploaded files use an EC2 host-mounted volume in the first AWS version?
8. Should the initial health check remain process-only, or should a database readiness endpoint be added later?
9. Should `VITE_API_BASE_URL` remain empty for same-origin Nginx routing?
10. Should the root `dev` script typo be fixed before Phase 3 Docker implementation?

## 18. Recommended Phase 3 Direction

Do not implement until ChatGPT Architect approves.

Recommended next phase:

1. Fix the root `dev` script typo.
2. Add a production API `start` script.
3. Add `.dockerignore`.
4. Create an API-focused multi-stage Dockerfile.
5. Ensure Prisma Client generation happens during Docker build.
6. Keep database schema application separate from normal container startup.
7. Add `docker-compose.prod.yml` for EC2 app services only.
8. Do not include PostgreSQL in production Compose.
9. Use RDS through runtime `DATABASE_URL`.
10. Plan Nginx to serve `client/dist` and proxy `/api`.
11. Decide upload persistence strategy.

Likely target shape:

```text
Cloudflare DNS
  -> EC2 Nginx + Certbot
  -> Nginx serves client/dist static frontend
  -> Nginx proxies /api to Express API container
  -> API container connects to Amazon RDS PostgreSQL
  -> CloudWatch basic monitoring later
```

## 19. Explicit Non-Implementation Statement

No production Docker files were created.

No `.dockerignore` was created.

No production Compose file was created.

No AWS work was performed.

No RDS work was performed.

No Terraform work was performed.

No CI/CD deployment work was performed.

No DNS work was performed.

No SSL work was performed.

No deployment was performed.

No `.env` values were changed or exposed.

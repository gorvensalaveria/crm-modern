# Codex Phase 3F: Production Runtime Requirements Audit

## 1. Phase Name And Purpose

Phase 3F: Production Runtime Requirements Audit

Purpose:

Review the current application runtime requirements before any production Compose file is created.

This was a planning/review phase only. No production Docker Compose, AWS, RDS, Terraform, CI/CD, DNS, SSL, Nginx, deployment, or `.env` changes were made.

## 2. Files Inspected

Files inspected:

- `package.json`
- `package-lock.json`
- `server/package.json`
- `server/Dockerfile`
- `server/src/server.ts`
- `server/src/app.ts`
- `server/src/routes/system-routes.ts`
- `server/src/controllers/system-controller.ts`
- `server/src/lib/prisma.ts`
- `prisma/schema.prisma`
- `docker-compose.yml`
- `.env.example`

No `.env` file was inspected or modified.

## 3. Backend / API Start Command

The server workspace production start command is:

```bash
npm run start --workspace server
```

The server workspace resolves that to:

```bash
node dist/server.js
```

The current API Dockerfile uses the same workspace start command:

```dockerfile
CMD ["npm", "run", "start", "--workspace", "server"]
```

Conclusion:

The API has a clear production runtime command for future API-only production Compose.

## 4. Required Environment Variables By Name

Environment variable names identified from source and example configuration:

- `DATABASE_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `NODE_ENV`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `VITE_API_BASE_URL`

Notes:

- `DATABASE_URL` is required for database-backed API behavior.
- `PORT` defaults to `4000` if not provided.
- `CLIENT_ORIGIN` defaults to `http://localhost:5173` if not provided.
- `AI_PROVIDER=local` or missing `OPENAI_API_KEY` allows deterministic local AI fallback behavior.
- `VITE_API_BASE_URL` is frontend-oriented and should be handled during frontend/Nginx planning.

Secret safety:

- No real `.env` values were inspected.
- No full `DATABASE_URL` value should be pasted into chat or committed to documentation.
- Production values should be passed through approved runtime secret handling later.

## 5. API Port

The API port is read from:

```ts
process.env.PORT ?? 4000
```

Confirmed default:

```text
4000
```

Conclusion:

Future API-only production Compose can map or expose container port `4000`, unless a later phase explicitly changes the runtime port.

## 6. Health Check Endpoint

Health route:

```text
GET /api/health
```

Expected response:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

Current behavior:

- The health endpoint exists.
- It verifies the API process is reachable.
- It does not currently verify database connectivity.

Recommendation:

- Use `GET /api/health` as the first API process smoke check.
- Consider a deeper database readiness endpoint later only if Architect approves that scope.

## 7. Database Connection Behavior

Prisma datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Runtime behavior:

- The API uses Prisma Client.
- Prisma reads the database connection from `DATABASE_URL`.
- This can point to local PostgreSQL for development.
- This can later point to Amazon RDS PostgreSQL in production.

Conclusion:

The API can run without a local PostgreSQL Docker service as long as `DATABASE_URL` points to a reachable external PostgreSQL database, such as future Amazon RDS PostgreSQL.

Important distinction:

- `GET /api/health` can run without proving database connectivity.
- Database-backed API routes require a valid reachable `DATABASE_URL`.

## 8. Migration Command And Deployment Guidance

Current database-related root scripts:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

Current script behavior:

- `db:generate` runs Prisma Client generation.
- `db:migrate` uses `prisma migrate dev`, which is development-oriented.
- `db:push` applies schema directly and is useful for local/dev workflows.
- `db:seed` runs seed data.

Production guidance:

- Database migrations should not run automatically on every API container startup.
- Production migration workflow should be a separate approved deployment step.
- A future production migration command should be planned before RDS deployment.
- `prisma migrate deploy` may be the likely production direction, but it should be added only in a later approved phase if Architect chooses it.

## 9. Dockerfile Readiness

Current API Dockerfile:

```text
server/Dockerfile
```

Confirmed behavior:

- Uses `node:20-bookworm-slim`.
- Installs `openssl` and `ca-certificates`.
- Uses `npm ci`.
- Generates Prisma Client during image build.
- Builds `shared`.
- Builds `server`.
- Sets `NODE_ENV=production`.
- Sets `PORT=4000`.
- Exposes port `4000`.
- Starts the server workspace.
- Does not run migrations automatically.

Readiness:

The current Dockerfile is acceptable for an API-only production Compose learning step, with known deferred hardening items:

- multi-stage build
- non-root runtime user
- production dependency pruning
- smaller runtime-only image
- Docker `HEALTHCHECK`

Those hardening items should wait for a later approved phase unless Architect changes the priority.

## 10. Local Compose Context

The current `docker-compose.yml` is local-development database support only.

It defines:

- local PostgreSQL service
- published local port `5432`
- local database volume
- PostgreSQL healthcheck

Decision from Phase 3E:

- Keep current `docker-compose.yml` local-only.
- Do not modify it for production app Compose.
- Do not put production PostgreSQL in Docker on EC2.
- Future production database target remains Amazon RDS PostgreSQL.

## 11. Runtime Readiness For Future API-Only Production Compose

The project is ready to plan a future API-only production Compose implementation because:

- API Dockerfile exists.
- API image builds.
- API container runs.
- API health check passes.
- API container can receive `DATABASE_URL` at runtime.
- API container has already connected to local PostgreSQL through runtime environment configuration.
- Production database can later be externalized through RDS by changing runtime `DATABASE_URL`.
- No automatic startup migration is present.

Remaining requirements before implementation:

- Decide future Compose filename.
- Decide secret injection method.
- Decide whether Compose implementation should remain API-only first.
- Decide whether Dockerfile hardening should happen before Compose.
- Define production migration command/workflow.
- Confirm whether uploads need a volume or should wait for object storage planning.

## 12. Boundaries Respected

Boundaries respected during Phase 3F:

- No production Docker Compose file was created.
- Existing local `docker-compose.yml` was not modified.
- PostgreSQL was not added as a production Docker service.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL / Certbot work was started.
- No Nginx files were created.
- No deployment work was started.
- No `.env` files were changed.
- No secrets were requested or exposed.
- No destructive commands were run.
- `npm audit fix --force` was not run.

## 13. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next option:

- Plan or implement API-only production app Compose as a separate file, without PostgreSQL.

Before implementation, confirm:

- Compose filename and scope.
- Runtime environment variable strategy.
- Whether to use the existing API image tag or build from `server/Dockerfile`.
- Whether migration workflow should be planned first.
- Whether Dockerfile hardening should happen before Compose implementation.


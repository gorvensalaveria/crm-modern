# Codex Phase 3B: API Dockerfile Planning And Implementation

## 1. Phase Name And Purpose

Phase 3B: API Dockerfile Planning And Implementation

Purpose:

Create the first controlled Docker implementation step for CRM Modern / Modern Fullstack by focusing on the Express API container only.

This phase verified that the API can be built and run locally in Docker before adding production Compose, Nginx, frontend static hosting, AWS, RDS, DNS, SSL, or CI/CD.

## 2. Scope Completed

Completed Phase 3B scope:

- Planned the API-only Dockerfile approach.
- Inspected package, workspace, Prisma, Docker ignore, server entrypoint, and health route assumptions.
- Confirmed Node.js version requirement.
- Confirmed npm/package-lock usage.
- Confirmed server build and start behavior.
- Confirmed Prisma Client generation approach.
- Created `server/Dockerfile`.
- Built the API image locally.
- Ran the API container locally.
- Verified `GET /api/health`.
- Fixed a Prisma OpenSSL runtime warning with an approved Dockerfile revision.
- Rebuilt and re-tested the API image successfully.

## 3. Files Inspected

Files inspected during Phase 3B:

- `package.json`
- `package-lock.json`
- `server/package.json`
- `shared/package.json`
- `prisma/schema.prisma`
- `.dockerignore`
- `server/src/server.ts`
- `server/src/app.ts`
- `server/src/routes/system-routes.ts`

## 4. Files Changed

Files changed during Phase 3B:

- `server/Dockerfile`
- `CODEX_PHASE_3B_API_DOCKERFILE.md`

No application source code was changed.

No `.env` file was changed.

## 5. Dockerfile Summary

Created API-only Dockerfile:

```text
server/Dockerfile
```

Dockerfile behavior:

- Uses `node:20-bookworm-slim`.
- Sets `/app` as the working directory.
- Installs `openssl` and `ca-certificates`.
- Copies root and workspace package manifests.
- Runs `npm ci`.
- Copies Prisma schema, base TypeScript config, shared package, and server package.
- Runs Prisma Client generation.
- Builds the `shared` workspace.
- Builds the `server` workspace.
- Sets `NODE_ENV=production`.
- Sets `PORT=4000`.
- Exposes port `4000`.
- Starts the API with `npm run start --workspace server`.

Final Dockerfile:

```dockerfile
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json
COPY client/package.json ./client/package.json

RUN npm ci

COPY prisma ./prisma
COPY tsconfig.base.json ./tsconfig.base.json
COPY shared ./shared
COPY server ./server

RUN npm run db:generate
RUN npm run build --workspace shared
RUN npm run build --workspace server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "server"]
```

## 6. Verification Results

### API Image Build

Command:

```bash
docker build -f server/Dockerfile -t crm-modern-api:phase3b .
```

Result:

- Docker build completed successfully.
- Image was tagged as `crm-modern-api:phase3b`.
- `npm ci` completed successfully.
- Prisma Client generation completed successfully.
- `shared` build completed successfully.
- `server` build completed successfully.

Overall result: Passed.

### Initial API Container Run

Command:

```bash
docker run --rm --name crm-modern-api-phase3b -p 4000:4000 crm-modern-api:phase3b
```

Initial result:

- API container started successfully.
- API printed:
  ```text
  ASUN Migrations API running on http://localhost:4000
  ```
- Visiting `/` returned `Cannot GET /`, which is expected because this phase is API-only.
- Prisma emitted an OpenSSL detection warning.

### Prisma OpenSSL Warning And Fix

Initial warning:

```text
Prisma failed to detect the libssl/openssl version to use
```

Fix:

Added the following approved block to `server/Dockerfile`:

```dockerfile
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
```

Reason:

- `openssl` addresses Prisma runtime compatibility.
- `ca-certificates` supports TLS/HTTPS connections.
- `--no-install-recommends` keeps the image smaller.
- Removing `/var/lib/apt/lists/*` cleans the package manager cache.

After the fix:

- Image rebuilt successfully.
- API container started successfully.
- Prisma OpenSSL warning no longer appeared.

Overall result: Passed.

### API Health Check

Command:

```bash
curl -i http://localhost:4000/api/health
```

Result:

```http
HTTP/1.1 200 OK
```

Response body:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

Overall result: Passed.

## 7. Current Readiness Status

Current Phase 3B readiness status:

- API-only Dockerfile exists.
- API image builds locally.
- API container runs locally.
- API health endpoint responds successfully.
- Prisma Client generation works during image build.
- Prisma OpenSSL runtime warning was resolved.
- No database migrations run automatically on container startup.
- No frontend, Nginx, production Compose, AWS, RDS, DNS, SSL, or CI/CD work was added.

Conclusion:

The API container is ready for ChatGPT Architect review and for the next approved Docker phase.

## 8. Risks Or Notes

Notes:

- This is a learning/local verification Dockerfile, not a complete production deployment.
- The Dockerfile is API-only.
- `/` returning `Cannot GET /` is expected because frontend/Nginx work is out of scope.
- `GET /api/health` does not require database connectivity.
- Database-backed API routes will require safe runtime `DATABASE_URL` handling in a later approved phase.
- The image currently keeps build dependencies because no production pruning or multi-stage optimization was added yet.

Risks:

- Image size may be larger than a future optimized production image.
- Future database-backed container verification will need careful secret-safe environment handling.
- Future migration workflow must be explicitly planned and must not run blindly on every container startup.
- Future production runtime may require further image hardening, non-root user configuration, or multi-stage build optimization.

## 9. Boundaries Respected

Boundaries respected during Phase 3B:

- Kept implementation API-only.
- No production Docker Compose file was created.
- PostgreSQL was not added as a production Docker service.
- No Nginx configuration was added.
- No frontend static hosting was added.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL / Certbot work was started.
- No deployment work was started.
- No `.env` changes were made.
- No secrets were exposed.
- No database migrations were run automatically on container startup.
- No destructive commands were run.
- `npm audit fix --force` was not run.

## 10. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Review and accept the API-only Dockerfile phase.
- Decide whether the next Docker phase should add:
  - database-backed API container verification with safe local `DATABASE_URL` handling, or
  - production Compose planning, or
  - Nginx/static frontend planning.

Before the next implementation phase, confirm:

- Whether to keep improving the API image first.
- Whether to add a multi-stage Dockerfile later.
- Whether to test database-backed API routes in Docker.
- How to pass runtime environment variables safely.
- When to introduce Nginx and frontend static hosting.
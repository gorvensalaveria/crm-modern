# Codex Phase 3C: API Dockerfile Hardening Review

## 1. Phase Name And Purpose

Phase 3C: API Dockerfile Hardening Review

Purpose:

Review the current API-only Dockerfile for production-readiness improvements before adding frontend/Nginx, production Compose, AWS, RDS, DNS, SSL, or CI/CD.

This was a review/planning ticket only. No Dockerfile changes were made during this phase.

## 2. Files Inspected

Files inspected:

- `server/Dockerfile`

## 3. Findings

The current `server/Dockerfile` is acceptable for the current learning/local verification stage.

Confirmed strengths:

- Uses `node:20-bookworm-slim`, matching the repo requirement of Node `>=20.0.0`.
- Uses `npm ci` with `package-lock.json` for reproducible dependency installation.
- Keeps the implementation API-only.
- Generates Prisma Client during image build.
- Builds the `shared` workspace.
- Builds the `server` workspace.
- Starts the API through the existing server workspace start script.
- Does not run database migrations automatically on container startup.
- Installs `openssl` and `ca-certificates`, resolving the Prisma OpenSSL runtime warning found in Phase 3B.
- Uses `.dockerignore` to keep `.env`, local dependencies, build output, logs, uploads, and Git metadata out of the Docker build context.
- Previously built successfully.
- Previously ran successfully.
- Previously passed `GET /api/health`.

Review categories:

### Good Enough For Current Learning Stage

- Single-stage Dockerfile
- API-only image
- Prisma Client generation during build
- Existing workspace build/start scripts
- OpenSSL and CA certificate runtime compatibility
- External health verification with `curl`

### Worth Improving Now

No required Dockerfile changes were identified for this phase.

The current Dockerfile should remain unchanged for now.

### Safe To Defer

- Docker `HEALTHCHECK`
- Image size optimization
- Production dependency pruning
- Layer caching refinements
- Runtime environment validation
- Docker metadata labels

### Should Wait For Later Production/Multi-Stage Phase

- Multi-stage build
- Non-root runtime user
- Runtime-only image
- Smaller production image
- Pruned production dependencies
- Database-backed container verification
- Production Compose integration
- Nginx/static frontend integration
- AWS/RDS/DNS/SSL/CI/CD deployment assumptions

## 4. Decision

Decision:

Keep the current `server/Dockerfile` unchanged for now.

Reason:

The Dockerfile is good enough for the current Phase 3B/3C learning and local API verification stage. It builds, runs, passes `GET /api/health`, avoids automatic migrations, and stays within the approved API-only scope.

## 5. Improvements Deferred

Deferred to a later approved production/multi-stage Docker phase:

- Multi-stage build
- Non-root runtime user
- Production dependency pruning
- Smaller runtime-only image
- Docker `HEALTHCHECK`
- Database-backed container verification
- Production Docker Compose
- Nginx/frontend static hosting
- AWS/RDS/DNS/SSL/CI/CD deployment assumptions

## 6. Boundaries Respected

Boundaries respected during Phase 3C:

- `server/Dockerfile` was not modified.
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
- No destructive commands were run.
- `npm audit fix --force` was not run.

## 7. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Database-backed API container verification with safe local `DATABASE_URL` handling.
- Production Docker Compose planning.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.

Before the next phase, confirm:

- Whether to test database-backed API routes in the current API container.
- Whether to improve the Dockerfile before adding Compose.
- Whether production Compose should remain planning-only first.
- How runtime environment variables will be passed safely without exposing secrets.
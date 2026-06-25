# Codex Phase 3E: Production App Compose Planning

## 1. Phase Name And Purpose

Phase 3E: Production App Compose Planning

Purpose:

Plan the future production-style Docker Compose approach for CRM Modern / Modern Fullstack app services.

This was a planning-only phase. No Compose files were created or modified.

Important architecture rule:

Production PostgreSQL must not run in Docker on EC2. The future production database target remains Amazon RDS PostgreSQL.

## 2. Files Inspected

Files inspected:

- `docker-compose.yml`

## 3. Current Local Compose Purpose

The current `docker-compose.yml` is local-development database support only.

It currently defines:

- `postgres` service
- `postgres:16-alpine`
- container name `asun-migrations-postgres`
- local port mapping `5432:5432`
- local development database configuration
- persistent local volume `postgres_data`
- PostgreSQL healthcheck using `pg_isready`

The current file should remain local-development-only for now.

## 4. Future Production App Compose Direction

A future production-style app Compose file should orchestrate application runtime services only.

Expected future purpose:

- Run the API container.
- Pass runtime environment variables safely.
- Configure app restart behavior.
- Define app service names and networks.
- Later coordinate with Nginx/static frontend service if approved.

The future production app Compose file should likely be separate from the current local `docker-compose.yml`.

## 5. Services Allowed Later

Possible future production app Compose services, after Architect approval:

- API service using `server/Dockerfile` or a future optimized API image.
- Optional Nginx/static frontend service in a later approved phase.
- Optional named volume for uploads if local upload persistence remains part of the design.
- Optional log-related mounts only if explicitly planned.

## 6. Services Excluded

Production app Compose must not include:

- PostgreSQL as a production database service.
- Any database container intended to replace Amazon RDS.
- AWS resource creation.
- RDS configuration.
- DNS automation.
- SSL / Certbot automation.
- CI/CD deployment logic.

Production PostgreSQL should be Amazon RDS PostgreSQL later.

## 7. Runtime Environment And Secret Handling

Future production app Compose should receive runtime configuration safely.

Rules:

- Do not bake secrets into Docker images.
- Do not commit real production environment values.
- Do not paste full `DATABASE_URL` values into chat or documentation.
- Use placeholders in examples.
- Use approved secret handling in a later deployment phase.
- Do not modify `.env` during planning.

Likely runtime variable names:

- `DATABASE_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_API_KEY`, if live AI is approved later

## 8. RDS Connection Direction

Future API service should connect to Amazon RDS PostgreSQL through runtime `DATABASE_URL`.

Direction:

- API container receives `DATABASE_URL` at runtime.
- `DATABASE_URL` points to RDS later, not a production PostgreSQL container.
- RDS security groups should allow database access only from the approved app path.
- Database migrations should not run automatically on every container startup.
- Migration workflow must be approved separately.

## 9. Deferred Nginx / Frontend Items

The following items should wait for a dedicated Nginx/frontend planning phase:

- Nginx service design.
- Static frontend serving strategy.
- `/api` reverse proxy rules.
- SPA fallback configuration.
- Upload body-size limits.
- SSL-related Nginx configuration.
- Cloudflare/DNS assumptions.
- Whether Nginx runs as a host package or container.

## 10. Open Questions

Before creating production Compose, answer:

- What should the future Compose filename be?
- Should the first production Compose implementation be API-only?
- Should Nginx be added in the same Compose file later or run directly on the host?
- How will production environment variables be injected safely?
- Will uploads need a persistent volume?
- Should app logs be stdout-only first?
- What restart policy should be used?
- Should the API image be optimized or multi-stage before Compose?
- What network name/service name should future Nginx use to reach the API?
- What exact migration workflow will be used outside app startup?

## 11. Decision

Decision:

Do not create or modify any Compose file in Phase 3E.

Accepted direction:

- Keep current `docker-compose.yml` as local-development PostgreSQL support only.
- Plan a separate future production app Compose file.
- Exclude PostgreSQL from production Compose.
- Use Amazon RDS PostgreSQL as the future production database.
- Future production Compose should likely start API-only first.
- Defer Nginx/frontend details to a later dedicated phase.

## 12. Boundaries Respected

Boundaries respected during Phase 3E:

- No production Docker Compose file was created.
- Existing local `docker-compose.yml` was not modified.
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
- No full `DATABASE_URL` was requested or documented.
- No destructive commands were run.
- `npm audit fix --force` was not run.

## 13. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- API-only production Compose planning or implementation.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.
- API image optimization and non-root runtime planning.

Before the next phase, confirm:

- Whether the next step should stay planning-only.
- Whether the first production Compose implementation should be API-only.
- Whether Dockerfile optimization should happen before Compose implementation.
- Whether Nginx/frontend planning should happen before production Compose implementation.
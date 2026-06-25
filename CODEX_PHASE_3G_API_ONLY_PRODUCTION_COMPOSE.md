# Codex Phase 3G: API-Only Production Compose Implementation

## 1. Phase Name And Purpose

Phase 3G: API-Only Production Compose Implementation

Purpose:

Create the first app-only production-style Docker Compose file for the API container.

This phase was API-only. PostgreSQL was not included because the future production database target remains Amazon RDS PostgreSQL.

## 2. Files Inspected

Files inspected:

- `CODEX_PHASE_3E_PRODUCTION_APP_COMPOSE_PLANNING.md`
- `CODEX_PHASE_3F_PRODUCTION_RUNTIME_REQUIREMENTS_AUDIT.md`
- `server/Dockerfile`

## 3. Files Created

Files created:

- `docker-compose.prod.yml`
- `CODEX_PHASE_3G_API_ONLY_PRODUCTION_COMPOSE.md`

## 4. Compose File Summary

Created production-style app Compose file:

```text
docker-compose.prod.yml
```

Purpose:

- Define the API service only.
- Build from `server/Dockerfile`.
- Use image name `crm-modern-api:prod`.
- Map host API port to container port `4000`.
- Pass runtime environment variable references safely.
- Keep PostgreSQL external.

Final Compose content:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: server/Dockerfile
    image: crm-modern-api:prod
    restart: unless-stopped
    ports:
      - "${HOST_API_PORT:-4000}:4000"
    environment:
      NODE_ENV: production
      PORT: ${PORT:-4000}
      DATABASE_URL: ${DATABASE_URL:?DATABASE_URL is required}
      CLIENT_ORIGIN: ${CLIENT_ORIGIN}
      AI_PROVIDER: ${AI_PROVIDER:-local}
      OPENAI_MODEL: ${OPENAI_MODEL:-gpt-5.4-mini}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
```

## 5. Design Decisions

Accepted design decisions:

- Use filename `docker-compose.prod.yml`.
- Keep current local `docker-compose.yml` unchanged.
- Define only an `api` service.
- Use `server/Dockerfile`.
- Do not include PostgreSQL.
- Do not include Nginx.
- Do not include frontend static hosting.
- Do not run database migrations automatically on container startup.
- Use runtime environment variable references instead of hardcoded values.
- Use `HOST_API_PORT` for the host port.
- Use `PORT` for the container/app runtime port.

## 6. Validation Results

Initial validation command:

```bash
docker compose -f docker-compose.prod.yml config
```

Result:

- Compose syntax rendered successfully.
- However, Docker Compose auto-loaded local `.env` values and printed a real `OPENAI_API_KEY`.

This revealed an important secret-handling risk:

- `docker compose config` can print resolved environment values.
- Future validation should avoid printing resolved config when `.env` may contain secrets.

Safer validation command:

```bash
docker compose --env-file /tmp/crm-modern-compose-placeholder.env -f docker-compose.prod.yml config --quiet
```

Result:

- Returned silently.
- Compose syntax validation passed.
- Placeholder values were used.
- Resolved secrets were not printed.

Overall validation result: Passed after switching to safe validation.

## 7. Secret Handling Note

During the first validation attempt, a real OpenAI API key was printed by Docker Compose because Compose auto-loaded `.env`.

Recovery and guidance:

- Treat the exposed key as compromised.
- Rotate the exposed OpenAI API key as soon as practical.
- Do not paste resolved Compose config output when `.env` may contain secrets.
- Prefer `docker compose config --quiet` for validation.
- Prefer placeholder env files for safe validation.
- Do not document real secret values.

No `.env` file was modified during this phase.

## 8. Boundaries Respected

Boundaries respected during Phase 3G:

- API-only production-style Compose was created.
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
- No migrations were configured to run automatically on container startup.
- No destructive commands were run.
- `npm audit fix --force` was not run.

## 9. Current Readiness Status

Current readiness status:

- API-only production-style Compose file exists.
- Compose syntax validates safely with placeholder env values.
- Compose file excludes PostgreSQL.
- Compose file is ready for ChatGPT Architect review.
- Runtime secret handling needs continued care in future phases.
- Exposed OpenAI API key should be rotated outside this repo workflow.

## 10. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- API-only Compose runtime verification with placeholder/local-safe runtime values.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.
- Runtime secrets handling plan.
- Production migration workflow planning.

Before next phase, confirm:

- Whether to run `docker compose -f docker-compose.prod.yml up` locally using safe env values.
- Whether to rotate the exposed OpenAI API key first.
- Whether to keep Compose API-only for one more verification phase.
- Whether Nginx/frontend planning should happen next.
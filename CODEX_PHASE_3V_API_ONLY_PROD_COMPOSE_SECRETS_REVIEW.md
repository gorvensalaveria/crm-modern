# Codex Phase 3V: API-Only Production Compose Secrets Review

## 1. Phase Name And Purpose

Phase 3V: API-Only Production Compose Secrets Review

Purpose:

Review `docker-compose.prod.yml` from a runtime secrets-handling perspective and confirm whether it is safe enough for future EC2 use or whether improvements should be planned later.

This was a review/planning-only phase. No Compose files, Dockerfiles, `.env` files, deployment files, AWS resources, RDS resources, or secrets were modified.

## 2. File Reviewed

File reviewed:

```text
docker-compose.prod.yml
```

The file defines an API-only production-style Compose service.

PostgreSQL is not included in production Compose.

## 3. Environment Variables Referenced

`docker-compose.prod.yml` references:

- `HOST_API_PORT`
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_MODEL`
- `OPENAI_API_KEY`

Relevant Compose lines:

```yaml
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

## 4. Secret Vs Non-Secret Classification

Secrets:

- `DATABASE_URL`
- `OPENAI_API_KEY`

Reason:

- `DATABASE_URL` can include database username, password, host, port, and database name.
- `OPENAI_API_KEY` grants access to an external API.

Non-secret or lower-sensitivity config:

- `HOST_API_PORT`
- `NODE_ENV`
- `PORT`
- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_MODEL`

Important:

Even non-secret config should be reviewed before sharing publicly, but it is not treated the same as credentials or API keys.

## 5. Whether Compose Contains Real Secrets

No real secrets were found in `docker-compose.prod.yml`.

The file uses environment references instead of hardcoded secret values:

```yaml
DATABASE_URL: ${DATABASE_URL:?DATABASE_URL is required}
OPENAI_API_KEY: ${OPENAI_API_KEY:-}
```

Conclusion:

The Compose file itself does not contain real secrets.

## 6. Future EC2 Suitability

The current env reference style is acceptable as a future EC2 starting point.

Positive findings:

- `DATABASE_URL` is required and not hardcoded.
- `OPENAI_API_KEY` is referenced through environment variables and not hardcoded.
- `HOST_API_PORT` is override-friendly.
- `PORT` is override-friendly.
- PostgreSQL is not included in production Compose.
- No RDS values are hardcoded.
- No migration commands are added to startup.

Caution:

The actual secret injection method for EC2 still needs a later approved implementation plan.

## 7. Risks Around `docker compose config`

`docker compose config` can resolve environment variables and print real secret values.

Risk:

- It may print `DATABASE_URL`.
- It may print `OPENAI_API_KEY`.
- It may print other resolved sensitive runtime values.
- This project previously encountered an OpenAI API key exposure through resolved Compose output.

Safety rule:

Do not paste or screenshot `docker compose config` output when real secrets may be loaded.

Safer alternatives:

- Use `docker compose config --quiet`.
- Use placeholder env files.
- Avoid resolved config output in logs, screenshots, or chat.
- Use targeted validation commands that do not print secret values.

## 8. Risks Around Blank / Default Values

Current Compose behavior:

```yaml
OPENAI_API_KEY: ${OPENAI_API_KEY:-}
AI_PROVIDER: ${AI_PROVIDER:-local}
```

`OPENAI_API_KEY` may be blank.

This is acceptable for now because:

- local/mock AI fallback exists,
- `AI_PROVIDER=local` is supported,
- the current phase is not production deployment.

Future production risk:

- If `AI_PROVIDER=openai` but `OPENAI_API_KEY` is blank, AI behavior may fail or fall back unexpectedly.
- Future production validation should decide whether `OPENAI_API_KEY` becomes required when `AI_PROVIDER=openai`.

Other future validation candidates:

- `CLIENT_ORIGIN`
- `DATABASE_URL`
- `NODE_ENV`
- `PORT`
- `HOST_API_PORT`

## 9. What Should Stay Unchanged For Now

Keep unchanged for now:

- Do not add real secrets to Compose.
- Do not include PostgreSQL in production Compose.
- Do not hardcode RDS values.
- Do not add AWS/deployment assumptions.
- Do not modify Dockerfile.
- Do not modify `docker-compose.prod.yml`.
- Do not add migration commands to API startup.
- Do not add Nginx/frontend configuration in this phase.

## 10. Future Improvements

Future improvements to consider:

- Plan EC2 runtime env injection method.
- Plan production secret storage approach.
- Consider an approved production env validation step.
- Consider whether `CLIENT_ORIGIN` should be required in production.
- Consider requiring `OPENAI_API_KEY` only when `AI_PROVIDER=openai`.
- Document safe `--env-file` usage for EC2.
- Use `docker compose config --quiet` in validation docs.
- Create a pre-deployment secrets checklist.
- Document evidence redaction rules in the operations runbook later.

## 11. Recommendation

Recommendation:

Keep `docker-compose.prod.yml` unchanged for now.

The current API-only production-style Compose file is acceptable as a future EC2 starting point from a secrets-reference perspective.

Before EC2/RDS deployment, plan:

- secret injection method,
- environment validation,
- RDS `DATABASE_URL` handling,
- evidence/log redaction rules,
- safe Compose validation commands.

## 12. Boundaries Respected

Boundaries respected during Phase 3V:

- `docker-compose.prod.yml` was not modified.
- Dockerfile was not modified.
- `.env` was not modified.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- `docker compose config` was not run with real secrets.
- No commands were run that print resolved secrets.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL work was started.
- No deployment work was started.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No commit was made.
- `npm audit fix --force` was not run.

## 13. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Runtime secrets implementation planning.
- EC2 env-file strategy planning.
- API-only production Compose hardening review.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.
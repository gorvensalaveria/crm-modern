# Codex Phase 3U: Runtime Secrets Handling Planning

## 1. Phase Name And Purpose

Phase 3U: Runtime Secrets Handling Planning

Purpose:

Plan how runtime environment variables and secrets should be handled for future EC2/RDS deployment, without creating AWS resources or changing deployment infrastructure yet.

This was a planning-only phase. No real secrets, `.env` files, Docker files, Compose files, GitHub Actions, AWS resources, RDS resources, or deployment files were modified.

## 2. Current Env-Related Files And References

Current env-related files and references identified:

- `.env`
- `.env.example`
- `client/src/vite-env.d.ts`
- `prisma/schema.prisma`
- `server/src/server.ts`
- `server/src/app.ts`
- `server/src/lib/prisma.ts`
- `server/src/services/crm-repository.ts`
- `client/src/services/api.ts`
- `docker-compose.prod.yml`
- `server/Dockerfile`

Important:

- `.env` exists but was not opened or inspected for values.
- `.env.example` contains example/local placeholder-style values.
- Runtime env references exist in backend, frontend, Prisma, Dockerfile, and Compose configuration.

## 3. API Runtime Environment Variables

API/runtime environment variables identified:

- `DATABASE_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `NODE_ENV`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Compose-related host/runtime variable:

- `HOST_API_PORT`

Notes:

- `DATABASE_URL` is used by Prisma.
- `PORT` controls API runtime port.
- `CLIENT_ORIGIN` controls CORS origin.
- `NODE_ENV` controls runtime mode behavior.
- `AI_PROVIDER`, `OPENAI_MODEL`, and `OPENAI_API_KEY` control AI behavior.
- `HOST_API_PORT` controls host-side Compose port mapping.

## 4. Frontend Env / Build Considerations

Frontend env variable identified:

- `VITE_API_BASE_URL`

Important:

Values prefixed with `VITE_` can become visible in browser-delivered frontend assets.

Therefore:

- `VITE_API_BASE_URL` may contain public frontend configuration.
- `VITE_API_BASE_URL` must not contain secrets.
- No API keys, passwords, private URLs with credentials, tokens, or database strings should ever use `VITE_` variables.

## 5. Secrets Vs Non-Secret Config

Secrets:

- `DATABASE_URL`
- `OPENAI_API_KEY`

Reason:

- `DATABASE_URL` can include username, password, host, port, database name, and connection options.
- `OPENAI_API_KEY` grants access to an external paid API.

Non-secret or lower-sensitivity config:

- `PORT`
- `HOST_API_PORT`
- `CLIENT_ORIGIN`
- `NODE_ENV`
- `AI_PROVIDER`
- `OPENAI_MODEL`
- `VITE_API_BASE_URL`

Important nuance:

Even non-secret config should be reviewed before sharing publicly, but it is not treated the same as credentials or API keys.

## 6. Safe Local Handling

Recommended local handling:

- Keep real local secrets in `.env`.
- Do not commit `.env`.
- Do not paste `.env` contents into chat.
- Keep `.env.example` safe and placeholder-oriented.
- Use temporary env files in `/tmp` for one-off tests.
- Delete temporary env files after their approved use.
- Do not paste full `DATABASE_URL` values into chat.
- Do not paste command output that expands secrets.
- Prefer `docker compose config --quiet` with placeholder env files for validation.

Local examples should use placeholders or clearly local-safe sample values only.

## 7. Safe Future EC2 Handling

Recommended future EC2 handling:

- Store production env values only on the server or in an approved secret injection mechanism.
- Restrict access to any server-local env file.
- Use appropriate file permissions.
- Do not commit production env files.
- Do not print resolved production env values in logs.
- Keep RDS credentials separate from source code.
- Rotate secrets if they are exposed in logs, screenshots, commits, or chat.

Possible future options, to be decided later:

- server-local env file,
- systemd environment file,
- Docker Compose env file on EC2,
- AWS Secrets Manager,
- SSM Parameter Store.

No EC2 implementation was started during Phase 3U.

## 8. Safe Future GitHub Actions Handling

Recommended future GitHub Actions handling:

- Use GitHub Actions Secrets for secret values.
- Use GitHub Actions Variables only for non-secret config.
- Do not echo secret values.
- Do not run commands that print resolved secret configuration.
- Avoid uploading logs or artifacts containing secrets.
- Keep deployment logs minimal and redacted.
- Use environment protection rules later if production deployment workflows are added.

No GitHub Actions files were created or modified during Phase 3U.

## 9. Safe Future RDS `DATABASE_URL` Handling

Future RDS `DATABASE_URL` should:

- Be generated only after RDS exists.
- Be treated as a secret.
- Be stored only in approved secret locations.
- Never be committed.
- Never be pasted into chat.
- Never be shown in screenshots.
- Never be printed in deployment logs.
- Be used only by approved runtime or migration commands.

Before using a future RDS `DATABASE_URL`, confirm:

- target environment,
- database host,
- database name,
- user/role,
- SSL requirement,
- backup/snapshot expectation,
- migration command scope.

No RDS work was started during Phase 3U.

## 10. Why `docker compose config` Is Risky With Real Secrets

`docker compose config` can resolve and print environment variable values.

Risk:

- If real `.env` values are loaded, `docker compose config` may print secrets such as:
  - `DATABASE_URL`
  - `OPENAI_API_KEY`
  - other tokens/passwords

This project already encountered a real example where resolved Compose output printed an OpenAI API key.

Safer alternatives:

- Use `docker compose config --quiet`.
- Use placeholder env files.
- Avoid screenshots of resolved Compose config.
- Avoid pasting resolved Compose config into chat.
- Prefer targeted validation commands that do not print environment values.

## 11. Screenshot / Log / Evidence Redaction Rules

Before sharing screenshots, logs, or command output:

Redact:

- full `DATABASE_URL`
- API keys
- tokens
- passwords
- private certificates
- private hostnames if sensitive
- resolved secret-bearing Compose config
- `.env` file contents

Safe evidence examples:

- variable names only,
- placeholder values,
- `git status --short`,
- health check status,
- count summaries without sensitive data,
- `docker compose config --quiet` success/failure,
- messages like `TEMP_ENV_OK`.

Do not share screenshots that show real env files or resolved secret values.

## 12. Recommended Simple Secrets Strategy

Recommended strategy for this project:

Local development:

- Use `.env`.
- Keep `.env` uncommitted.
- Use `.env.example` for safe placeholders only.

One-off local tests:

- Use temporary env files under `/tmp`.
- Avoid printing full values.
- Delete temporary env files after approved use.

Future EC2:

- Store real production runtime values on the server or approved secret manager.
- Restrict file permissions.
- Do not commit server env files.

Future GitHub Actions:

- Use GitHub Secrets for secrets.
- Use GitHub Variables for non-secret config.

Future RDS:

- Treat RDS `DATABASE_URL` as a secret.
- Store only in approved runtime/deployment secret locations.

Frontend:

- Never put secrets in `VITE_*` values.

## 13. Risks And Safety Rules

Risks:

- Accidentally committing `.env`.
- Printing secrets through `docker compose config`.
- Putting secrets into frontend `VITE_*` values.
- Pasting full `DATABASE_URL` values into chat.
- Logging API keys.
- Mixing local and production env values.
- Running migration or deployment commands against the wrong environment.
- Saving screenshots that reveal secrets.

Safety rules:

- Inspect env variable names, not real values.
- Use placeholders in documentation.
- Use `docker compose config --quiet` for Compose validation.
- Use temporary env files only when needed.
- Delete temporary env files after approved use.
- Redact screenshots/logs before sharing.
- Confirm target environment before migration/deployment commands.
- Keep migration, seed, and app startup commands separate.
- Never add secrets to frontend-exposed variables.

## 14. Recommendation

Recommendation:

Create this planning report only.

Do not modify `.env`, Compose, Dockerfile, GitHub Actions, or deployment files during Phase 3U.

Future recommended ticket:

Plan runtime secrets implementation for local/EC2/GitHub Actions only after deployment direction is approved.

## 15. Boundaries Respected

Boundaries respected during Phase 3U:

- `.env` was not modified.
- `.env` values were not inspected.
- No real secrets were created or edited.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL work was started.
- No deployment work was started.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions were not modified.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No commit was made.
- `npm audit fix --force` was not run.

## 16. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Runtime secrets implementation planning.
- Multi-stage Dockerfile planning.
- API-only production Compose hardening review.
- Nginx/static frontend planning.
- Future EC2 environment variable strategy planning.
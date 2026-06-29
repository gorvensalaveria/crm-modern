# Codex Phase 3W: EC2 Runtime Env File Planning

## 1. Phase Name And Purpose

Phase 3W: EC2 Runtime Env File Planning

Purpose:

Plan the future EC2 server-local env file pattern for running `docker-compose.prod.yml` safely with runtime environment variables.

This was a planning-only phase. No real env files, AWS resources, EC2 resources, RDS resources, deployment files, Docker files, Compose files, GitHub Actions, or secrets were created or modified.

## 2. Why Future EC2 Should Use A Server-Local Env File Or Approved Secret Injection Method

Future EC2 should not rely on committed `.env` files or hardcoded secrets.

A server-local env file or approved secret injection method is useful because:

- secrets stay on the server,
- secrets stay out of Git,
- runtime values can differ between local, staging, and production,
- `docker-compose.prod.yml` can stay generic,
- RDS credentials can be rotated later without changing source code,
- deployment evidence can avoid exposing secret values,
- Docker images do not need secrets baked into them.

## 3. Recommended Future EC2 Env File Path / Name Pattern

Recommended future path pattern:

```text
/opt/crm-modern/env/production.env
```

Alternative acceptable pattern:

```text
/opt/crm-modern/secrets/production.env
```

Recommendation:

Use a clear path outside the repo working tree so it is not accidentally committed.

Example separation:

- app code lives in the repository directory,
- production env file lives in a separate server-local env/secrets directory.

Do not create this file during Phase 3W.

## 4. Variables To Include In The Future EC2 Env File

Future EC2 env file should likely include:

```text
DATABASE_URL=
CLIENT_ORIGIN=
AI_PROVIDER=
OPENAI_MODEL=
OPENAI_API_KEY=
PORT=
HOST_API_PORT=
```

Purpose of each variable:

- `DATABASE_URL`: future RDS PostgreSQL connection string
- `CLIENT_ORIGIN`: production frontend origin
- `AI_PROVIDER`: AI provider mode, such as `local` or `openai`
- `OPENAI_MODEL`: selected OpenAI model
- `OPENAI_API_KEY`: OpenAI API key if using OpenAI provider
- `PORT`: container/app runtime port
- `HOST_API_PORT`: host port mapped by Compose

## 5. Secret Vs Non-Secret Classification

Secrets:

- `DATABASE_URL`
- `OPENAI_API_KEY`

Reason:

- `DATABASE_URL` can include database username, password, host, port, and database name.
- `OPENAI_API_KEY` grants access to an external API.

Non-secret or lower-sensitivity config:

- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_MODEL`
- `PORT`
- `HOST_API_PORT`

Important:

Even non-secret config should be reviewed before sharing publicly, but credentials and API keys require stricter protection.

## 6. Safe File Permission Expectations

Future EC2 env file should have restricted permissions.

Suggested future permission model:

```text
owner: deployment user or root
group: deployment group if needed
permissions: 600 or 640
```

Meaning:

- `600`: only owner can read/write
- `640`: owner can read/write, group can read

Avoid world-readable permissions such as:

```text
644
```

The final owner/group/permission choice should be made during EC2 deployment planning.

## 7. How To Avoid Committing Or Printing The Env File

Avoid committing:

- Store the production env file outside the repo.
- Do not copy it into the project root.
- Do not add it to Git.
- Confirm with `git status --short` before commits.
- Keep `.env`, `.env.local`, and production env files untracked.

Avoid printing:

- Do not run `cat` on the env file in shared logs.
- Do not screenshot the env file.
- Do not paste env values into chat.
- Do not run commands that render resolved secrets.
- Avoid plain `docker compose config` with real env files.

## 8. How The Env File Would Be Used With `docker-compose.prod.yml` Later

Accepted future usage pattern:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml up -d
```

Important:

This is a future pattern only.

It should not be run during Phase 3W.

The env file supplies values referenced by `docker-compose.prod.yml`, such as:

- `DATABASE_URL`
- `CLIENT_ORIGIN`
- `OPENAI_API_KEY`
- `HOST_API_PORT`

## 9. Safe Validation Patterns That Avoid Printing Secrets

Accepted safe validation pattern:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config --quiet
```

Why:

- `--quiet` validates config without printing resolved secret values.

Avoid:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config
```

Reason:

- Plain `docker compose config` can print resolved `DATABASE_URL`, `OPENAI_API_KEY`, and other runtime values.

For screenshots/evidence, prefer:

- command success/failure only,
- health check output,
- `git status --short`,
- redacted env summaries,
- variable names only.

## 10. Relationship To Future RDS `DATABASE_URL`

Future RDS `DATABASE_URL` should live in the EC2 env file or approved secret injection system.

Rules:

- Do not commit it.
- Do not paste it into chat.
- Do not screenshot it.
- Do not include it in Compose files.
- Do not include it in Docker images.
- Use it only at runtime or in approved migration/deployment commands.

When RDS work begins, confirm:

- RDS endpoint,
- database name,
- username,
- password handling,
- SSL requirement,
- security group access,
- migration workflow,
- backup/snapshot expectations.

No RDS work was started during Phase 3W.

## 11. Risks And Safety Rules

Risks:

- Env file accidentally stored inside the repo.
- Env file accidentally committed.
- Secrets printed by plain `docker compose config`.
- Secrets exposed in screenshots or logs.
- `DATABASE_URL` points to the wrong database.
- Production env values used against local commands by mistake.
- Overly broad file permissions.
- API key or database password leakage.

Safety rules:

- Store production env file outside the repo.
- Restrict file permissions.
- Never paste full `DATABASE_URL`.
- Never paste `OPENAI_API_KEY`.
- Use `docker compose config --quiet`.
- Redact logs/screenshots.
- Confirm target environment before running deployment/migration commands.
- Keep env handling separate from Docker image build.
- Rotate secrets if exposure occurs.

## 12. Recommendation

Recommendation:

Use a future EC2 server-local env file pattern such as:

```text
/opt/crm-modern/env/production.env
```

Do not create it yet.

Do not add secrets to the repo.

Before EC2 deployment, create a dedicated implementation ticket for:

- creating the server-local env path,
- defining exact permissions,
- safely placing production values,
- validating Compose with `config --quiet`,
- documenting redaction/evidence rules.

## 13. Boundaries Respected

Boundaries respected during Phase 3W:

- No real env files were created.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No deployment was performed.
- `.env` was not modified.
- `.env.example` was not modified.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions were not modified.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- `docker compose config` was not run with real secrets.
- No commands were run that print resolved secrets.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No commit was made.
- `npm audit fix --force` was not run.

## 14. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- EC2 env-file implementation planning.
- Runtime secrets validation planning.
- Multi-stage Dockerfile planning.
- API-only production Compose hardening review.
- Nginx/static frontend planning.
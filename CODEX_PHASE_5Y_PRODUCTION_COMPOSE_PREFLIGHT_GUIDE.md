# Codex Phase 5Y: Production Compose Preflight Guide

## 1. Phase Name And Purpose

Phase 5Y: Production Compose Preflight Guide

Purpose:

Prepare the exact safe preflight checks before building or starting the production Docker Compose deployment on EC2.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. No Docker/Compose commands were run. No Prisma migration commands were run. No containers were built or started. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, deployments, databases, or `.env` files were created or modified.

## 2. Safe Preflight Purpose

The production Compose preflight should verify:

- The production Compose file exists.
- The API Dockerfile exists.
- Prisma committed migrations exist.
- The runtime env file exists with correct ownership and permissions.
- The repo is at the intended commit and has no unexpected changes.
- Docker and Docker Compose are available.
- Production Compose appears to reference the correct build inputs.
- Production Compose does not include a PostgreSQL service.

The preflight must avoid exposing runtime secrets.

Do not run production containers during this phase.

Do not run migrations during this phase.

## 3. Current Directory

Expected current directory on EC2:

```text
/opt/crm-modern/app
```

Future command shape:

```bash
cd /opt/crm-modern/app
```

Purpose:

- Ensures future checks run from the deployed repository root.

## 4. Safe File Existence Checks

Future command shape:

```bash
ls -l docker-compose.prod.yml
```

Purpose:

- Confirms the production Compose file exists.

Future command shape:

```bash
ls -l server/Dockerfile
```

Purpose:

- Confirms the API Dockerfile exists.

Future command shape:

```bash
ls -ld prisma/migrations
```

Purpose:

- Confirms the committed Prisma migrations directory exists.

Future command shape:

```bash
ls -l /opt/crm-modern/env/production.env
```

Purpose:

- Confirms the server-local production env file exists.
- Does not print env file contents.

Do not use file checks that print secret values.

## 5. Safe Env File Permission Checks

Future command shape:

```bash
stat -c "%a %U:%G %n" /opt/crm-modern/env/production.env
```

Expected future result shape:

```text
600 ubuntu:ubuntu /opt/crm-modern/env/production.env
```

Purpose:

- Confirms restrictive env file permissions.
- Confirms expected owner/group.
- Does not print env contents.

Do not print env file contents.

## 6. Safe Repo State Checks

Future command shape:

```bash
git status --short
```

Purpose:

- Confirms whether the deployed repo has unexpected local changes.

Expected result:

- No output for a clean working tree.

Future command shape:

```bash
git rev-parse --short HEAD
```

Purpose:

- Prints the short commit hash for safe evidence.

Expected current verified commit:

```text
051458d
```

Stop if the commit or repo state differs from the approved deployment target.

## 7. Safe Docker Availability Checks

Future command shape:

```bash
docker --version
```

Purpose:

- Confirms Docker CLI is available.

Future command shape:

```bash
docker compose version
```

Purpose:

- Confirms Docker Compose plugin is available.

Future command shape:

```bash
docker ps
```

Purpose:

- Confirms Docker can talk to the Docker daemon.
- Does not start containers.

Do not run `docker compose up`, `docker compose build`, or app container commands during this phase.

## 8. Compose Preflight Checks That Avoid Secrets

Avoid this command with the real production env file:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config
```

Why:

- Plain `docker compose config` can print resolved environment values.
- With the real env file, that may expose secrets such as `DATABASE_URL` or API keys.

Safe approach:

- Do not run Compose config with the real env file in this phase.
- If config validation is needed later, use a placeholder env file in a separately approved step.
- Prefer targeted file inspections that verify structure without resolving or printing secrets.

Future safe inspection may focus on:

- Service names.
- Build context.
- Dockerfile path.
- Env file path reference.
- Ports mapping.
- Restart policy.
- Healthcheck if present.
- Confirm no PostgreSQL service exists in production Compose.

## 9. Safe Inspection Targets

Safe production Compose inspection targets:

- API service name.
- Build context.
- Dockerfile path.
- Runtime env file reference.
- Host/container port mapping.
- Restart policy.
- Healthcheck definition, if present.
- Absence of a PostgreSQL service.

Important production rule:

- PostgreSQL must not run in Docker on EC2 for production.
- Production PostgreSQL target is Amazon RDS.
- The production Compose file should not define a Postgres database service.

Do not inspect files by printing secrets or env values.

## 10. Stop Conditions

Stop immediately if:

- Any command would print env values.
- Any command would print `DATABASE_URL`.
- Any command would print database password.
- Any command would print full RDS endpoint.
- Compose references a missing env file.
- Compose includes a PostgreSQL service for production.
- `server/Dockerfile` is missing.
- `prisma/migrations` is missing.
- Repo has unexpected modifications.
- Repo commit is unexpected.
- Docker is unavailable.
- Docker Compose plugin is unavailable.
- User is unsure what to do.
- Any command would build containers.
- Any command would start containers.
- Any command would run Prisma migrations.
- Any command would deploy the app.

## 11. Evidence Rules

Safe to document:

- Docker version.
- Docker Compose version.
- File paths.
- File existence.
- Service names.
- Short commit hash.
- Clean working tree status.
- Confirmation that production Compose has no PostgreSQL service.

Do not include:

- Env values.
- Full `DATABASE_URL`.
- Database password.
- Full RDS endpoint.
- EC2 public IP/DNS.
- User public IP.
- Private key path or contents.
- GitHub tokens.
- Secret values.
- Env file contents.
- Plain Docker Compose config output using real env values.

## 12. Boundaries Respected

Boundaries respected during Phase 5Y:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
- Docker/Compose commands were not run.
- Prisma migration commands were not run.
- Containers were not built.
- Containers were not started.
- `docker compose config` was not run using the real env file.
- Env file contents were not printed.
- AWS resources were not created or modified.
- Security groups were not modified.
- Cloudflare records were not created or modified.
- Elastic IPs were not allocated.
- Real secrets were not created or edited.
- Database password was not requested.
- Private key contents were not requested.
- GitHub tokens were not requested.
- Secrets were not exposed.
- The user’s public IP was not exposed.
- EC2 public IP/DNS was not exposed.
- Private key material was not exposed.
- Full RDS endpoint was not exposed.
- Full `DATABASE_URL` was not exposed.
- `.env` was not modified.
- Dockerfile was not modified.
- Compose files were not modified.
- Frontend files were not modified.
- Nginx config was not modified.
- GitHub Actions files were not modified.
- No deployment was performed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

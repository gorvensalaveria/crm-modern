# Codex Phase 5AB: RDS Migration Deploy Guide

## 1. Phase Name And Purpose

Phase 5AB: RDS Migration Deploy Guide

Purpose:

Prepare the exact safe steps for running the committed Prisma migrations against the production RDS PostgreSQL database from EC2.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. No Prisma migration commands were run. No Docker/Compose commands were run. No containers were built or started. No env file contents were printed. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, deployments, databases, or `.env` files were created or modified.

## 2. Purpose Of Prisma Migrate Deploy In Production

Production migration command purpose:

```text
prisma migrate deploy
```

Expected project script:

```text
npm run db:migrate:deploy
```

Expected behavior:

```text
prisma migrate deploy --schema prisma/schema.prisma
```

Production behavior:

- Applies committed migrations only.
- Uses the existing migration history in `prisma/migrations`.
- Does not create new migration files.
- Does not run interactive development migration flow.
- Does not use `prisma db push`.
- Does not use `prisma migrate dev`.
- Must not reset or delete the production database.

Production migration target:

```text
Amazon RDS PostgreSQL
Database: crm_modern_prod
```

Do not run this command until a later approved execution phase.

## 3. Safe Pre-Checks

Future current directory check:

```text
/opt/crm-modern/app
```

Safe pre-checks before migration execution:

- Current directory is `/opt/crm-modern/app`.
- Git status is clean.
- Commit hash is:
  ```text
  051458d
  ```
- Prisma migrations directory exists:
  ```text
  prisma/migrations
  ```
- Migration script exists:
  ```text
  db:migrate:deploy
  ```
- Runtime env file exists:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Runtime env file permission is:
  ```text
  600
  ```
- Runtime env file owner is:
  ```text
  ubuntu:ubuntu
  ```

Safe future check shapes:

```bash
pwd
```

```bash
git status --short
```

```bash
git rev-parse --short HEAD
```

```bash
test -d prisma/migrations && echo "migrations_exists=yes"
```

```bash
npm pkg get scripts.db:migrate:deploy
```

```bash
stat -c "%a %U:%G %n" /opt/crm-modern/env/production.env
```

Do not print env file contents.

## 4. Loading The Server-Local Env File Without Printing Secrets

The migration command needs `DATABASE_URL` from:

```text
/opt/crm-modern/env/production.env
```

Safe requirements:

- Load env values without echoing them.
- Do not print `DATABASE_URL`.
- Do not run `env`.
- Do not run `printenv`.
- Do not run `cat /opt/crm-modern/env/production.env`.
- Do not paste env contents into chat.
- Do not screenshot env contents.

Future env-loading command shape:

```bash
set -a
. /opt/crm-modern/env/production.env
set +a
npm run db:migrate:deploy
```

Caution:

- This command shape is not approved to run now.
- It must be used only in a later approved execution phase.
- Do not enable shell debugging such as `set -x` while loading secrets.
- Do not combine env loading with commands that print environment variables.

## 5. Dependency/Runtime Requirement

Before running the migration later, decide whether the migration should run through:

1. Local Node/npm dependencies on EC2.
2. A one-off Docker container with the app image and server-local env file.

Preferred guide direction for the current EC2 setup:

- Use the safest and simplest approach that avoids secret output.
- Because Docker is installed and the repo is present, a one-off container may later align with the production runtime.
- Because the migration script is an npm script, local npm execution may be simpler if dependencies are installed safely.
- The exact execution method should be approved in the migration execution ticket before any command is run.

Do not install dependencies, build containers, or run migration commands in this guide phase.

## 6. Proposed Migration Command Shape

Future local npm command shape:

```bash
cd /opt/crm-modern/app
set -a
. /opt/crm-modern/env/production.env
set +a
npm run db:migrate:deploy
```

No real secrets are shown in this guide.

Future one-off container direction, if later approved:

```text
Run the existing production app image or a purpose-built one-off command with /opt/crm-modern/env/production.env loaded without printing values.
```

Important:

- Do not use real env values in documentation.
- Do not run `docker compose config` with the real env file.
- Do not run `prisma db push`.
- Do not run `prisma migrate dev`.
- Do not run destructive reset commands.

## 7. Verification After Migration

Safe success indicators:

- Migration command exits successfully.
- Prisma reports migrations were applied.
- Or Prisma reports migrations were already applied.
- No new migration files are created.
- No database reset is requested.
- No secret values are printed.

Do not verify by:

- Pasting a database password into chat.
- Pasting a full `DATABASE_URL` into chat.
- Dumping database contents.
- Sharing database rows.
- Running destructive database commands.

Safe evidence can be a redacted summary such as:

```text
Prisma migrate deploy completed successfully against the intended RDS PostgreSQL database.
```

## 8. Stop Conditions

Stop immediately if:

- Env file is missing.
- Env file permission is not `600`.
- Env file owner is not `ubuntu:ubuntu`.
- `DATABASE_URL` is printed.
- Env values are printed.
- Migration script is missing.
- `prisma/migrations` is missing.
- Prisma tries to create a new migration.
- Any command suggests `prisma db push`.
- Any command suggests `prisma migrate dev`.
- Any command suggests `prisma migrate reset`.
- Any destructive reset warning appears.
- Connection error occurs.
- Authentication error occurs.
- Target database is unclear.
- User is unsure what to do.
- Any secret appears in terminal, chat, screenshots, or reports.

## 9. Evidence Rules

Safe to document:

- Command type:
  ```text
  npm run db:migrate:deploy
  ```
- Migration success summary.
- Already-applied summary.
- Commit hash.
- Migration directory presence.
- Env file path, owner, and permission.

Do not document:

- Database password.
- Full `DATABASE_URL`.
- Full RDS endpoint.
- Env contents.
- Secret values.
- EC2 public IP/DNS.
- User public IP.
- Private key path or contents.
- Database rows.
- Database dumps.

## 10. Boundaries Respected

Boundaries respected during Phase 5AB:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
- Prisma migration commands were not run.
- Docker/Compose commands were not run.
- Containers were not built.
- Containers were not started.
- Env file contents were not printed.
- `env` was not run.
- `docker compose config` was not run using the real env file.
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

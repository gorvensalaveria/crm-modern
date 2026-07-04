# Codex Phase 5AH: API Container Start Guide

## 1. Phase Name And Purpose

Phase 5AH: API Container Start Guide

Purpose:

Prepare the exact safe guide for starting the production API container on EC2 using Docker Compose, verifying it runs locally on EC2, and keeping it private first before opening public HTTP/HTTPS.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. Docker Compose was not run. Containers were not started. Docker build was not run. Prisma commands were not run. No env file contents were printed. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, deployments, databases, or `.env` files were created or modified.

## 2. Approved Scope

This phase should guide a future execution step to:

- Start the production API container on EC2 using Docker Compose.
- Verify the API runs locally on EC2 first.
- Keep the API private before public HTTP/HTTPS work.
- Avoid opening security group ports.
- Avoid configuring Nginx.
- Avoid configuring Cloudflare or DNS.
- Avoid deploying the frontend.

This phase is not a public deployment phase.

## 3. Purpose Of The Future Start Step

The future API container start should:

- Start the production API container.
- Verify the container runs locally on EC2.
- Confirm the API can run after the RDS migration and image build phases.
- Keep the service private first.
- Avoid public HTTP/HTTPS exposure until later approved Nginx/security group phases.

Do not open public access during this phase.

## 4. Safe Pre-Checks

Before future container startup, verify:

- Current directory is:
  ```text
  /opt/crm-modern/app
  ```
- Git status is clean, except documentation files may be untracked.
- Production Compose file exists:
  ```text
  docker-compose.prod.yml
  ```
- Production API image exists:
  ```text
  crm-modern-api:prod
  ```
- No running containers exist before start.
- Runtime env file exists:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Runtime env file permission remains:
  ```text
  600
  ```
- Runtime env file owner remains:
  ```text
  ubuntu:ubuntu
  ```

Future safe check shapes:

```bash
pwd
```

```bash
git status --short
```

```bash
ls -l docker-compose.prod.yml
```

```bash
docker images
```

```bash
docker ps
```

```bash
stat -c "%a %U:%G %n" /opt/crm-modern/env/production.env
```

These are future command shapes only. They are not approved to run in this guide phase.

## 5. Safe Env Handling

The future Compose start requires values from:

```text
/opt/crm-modern/env/production.env
```

Safe env handling requirements:

- Source `/opt/crm-modern/env/production.env` for Compose interpolation.
- Do not print env contents.
- Do not print `DATABASE_URL`.
- Do not run `env`.
- Do not run `printenv`.
- Do not run `cat /opt/crm-modern/env/production.env`.
- Unset `DATABASE_URL` after the Compose command.

Future env-loading shape:

```bash
set -a
. /opt/crm-modern/env/production.env
set +a
docker compose -f docker-compose.prod.yml up -d
unset DATABASE_URL
```

Important:

- This is a future command shape only.
- Do not run it in this guide phase.
- Do not enable shell debugging such as `set -x` while secrets are loaded.

## 6. Proposed Start Method

Approved future start command shape:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Purpose:

- Start the production API container in detached mode.
- Use the production Compose file.
- Keep startup controlled and local-first.

Do not rebuild unless necessary.

Do not use public ports unless already defined by Compose.

Do not run:

```bash
docker compose up --build
```

unless a later approved phase says rebuild is needed.

Do not run unrelated services.

Do not start a PostgreSQL container.

## 7. Verification After Start

Future verification command:

```bash
docker ps
```

Purpose:

- Confirm the API container is running.

Future verification command:

```bash
docker compose -f docker-compose.prod.yml ps
```

Purpose:

- Confirm Compose service status.

If container health/status exists:

- Check status without exposing secrets.
- Confirm the container is not restarting repeatedly.

Future local-only API health check shape:

```bash
curl http://localhost:<port>/api/health
```

Use the expected API host port from non-secret configuration or Compose mapping.

Local-only means:

- Run the check from inside the EC2 SSH session.
- Do not use EC2 public IP/DNS.
- Do not require opening public security group ports.

Safe log check only if needed:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100
```

Caution:

- Review logs carefully.
- Stop if logs reveal secrets.
- Do not paste logs containing secrets into chat or reports.

## 8. Stop Conditions

Stop immediately if:

- Compose asks for missing env values.
- Env contents would be printed.
- `DATABASE_URL` would be printed.
- App exits repeatedly.
- App restarts repeatedly.
- Logs reveal secrets.
- App cannot connect to the database.
- Port conflict occurs.
- Compose unexpectedly starts extra services like PostgreSQL.
- Public access is required before local verification.
- Any command would modify AWS security groups.
- Any command would configure Nginx.
- Any command would configure DNS.
- User is unsure what to do.

## 9. Evidence Rules

Safe to document:

- Container name/status.
- Compose service status.
- Local health check result.
- Non-secret app port.
- Confirmation that no public access was opened.
- Confirmation that no frontend/Nginx/DNS work was performed.

Do not document:

- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env contents.
- Secret values.
- EC2 public IP/DNS.
- User public IP.
- Private key material.
- Logs containing secrets.

## 10. Boundaries Respected

Boundaries respected during Phase 5AH:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
- Docker Compose was not run.
- Containers were not started.
- Docker build was not run.
- Prisma commands were not run.
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
- Public access was not configured.
- DNS was not configured.
- Frontend was not deployed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

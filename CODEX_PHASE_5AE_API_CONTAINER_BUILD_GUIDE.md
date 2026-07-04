# Codex Phase 5AE: API Container Build Guide

## 1. Phase Name And Purpose

Phase 5AE: API Container Build Guide

Purpose:

Prepare the exact safe guide for building the production API Docker image on EC2.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. No Docker build was run. No Docker Compose commands were run. No containers were built or started. No Prisma commands were run. No env file contents were printed. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, deployments, databases, or `.env` files were created or modified.

## 2. Current Server State

Current approved server state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
App path: /opt/crm-modern/app
Current verified commit: 051458d
```

Runtime env file exists:

```text
/opt/crm-modern/env/production.env
Permission: 600
Owner: ubuntu:ubuntu
```

Production RDS migration completed successfully:

```text
Migration applied: 20260626135938_init
```

Docker is installed and working:

```text
Docker 29.1.3
Docker Compose 2.40.3
```

Expected deployment files:

```text
docker-compose.prod.yml
server/Dockerfile
```

## 3. Purpose Of This Phase

This phase is for building the production API Docker image only.

This phase must not:

- Start the app container.
- Run `docker compose up`.
- Run `docker compose run`.
- Run `docker start`.
- Run Prisma commands.
- Open HTTP or HTTPS security group ports.
- Expose an app port publicly.
- Deploy the app.

The build should prepare the image for a later approved container startup phase.

## 4. Safe Pre-Checks

Before the future build execution, verify:

- Current directory is:
  ```text
  /opt/crm-modern/app
  ```
- Git status is clean, except documentation files may be untracked.
- `docker-compose.prod.yml` exists.
- `server/Dockerfile` exists.
- Docker version is available.
- Docker Compose version is available.
- No app containers are running before build.

Future safe check shapes:

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
ls -l docker-compose.prod.yml
```

```bash
ls -l server/Dockerfile
```

```bash
docker --version
```

```bash
docker compose version
```

```bash
docker ps
```

These are future command shapes only. They are not approved to run in this guide phase.

## 5. Safe Inspection Rules

Allowed future inspection:

- Inspect repository Dockerfile if it contains no secrets.
- Inspect repository Compose file if it contains no secrets.
- Verify service names, build context, and Dockerfile path.
- Verify the production Compose file does not define a PostgreSQL service.

Not allowed:

- Do not inspect or print:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Do not run:
  ```bash
  cat /opt/crm-modern/env/production.env
  ```
- Do not run:
  ```bash
  env
  ```
- Do not run:
  ```bash
  docker compose config
  ```
  with the real env file.

Reason:

- Compose config and env-printing commands may reveal resolved secret values such as `DATABASE_URL` or API keys.

## 6. Proposed Image Build Method

Approved future build command shape:

```bash
docker compose -f docker-compose.prod.yml build
```

Purpose:

- Build the production API Docker image using the production Compose file.
- Use the existing Compose build configuration.
- Avoid starting containers.

This phase must not use:

```bash
docker compose up
```

```bash
docker compose run
```

```bash
docker start
```

Do not start the app container in this phase.

## 7. Build Output Expectations

Expected build behavior:

- Docker build context is sent to Docker.
- Dependencies are installed inside the image.
- TypeScript/server build should complete if the Dockerfile is correct.
- Prisma client generation may occur if the Dockerfile includes it.
- A local Docker image should be created.

Expected non-behavior:

- No app container should start.
- No app port should be exposed.
- No HTTP/HTTPS traffic should be opened.
- No migration command should run.
- No database reset should happen.

## 8. Verification After Build

Future post-build verification should confirm:

- The image exists locally.
- No app container is running.
- No app port is exposed yet.
- Build completed without TypeScript/npm/Prisma errors.

Future command shape to list images:

```bash
docker images
```

Future command shape to confirm containers are not running:

```bash
docker ps
```

Evidence can summarize image presence without exposing secrets.

## 9. Stop Conditions

Stop immediately if:

- `server/Dockerfile` is missing.
- `docker-compose.prod.yml` is missing.
- Compose references missing env values incorrectly.
- Build output tries to print secrets.
- Build tries to start services.
- Build fails on TypeScript errors.
- Build fails on npm errors.
- Build fails on Prisma errors.
- Disk space is too low.
- User is unsure what to do.
- Any command would print env values.
- Any command would run migrations.
- Any command would start containers.
- Any command would expose an app port publicly.
- Any command would modify AWS security groups.

## 10. Evidence Rules

Safe to document:

- Docker version.
- Docker Compose version.
- Build command type:
  ```text
  docker compose -f docker-compose.prod.yml build
  ```
- Image name/tag if non-secret.
- Build success summary.
- Confirmation that no container was started.
- Confirmation that no app port was exposed.

Do not document:

- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- Secret values.
- EC2 public IP/DNS.
- User public IP.
- Private key path or contents.
- GitHub tokens.

## 11. Boundaries Respected

Boundaries respected during Phase 5AE:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
- Docker build was not run.
- Docker Compose was not run.
- Containers were not built.
- Containers were not started.
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
- No deployment was performed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

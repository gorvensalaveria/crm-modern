# Codex Phase 5V: Server Repo Deployment Guide

## 1. Phase Name And Purpose

Phase 5V: Server Repo Deployment Guide

Purpose:

Prepare the exact safe steps for getting the application repository onto the EC2 server under `/opt/crm-modern/app`.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. No repository was cloned or copied. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployments, databases, or `.env` files were created or modified.

## 2. Recommended Repo Transfer Strategy

Preferred strategy:

- Use `git clone` from the EC2 server if the repository is accessible from EC2.
- Use the intended production-ready branch.
- Keep the repository under:
  ```text
  /opt/crm-modern/app
  ```

Private repository options:

- Use an SSH deploy key only if needed.
- Use an HTTPS token only if needed.
- Do not paste deploy keys, private keys, or tokens into chat.
- Do not screenshot tokens or private key material.
- Do not commit tokens or private keys.

Alternative strategy:

- If the repository is private and no deploy key is configured, upload a clean archive from the local machine.
- The archive must exclude `.env`, real secrets, private keys, local database files, and `node_modules`.
- Archive transfer should be covered by a later approved execution step.

## 3. Target App Path

Target EC2 app path:

```text
/opt/crm-modern/app
```

Purpose:

- Hold the application repository or deployment copy.
- Keep app code separate from runtime env/secrets.
- Preserve `/opt/crm-modern/env` for server-local runtime configuration only.

The runtime env file should remain here:

```text
/opt/crm-modern/env/production.env
```

It must not be copied into the app repository.

## 4. Safe Clone/Copy Pattern

Safe clone pattern:

- Confirm the current directory before clone/copy.
- Confirm whether `/opt/crm-modern/app` is empty before writing into it.
- Avoid cloning into a non-empty directory incorrectly.
- If the target directory is not empty, stop and review before deleting, moving, or overwriting anything.

Future command shape if `/opt/crm-modern/app` is empty:

```bash
cd /opt/crm-modern/app
git clone <repo-url> .
```

Future command shape if using a subdirectory:

```bash
cd /opt/crm-modern/app
git clone <repo-url> crm-modern
```

Important:

- Use placeholders for repository URLs if they contain private access details.
- Do not include tokens in command examples, reports, screenshots, or chat.
- Only clean an approved empty target if explicitly safe.

## 5. Branch/Commit Selection

Use the intended production-ready branch.

Future branch verification shape:

```bash
git status --short
```

Future commit verification shape:

```bash
git rev-parse --short HEAD
```

Purpose:

- Confirm the deployment copy is on the intended branch/commit.
- Record a short commit hash for portfolio-safe evidence.
- Verify without changing the branch or commit.

Stop if:

- The branch is not the intended production-ready branch.
- The commit is unexpected.
- The repository has unexpected local changes.

## 6. Files That Must Not Be Copied From Local Machine

Do not copy:

```text
.env
real secrets
private keys
local database files
node_modules
```

Also avoid copying:

- Local build caches.
- Local logs containing sensitive values.
- Any file containing `DATABASE_URL`.
- Any file containing API keys or tokens.
- Any personal SSH key material.

Secrets belong only in the server-local runtime env file:

```text
/opt/crm-modern/env/production.env
```

## 7. Files Expected To Be Present

Expected deployment repository contents include:

- API Dockerfile.
- Production Compose file, such as:
  ```text
  docker-compose.prod.yml
  ```
- Prisma schema.
- Committed Prisma migrations.
- Frontend project files.
- Package metadata needed for build/deployment.

Expected example paths may include:

```text
server/Dockerfile
docker-compose.prod.yml
prisma/schema.prisma
prisma/migrations
```

Exact paths should be verified during the approved execution phase.

## 8. Safe Verification Commands

Future location check:

```bash
pwd
```

Purpose:

- Confirms the current directory.

Future git status check:

```bash
git status --short
```

Purpose:

- Shows whether the deployment copy has unexpected local changes.

Future commit check:

```bash
git rev-parse --short HEAD
```

Purpose:

- Prints a short commit hash for safe deployment evidence.

Future file listing:

```bash
ls
```

Purpose:

- Confirms expected top-level files and folders exist.

Future existence checks:

```bash
test -f docker-compose.prod.yml && echo "compose_exists=yes"
```

```bash
test -f server/Dockerfile && echo "api_dockerfile_exists=yes"
```

```bash
test -f prisma/schema.prisma && echo "prisma_schema_exists=yes"
```

```bash
test -d prisma/migrations && echo "prisma_migrations_exists=yes"
```

These checks verify presence without printing secrets.

## 9. Commands To Avoid

Avoid during this phase:

```bash
docker compose up
```

```bash
docker compose build
```

```bash
docker compose config
```

```bash
cat /opt/crm-modern/env/production.env
```

```bash
npm run db:migrate:deploy
```

Do not:

- Run app containers.
- Run migrations.
- Run Prisma commands.
- Print the env file.
- Run Docker Compose config with real env values.
- Start deployment.
- Modify Nginx.
- Change DNS or SSL.

## 10. Stop Conditions

Stop immediately if:

- Repo access requires pasting a token into chat.
- SSH key or token is exposed.
- `.env` would be copied.
- Real secrets would be copied.
- Private keys would be copied.
- Local database files would be copied.
- `node_modules` would be copied.
- Target directory is unexpectedly non-empty.
- Branch is wrong.
- Commit is wrong.
- User is unsure what to do.
- Any command would print env values.
- Any command would expose secrets.
- Any command would run containers.
- Any command would run migrations.
- Any command would deploy the app.

## 11. Evidence Rules

Safe to document:

- Repo path:
  ```text
  /opt/crm-modern/app
  ```
- Branch name, if not sensitive.
- Short commit hash.
- Existence of expected files.
- Confirmation that `.env` and secrets were not copied.

Do not include:

- GitHub tokens.
- Deploy keys.
- Private repo credentials.
- Private key material.
- Secret values.
- Env values.
- EC2 public IP/DNS.
- User public IP.
- Full RDS endpoint unless redacted.
- Full `DATABASE_URL`.
- Env file contents.

## 12. Boundaries Respected

Boundaries respected during Phase 5V:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
- Repository was not cloned or copied.
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
- No Docker/Compose commands were run.
- No Nginx commands were run.
- No Prisma migration commands were run.
- No deployment was performed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

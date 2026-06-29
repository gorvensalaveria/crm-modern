# Codex Phase 4E: API Container Deployment To EC2 Plan

## 1. Phase Name And Purpose

Phase 4E: API Container Deployment To EC2 Plan

Purpose:

Plan the future API container deployment workflow on EC2 using the existing API Dockerfile, production Compose file, and EC2 server-local env file.

This is a planning-only phase.

No deployment was performed. No AWS resources, EC2 resources, RDS resources, real env files, real secrets, Docker files, Compose files, GitHub Actions, Prisma migrations, databases, or `.env` files were created or modified.

## 2. Future API Deployment Goal On EC2

The future API deployment goal is to run the existing API container on EC2 using the existing production Docker/Compose assets and a server-local production env file.

The API container should:

- Be built from the existing `server/Dockerfile`.
- Be started through the existing `docker-compose.prod.yml`.
- Receive runtime values from:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Connect to Amazon RDS PostgreSQL through `DATABASE_URL`.
- Expose the API internally or temporarily through a reviewed host port.
- Eventually sit behind Nginx for public traffic.
- Not include or start a PostgreSQL container.

This phase does not deploy anything. It only plans the future deployment workflow.

## 3. Prerequisites Before API Deployment

Before API deployment execution, confirm:

- EC2 host is created and accessible.
- EC2 is in the intended AWS region, aligned with RDS.
- Docker is installed.
- Docker Compose plugin is installed.
- Docker service is running.
- App repo or deployment copy exists on EC2, likely under:
  ```text
  /opt/crm-modern/app
  ```
- RDS PostgreSQL exists.
- RDS security group allows PostgreSQL access only from the EC2 security group.
- Production env file exists at:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Env file has been validated without printing secrets.
- `DATABASE_URL` points to the intended RDS database.
- Security groups have been reviewed.
- Any temporary API/app host port has been explicitly approved if needed.
- No migration command is configured to run automatically on API startup.

## 4. Files Involved

Future API deployment will involve:

```text
server/Dockerfile
```

Purpose:

- Builds the API container image.

```text
docker-compose.prod.yml
```

Purpose:

- Defines the production API service, image/build settings, port mapping, and runtime env references.

Relevant package scripts:

```text
db:migrate:deploy
```

Purpose:

- Future production-style migration command shape for applying committed migrations.
- Not run automatically on API startup.
- Not run during Phase 4E.

```text
start
```

Purpose:

- API container runtime command through the existing Dockerfile flow.

Future server-local env file:

```text
/opt/crm-modern/env/production.env
```

Purpose:

- Supplies runtime values such as `DATABASE_URL`, `CLIENT_ORIGIN`, `AI_PROVIDER`, `OPENAI_MODEL`, `OPENAI_API_KEY` if needed, `PORT`, and `HOST_API_PORT`.

Important:

The env file must stay outside the repo and must not be printed, committed, or screenshotted.

## 5. Future Build/Start Command Shapes Without Running Them

Future command shape for safe Compose validation:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config --quiet
```

Future command shape for building the API image:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml build api
```

Future command shape for starting the API container:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml up -d api
```

Future command shape for checking container status:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml ps
```

Important:

These are planning-only command shapes. They are not approved to run during Phase 4E.

Before running them later, the command target, env file, security group state, RDS readiness, and secret-safety rules must be reviewed.

## 6. Safe Compose Validation Using `config --quiet`

Safe validation should use:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config --quiet
```

Why:

- It validates Compose syntax and env variable requirements.
- It avoids printing the fully resolved Compose configuration.
- It reduces risk of exposing `DATABASE_URL` or `OPENAI_API_KEY`.

Do not use plain:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config
```

because it can print resolved secrets.

## 7. API Container Health Verification

Future API health verification should confirm the API starts and responds.

Possible future checks:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml ps
```

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml logs api
```

```bash
curl http://localhost:<host-api-port>/api/health
```

Later, after Nginx is configured:

```bash
curl http://<public-host>/api/health
```

After SSL:

```bash
curl https://<public-domain>/api/health
```

Safety notes:

- Logs should be reviewed carefully for accidental secret output.
- Health checks should not print secrets.
- If using a temporary API port, it should be closed after Nginx reverse proxy is verified.

## 8. Database Connectivity Verification Without Exposing Secrets

Database connectivity can be verified indirectly through:

- API startup success.
- API health endpoint, if health includes DB status.
- A safe DB-backed endpoint only after approval.
- Application logs that confirm connection success without printing credentials.
- Migration deploy status in the separate migration phase.

Do not verify DB connectivity by printing:

- `DATABASE_URL`
- Env file contents
- Prisma connection strings
- RDS password

Before DB connectivity checks:

- Confirm `DATABASE_URL` points to RDS without exposing the full value.
- Confirm RDS security group allows access only from EC2.
- Confirm no migration or seed command is being run accidentally.

## 9. What Must Not Happen

Must not happen:

- Do not run PostgreSQL in Docker on EC2 for production.
- Do not add a PostgreSQL service to production Compose.
- Do not run migrations automatically on API container startup.
- Do not use plain `docker compose config` with a real env file.
- Do not run `prisma db push` against RDS.
- Do not run `prisma migrate dev` against RDS.
- Do not print `/opt/crm-modern/env/production.env`.
- Do not expose `DATABASE_URL`.
- Do not expose `OPENAI_API_KEY`.
- Do not open temporary API ports without explicit approval.
- Do not leave temporary API ports open after Nginx is verified.
- Do not reset or delete RDS if the API fails to start.

## 10. Rollback/Safety Steps If API Container Fails

If the API container fails:

1. Stop and review container status.
2. Inspect logs carefully without exposing secrets.
3. Confirm the env file exists without printing contents.
4. Confirm required env variable names are present without printing values.
5. Confirm Compose validation passes with `config --quiet`.
6. Confirm RDS security group allows EC2 access.
7. Confirm the API image was built from the expected Dockerfile.
8. Restart only the API container if appropriate.
9. Do not run migration commands unless the separate migration phase has approved them.
10. Do not run `prisma db push`.
11. Do not reset or delete the database.
12. If the EC2 deployment state becomes messy before production data exists, consider a reviewed rebuild of the EC2 app directory/container state.

Rollback should focus first on container/app state, not database destruction.

## 11. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- Docker version on EC2.
- Docker Compose version on EC2.
- Project directory present under `/opt/crm-modern/app`.
- Env file existence check without contents.
- Compose validation with `config --quiet`.
- API image build success.
- API container running.
- API health endpoint success.
- Logs showing startup success without secrets.
- Security group screenshot showing intended ports, with account details redacted.
- RDS connectivity success through API behavior, without connection string exposure.

Do not capture:

- Env file contents.
- Full `DATABASE_URL`.
- `OPENAI_API_KEY`.
- RDS password.
- Private keys.
- Plain `docker compose config` output.
- Any terminal or screenshot containing secrets.

## 12. Boundaries Respected

Boundaries respected during Phase 4E:

- No deployment was performed.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No real env files were created.
- No real secrets were created or edited.
- `.env` was not modified.
- No secrets were exposed.
- No secret values were requested.
- No full real `DATABASE_URL` was requested or documented.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
# Codex Phase 5AJ: API Container Start Execution Report

## 1. Phase Name And Purpose

Phase 5AJ: API Container Start Execution Report

Purpose:

Document the completed production API container start execution on EC2 using only approved non-secret facts.

This report is documentation only.

No SSH connection was attempted again during this documentation step. No commands were run. Docker Compose was not rerun. Containers were not started or stopped. Docker build was not run. Prisma commands were not run. No env file contents were printed. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, public access, DNS, frontend deployment, deployments, databases, or `.env` files were created or modified.

## 2. Start Command Type

Target server:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
```

App path:

```text
/opt/crm-modern/app
```

Production RDS migration had already completed:

```text
Migration applied: 20260626135938_init
```

Production API image had already been built:

```text
Image name/tag: crm-modern-api:prod
```

Start command type:

```text
docker compose -f docker-compose.prod.yml up -d
```

## 3. Safe Env Handling

Runtime env file used locally for Compose interpolation:

```text
/opt/crm-modern/env/production.env
```

Safe env handling confirmed:

- Env file contents were not printed.
- Full `DATABASE_URL` is not included in this report.
- Database password is not included in this report.
- Full RDS endpoint is not included in this report.
- `DATABASE_URL` was unset afterward.

## 4. Initial Issue: Port Mismatch

Initial start result:

```text
Container: app-api-1
Image: crm-modern-api:prod
Port mapping: host 4000 to container 4000
```

Initial local checks:

```text
curl http://localhost:4000
curl http://localhost:4000/health
```

Initial result:

```text
Both initially returned connection reset.
```

Investigation found:

- Logs showed the app was listening on `localhost:3001`.
- Compose/Dockerfile expected port `4000`.
- A targeted check showed `PORT=3001` in `/opt/crm-modern/env/production.env`.
- `HOST_API_PORT` was not set.

No env file contents are included in this report.

## 5. Corrective Action

Corrective action completed:

- Broken container was stopped with Docker Compose down.
- `PORT` in `/opt/crm-modern/env/production.env` was corrected from `3001` to `4000`.
- Env file remained:
  ```text
  Permission: 600
  Owner: ubuntu:ubuntu
  ```

No full env file contents were printed or documented.

No secret values are included in this report.

## 6. Final Running Container State

Restart result:

```text
Container: app-api-1
Image: crm-modern-api:prod
Status: running
Port mapping: host 4000 to container 4000
```

Final logs showed:

```text
ASUN Migrations API running on http://localhost:4000
```

No secrets appeared in the final logs.

## 7. Local API Verification

Local-only verification from EC2:

```text
curl -i http://localhost:4000
```

Result:

```text
HTTP 404 Not Found
```

Meaning:

- Express was reachable.

Local-only check:

```text
curl -i http://localhost:4000/health
```

Result:

```text
HTTP 404 Not Found
```

Meaning:

- No `/health` route exists.

Safe route inspection found the real health endpoint:

```text
/api/health
```

Final local health check:

```text
curl -i http://localhost:4000/api/health
```

Result:

```text
HTTP 200 OK
```

Non-secret response body:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

## 8. Production Safety Confirmation

Production safety confirmed:

- API container is running locally on EC2.
- Local health endpoint works at `/api/health`.
- No public HTTP/HTTPS security group ports were opened.
- No Nginx was configured.
- No Cloudflare/DNS was configured.
- No frontend was deployed.
- No database changes were made in this phase.
- No staging, commit, or push was performed.
- No full `DATABASE_URL` was exposed.
- No database password was exposed.
- No env file contents were exposed.
- No full RDS endpoint was exposed.
- No EC2 public IP/DNS was exposed.
- No user public IP was exposed.
- No private key path or contents were exposed.

## 9. Evidence/Security Notes

Safe to include:

- Container name:
  ```text
  app-api-1
  ```
- Image tag:
  ```text
  crm-modern-api:prod
  ```
- Non-secret port:
  ```text
  4000
  ```
- Local health endpoint:
  ```text
  /api/health
  ```
- Health result:
  ```text
  HTTP 200 OK
  ```
- Non-secret health response body:
  ```json
  {"data":{"status":"ok","service":"asun-migrations-api"}}
  ```

Do not include:

- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- Full RDS endpoint.
- EC2 public IP/DNS.
- User public IP.
- Private key path or contents.
- Secret values.

## 10. What Was Not Done

The following were not done:

- SSH was not attempted again during this documentation step.
- Commands were not run by Codex.
- Docker Compose was not rerun.
- Containers were not started or stopped by Codex.
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
- Database was not reset or deleted.
- Files were not staged, committed, or pushed.

## 11. Next Phase Recommendation

Recommended next phase:

Plan the private API container verification and readiness checkpoint before exposing it through Nginx.

Suggested next-ticket focus:

- Confirm the container remains stable.
- Confirm safe log review rules.
- Confirm API local-only health evidence.
- Decide when to add Nginx and HTTP security group access.
- Keep public HTTP/HTTPS, Cloudflare/DNS, SSL, and frontend deployment for later approved phases.

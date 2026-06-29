# Codex Phase 3Y: EC2 Deployment Readiness Gap Review

## 1. Phase Name And Purpose

Phase 3Y: EC2 Deployment Readiness Gap Review

Purpose:

Review what is still missing before actual AWS EC2/RDS deployment work begins.

This was a review/planning-only phase. No AWS resources, EC2 resources, RDS resources, deployment files, Docker files, Compose files, GitHub Actions, secrets, or `.env` files were created or modified.

## 2. Already Ready For Future EC2 / RDS Deployment

Ready or mostly ready:

- API Dockerfile exists and has been tested locally.
- API-only `docker-compose.prod.yml` exists.
- Production Compose excludes PostgreSQL, which matches the RDS direction.
- API container has been tested locally through Compose.
- API container has connected to PostgreSQL using runtime `DATABASE_URL`.
- Prisma baseline migration exists.
- Seed workflow was tested against a migrated throwaway database.
- `db:migrate:deploy` exists.
- Runtime secrets handling has been planned.
- EC2 server-local env file pattern has been planned.
- `GET /api/health` exists and works.
- Phase reports provide strong portfolio/process evidence.

## 3. Not Ready Yet

Not ready yet:

- No EC2 instance exists.
- No RDS instance exists.
- No production `DATABASE_URL` exists.
- No real EC2 env file exists.
- No Nginx/reverse proxy configuration exists.
- No frontend production hosting plan has been implemented.
- No DNS/Cloudflare setup exists.
- No SSL/Certbot setup exists.
- No GitHub Actions deployment workflow exists.
- No production backup/restore workflow exists.
- No monitoring/logging plan has been implemented.
- No production runbook execution has been tested.

## 4. Gap Groups

### Must-Have Before AWS Deployment

Must-have before AWS deployment:

- Decide deployment shape.
- Confirm EC2 runtime env strategy.
- Confirm RDS strategy and production database naming.
- Confirm migration deployment workflow using committed migrations.
- Decide frontend build/serving approach.
- Decide whether Nginx is required before first public deployment.
- Create a safe deployment checklist.
- Confirm secrets redaction/evidence rules.

### Can-Do During AWS Deployment

Can-do during AWS deployment:

- Create EC2 instance.
- Create RDS PostgreSQL.
- Configure security groups.
- Install Docker/Compose on EC2.
- Place server-local env file on EC2.
- Build/run API container on EC2.
- Run migration deploy against RDS only after backup/snapshot planning.
- Configure Nginx/DNS/SSL if included in deployment scope.

### Can-Defer Until After First Deployment

Can defer until after first deployment:

- GitHub Actions CI/CD.
- Advanced monitoring.
- Centralized logging.
- Automated backups beyond initial RDS backups/snapshot planning.
- Full production hardening.
- Multi-stage Docker optimization.
- Blue/green or zero-downtime deployment.
- Observability dashboards.

## 5. Readiness Areas

### Docker / API Runtime

Status:

- Good local readiness.
- API Dockerfile exists.
- Docker image has built successfully.
- API container has run successfully.
- Health endpoint works.

Remaining considerations:

- Multi-stage Dockerfile.
- Non-root runtime user.
- Production dependency pruning.
- Smaller runtime image.
- Docker `HEALTHCHECK`.

These can wait unless Architect prioritizes hardening before deployment.

### Production Compose

Status:

- API-only `docker-compose.prod.yml` exists.
- PostgreSQL is excluded.
- Runtime env references are used.
- Secrets are not hardcoded.

Remaining considerations:

- Future EC2 env file integration.
- Safe validation with `config --quiet`.
- Possible Nginx/frontend service later if approved.

### Prisma Migrations

Status:

- Baseline migration exists.
- Baseline migration was reviewed.
- Baseline migration was tested against a throwaway database.
- Seed workflow was tested after migration.
- `db:migrate:deploy` exists.

Remaining considerations:

- Future RDS migration execution checklist.
- Backup/snapshot expectations before production migration.
- Confirmation of target database before migration deploy.

### Runtime Secrets

Status:

- Runtime env vars are identified.
- Secret vs non-secret classification is complete.
- EC2 server-local env file pattern is planned.
- Compose secret-printing risk is understood.

Remaining considerations:

- Real EC2 env file not created yet.
- RDS `DATABASE_URL` not available yet.
- Production redaction/evidence checklist still needs execution during deployment.

### RDS Planning

Status:

- Direction is clear: use Amazon RDS PostgreSQL.
- Production PostgreSQL should not run in Docker on EC2.

Remaining considerations:

- RDS instance planning.
- Database name/user planning.
- Security group access.
- Backup/snapshot expectations.
- SSL requirement.
- Migration deploy flow.

### EC2 Planning

Status:

- EC2 runtime env file pattern is planned.

Remaining considerations:

- EC2 instance type/AMI.
- SSH access.
- Linux user setup.
- Docker/Compose installation.
- App directory layout.
- Firewall/security group rules.
- Deployment checklist.

### Nginx / Reverse Proxy

Status:

- Not configured yet.

Remaining considerations:

- Decide whether Nginx is required before first public deployment.
- Reverse proxy routing.
- API upstream configuration.
- Static frontend serving strategy.
- SSL/Certbot integration.

### Frontend Production Build / Static Hosting

Status:

- Frontend production hosting plan has not been implemented.

Remaining considerations:

- Decide how frontend build artifacts are created.
- Decide whether frontend is served by Nginx on EC2.
- Decide whether frontend is served by a separate container.
- Confirm `VITE_API_BASE_URL` production behavior.

### DNS / Cloudflare

Status:

- Not started.

Remaining considerations:

- Domain selection.
- Cloudflare DNS records.
- Proxy mode decision.
- DNS propagation.
- Evidence screenshots with secrets redacted.

### SSL / Certbot

Status:

- Not started.

Remaining considerations:

- Requires DNS/public routing decision.
- Likely depends on Nginx.
- Certbot install/config.
- Renewal verification.
- HTTP-to-HTTPS redirect.

### GitHub Actions CI/CD

Status:

- Not started.

Can defer:

- Manual deployment can come first.
- CI/CD can be added after the deployment path is understood.

Future considerations:

- Secrets in GitHub Actions.
- Deployment key/SSH.
- Build/test pipeline.
- Deployment workflow.
- Rollback strategy.

### Logs / Monitoring / Backups

Status:

- Local Docker logs are available.
- Production logging/monitoring/backups are not implemented.

Remaining considerations:

- Docker logs on EC2.
- Nginx logs if used.
- RDS backups/snapshots.
- Basic uptime/health monitoring.
- Runbook for troubleshooting.

### Documentation / Portfolio Evidence

Status:

- Strong phase documentation exists.
- Review/planning reports are building solid portfolio evidence.

Future evidence:

- Architecture diagram.
- Redacted deployment screenshots.
- Health check screenshot.
- Docker/EC2 process screenshot.
- RDS screenshot with sensitive values redacted.
- DNS/SSL evidence.
- Operations runbook excerpts.

## 6. Risks To Avoid Before Deployment

Risks to avoid:

- Starting AWS before deployment shape is clear.
- Putting production PostgreSQL in Docker on EC2.
- Committing `.env` or real secrets.
- Pasting or screenshotting resolved Compose config.
- Running migrations automatically on container startup.
- Running migration deploy against the wrong database.
- Deploying without backup/snapshot planning.
- Exposing API publicly without CORS/origin review.
- Mixing frontend `VITE_*` values with secrets.
- Trying to do EC2, RDS, Nginx, DNS, SSL, and CI/CD all in one ticket.

## 7. Recommended Next 3 Tickets

Recommended next tickets:

### 1. Phase 3Z: Deployment Shape Decision

Purpose:

Decide whether the first deployment should be:

- API-only first,
- API plus frontend,
- API plus frontend plus Nginx.

This should clarify the first public deployment target before AWS work begins.

### 2. Phase 4A: Nginx And Frontend Hosting Planning

Purpose:

Plan how frontend production build/static assets and reverse proxy routing should work.

This should remain planning-only until Architect approves implementation.

### 3. Phase 4B: AWS EC2 / RDS Deployment Plan Review

Purpose:

Convert the existing AWS deployment direction into a step-by-step implementation checklist.

Should include:

- EC2 setup,
- RDS setup,
- security groups,
- server-local env file,
- Docker/Compose runtime,
- migration deploy,
- verification,
- evidence capture.

## 8. Boundaries Respected

Boundaries respected during Phase 3Y:

- `.env` was not modified.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No deployment was performed.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions were not modified.
- `docker compose config` was not run with real secrets.
- No commands were run that print resolved secrets.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged.
- No commit was made.
- No push was performed.
- `npm audit fix --force` was not run.
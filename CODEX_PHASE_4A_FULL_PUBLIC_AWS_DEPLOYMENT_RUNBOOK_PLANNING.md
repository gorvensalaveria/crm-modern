# Codex Phase 4A: Full Public AWS Deployment Runbook Planning

## 1. Phase Name And Purpose

Phase 4A: Full Public AWS Deployment Runbook Planning

Purpose:

Create a high-level but practical runbook plan for the selected Option C deployment milestone:

```text
EC2 + RDS PostgreSQL + API container + frontend production build/static hosting + Nginx reverse proxy + Cloudflare DNS + SSL/Certbot + redacted evidence capture
```

This is a planning-only phase.

No AWS resources, EC2 resources, RDS resources, deployment files, Docker files, Compose files, GitHub Actions, secrets, or `.env` files were created or modified.

## 2. Target Milestone

Accepted target milestone:

- EC2 host
- RDS PostgreSQL database
- API container
- Frontend production build/static hosting
- Nginx reverse proxy
- Cloudflare DNS
- SSL/Certbot
- Redacted evidence capture

Important execution rule:

Option C is the target milestone, but controlled sub-phases are the method.

This deployment should not be performed in one uncontrolled step.

## 3. High-Level Deployment Runbook

Accepted high-level future runbook:

1. Confirm local repository readiness.
2. Confirm committed Prisma migration history exists.
3. Confirm production deploy script exists.
4. Plan AWS resource names, region, and cost boundaries.
5. Provision RDS PostgreSQL.
6. Record only safe metadata, never secrets.
7. Provision EC2 host.
8. Configure EC2 security group access.
9. Install Docker and Docker Compose on EC2.
10. Transfer or clone the application repo to EC2.
11. Create server-local production env file on EC2.
12. Build and start the API container.
13. Run Prisma migration deploy against RDS after safety review.
14. Verify API health and database connectivity.
15. Build frontend production assets.
16. Configure Nginx to serve frontend and reverse proxy API.
17. Verify app over EC2 public IP.
18. Configure Cloudflare DNS.
19. Configure SSL/Certbot.
20. Verify HTTPS public app.
21. Capture redacted evidence.
22. Document final deployment state and rollback notes.

## 4. Safe Sub-Phases

Accepted safe sub-phases:

- Phase 4B: RDS PostgreSQL Provisioning Plan
- Phase 4C: EC2 Host Setup Plan
- Phase 4D: EC2 Runtime Environment And Secrets Execution Plan
- Phase 4E: API Container Deployment To EC2 Plan
- Phase 4F: RDS Migration Deploy Plan
- Phase 4G: Frontend Production Build And Static Hosting Plan
- Phase 4H: Nginx Reverse Proxy Plan
- Phase 4I: Cloudflare DNS Plan
- Phase 4J: SSL/Certbot Plan
- Phase 4K: Full Public Deployment Verification And Evidence Plan

Each sub-phase should have its own review gate before execution.

## 5. Recommended Order Of Operations

Recommended order:

1. Confirm AWS region, naming, and cost boundaries.
2. Plan RDS PostgreSQL settings.
3. Provision RDS only after review.
4. Plan EC2 instance settings.
5. Provision EC2 only after review.
6. Configure EC2 access and security groups carefully.
7. Install Docker and Docker Compose on EC2.
8. Clone or transfer the project to EC2.
9. Create the EC2 server-local production env file.
10. Build and start the API container.
11. Run Prisma migration deploy against RDS only after review.
12. Verify API health and database connectivity.
13. Build frontend production assets.
14. Configure Nginx for static frontend serving and API reverse proxying.
15. Verify app over EC2 public IP.
16. Configure Cloudflare DNS.
17. Configure SSL/Certbot.
18. Verify HTTPS public app.
19. Capture redacted evidence.
20. Document final deployment result and rollback notes.

## 6. Manual Checkpoints Requiring ChatGPT Architect Review

ChatGPT Architect review should happen before:

- Creating any AWS resource.
- Choosing RDS size, region, storage, public/private access, and database name.
- Creating or editing production secrets.
- Creating the EC2 server-local env file.
- Opening security group ports.
- Running `db:migrate:deploy` against RDS.
- Starting public DNS changes.
- Running Certbot.
- Capturing or publishing portfolio evidence.
- Any cleanup involving cloud resources.
- Any future commit checkpoint before real deployment work.

## 7. Where Secrets Must Be Created Or Handled Later

Secrets and sensitive values that must be handled later:

- RDS password
- Production `DATABASE_URL`
- `OPENAI_API_KEY`, if production AI provider is `openai`
- EC2 SSH key material
- Cloudflare account/API credentials, if API automation is used
- Future GitHub Actions secrets, if CI/CD is added later

Safe handling rules:

- Do not paste full secret values into chat.
- Do not commit secret files.
- Do not add real secrets to reports.
- Keep the future production env file outside the repo, such as:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Use placeholders in documentation.
- Use validation commands that do not print resolved secrets.
- Avoid plain `docker compose config` with real env files because it can print secrets.

## 8. Where Screenshots/Evidence Should Be Captured Later

Potential evidence capture points:

- AWS EC2 instance running, with sensitive account details redacted.
- RDS instance available, with endpoint/password details redacted as needed.
- EC2 terminal showing Docker and Docker Compose installed.
- API container running.
- API health endpoint response.
- Migration deploy success output, with secrets absent.
- Nginx status or config test output, with secrets absent.
- Frontend loaded over EC2 public IP.
- Cloudflare DNS record, with sensitive dashboard details redacted.
- SSL/Certbot success output.
- Final public app loaded over HTTPS.
- Git commit history showing deployment preparation.

Evidence should not include:

- Full `DATABASE_URL`
- API keys
- Passwords
- Private keys
- Secret env file contents
- Unredacted AWS account details, if the user prefers not to publish them
- Any command output that resolves secrets

## 9. Rollback And Safety Checkpoints

Rollback and safety checkpoints:

- Before AWS creation: confirm cost boundaries and AWS region.
- After RDS creation: confirm database availability before connecting the app.
- Before migration deploy: confirm target is the intended RDS database.
- Before migration deploy: confirm migration history is committed.
- Before opening public ports: confirm only intended ports are exposed.
- Before DNS changes: verify the app works by EC2 public IP.
- Before SSL/Certbot: verify Nginx serves expected routes over HTTP.
- After each deployment step: document the current known-good state.
- If API deployment fails: inspect logs and restart only the app container if appropriate.
- If migration deploy fails: stop and review; do not run `prisma db push`; do not reset RDS.
- If DNS or SSL fails: keep IP-based verification available while troubleshooting.
- If costs or security look wrong: pause and review before continuing.

## 10. What Is Intentionally Excluded For Now

The following are intentionally excluded from the first public deployment milestone:

- GitHub Actions deployment automation
- Terraform
- Kubernetes
- EKS
- Blue/green deployment
- Zero-downtime deployment
- Advanced monitoring dashboards
- Centralized logging stack
- Full production hardening beyond what is needed for a safe portfolio deployment
- Automated backup/restore beyond basic RDS snapshot/backup planning
- Multi-region or high-availability architecture

These can be planned later after the first public deployment is working and verified.

## 11. Recommended Next 5 Tickets

Recommended next tickets:

1. Phase 4B: RDS PostgreSQL Provisioning Plan
2. Phase 4C: EC2 Host Setup Plan
3. Phase 4D: EC2 Runtime Environment And Secrets Execution Plan
4. Phase 4E: API Container Deployment To EC2 Plan
5. Phase 4F: RDS Migration Deploy Plan

After those, continue with:

- Phase 4G: Frontend Production Build And Static Hosting Plan
- Phase 4H: Nginx Reverse Proxy Plan
- Phase 4I: Cloudflare DNS Plan
- Phase 4J: SSL/Certbot Plan
- Phase 4K: Full Public Deployment Verification And Evidence Plan

## 12. Boundaries Respected

Boundaries respected during Phase 4A:

- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No deployment was performed.
- `.env` was not modified.
- No real secrets were created or edited.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands that print resolved secrets were run.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

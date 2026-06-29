# Codex Phase 5A: AWS Execution Readiness And Cost Guardrail Review

## 1. Phase Name And Purpose

Phase 5A: AWS Execution Readiness And Cost Guardrail Review

Purpose:

Before creating any real AWS resources, review readiness, cost guardrails, naming choices, region choice, and execution boundaries for the upcoming real AWS deployment.

This is a planning/review gate only.

No AWS resources, Cloudflare records, Elastic IPs, security groups, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployment resources, databases, or `.env` files were created or modified.

## 2. Planned And Ready Items From Phase 4A–4K

The project now has planning coverage for the full public deployment milestone.

Completed planning areas:

- Full public AWS deployment runbook.
- RDS PostgreSQL provisioning approach.
- EC2 host setup approach.
- EC2 runtime env and secrets handling.
- API container deployment workflow.
- RDS migration deploy workflow.
- Frontend production build/static hosting.
- Nginx reverse proxy.
- Cloudflare DNS.
- SSL/Certbot.
- Final verification and portfolio-safe evidence capture.

Target milestone:

```text
EC2 + RDS PostgreSQL + API container + frontend production build/static hosting + Nginx reverse proxy + Cloudflare DNS + SSL/Certbot
```

Phase 5A is the guardrail checkpoint before moving from planning into real AWS execution.

## 3. Real Resources That May Be Created Later

Future execution phases may create:

- EC2 instance
- RDS PostgreSQL instance
- Security groups
- Optional Elastic IP
- EBS/root volume attached to EC2
- RDS snapshots/backups

These should be created only through reviewed execution tickets.

## 4. Cost Guardrails

Recommended cost guardrails:

- Use one AWS region for all resources.
- Use small/low-cost EC2 instance choices suitable for portfolio/demo traffic.
- Use single-AZ RDS for the first portfolio deployment.
- Use modest RDS storage.
- Use a modest EC2 root EBS volume.
- Avoid NAT Gateway for this milestone.
- Avoid Load Balancer for this milestone.
- Avoid EKS, ECS, Terraform, and Kubernetes for this milestone.
- Avoid oversized RDS/EC2 choices.
- Understand that stopped EC2 may still incur EBS costs.
- Understand that RDS can continue billing while running.
- Understand that RDS snapshots/backups may incur storage costs.
- Understand that Elastic IP may incur costs if unattached.

Cost-related stop condition:

If AWS shows an unexpected cost warning or unclear pricing choice, pause and review before continuing.

## 5. Naming/Tagging Plan

Recommended naming/tagging pattern:

Project:

```text
crm-modern
```

Environment:

```text
prod
```

Resource purpose examples:

```text
api-host
postgres
security-group
frontend-nginx
snapshot
```

Suggested tag keys:

```text
Project=crm-modern
Environment=prod
Owner=<user>
Purpose=<resource-purpose>
ManagedBy=manual-learning
```

Resource name examples using placeholders:

```text
crm-modern-prod-ec2
crm-modern-prod-rds-postgres
crm-modern-prod-ec2-sg
crm-modern-prod-rds-sg
crm-modern-prod-eip
```

Use consistent names so resources are easy to identify and clean up later.

## 6. Region Selection Checklist

Before choosing a region, confirm:

- EC2 and RDS PostgreSQL are available in the region.
- Region has acceptable latency for the target audience.
- Region has acceptable pricing.
- Region supports desired instance classes.
- Region supports desired RDS class/storage choices.
- All resources will be created in the same region.
- The selected region is clearly documented before resource creation.

Avoid splitting EC2 and RDS across regions.

## 7. Security Guardrails

Security guardrails:

- SSH should be restricted to the user’s approved IP.
- Avoid SSH from `0.0.0.0/0`.
- HTTP port `80` should open only when Nginx/HTTP validation is needed.
- HTTPS port `443` should open when SSL/HTTPS validation is needed.
- Temporary API port should open only if explicitly approved.
- Temporary API port should close after Nginx reverse proxy works.
- RDS should not be publicly accessible.
- RDS inbound PostgreSQL access should allow only the EC2 security group.
- Do not expose PostgreSQL to `0.0.0.0/0`.
- Do not put secrets in chat, repo, reports, or screenshots.
- Do not paste or capture a full `DATABASE_URL`.
- Do not capture private keys, API keys, passwords, or env file contents.

## 8. Execution Order For Upcoming Phases

Recommended execution order:

1. Choose AWS region, names, and tags.
2. Create security groups.
3. Create RDS PostgreSQL.
4. Create EC2.
5. Install Docker and Docker Compose later.
6. Install/configure Nginx later.
7. Create EC2 server-local env file later.
8. Deploy API container later.
9. Run migration deploy later after RDS/env/backup review.
10. Build and serve frontend later.
11. Configure Cloudflare DNS later.
12. Configure SSL/Certbot later.
13. Perform final verification and evidence capture later.

Each execution step should have a review gate before action.

## 9. Stop Conditions

Stop immediately if:

- AWS shows unexpected cost warning.
- RDS is about to be publicly accessible.
- PostgreSQL port is open to `0.0.0.0/0`.
- SSH is about to be opened broadly.
- A secret is exposed in terminal, screenshot, chat, or repo.
- Region choice is uncertain.
- Resource names/tags are unclear.
- RDS size/storage choices are unclear.
- Security group direction is unclear.
- Target database is unclear.
- Any command would run migrations before review.
- Any step exceeds the approved phase.

## 10. Evidence Rules For AWS Console Screenshots

Safe evidence may include:

- Resource names.
- Resource state, such as running/available.
- Instance type if acceptable.
- Region if acceptable.
- Security group rules with sensitive details redacted as needed.
- RDS engine/status without passwords or full endpoints if the user wants redaction.
- Tags showing project/environment/purpose.
- Billing/cost estimates with account details redacted.

Never capture:

- Secret values.
- RDS password.
- Full `DATABASE_URL`.
- Private keys.
- Access keys.
- Cloudflare tokens.
- Full env files.
- AWS account IDs if the user wants them redacted.
- Any screen containing credentials.

## 11. Boundaries Respected

Boundaries respected during Phase 5A:

- No AWS resources were created.
- Cloudflare records were not created or modified.
- No Elastic IPs were allocated.
- No security groups were changed.
- No real env files were created.
- No real secrets were created or edited.
- No secret values were requested.
- No secrets were exposed.
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
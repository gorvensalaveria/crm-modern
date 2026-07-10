# CODEX Phase 9A: Backend CI/CD Planning Guide

## 1. Phase Name and Purpose

Phase 9A plans future backend CI/CD for the CRM Modern AWS deployment.

This phase is documentation/planning-only. It does not modify workflows, source code, package files, infrastructure, AWS resources, EC2, Docker, Nginx, Certbot, DuckDNS, RDS, GitHub variables/secrets, or production.

The goal is to define a conservative backend deployment automation direction before creating any deployment workflow or script.

## 2. Why Backend CI/CD Is Riskier Than Frontend CI/CD

Frontend CI/CD deploys static files to S3 and invalidates CloudFront. Backend CI/CD can affect running services, production environment variables, database migrations, Docker containers, Nginx proxy behavior, and application availability.

Backend deployments are riskier because they can:

* restart or replace the API container,
* introduce runtime configuration problems,
* require database migrations,
* break `/api/` traffic behind Nginx,
* expose secrets if commands are careless,
* create rollback complexity when schema changes are involved,
* affect the live backend used by the CloudFront-hosted frontend.

For this reason, backend CI/CD should begin with a manual, controlled deployment workflow rather than automatic deployment on every push.

## 3. Current Backend Deployment Architecture

Current production architecture:

* Frontend: S3 + CloudFront
* Frontend URL: `https://d3k197cbnbmhh7.cloudfront.net`
* Backend API: EC2 + Docker + Nginx + HTTPS
* Backend API base: `https://aucrm.duckdns.org/api/...`
* Database: private RDS PostgreSQL
* Backend runtime: Docker container on EC2
* Nginx handles HTTPS and proxies `/api/` traffic to the local API container.

Backend CI/CD is not yet automated.

Infrastructure is manually created and is not Terraform/IaC-managed yet.

## 4. Current Frontend CI/CD Reference Model

Phase 7 completed frontend CI/CD:

* GitHub Actions deploys frontend build output to S3.
* CloudFront invalidation works.
* AWS OIDC is used.
* No long-lived AWS access keys are used.
* The deploy workflow is manual-triggered.

The frontend model is a useful reference, but backend deployment needs additional safeguards because it touches live runtime and database concerns.

## 5. Backend CI/CD Goals

Backend CI/CD should aim to:

* reduce manual backend deployment steps,
* keep production deploys controlled,
* preserve the current EC2 + Docker + Nginx architecture,
* keep RDS private,
* run safe production migrations,
* verify health after deployment,
* avoid leaking secrets,
* keep rollback understandable,
* keep costs low.

## 6. Backend CI/CD Non-Goals

Phase 9A does not plan immediate adoption of:

* ECS/EKS migration,
* Kubernetes,
* Terraform conversion,
* ALB/NAT Gateway,
* blue/green deployment,
* automatic deploy on every push,
* database schema changes without migration review,
* production secret rotation,
* backend architecture changes.

## 7. Recommended Backend Deployment Strategy Options

### Option A: SSH From GitHub Actions to EC2

Pros:

* simple to understand,
* common beginner deployment pattern,
* works with the current EC2-based architecture.

Cons:

* requires a private key secret in GitHub,
* requires careful SSH security group/user/IP planning,
* GitHub-hosted runner IP ranges can complicate inbound SSH rules,
* deployment commands must avoid printing server secrets.

### Option B: AWS Systems Manager Run Command

Pros:

* no inbound SSH from a GitHub runner,
* AWS-native,
* auditable,
* better long-term operational pattern than direct SSH.

Cons:

* requires SSM readiness,
* requires an IAM instance profile,
* requires more AWS concepts and setup,
* may be a larger learning step than SSH.

### Option C: Self-Hosted GitHub Runner on EC2

Pros:

* avoids opening SSH from GitHub-hosted runners,
* can deploy locally on the EC2 instance,
* can reuse local Docker context.

Cons:

* adds runner security risk on the production server,
* creates maintenance overhead,
* can blur CI and production boundaries,
* not ideal for beginner production unless isolated carefully.

### Option D: Later ECR/ECS Path

Pros:

* more cloud-native container deployment,
* highly job-market relevant,
* better long-term deployment model for containerized services.

Cons:

* larger architecture change,
* more cost and complexity,
* not aligned with the current EC2 + Docker milestone.

## 8. Recommended Safest First Backend CI/CD Approach

The safest first approach is to plan a manual backend deploy workflow, then implement only after a separate design phase.

Preferred near-term candidate:

* GitHub Actions builds/tests first.
* Deployment is manually triggered with `workflow_dispatch`.
* Frontend and backend deploy workflows remain separate.
* A controlled EC2 deployment mechanism is selected after comparing SSH, SSM, and self-hosted runner options.
* Production migrations use `prisma migrate deploy`.
* Docker container rebuild/restart is handled carefully.
* `/api/health` is verified after deployment.
* CloudWatch alarms and logs are checked after deployment.

This guide does not choose the final implementation. The next phase should make that decision after comparing tradeoffs.

## 9. GitHub Actions Design Considerations

Backend deployment workflow planning should include:

* manual-only trigger at first,
* CI success required before backend deploy,
* separate workflow from frontend deploy,
* least-privilege AWS access,
* protected branch/environment later if practical,
* no long-lived AWS access keys,
* no secret printing,
* no env file printing,
* no commands that expose environment variables.

The current CI workflow already runs tests/typecheck/build. Backend deployment should build on that quality gate rather than bypass it.

## 10. AWS Authentication Approach

Preferred AWS authentication model:

```text
GitHub Actions OIDC
```

OIDC should remain preferred because it avoids long-lived AWS access keys and matches the existing frontend CI/CD security model.

Avoid:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Backend CI/CD may still require a separate access design depending on whether the final deployment mechanism uses AWS APIs, SSM Run Command, or direct SSH.

## 11. EC2 Access Strategy Options

The next design phase should compare:

* SSH from GitHub Actions to EC2,
* AWS Systems Manager Run Command,
* self-hosted GitHub runner on EC2,
* later ECR/ECS migration path.

Initial preference should favor the safest practical option for the current portfolio stage.

Decision factors:

* secret exposure risk,
* operational simplicity,
* IAM complexity,
* whether inbound SSH needs to be broadened,
* auditability,
* rollback clarity,
* cost impact,
* fit with the existing EC2 + Docker deployment.

## 12. Docker Image Build/Deploy Strategy

Backend Docker deployment needs a deliberate strategy.

Possible approaches:

* build Docker image in GitHub Actions and transfer/pull it later,
* build Docker image on EC2 from checked-out source,
* later publish images to ECR and deploy from there.

Planning considerations:

* do not delete the previous known-working image immediately,
* use clear image tags if images are retained,
* keep rollback simple,
* avoid printing production env values,
* avoid changing Docker architecture until approved.

The guide recommends evaluating image build location before implementation.

## 13. Production Environment Variable Handling

Production runtime secrets should remain on the server or in an approved secret-management model.

Backend CI/CD must not:

* print env files,
* copy env contents into logs,
* add database credentials to GitHub,
* store `DATABASE_URL` in frontend or public docs,
* run commands that dump the environment,
* run Docker Compose config against production env if it would reveal secrets.

Safe planning principle:

* deploy code and containers,
* keep runtime secrets separate,
* only verify non-secret configuration names or approved public endpoints.

## 14. Production Database Migration Strategy

Production migrations must use:

```text
prisma migrate deploy
```

Production migrations must not use:

```text
prisma db push
prisma migrate dev
```

Migration planning should require:

* CI success before migration,
* migration review before deployment,
* backup awareness before risky migrations,
* avoiding destructive migrations without explicit review,
* understanding whether the migration is backward-compatible with the currently running app,
* avoiding casual rollback of database migrations.

Database rollback is harder than application rollback. This should be reflected in every backend deployment plan.

## 15. Health Check and Rollback Considerations

Post-deploy verification should include:

* verify `https://aucrm.duckdns.org/api/health`,
* verify the API container is running,
* verify Nginx is proxying correctly,
* check CloudWatch alarms after deploy,
* check Docker/API logs and Nginx logs if health check fails.

Rollback planning should include:

* keep previous working Docker image/tag if possible,
* do not delete old images immediately,
* if deployment fails, revert container to previous image,
* avoid rolling back database migrations casually,
* document that database rollback is harder than app rollback.

## 16. Monitoring/Alarm Integration From Phase 8

Phase 8 completed AWS-native monitoring/alarm setup:

* CloudWatch alarms were created for EC2, RDS, and CloudFront.
* Alarms are observation-only.
* No SNS/email notification actions are configured yet.

Backend CI/CD should include post-deployment observation:

* review backend health,
* review EC2 alarm state,
* review RDS alarm state,
* review relevant logs when health checks fail,
* avoid restarting blindly without evidence.

## 17. Security Boundaries

Do not include or expose:

* EC2 public IP/DNS,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL`,
* full env file contents,
* DuckDNS token,
* Certbot account email,
* private key paths/material,
* AWS account ID,
* IAM role ARN,
* GitHub secrets,
* SSH private key contents,
* screenshots containing account metadata.

Do not recommend:

* printing env files,
* `cat /opt/crm-modern/env/production.env`,
* `docker compose config` with production env,
* `env`.

## 18. Cost-Control Boundaries

Backend CI/CD should preserve the current cost posture:

* keep EC2 + Docker + Nginx for now,
* avoid ECS/EKS/ALB/NAT Gateway for now,
* avoid paid deployment tools,
* avoid new always-on infrastructure unless explicitly approved,
* prefer manual workflow trigger first,
* avoid overengineering.

## 19. What Not to Automate Yet

Do not automate yet:

* automatic backend deployment on push,
* database rollback,
* secret rotation,
* EC2 provisioning,
* RDS provisioning,
* Nginx/Certbot/DuckDNS changes,
* infrastructure creation,
* CloudWatch Agent installation,
* Prometheus/Grafana,
* blue/green deployments,
* autoscaling,
* ECS/EKS migration.

## 20. Proposed Phase 9 Subphases

Recommended Phase 9 subphases:

* Phase 9A: Backend CI/CD Planning Guide
* Phase 9B: Backend Deployment Strategy Decision
* Phase 9C: Backend CI/CD IAM/Access Design
* Phase 9D: Backend Deployment Script Design
* Phase 9E: Backend GitHub Actions Workflow Draft
* Phase 9F: Backend CI/CD Dry Run / Controlled First Deployment
* Phase 9G: Backend CI/CD Execution Report
* Phase 9H: Backend CI/CD Milestone Summary

## 21. Recommended Next Step

Recommended next step:

```text
Phase 9B: Backend Deployment Strategy Decision
```

Phase 9B should compare SSH, SSM Run Command, self-hosted runner, and later ECS/ECR options, then choose the safest practical near-term backend deployment mechanism before any workflow or script is created.

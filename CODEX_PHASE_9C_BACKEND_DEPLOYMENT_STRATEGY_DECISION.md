# CODEX Phase 9C: Backend Deployment Strategy Decision

## 1. Phase Name and Purpose

Phase 9C records the backend CI/CD deployment strategy decision for CRM Modern.

This phase is documentation/decision-only. It does not create ECR resources, modify AWS, modify workflows, modify source code, modify infrastructure, run migrations, or touch production.

## 2. Final Selected Strategy

Final selected strategy:

```text
Option D3: Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

The selected strategy keeps the existing backend architecture and adds ECR as a backend Docker image registry in later approved phases.

## 3. Why D3 Was Selected

D3 was selected because it provides the best balance of job relevance, cost control, and current project maturity.

Reasons:

* keeps the existing working backend architecture,
* keeps `https://aucrm.duckdns.org`,
* avoids buying a custom domain,
* avoids an ALB requirement for now,
* avoids NAT Gateway risk for now,
* avoids full ECS/Fargate migration cost for now,
* adds job-relevant ECR/container registry experience,
* improves backend deployment maturity beyond manual Docker rebuilds,
* supports rollback by retaining previous image tags,
* allows future migration to ECS/Fargate later,
* keeps the current private RDS model,
* keeps Nginx/Certbot HTTPS setup unchanged.

## 4. Why D1 Full ECS/Fargate Was Deferred

D1, full ECS Fargate + ECR + ALB, is likely the most job-relevant long-term architecture.

It was deferred because it likely requires:

* ALB,
* target groups,
* ECS services,
* ECS task definitions,
* CloudWatch logs,
* additional IAM,
* networking changes,
* possible ACM/custom domain planning.

It may not fit well with the current DuckDNS-only requirement. It also increases recurring cost and architecture complexity.

D1 should be revisited later after ECR experience and a more precise cost estimate.

## 5. Why D2 ECS on EC2 Was Deferred

D2, ECS on EC2 launch type, was deferred because it adds ECS complexity while still requiring EC2 capacity management.

It is useful, but operationally heavier than the current EC2 + ECR hybrid direction. It is also less clean than Fargate and less cost/simple than keeping the current backend architecture while adding ECR first.

D2 is not ideal as the immediate next step.

## 6. Why D4 SSM-Only Was Not Selected as the Primary Strategy

D4, SSM Run Command only, remains useful and may still be used as the EC2 execution mechanism later.

However, D4 alone does not add ECR/container registry experience.

The selected D3 strategy can still use SSM later to make EC2 pull and restart ECR images. That means SSM can be part of the deployment mechanism, while the architecture decision remains ECR-hybrid.

## 7. How D3 Preserves Current DuckDNS Backend Domain

D3 preserves the current backend domain:

```text
https://aucrm.duckdns.org
```

The backend API remains:

```text
https://aucrm.duckdns.org/api/...
```

Because the public backend entry point remains Nginx/Certbot/DuckDNS on EC2, the project does not need a custom domain, ALB, ACM certificate, or DNS change for this phase.

## 8. Target D3 Architecture

Target D3 architecture:

```text
GitHub Actions
-> AWS OIDC
-> build backend Docker image
-> push versioned image to Amazon ECR
-> controlled EC2 deployment mechanism
-> EC2 pulls selected ECR image
-> Docker API container is replaced/restarted
-> Nginx continues proxying /api/ to local API container
-> backend remains available at https://aucrm.duckdns.org/api/...
-> API connects to private RDS PostgreSQL
```

Current backend architecture remains:

* EC2,
* Docker,
* Nginx,
* Certbot HTTPS,
* DuckDNS,
* private RDS PostgreSQL.

## 9. Expected Future Deployment Flow

Expected future backend deployment flow:

1. GitHub Actions runs backend CI checks.
2. GitHub Actions builds the backend Docker image.
3. GitHub Actions authenticates to AWS using OIDC.
4. GitHub Actions pushes a versioned backend image to ECR.
5. A controlled EC2 deployment mechanism selects the image to deploy.
6. EC2 pulls the selected ECR image.
7. The Docker API container is carefully replaced or restarted.
8. Production migrations run only if included in the approved later design.
9. `https://aucrm.duckdns.org/api/health` is verified.
10. Phase 8 CloudWatch alarms and logs are reviewed after deployment.

This flow is not implemented in Phase 9C.

## 10. ECR Role in the Architecture

ECR will act as the backend Docker image registry.

Expected ECR responsibilities in later phases:

* store backend Docker images,
* support versioned image tags,
* provide an image source for EC2 deployment,
* retain previous image tags for rollback,
* use a lifecycle policy later to avoid stale image buildup.

No ECR repository or lifecycle policy is created in this phase.

## 11. EC2 Role in the Architecture

EC2 remains the backend runtime host.

Expected EC2 responsibilities:

* pull the selected backend image from ECR,
* run the Docker API container,
* keep the API reachable locally for Nginx proxying,
* preserve existing backend runtime environment handling,
* support controlled rollback to a previous image.

No EC2 changes are made in this phase.

## 12. Nginx/Certbot/DuckDNS Role in the Architecture

Nginx, Certbot, and DuckDNS remain the public backend entry point.

Responsibilities:

* DuckDNS provides the backend domain.
* Certbot provides HTTPS certificates for the current backend domain.
* Nginx terminates HTTPS and proxies `/api/` traffic to the local API container.

This keeps the backend available at:

```text
https://aucrm.duckdns.org/api/...
```

No Nginx, Certbot, or DuckDNS changes are made in this phase.

## 13. RDS Connectivity Considerations

RDS remains private.

The API container continues to connect to private RDS PostgreSQL through the existing approved backend runtime model.

D3 avoids immediate ECS networking changes and avoids exposing RDS publicly. Future deployment design must preserve:

* private RDS access,
* no public database endpoint documentation,
* no database credential exposure,
* no `DATABASE_URL` exposure,
* no broad security group changes.

## 14. GitHub Actions/OIDC Considerations

Future backend CI/CD should use GitHub Actions OIDC where AWS access is needed.

Expected future uses:

* authenticate to AWS,
* push Docker images to ECR,
* possibly trigger or authorize the controlled EC2 deployment mechanism.

The backend workflow should remain separate from the frontend deployment workflow.

Future workflow design should:

* avoid long-lived AWS access keys,
* use least privilege,
* avoid printing secrets,
* avoid printing env files,
* remain manually controlled at first.

No GitHub Actions workflow is created in this phase.

## 15. Production Migration Strategy

Production migrations must use:

```text
prisma migrate deploy
```

Production migrations must not use:

```text
prisma db push
prisma migrate dev
```

Migration execution should be designed in a later phase.

Migration principles:

* avoid destructive migrations without review,
* run migrations only through an approved deployment design,
* treat database rollback as harder than app rollback,
* keep backup awareness before risky migrations.

No migrations are run in this phase.

## 16. Health Check and Rollback Strategy

Health check strategy:

* verify `https://aucrm.duckdns.org/api/health`,
* check Docker/API container state,
* check Nginx proxy behavior if health fails,
* check Phase 8 CloudWatch alarms after deployment,
* check Docker/API logs and Nginx logs if health fails.

Rollback strategy:

* retain previous working ECR image tag,
* do not delete the previous image immediately,
* if the new container fails, redeploy the previous image,
* avoid casual database migration rollback,
* document rollback steps in a later deployment script design.

## 17. Monitoring Integration From Phase 8

Phase 8 completed AWS-native monitoring/alarm setup.

Future backend deployments should use Phase 8 monitoring by:

* checking CloudWatch alarms after deployment,
* reviewing EC2 alarm state,
* reviewing RDS alarm state,
* checking Docker/API logs if health fails,
* checking Nginx logs if proxying fails.

The alarms remain observation-focused and do not replace health checks or manual verification.

## 18. Cost-Control Reasoning

D3 was selected partly for cost control.

Cost-control reasons:

* no ECR repository is created yet,
* no ECS cluster is created,
* no ALB/NLB is created,
* no target groups are created,
* no NAT Gateway is created,
* no ACM certificates are created,
* no DNS changes are made,
* no Secrets Manager secrets are created,
* no always-on infrastructure is added,
* current EC2/Nginx/DuckDNS architecture is preserved,
* ECR is added only after IAM/cost/access planning is approved,
* an ECR lifecycle policy can be used later to avoid stale image buildup.

D3 avoids the larger recurring-cost profile of full ECS/Fargate + ALB while still adding valuable container registry experience.

## 19. Security Boundaries

Do not include or expose:

* AWS account ID,
* EC2 public IP/DNS,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL`,
* full env file contents,
* DuckDNS token,
* Certbot account email,
* private key paths/material,
* IAM role ARN,
* GitHub secrets,
* SSH private key contents,
* screenshots containing account metadata.

Do not recommend:

* printing env files,
* `cat /opt/crm-modern/env/production.env`,
* `docker compose config` with production env,
* `env`.

## 20. What Is Not Implemented Yet

Not implemented yet:

* no ECR repository created,
* no ECR lifecycle policy created,
* no IAM permissions created,
* no GitHub variables/secrets created,
* no backend GitHub Actions workflow created,
* no EC2 deployment script created,
* no Docker deployment changes made,
* no Nginx changes made,
* no RDS changes made,
* no migrations run,
* no production deployment performed.

## 21. Proposed Next Phase 9 Subphases After Decision

Recommended next Phase 9 subphases:

* Phase 9D: ECR Repository and Image Tagging Design
* Phase 9E: Backend ECR IAM/OIDC Access Design
* Phase 9F: Backend Docker Image Build Strategy
* Phase 9G: EC2 ECR Pull/Deploy Mechanism Design
* Phase 9H: Backend Deployment Script Design
* Phase 9I: Backend GitHub Actions Workflow Draft
* Phase 9J: Controlled First Backend ECR-Based Deployment
* Phase 9K: Backend CI/CD Execution Report
* Phase 9L: Backend CI/CD Milestone Summary

## 22. Final Decision Statement

CRM Modern will proceed with Option D3 as the selected backend CI/CD architecture direction:

```text
Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

The project will preserve the current EC2 + Docker + Nginx + Certbot + DuckDNS backend while adding ECR in later approved phases. This keeps `https://aucrm.duckdns.org/api/...` stable, avoids immediate ECS/ALB/NAT Gateway cost, adds job-relevant container registry experience, and leaves a future path open for ECS/Fargate migration.

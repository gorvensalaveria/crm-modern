# CODEX Phase 9J: Backend ECR/IAM/SSM Readiness Execution Planning

## 1. Phase Name and Purpose

Phase 9J plans the required AWS/GitHub readiness work before backend ECR-based CI/CD can be implemented.

This phase is documentation/planning-only. It does not create AWS resources, create an ECR repository, create IAM roles/policies, modify EC2, modify SSM, modify GitHub variables/secrets, create workflows, create deployment scripts, or run commands.

## 2. Why Readiness Execution Planning Is Needed

Backend ECR-based CI/CD depends on several pieces that must be created and verified in the correct order.

Readiness planning is needed to avoid:

* creating overly broad IAM permissions,
* mixing frontend and backend deployment roles,
* pushing images before ECR lifecycle/cost planning,
* creating workflows before secrets/variables are ready,
* attempting deployment before EC2 can pull from ECR,
* using SSM before EC2 readiness is verified,
* deploying before health check and rollback paths are reviewed.

## 3. Current Approved Backend CI/CD Direction

Selected strategy:

```text
Option D3: Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

Current backend architecture remains:

* EC2 + Docker + Nginx + Certbot HTTPS + DuckDNS + private RDS PostgreSQL.

Backend domain:

```text
https://aucrm.duckdns.org
```

Backend API:

```text
https://aucrm.duckdns.org/api/...
```

No backend ECR repository exists yet. No backend IAM/OIDC role exists yet. No EC2 ECR pull role/profile has been created yet. No backend GitHub variables/secrets exist yet. No backend deployment script exists yet. No backend deployment workflow exists yet.

## 4. Readiness Items Overview

Readiness items:

* ECR repository readiness,
* ECR lifecycle policy readiness,
* backend GitHub Actions OIDC role readiness,
* backend ECR push policy readiness,
* EC2 ECR pull access readiness,
* EC2 SSM readiness,
* GitHub variables/secrets readiness,
* backend Docker build verification readiness,
* deployment script readiness,
* backend workflow readiness,
* health check and rollback readiness,
* monitoring readiness from Phase 8.

## 5. Recommended Execution Order

Recommended readiness execution order:

1. Confirm backend ECR repository design.
2. Plan ECR repository creation.
3. Plan ECR lifecycle policy.
4. Plan backend GitHub Actions OIDC role.
5. Plan ECR push permissions for backend GitHub Actions role.
6. Plan EC2 ECR pull access.
7. Plan EC2 SSM readiness.
8. Plan GitHub variables/secrets.
9. Plan Docker build verification.
10. Plan deployment script creation/review.
11. Plan backend workflow creation later.
12. Plan controlled first deployment only after all readiness checks pass.

## 6. ECR Repository Readiness Plan

Future repository name:

```text
crm-modern-backend
```

Future region:

```text
ap-southeast-1
```

Repository purpose:

* backend Docker images only,
* no frontend artifacts,
* no ECS, ALB, or NAT Gateway requirement.

Documentation boundaries:

* do not include full ECR URI,
* do not include AWS account ID,
* do not create the repository in this phase.

## 7. ECR Lifecycle Policy Readiness Plan

Lifecycle policy should reduce stale image buildup.

Recommended later policy direction:

* retain recent images by count, such as 10-20 images,
* protect production-related tags where practical,
* keep `prod-current` and `prod-previous` longer where practical,
* avoid unlimited image retention,
* do not delete previous known-working image immediately.

Do not create lifecycle policy in this phase.

## 8. Backend GitHub Actions OIDC Role Readiness Plan

Future role name to evaluate:

```text
crm-modern-backend-github-actions-oidc-role
```

Role requirements:

* separate from frontend deployment role,
* trust scoped to repo `gorvensalaveria/crm-modern`,
* trust scoped to branch `main`,
* no AWS access keys,
* no full role ARN in documentation.

Do not create IAM role in this phase.

## 9. Backend ECR Push Policy Readiness Plan

Future inline policy name to evaluate:

```text
crm-modern-backend-ecr-push-policy
```

Conceptual push actions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:PutImage
```

Limited read/describe actions if needed:

```text
ecr:DescribeRepositories
ecr:DescribeImages
ecr:BatchGetImage
```

Readiness notes:

* keep repository-scoped where AWS allows,
* `ecr:GetAuthorizationToken` may require broader resource scope,
* avoid broad AWS permissions,
* do not create policy in this phase.

Avoid:

* `AdministratorAccess`,
* broad `*`,
* unrelated S3/CloudFront permissions,
* RDS permissions,
* IAM admin permissions,
* ECS permissions,
* EC2 terminate/modify permissions,
* delete repository permissions.

## 10. EC2 ECR Pull Access Readiness Plan

Preferred future model:

```text
EC2 IAM instance profile/role with ECR pull permissions
```

Conceptual pull actions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:BatchGetImage
ecr:GetDownloadUrlForLayer
ecr:DescribeImages
```

Pull access rules:

* pull role should not push images,
* pull role should not delete images,
* do not store AWS access keys on EC2,
* do not create or attach role/profile in this phase.

## 11. EC2 SSM Readiness Plan

Future goal:

```text
SSM Run Command can execute approved deployment script/commands on EC2
```

Later verification should check:

* EC2 is managed by SSM if required,
* SSM agent readiness,
* IAM permissions needed for SSM command execution,
* command output safety,
* non-interactive deployment script compatibility.

Do not run SSM commands in this phase.

Do not create SSM documents in this phase.

Do not grant broad SSM permissions in this phase.

## 12. GitHub Variables/Secrets Readiness Plan

Future GitHub repository variables:

```text
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=crm-modern-backend
BACKEND_HEALTH_URL=https://aucrm.duckdns.org/api/health
```

`BACKEND_HEALTH_URL` is optional.

Future GitHub repository secret:

```text
BACKEND_AWS_ROLE_TO_ASSUME
```

Rules:

* do not create variables now,
* do not create secrets now,
* do not document full role ARN,
* do not store AWS access keys,
* do not store production env values,
* do not store database credentials,
* do not store DuckDNS token,
* do not store SSH private key.

## 13. Backend Docker Build Verification Readiness Plan

Later readiness work should verify:

* Dockerfile path,
* build context,
* image can build without production secrets,
* image can be tagged as `sha-<short-git-sha>`,
* build does not bake runtime secrets,
* production migrations do not run during image build.

No Docker build is run in this phase.

## 14. Deployment Script Readiness Plan

Deployment script design requirements from Phase 9H:

* explicit image tag,
* reject `latest`,
* pull-before-stop,
* preserve runtime env,
* health check,
* rollback,
* safe logs.

Readiness requirements:

* script must be created and reviewed later,
* script must avoid printing secrets,
* rollback path must be reviewed,
* SSM compatibility should be preserved.

No deployment script is created in this phase.

## 15. Backend Workflow Readiness Plan

Future backend workflow must remain separate from frontend workflow.

Recommended workflow direction:

* manual `workflow_dispatch`,
* v1 build-and-push only,
* v2 deploy through SSM only after readiness is complete,
* no automatic production migrations first,
* no PR-triggered production deployment.

No workflow is created in this phase.

## 16. Health Check and Rollback Readiness Plan

Health endpoint:

```text
https://aucrm.duckdns.org/api/health
```

Rollback readiness:

* rollback target is previous known-working SHA tag,
* `latest` is not a rollback target,
* previous image should not be deleted immediately,
* health check must work before first controlled deployment,
* rollback path must be tested safely later.

## 17. Monitoring Readiness From Phase 8

Phase 8 monitoring should be used after backend deployment.

Readiness checklist:

* Phase 8 alarms are known,
* EC2 status/CPU alarms can be reviewed,
* RDS CPU/storage/connections alarms can be reviewed,
* CloudFront 4xx/5xx alarms can be reviewed where relevant,
* log review path is known.

Do not create new CloudWatch log groups in this phase.

## 18. Manual Validation Checkpoints

Manual validation checkpoints before controlled deployment:

* ECR repository exists.
* Backend OIDC role exists and trust is scoped correctly.
* Backend ECR push policy is repository-limited.
* EC2 pull access is pull-only.
* EC2 SSM readiness is confirmed if SSM is used.
* GitHub variables/secrets are present and safe.
* Docker image build path/context is verified.
* Test image can be built without secrets.
* Test image can be pushed to ECR.
* EC2 can pull image from ECR.
* Deployment script is reviewed.
* Health check works.
* Rollback target is known.
* Phase 8 alarms are monitored after deployment.

## 19. Cost-Control Checkpoints

Cost-control checkpoints:

* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager unless separately approved,
* no CloudWatch log group creation unless separately approved,
* ECR lifecycle policy planned,
* avoid stale image buildup,
* avoid cross-region image pulls,
* keep current EC2/Nginx/DuckDNS architecture,
* keep backend CI/CD manual/controlled first.

## 20. Security Boundaries

Do not include or expose:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL`,
* full env file contents,
* DuckDNS token,
* Certbot account email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents,
* screenshots containing account metadata.

Do not recommend:

* printing env files,
* `cat /opt/crm-modern/env/production.env`,
* `docker compose config` with production env,
* `env`,
* baking secrets into Docker images,
* long-lived AWS access keys,
* `set -x` in deployment scripts.

## 21. What Not to Execute Yet

Do not execute yet:

* ECR repository creation,
* ECR lifecycle policy creation,
* IAM role/policy/instance profile creation,
* EC2 role attachment,
* SSM setup changes,
* SSM command execution,
* GitHub variable creation,
* GitHub secret creation,
* workflow creation,
* deployment script creation,
* Docker image build,
* ECR login,
* image push,
* EC2 image pull,
* container restart,
* production migration,
* production deployment.

## 22. Proposed Next Phase

Recommended next phase:

```text
Phase 9K: Backend ECR/IAM/SSM Readiness Execution Guide
```

Phase 9K should be the first execution guide that gives safe manual AWS/GitHub console steps for creating the required readiness pieces, but still should not perform the final production deployment.

## 23. Final Readiness Recommendation

Recommended readiness posture:

* create readiness pieces in a deliberate order,
* keep backend ECR/IAM/SSM work separate from frontend CI/CD,
* create ECR and IAM only after execution guide approval,
* verify EC2 pull access and SSM readiness before deployment automation,
* create GitHub variables/secrets only after IAM is ready,
* verify Docker build path/context before workflow creation,
* create deployment script before full backend workflow automation,
* perform controlled first deployment only after all readiness checks pass,
* keep current EC2/Nginx/DuckDNS architecture throughout this readiness stage.

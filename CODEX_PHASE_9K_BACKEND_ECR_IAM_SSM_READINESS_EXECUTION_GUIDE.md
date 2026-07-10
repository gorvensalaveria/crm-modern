# CODEX Phase 9K: Backend ECR/IAM/SSM Readiness Execution Guide

## 1. Phase Name and Purpose

Phase 9K provides a safe manual execution guide for setting up the backend ECR/IAM/SSM readiness pieces required before backend ECR-based CI/CD can be implemented.

This phase is documentation/execution-guide-only. It does not execute the guide, create AWS resources, create an ECR repository, create IAM roles/policies, attach EC2 roles, modify SSM, modify GitHub variables/secrets, create workflows, create deployment scripts, or run commands.

## 2. Scope and Non-Goals

Scope:

* document safe manual readiness steps,
* explain what should be created in a later approved manual phase,
* preserve the current backend architecture,
* keep the guide free of private AWS/account details,
* stop before workflow creation or production deployment.

Non-goals:

* no production deployment,
* no Docker image build,
* no ECR push/pull,
* no SSM command execution,
* no backend workflow creation,
* no deployment script creation,
* no ECS, ALB, NAT Gateway, or Secrets Manager setup.

## 3. Required AWS Region

Use:

```text
ap-southeast-1
```

Do not create backend ECR/IAM/SSM readiness resources in other regions unless a later approved phase explicitly changes the target region.

## 4. Manual Execution Sequence Overview

Recommended manual readiness sequence for a later approved execution phase:

1. Create ECR repository.
2. Configure or plan ECR lifecycle policy.
3. Create backend GitHub Actions OIDC IAM role.
4. Attach backend ECR push policy.
5. Plan EC2 ECR pull role/instance profile.
6. Plan or verify EC2 SSM readiness.
7. Plan GitHub variables/secrets.
8. Complete manual validation checklist.

This guide does not perform those steps.

## 5. Step 1: Create ECR Repository Guide

AWS Console path for a later approved manual phase:

```text
AWS Console -> Amazon ECR -> Private registry -> Repositories -> Create repository
```

Repository settings:

* repository name: `crm-modern-backend`,
* repository type: Private,
* region: `ap-southeast-1`,
* purpose: backend Docker images only.

Do not:

* enable public repository,
* use the repository for frontend artifacts,
* create ECS,
* create ALB,
* create NAT Gateway,
* create any always-on service.

Do not document full ECR URI or AWS account ID in reports.

## 6. Step 2: Configure ECR Lifecycle Policy Guide

Lifecycle policy goal:

* avoid stale image buildup,
* keep repository cost and clutter controlled,
* preserve recent rollback targets.

Recommended direction:

* retain recent untagged or old images by count or age,
* retain important production-related tags longer where practical,
* do not delete previous known-working image immediately,
* keep policy simple for beginner maintainability.

Production-related tags to protect where practical:

```text
prod-current
prod-previous
sha-...
```

If exact lifecycle JSON is included in a later phase, mark it as draft and require Architect review before applying.

Do not accidentally delete `prod-current`, `prod-previous`, or recent `sha-...` tags.

Do not create lifecycle policy in this phase.

## 7. Step 3: Create Backend GitHub Actions OIDC IAM Role Guide

Future role name:

```text
crm-modern-backend-github-actions-oidc-role
```

Requirements:

* must be separate from frontend role,
* must use existing GitHub OIDC provider if already present,
* must be scoped to the approved repository and branch.

Trust boundary:

```text
repo: gorvensalaveria/crm-modern
branch: main
```

Do not allow:

* all repositories,
* all branches,
* pull request contexts for production deployment access.

Do not include:

* full role ARN,
* AWS account ID.

Do not create IAM role in this phase.

## 8. Step 4: Attach Backend ECR Push Policy Guide

Future inline policy name:

```text
crm-modern-backend-ecr-push-policy
```

Purpose:

* allow GitHub Actions backend role to push images to `crm-modern-backend`.

Conceptual allowed actions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:PutImage
ecr:DescribeRepositories
ecr:DescribeImages
ecr:BatchGetImage
```

Policy guidance:

* keep repository-scoped where AWS allows,
* note that `ecr:GetAuthorizationToken` commonly requires broader resource scope,
* do not grant delete repository permission,
* do not grant delete image permission unless lifecycle/cleanup is separately approved.

Avoid:

* `AdministratorAccess`,
* broad `*`,
* IAM admin,
* RDS permissions,
* unrelated S3/CloudFront permissions,
* ECS permissions,
* EC2 terminate/modify permissions.

Do not create policy in this phase.

## 9. Step 5: Plan EC2 ECR Pull Role/Instance Profile Guide

Preferred future model:

```text
EC2 IAM role/instance profile with ECR pull-only permissions
```

Purpose:

* allow EC2 to pull backend images from ECR without long-lived AWS keys.

Conceptual pull actions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:BatchGetImage
ecr:GetDownloadUrlForLayer
ecr:DescribeImages
```

Rules:

* pull role must not push images,
* pull role must not delete images,
* do not store AWS access keys on EC2,
* attaching or modifying EC2 instance profile should be reviewed carefully before execution.

Do not expose EC2 instance ID.

Do not create or attach EC2 role/profile in this phase.

## 10. Step 6: Plan or Verify EC2 SSM Readiness Guide

Goal:

```text
EC2 can eventually receive SSM Run Command for controlled deployment.
```

Later verification should check:

* SSM agent status or managed instance visibility,
* IAM permissions for SSM,
* command output safety,
* deployment script non-interactive compatibility.

Do not:

* run SSM command in this phase,
* create SSM document in this phase,
* grant broad SSM command permissions yet.

## 11. Step 7: Plan GitHub Variables/Secrets Guide

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

* do not create variables/secrets unless a later execution phase explicitly approves,
* do not document the full role ARN,
* do not store AWS access keys,
* do not store production env values,
* do not store database credentials,
* do not store DuckDNS token,
* do not store SSH private key.

## 12. Step 8: Manual Validation Checklist

Manual validation checklist for a later execution phase:

* ECR repository exists in correct region.
* Lifecycle policy is reviewed and safe.
* Backend OIDC role exists and is separate from frontend role.
* Trust policy is scoped to repo and main branch.
* Backend ECR push policy is limited.
* EC2 pull role is pull-only.
* No AWS access keys were created.
* SSM readiness is understood or verified later.
* GitHub variables/secrets are planned safely.
* No workflows were created yet.
* No production deployment occurred.
* Current backend remains available at `https://aucrm.duckdns.org/api/health`.

## 13. Safety Review Before Any Workflow/Deployment

Before creating a workflow or deploying:

* Docker build path still needs verification.
* Deployment script still needs creation/review.
* EC2 pull test still needs a controlled plan.
* Backend workflow should still start as build-and-push-only.
* First production deployment still requires separate approval.

## 14. Cost-Control Checklist

Cost-control checklist:

* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager unless separately approved,
* no CloudWatch log group creation unless separately approved,
* ECR repository only when approved,
* lifecycle policy should prevent stale image buildup,
* keep current EC2/Nginx/DuckDNS architecture,
* avoid always-on new services.

## 15. Security Boundaries

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

## 16. What Not to Execute Yet

Do not execute yet:

* create resources from this guide,
* create ECR repository,
* create lifecycle policy,
* create IAM role/policy/instance profile,
* attach EC2 role,
* modify SSM,
* run SSM command,
* create GitHub variables/secrets,
* create workflow,
* create deployment script,
* build Docker image,
* login to ECR,
* push image,
* pull image on EC2,
* restart container,
* run migrations,
* deploy production.

## 17. Expected Completion Report Format

Expected completion report for a later manual execution phase:

* files created/modified,
* summary of guide contents,
* any assumptions documented,
* current `git status --short`.

If resources are created in a later manual execution phase, that report should also summarize created resources without exposing account metadata or secrets.

## 18. Proposed Next Phase

Recommended next phase:

```text
Phase 9L: Backend ECR/IAM/SSM Readiness Manual Execution
```

Phase 9L would be the first phase where the user may manually create approved readiness resources.

Phase 9L should still not perform production deployment and should stop before creating the backend deployment workflow or running a production deploy.

## 19. Final Execution-Guide Recommendation

Recommended readiness execution posture:

* create only the readiness resources approved for the next manual phase,
* keep backend readiness separate from frontend CI/CD,
* keep resources in `ap-southeast-1`,
* keep ECR private and backend-only,
* use separate backend OIDC role,
* keep EC2 pull access pull-only,
* avoid long-lived AWS access keys,
* avoid broad IAM permissions,
* avoid ECS/ALB/NAT Gateway,
* keep current EC2/Nginx/DuckDNS backend architecture,
* stop before workflow creation or production deployment.

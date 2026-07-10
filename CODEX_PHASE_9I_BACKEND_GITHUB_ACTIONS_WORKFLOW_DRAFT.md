# CODEX Phase 9I: Backend GitHub Actions Workflow Draft

## 1. Phase Name and Purpose

Phase 9I drafts the future backend GitHub Actions workflow that will eventually build the backend Docker image, tag it, push it to ECR, and later trigger the approved EC2 deployment path.

This phase is documentation/draft-only. It does not create or modify GitHub Actions workflow files, create deployment scripts, modify source code, modify Dockerfiles, modify package files, modify AWS, or touch production.

## 2. Why a Backend Workflow Draft Is Needed

Backend deployment is riskier than frontend static deployment because it can affect the running API container, runtime configuration, health checks, rollback, and database migration timing.

A workflow draft is needed before implementation so the project can define:

* manual trigger behavior,
* CI checks before image publishing,
* Docker image build and tagging,
* AWS OIDC authentication,
* ECR login/push behavior,
* future SSM deployment trigger,
* health and rollback integration,
* production migration boundaries,
* safe logging rules.

## 3. Current Backend CI/CD Direction

Selected strategy:

```text
Option D3: Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

Phase 9D designed:

* ECR repository name: `crm-modern-backend`
* Region: `ap-southeast-1`
* Primary image tag: `sha-<short-git-sha>`
* Optional tags: `prod-current`, `prod-previous`, `manual-YYYYMMDD-HHMM`

Phase 9E designed:

* separate backend GitHub Actions OIDC role,
* ECR push permissions for GitHub Actions,
* ECR pull permissions for EC2/deployment mechanism,
* frontend/backend IAM separation.

Phase 9F designed:

* backend Docker image build strategy,
* GitHub Actions as future image builder,
* production secrets must not be baked into images,
* production migrations must not run during image build.

Phase 9G designed:

* prefer SSM Run Command as future controlled execution mechanism,
* prefer EC2 IAM instance profile/role for ECR pull access if practical,
* avoid GitHub Actions SSH as primary method,
* avoid self-hosted runner on production EC2.

Phase 9H designed:

* future EC2 deployment script logic,
* explicit SHA tag input,
* reject `latest`,
* pull before stop,
* preserve runtime env,
* health check and rollback,
* SSM Run Command compatibility.

## 4. Relationship to Existing Frontend Workflow

The existing frontend deployment workflow already uses GitHub Actions OIDC for S3/CloudFront.

The backend workflow must be separate from the frontend workflow because backend deployment has different risks and permissions.

Frontend workflow:

* deploys static frontend files,
* invalidates CloudFront,
* uses frontend-specific AWS permissions.

Future backend workflow:

* builds backend Docker image,
* pushes image to ECR,
* eventually triggers a controlled backend deployment path,
* must use separate backend AWS permissions.

Do not reuse the frontend role for backend ECR deployment.

## 5. Workflow Trigger Design

Recommended trigger:

```text
workflow_dispatch
```

Design rules:

* create a separate backend workflow later,
* prefer manual trigger first,
* do not auto-deploy backend on every push at first,
* PR-triggered production deployment must not be allowed,
* workflow should initially be controlled and manually triggered.

Recommended future workflow name to evaluate:

```text
Deploy Backend to ECR and EC2
```

Recommended future workflow file name to evaluate:

```text
.github/workflows/deploy-backend.yml
```

Do not create this workflow file in Phase 9I.

## 6. Required Future Repository Variables/Secrets

Future GitHub repository variables to plan:

```text
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=crm-modern-backend
```

Optional later variable:

```text
BACKEND_HEALTH_URL=https://aucrm.duckdns.org/api/health
```

Optional later SSM-related variable:

```text
BACKEND_SSM_DOCUMENT_NAME
```

Future GitHub repository secret to plan:

```text
BACKEND_AWS_ROLE_TO_ASSUME
```

Rules:

* do not create variables now,
* do not create secrets now,
* do not document full role ARN,
* do not store AWS access keys,
* do not store database secrets,
* do not store production env values.

## 7. Workflow Permissions Design

Future workflow permissions should use:

```yaml
permissions:
  id-token: write
  contents: read
```

Design rules:

* avoid broad permissions,
* do not grant unnecessary repository permissions,
* do not grant production deployment permissions to pull request workflows,
* use backend OIDC role only,
* do not reuse frontend role.

## 8. Job Structure Overview

Conceptual future job structure:

1. Checkout repository.
2. Set up Node/build dependencies as needed.
3. Run existing CI checks where practical.
4. Compute image tag: `sha-<short-git-sha>`.
5. Build backend Docker image using approved Dockerfile/build context.
6. Configure AWS credentials using OIDC.
7. Login to ECR.
8. Push image to ECR with immutable SHA tag.
9. Optionally tag `prod-current` only after deployment is verified later.
10. Future deployment step: trigger SSM Run Command with explicit image tag only after deployment mechanism is approved.
11. Verify `https://aucrm.duckdns.org/api/health`.
12. Use rollback path if deployment fails, once rollback is implemented.

## 9. CI/Checks Before Image Publishing

Workflow should build and push image only after CI checks pass.

Checks to reuse where practical:

* typecheck,
* tests,
* build.

Guidance:

* prefer passing checks before publishing deploy image,
* do not weaken existing CI,
* do not use production database for CI tests,
* do not use production secrets in CI image build.

## 10. Docker Image Build Step Design

Docker build guidance:

* exact Dockerfile path and build context must be verified later,
* do not bake runtime secrets into image,
* do not pass production secrets as build args,
* do not include `.env` files in image,
* do not include production env in GitHub Actions logs,
* production migrations must not run during image build.

The workflow draft should remain conceptual until Dockerfile/build context verification is completed.

## 11. Image Tagging Design

Primary image tag:

```text
sha-<short-git-sha>
```

Optional later tags:

```text
manual-YYYYMMDD-HHMM
prod-current
prod-previous
```

Avoid relying on:

```text
latest
```

Rules:

* `prod-current` should only be updated after deployment succeeds, if used later,
* rollback should use immutable SHA tags,
* workflow should compute the SHA tag consistently.

## 12. AWS OIDC Authentication Design

Future backend workflow should authenticate to AWS with GitHub Actions OIDC.

Design rules:

* use backend OIDC role only,
* do not reuse frontend role,
* do not use long-lived AWS access keys,
* keep trust scoped to approved repository/branch,
* do not expose role ARN in documentation.

## 13. ECR Login and Push Design

ECR push guidance:

* workflow should push only to `crm-modern-backend`,
* keep region `ap-southeast-1`,
* use backend OIDC role only,
* do not include full ECR URI in public docs,
* do not include AWS account ID,
* do not echo credentials or auth tokens.

Future push behavior:

* login to ECR,
* push immutable SHA tag,
* optionally push additional manual tag if approved,
* do not push `latest` as primary production tag.

## 14. Deployment Trigger Design

Important draft guidance:

* consider splitting workflow into phases,
* workflow v1: build and push to ECR only,
* workflow v2: build, push, then manually trigger EC2 deploy through SSM.

This reduces risk because ECR image publishing and production deployment are separate concerns.

Do not deploy automatically before first controlled backend deployment.

## 15. SSM Run Command Integration Planning

Future deployment step should call SSM only after:

* EC2 has SSM readiness,
* EC2 has ECR pull access,
* deployment script exists and is reviewed,
* rollback path is tested,
* manual approval/control is defined.

SSM command should pass explicit image tag.

SSM output must not expose secrets.

Do not design broad SSM permissions now.

Do not create SSM document or command in Phase 9I.

## 16. Health Check and Rollback Integration Planning

Health endpoint:

```text
https://aucrm.duckdns.org/api/health
```

Workflow should treat health failure as deployment failure.

Rollback should be triggered by the EC2-side deployment script or controlled deployment mechanism, not by ad hoc GitHub SSH.

Rollback target should be previous known-working SHA tag.

Do not roll back database migrations automatically.

## 17. Production Migration Handling

First backend workflow should not run migrations automatically.

Migrations may be added later as an explicit reviewed step.

Production migrations must use:

```text
prisma migrate deploy
```

Production must not use:

```text
prisma db push
prisma migrate dev
```

Database rollback is harder than app rollback.

## 18. Safe Logging/Output Rules

Workflow logs may show:

* safe step names,
* image tag,
* repository name,
* region,
* success/failure status.

Workflow logs must not show:

* AWS account ID,
* full ECR URI if avoidable in docs,
* IAM role ARN,
* database credentials,
* `DATABASE_URL`,
* env file contents,
* production secrets,
* DuckDNS token,
* private IPs,
* RDS endpoint,
* SSH key material.

Do not:

* use debug logging that prints secrets,
* echo secrets,
* use `set -x` in deployment scripts.

## 19. Security Boundaries

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

## 20. Cost-Control Boundaries

Cost-control boundaries:

* draft-only,
* no workflow creation,
* no GitHub Actions runs,
* no ECR creation,
* no ECR image storage,
* no IAM creation,
* no SSM setup,
* no CloudWatch log group creation,
* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager,
* no production deployment,
* keep current EC2/Nginx/DuckDNS architecture.

## 21. What Must Exist Before Workflow Creation

Before creating the backend workflow:

* ECR repository approved and created,
* backend OIDC IAM role approved and created,
* GitHub variables/secrets approved and created,
* Dockerfile/build context verified,
* backend image build verified safely,
* EC2 ECR pull access approved and created,
* deployment script designed, created, and reviewed,
* SSM readiness verified if SSM is used,
* health check and rollback path reviewed,
* manual first deployment plan approved.

## 22. What Not to Create or Modify Yet

Do not create or modify:

* workflow file,
* deployment script,
* source code,
* Dockerfile,
* `.dockerignore`,
* package files,
* GitHub variables/secrets,
* AWS resources,
* IAM role/policy/instance profile,
* ECR repository,
* SSM,
* EC2,
* Docker,
* Nginx,
* Certbot,
* DuckDNS,
* RDS.

Do not perform:

* Docker image build,
* ECR login,
* image push,
* SSM command,
* image deployment,
* container restart,
* production migration.

## 23. Proposed Next Phase

Ask ChatGPT Architect which next phase is preferred after Phase 9I:

```text
Phase 9J: Backend ECR/IAM/SSM Readiness Execution Planning
```

or:

```text
Phase 9J: Controlled First Backend ECR-Based Deployment Planning
```

## 24. Final Draft Recommendation

Recommended backend workflow draft direction:

* create a separate backend workflow later,
* use `workflow_dispatch` manual trigger first,
* use `id-token: write` and `contents: read`,
* require CI/checks before image publishing,
* compute `sha-<short-git-sha>` image tag,
* build backend Docker image only after Dockerfile/build context verification,
* authenticate with backend GitHub Actions OIDC role,
* push image to `crm-modern-backend` in `ap-southeast-1`,
* avoid `latest` as production deployment tag,
* start with build-and-push-only workflow if needed,
* add SSM deployment trigger only after ECR, IAM, EC2 pull access, deployment script, health check, rollback, and manual approval path are ready,
* do not run production migrations automatically in the first backend workflow.

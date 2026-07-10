# CODEX Phase 9S: Backend ECR Build-and-Push Workflow Planning

## 1. Phase Name and Purpose

Phase 9S plans a future backend GitHub Actions workflow that builds the backend Docker image and pushes it to Amazon ECR.

This phase is planning/documentation-only. It does not create GitHub Actions workflow files, create GitHub variables/secrets, run Docker, build images, log in to ECR, push images, pull images, modify AWS, run SSM, SSH, deploy, or touch production.

## 2. Current Readiness Context

Phase 9L completed backend ECR and GitHub Actions OIDC readiness:

* private ECR repository created: `crm-modern-backend`
* backend GitHub Actions OIDC role created
* backend ECR push policy attached
* backend ECR push policy is push-only with no delete/admin permissions

Phase 9N completed EC2 ECR pull and SSM readiness:

* EC2 pull/SSM role created
* EC2 role attached to production EC2
* EC2 has ECR pull-only access
* SSM managed node visible and online
* backend health remained working

Phase 9O reviewed backend Docker build shape:

* backend Dockerfile path: `server/Dockerfile`
* build context: repo root `.`
* Dockerfile runs `npm ci`, Prisma generate, shared build, and server build
* Dockerfile does not run migrations
* Dockerfile does not copy production env files

Phase 9P tightened `.dockerignore`:

* frontend source excluded while preserving `client/package.json`
* `.env.*` excluded
* docs/reports/local-only files excluded

Phase 9R completed controlled local build validation:

* local Docker build succeeded
* local image tag created: `crm-modern-backend:local-build-test`
* `npm ci` completed
* Prisma generate completed
* shared build completed
* server build completed
* no migration command appeared
* no `DATABASE_URL` value printed or required
* no secret-looking value printed
* no ECR push
* no EC2 pull
* no SSM command
* no deployment

## 3. Planned Workflow Scope

Planned workflow scope:

```text
build backend Docker image -> push image to ECR -> stop
```

The workflow must not deploy production.

It must not:

* pull image on EC2,
* run SSM,
* SSH,
* restart containers,
* run Prisma migrations,
* use production env files,
* pass `DATABASE_URL`,
* use `latest`,
* modify production infrastructure.

## 4. Recommended Workflow Name and Path

Recommended future workflow name:

```text
Deploy Backend Image to ECR
```

Recommended future workflow file path:

```text
.github/workflows/deploy-backend-image.yml
```

Do not create this workflow file in Phase 9S.

## 5. Recommended Trigger

Recommended trigger:

```text
workflow_dispatch
```

The first backend image publishing workflow should be manual-only.

Do not trigger backend image publishing automatically on every push yet.

## 6. Why Manual Trigger Is Safer for Now

Manual `workflow_dispatch` is safer because backend image publishing is closer to production deployment than frontend static publishing.

Manual trigger allows the user to:

* choose when an image is published,
* confirm CI/readiness context before publishing,
* avoid accidental backend image churn,
* review build logs before later deployment phases,
* keep image publishing separate from runtime replacement.

Push-triggered backend publishing can be revisited after the build, push, deploy, health check, and rollback paths are mature.

## 7. Required GitHub Variables and Secret

Required GitHub repository variables:

```text
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=crm-modern-backend
```

Required GitHub repository secret:

```text
AWS_BACKEND_ROLE_TO_ASSUME
```

Secret purpose:

* contains the backend OIDC role ARN,
* used by GitHub Actions to assume the backend ECR push role.

Do not document the actual secret value.

Do not use long-lived AWS access keys.

## 8. Recommended Workflow Permissions

Recommended permissions block:

```yaml
permissions:
  id-token: write
  contents: read
```

These permissions support GitHub OIDC and repository checkout while avoiding broad repository permissions.

## 9. Recommended High-Level Workflow Steps

Recommended future workflow steps:

1. Checkout repository.
2. Configure AWS credentials using OIDC and `AWS_BACKEND_ROLE_TO_ASSUME`.
3. Log in to Amazon ECR.
4. Compute short git SHA.
5. Build backend Docker image using `server/Dockerfile`.
6. Tag image as `sha-<short-sha>`.
7. Push `sha-<short-sha>` image to ECR.
8. Print only non-secret image tag summary.
9. Stop.

No deployment step should be included.

## 10. Docker Build Plan

Planned Dockerfile:

```text
server/Dockerfile
```

Planned build context:

```text
.
```

Conceptual build command shape:

```text
docker build -f server/Dockerfile -t <ecr-registry>/<repo>:sha-<short-sha> .
```

Do not document the full ECR URI in public project docs.

The workflow should not pass production build args.

The workflow should not provide `DATABASE_URL`.

## 11. Image Tagging Plan

Required image tag:

```text
sha-<short-git-sha>
```

Avoid:

```text
latest
```

Optional future manual tag:

```text
manual-YYYYMMDD-HHMM
```

The optional manual tag should be added only if it is useful and approved later. The SHA tag should remain the primary immutable deployment and rollback anchor.

## 12. Why SHA Tags Are Preferred Over Latest

SHA tags are preferred because they:

* identify the exact source commit,
* support rollback to a known image,
* avoid ambiguity,
* make audit trails easier,
* match the Phase 9D image tagging design.

`latest` is not suitable as the production deployment tag because it can change meaning over time and does not clearly identify what code is running.

## 13. ECR Lifecycle Policy Interaction

The existing ECR lifecycle policy keeps recent `sha-*` images and expires untagged images after a short retention window.

This supports the planned workflow because:

* each workflow run publishes a `sha-*` image,
* recent immutable images remain available for rollback,
* stale images are controlled over time,
* untagged image buildup is reduced.

Future deployment phases should still avoid deleting the currently deployed and previous known-good image tags prematurely.

## 14. Why Build-and-Push Is Separate From Deployment

Build-and-push should remain separate from deployment because publishing an image is lower risk than replacing the running API container.

Separation keeps these concerns distinct:

* image build correctness,
* ECR authentication and push behavior,
* EC2 pull behavior,
* container replacement,
* health checks,
* rollback,
* production migrations.

This workflow should stop after ECR push so deployment can be designed, reviewed, and tested separately.

## 15. Prisma and Migration Boundaries

The Dockerfile may run Prisma generate during image build.

The workflow must not run:

```text
prisma migrate deploy
prisma db push
prisma migrate dev
```

The workflow must not run production migrations.

The workflow must not provide production database credentials or `DATABASE_URL`.

Production migrations must remain a later deployment-time design decision.

## 16. Secret-Safe Logging

Workflow logs may show:

* safe step names,
* short SHA tag,
* repository variable names,
* success/failure status,
* non-secret image tag summary.

Workflow logs must not show:

* AWS account ID,
* full ECR URI if avoidable in docs,
* IAM role ARN,
* AWS credentials,
* GitHub secrets,
* database credentials,
* `DATABASE_URL` value,
* env file contents,
* RDS endpoint,
* EC2 identifiers,
* private IPs.

Avoid:

```text
set -x
env
docker compose config
```

Do not echo secrets.

## 17. Failure Handling

If workflow build or push fails:

* stop the workflow,
* do not deploy,
* do not trigger SSM,
* do not SSH,
* do not retry by adding production secrets,
* document a sanitized error summary,
* propose a fix in a later approved phase.

Failure categories to document later:

* OIDC credential failure,
* ECR login failure,
* Docker build failure,
* Docker push failure,
* secret-safety concern in logs.

## 18. What Should Be Verified After First Push

After the first approved ECR push, verify:

* workflow completed successfully,
* pushed tag follows `sha-<short-sha>`,
* image appears in `crm-modern-backend`,
* no `latest` tag was required,
* no secret values appeared in logs,
* no migration commands appeared in logs,
* no deployment step ran,
* no EC2 pull occurred,
* no SSM command ran,
* no production service changed.

Do not document full ECR URI or AWS account metadata.

## 19. What Must Wait for Later Deployment Phases

Later phases must handle:

* EC2 image pull,
* SSM Run Command design,
* deployment script creation,
* container replacement,
* runtime env preservation,
* health checks,
* rollback,
* production migration strategy,
* production deployment execution report.

Do not include these in the build-and-push workflow.

## 20. Required Stop Boundaries

The future workflow must stop after pushing the `sha-<short-sha>` image.

Stop before:

* EC2 pull,
* SSM command,
* SSH command,
* Docker container restart,
* Nginx reload,
* Certbot action,
* DuckDNS change,
* RDS change,
* Prisma migration,
* production deployment.

## 21. What Not to Create Yet

Do not create yet:

* `.github/workflows/deploy-backend-image.yml`,
* GitHub variables,
* GitHub secrets,
* deployment script,
* SSM document,
* production deployment workflow.

Do not run:

* Docker build,
* ECR login,
* image push,
* EC2 pull,
* SSM command,
* Prisma command,
* migration.

## 22. Security Boundaries

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
* env file contents,
* DuckDNS token,
* Certbot email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents.

## 23. Proposed Next Phase

Recommended next phase:

```text
Phase 9T: Backend GitHub Variables and Secret Setup Guide
```

Phase 9T should guide manual creation of the GitHub variables and secret required by the future backend ECR workflow:

* `AWS_REGION`
* `ECR_REPOSITORY`
* `AWS_BACKEND_ROLE_TO_ASSUME`

Phase 9T should not create the workflow, push an image, or deploy production.

## 24. Final Planning Recommendation

Recommended future backend ECR workflow:

* manual-only trigger with `workflow_dispatch`,
* uses GitHub OIDC, not AWS access keys,
* assumes the backend OIDC role,
* logs in to Amazon ECR,
* builds from `server/Dockerfile` with repo-root context,
* tags image as `sha-<short-git-sha>`,
* pushes the SHA-tagged image to ECR,
* prints only a non-secret image tag summary,
* stops immediately after push,
* does not deploy, pull on EC2, run SSM, restart containers, or run migrations.

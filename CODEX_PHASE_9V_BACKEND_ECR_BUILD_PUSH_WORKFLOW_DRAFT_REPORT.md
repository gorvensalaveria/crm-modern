# CODEX Phase 9V: Backend ECR Build-and-Push Workflow Draft Report

## 1. Phase Name and Purpose

Phase 9V creates the backend GitHub Actions workflow file for manually building the backend Docker image and pushing it to Amazon ECR.

This phase creates the workflow draft only. It does not run the workflow, run Docker locally, push images locally, modify AWS, use SSM, SSH, deploy, restart containers, run Prisma commands, run migrations, or touch production.

## 2. Workflow File Created

Workflow file created:

```text
.github/workflows/deploy-backend-image.yml
```

Workflow name:

```text
Deploy Backend Image to ECR
```

Existing frontend workflow files were not modified.

## 3. Workflow Trigger

Workflow trigger:

```text
workflow_dispatch
```

The workflow is manual-only.

It does not include:

* push trigger,
* pull request trigger,
* schedule trigger.

## 4. OIDC Authentication Design

The workflow uses GitHub OIDC through:

```text
aws-actions/configure-aws-credentials
```

It references:

```text
secrets.AWS_BACKEND_ROLE_TO_ASSUME
vars.AWS_REGION
```

The workflow does not use long-lived AWS access keys.

No IAM role ARN is documented in this report.

## 5. ECR Login Step

The workflow logs in to Amazon ECR through:

```text
aws-actions/amazon-ecr-login
```

The login step output is used internally by later build/push steps.

The report does not include the full ECR URI or AWS account ID.

## 6. Image Tag Behavior

The workflow computes a short Git SHA:

```text
SHORT_SHA="${GITHUB_SHA::7}"
```

It builds the image tag:

```text
IMAGE_TAG="sha-${SHORT_SHA}"
```

The workflow does not use:

```text
latest
```

The SHA tag remains the immutable image identifier for later deployment and rollback planning.

## 7. Docker Build Command Shape

The workflow builds the backend image using:

```text
docker build -f server/Dockerfile -t "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}" .
```

Build details:

* Dockerfile: `server/Dockerfile`
* build context: repo root `.`
* repository variable: `vars.ECR_REPOSITORY`
* region variable: `vars.AWS_REGION`

The workflow does not pass `DATABASE_URL` and does not use production env files.

## 8. Docker Push Command Shape

The workflow pushes the backend image using:

```text
docker push "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
```

The workflow pushes only the SHA-tagged image.

It does not push `latest`.

## 9. Explicit No-Deployment Boundaries

The workflow stops after ECR push.

It does not include:

* SSM commands,
* SSH commands,
* EC2 image pull,
* container restart,
* Nginx reload,
* Certbot action,
* DuckDNS change,
* RDS change,
* Prisma migration command,
* deployment script execution,
* production deployment.

## 10. Secret-Safe Logging Notes

The workflow summary prints only:

* non-secret repository name,
* SHA image tag.

The workflow does not intentionally print:

* role ARN,
* AWS account ID,
* full ECR URI in this report,
* AWS credentials,
* GitHub secrets,
* database credentials,
* `DATABASE_URL`,
* env file contents,
* RDS endpoint,
* EC2 identifiers,
* private IPs.

The workflow does not use:

```text
set -x
env
docker compose config
```

## 11. What Was Not Done

The following were intentionally not done:

* no workflow run,
* no GitHub Actions manual run,
* no local Docker build,
* no local ECR login,
* no local image push,
* no image pull,
* no AWS modification,
* no GitHub variables/secrets creation,
* no GitHub settings modification,
* no SSM command,
* no SSH,
* no deployment,
* no container restart,
* no Prisma command,
* no migration,
* no env file inspection,
* no source code modification,
* no Dockerfile modification,
* no `.dockerignore` modification,
* no package file modification,
* no frontend workflow modification,
* no staging, commit, or push.

## 12. Security Boundaries Confirmed

This report does not include:

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

## 13. Current Git Status

Current git status should be captured after this report is created using:

```text
git status --short
```

## 14. Next Recommended Phase

Recommended next phase:

```text
Phase 9W: Backend ECR Build-and-Push Workflow Review
```

Phase 9W should review the workflow file before any workflow run. It should confirm the trigger, OIDC usage, tag behavior, no-deployment boundaries, and secret-safe logging.

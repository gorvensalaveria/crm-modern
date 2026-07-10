# CODEX Phase 9W: Backend ECR Build-and-Push Workflow Review

## 1. Phase Name and Purpose

Phase 9W reviews the drafted backend GitHub Actions workflow for syntax, safety, permissions, secret handling, ECR push behavior, and no-deployment boundaries before any controlled workflow execution.

This phase is review/documentation-only. It does not modify the workflow, run the workflow, run Docker, push images, modify AWS, use SSM, SSH, deploy, or touch production.

## 2. Workflow File Reviewed

Workflow file reviewed:

```text
.github/workflows/deploy-backend-image.yml
```

Workflow exists at the expected path.

## 3. Workflow Name

Configured workflow name:

```text
Deploy Backend Image to ECR
```

Result:

```text
pass
```

## 4. Trigger Review

Configured trigger:

```text
workflow_dispatch
```

Result:

```text
pass
```

The workflow does not include:

* push trigger,
* pull request trigger,
* schedule trigger.

## 5. Permissions Review

Configured permissions:

```yaml
permissions:
  id-token: write
  contents: read
```

Result:

```text
pass
```

These permissions are appropriate for GitHub OIDC and repository checkout without granting broad repository permissions.

## 6. OIDC Authentication Review

AWS credential configuration uses:

```text
aws-actions/configure-aws-credentials
```

It references:

```text
secrets.AWS_BACKEND_ROLE_TO_ASSUME
vars.AWS_REGION
```

Result:

```text
pass
```

The workflow does not use long-lived AWS access keys.

No IAM role ARN is documented in this report.

## 7. ECR Login Review

ECR login uses:

```text
aws-actions/amazon-ecr-login
```

Result:

```text
pass
```

The login output is used internally as the ECR registry value for build and push steps.

## 8. Image Tag Behavior Review

The workflow computes:

```text
SHORT_SHA="${GITHUB_SHA::7}"
IMAGE_TAG="sha-${SHORT_SHA}"
```

Result:

```text
pass
```

The workflow uses `sha-<short-sha>` tag behavior.

The workflow does not use:

```text
latest
```

## 9. Docker Build Command Review

Docker build command shape:

```text
docker build -f server/Dockerfile -t "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}" .
```

Result:

```text
pass
```

Confirmed:

* Dockerfile: `server/Dockerfile`
* build context: repo root `.`
* image tag: `sha-<short-sha>`

## 10. Docker Push Command Review

Docker push command shape:

```text
docker push "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
```

Result:

```text
pass
```

The workflow pushes the SHA-tagged image only.

It does not push `latest`.

## 11. Summary and Logging Review

The explicit summary step prints:

* backend image pushed message,
* repository name,
* SHA image tag.

Result:

```text
pass
```

The explicit summary step does not print:

* role ARN,
* AWS account ID,
* full ECR URI,
* GitHub secrets,
* env contents,
* database values,
* sensitive infrastructure values.

Non-blocking observation:

* Docker and ECR action logs may naturally include registry-related details during image build or push. The workflow does not explicitly echo those values in the custom summary, but first-run logs should still be reviewed for acceptable exposure before broader use.

## 12. No-Deployment Boundary Review

The workflow does not include:

* SSM,
* SSH,
* EC2 pull,
* container restart,
* Docker Compose,
* Prisma migration command,
* `DATABASE_URL`,
* production env file usage,
* AWS access keys,
* `set -x`,
* env printing,
* deployment script,
* frontend workflow changes.

Result:

```text
pass
```

The workflow stops after ECR push.

## 13. Required Variables and Secret Before Run

Required before a controlled first run:

```text
AWS_REGION
ECR_REPOSITORY
AWS_BACKEND_ROLE_TO_ASSUME
```

Phase 9U confirmed these were created or verified manually.

Actual secret value is intentionally not documented.

## 14. Syntax and Safety Issues

Blocking syntax or safety issues:

```text
none
```

The workflow structure is valid for the intended GitHub Actions use case based on review.

## 15. Review Conclusion

Workflow ready for controlled first run after commit/push:

```text
yes
```

Blocking issues:

```text
none
```

Non-blocking observations:

* First-run logs should be reviewed for any registry/account metadata that may be produced by standard Docker/ECR action output.
* The workflow should remain manual-only until backend deployment, rollback, and health-check paths are separately approved.

## 16. Required Before Run

Before GitHub can run this workflow:

* commit workflow and related approved files,
* push to `main`,
* manually run `workflow_dispatch` only after Architect approval.

Do not run the workflow before the approved commit/push phase is complete.

## 17. Still Forbidden During First Run

Still forbidden during first run:

* no EC2 pull,
* no SSM,
* no deployment,
* no container restart,
* no migrations,
* no SSH,
* no production env files,
* no `DATABASE_URL`,
* no `latest` tag.

The first run should build and push the SHA-tagged backend image only, then stop.

## 18. What Was Not Done

The following were intentionally not done:

* no workflow modification,
* no source code modification,
* no Dockerfile modification,
* no `.dockerignore` modification,
* no package file modification,
* no GitHub variables/secrets creation,
* no GitHub settings modification,
* no workflow run,
* no GitHub Actions manual run,
* no Docker command,
* no image build,
* no ECR login,
* no image push,
* no image pull,
* no AWS modification,
* no SSM command,
* no SSH,
* no deployment,
* no container restart,
* no Prisma command,
* no migration,
* no env file inspection,
* no staging, commit, or push.

## 19. Security Boundaries Confirmed

This review does not include:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL` value,
* env file contents,
* DuckDNS token,
* Certbot email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents.

## 20. Proposed Next Phase

Recommended next phase:

```text
Phase 9X: Commit Backend ECR Workflow and Phase 9O-9W Documentation
```

Phase 9X should:

* stage only approved Phase 9O-9W files, `.dockerignore`, and backend workflow,
* commit,
* push,
* not run the workflow unless separately approved.

## 21. Current Git Status

Current git status should be captured after this review is created using:

```text
git status --short
```

# CODEX Phase 9T: Backend GitHub Variables and Secret Setup Guide

## 1. Phase Name and Purpose

Phase 9T provides a manual setup guide for the GitHub repository variables and secret required by the future backend ECR build-and-push workflow.

This phase is documentation/guide-only. It does not create GitHub variables or secrets, create workflows, run workflows, build images, push images, modify AWS, or deploy production.

## 2. Current Backend Workflow Planning Context

Phase 9S planned a future backend GitHub Actions workflow:

* workflow name: `Deploy Backend Image to ECR`
* future workflow path: `.github/workflows/deploy-backend-image.yml`
* trigger: `workflow_dispatch` only
* authentication: GitHub OIDC
* backend Dockerfile: `server/Dockerfile`
* build context: repo root `.`
* image tag: `sha-<short-git-sha>`
* push target: `crm-modern-backend`
* stop after ECR push

The future workflow must not deploy, pull on EC2, run SSM, restart containers, run Prisma migrations, use production env files, or pass `DATABASE_URL`.

No backend workflow file has been created yet. No backend image has been pushed to ECR. No production deployment has occurred.

## 3. Required GitHub Configuration

Required GitHub repository variables:

```text
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=crm-modern-backend
```

Required GitHub repository secret:

```text
AWS_BACKEND_ROLE_TO_ASSUME
```

The secret value should be the backend GitHub Actions OIDC role ARN.

Do not document, paste, or expose the actual secret value.

## 4. Why Each Variable or Secret Is Needed

`AWS_REGION`:

* tells the workflow which AWS region to use,
* should match the backend ECR repository region,
* expected value: `ap-southeast-1`.

`ECR_REPOSITORY`:

* tells the workflow which ECR repository to push to,
* expected value: `crm-modern-backend`.

`AWS_BACKEND_ROLE_TO_ASSUME`:

* lets GitHub Actions assume the backend ECR push role using OIDC,
* avoids long-lived AWS access keys,
* should point to the backend OIDC role, not the frontend role.

## 5. Repository Variables vs Repository Secrets

Repository variables are for non-sensitive configuration values.

Examples:

```text
AWS_REGION
ECR_REPOSITORY
```

Repository secrets are for sensitive values that should not be visible in workflow logs or project documentation.

Example:

```text
AWS_BACKEND_ROLE_TO_ASSUME
```

Even though the backend role ARN is not a password, it is deployment-sensitive and should be stored as a secret for this project.

## 6. Manual GitHub UI Path

Manual GitHub UI path:

```text
GitHub repository -> Settings -> Secrets and variables -> Actions
```

Use the `Variables` tab for repository variables.

Use the `Secrets` tab for repository secrets.

## 7. Manual Variable Setup Steps

In the `Variables` tab, create this repository variable:

```text
Name: AWS_REGION
Value: ap-southeast-1
```

Create this repository variable:

```text
Name: ECR_REPOSITORY
Value: crm-modern-backend
```

Do not modify unrelated frontend variables.

## 8. Manual Secret Setup Steps

In the `Secrets` tab, create this repository secret:

```text
Name: AWS_BACKEND_ROLE_TO_ASSUME
Value: backend OIDC role ARN
```

Do not paste the actual value into documentation or chat.

Do not reuse the frontend deployment role secret for the backend workflow.

Do not create AWS access keys.

## 9. Backend vs Frontend Secret Separation

The project already has frontend CI/CD variables/secrets from Phase 7.

Important separation rules:

* do not overwrite frontend values,
* do not reuse the frontend role secret for backend workflow,
* keep frontend and backend IAM roles separate,
* keep frontend and backend GitHub secret names separate.

Existing frontend secret may be named:

```text
AWS_ROLE_TO_ASSUME
```

Backend workflow should use:

```text
AWS_BACKEND_ROLE_TO_ASSUME
```

This keeps frontend S3/CloudFront deployment permissions separate from backend ECR image push permissions.

## 10. Security Rules

Security rules:

* do not create long-lived AWS access keys,
* do not store AWS access keys in GitHub,
* do not document the backend role ARN,
* do not paste the backend role ARN into chat,
* do not expose GitHub secrets,
* do not store database credentials in GitHub for the image build,
* do not store `DATABASE_URL` for this workflow,
* do not store production env file contents in GitHub,
* do not use frontend role permissions for backend ECR push.

## 11. Verification Checklist

After manual setup, verify:

* `AWS_REGION` exists as repository variable.
* `AWS_REGION` value is `ap-southeast-1`.
* `ECR_REPOSITORY` exists as repository variable.
* `ECR_REPOSITORY` value is `crm-modern-backend`.
* `AWS_BACKEND_ROLE_TO_ASSUME` exists as repository secret.
* `AWS_BACKEND_ROLE_TO_ASSUME` contains the backend role ARN.
* Actual secret value is not documented.
* No AWS access keys were created.
* No frontend variable/secret was overwritten.
* No workflow was run.
* No image was pushed.
* No deployment occurred.

## 12. What Must Not Be Done in This Phase

Do not:

* create GitHub variables/secrets through Codex,
* ask the user to paste the backend role ARN into chat,
* document the backend role ARN,
* create GitHub Actions workflow file,
* modify existing workflows,
* run workflows,
* run Docker,
* build images,
* log in to ECR,
* push images,
* pull images,
* modify AWS,
* create AWS access keys,
* run SSM commands,
* SSH,
* deploy,
* restart containers,
* run Prisma commands,
* run migrations,
* inspect env files,
* expose secrets,
* modify source code,
* modify Dockerfile,
* modify `.dockerignore`,
* modify package files,
* stage, commit, or push.

## 13. Security Boundaries

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

## 14. Proposed Next Phase

Recommended next phase:

```text
Phase 9U: Backend GitHub Variables and Secret Manual Execution
```

Phase 9U should:

* let the user manually create the GitHub variables and secret,
* have ChatGPT Architect guide the manual setup,
* have Codex create an execution report only after Architect confirms the results,
* stop before workflow creation,
* stop before image push,
* stop before deployment.

## 15. Final Recommendation

Create only the two backend repository variables and one backend repository secret needed for the future backend ECR build-and-push workflow:

```text
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=crm-modern-backend
AWS_BACKEND_ROLE_TO_ASSUME=<backend OIDC role ARN stored only as a GitHub secret>
```

Keep backend GitHub configuration separate from the existing frontend CI/CD configuration. Do not create long-lived AWS access keys, do not overwrite frontend values, and do not run any workflow during this setup phase.

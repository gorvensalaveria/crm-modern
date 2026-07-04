# CODEX Phase 7A: Frontend CI/CD Planning Guide

## 1. Phase Name and Purpose

Phase 7A plans frontend CI/CD automation for deploying the already-working React/Vite frontend to S3 + CloudFront using GitHub Actions.

This phase is documentation/planning only. It does not create workflow files, create IAM resources, create GitHub secrets, run commands, modify files, deploy frontend, or change infrastructure.

## 2. Current Manual Deployment Flow

Current frontend hosting:

* S3 bucket: `crm-modern-frontend-aucrm`
* CloudFront distribution: `crm-modern-frontend-cloudfront`
* CloudFront URL: `https://d3k197cbnbmhh7.cloudfront.net`

Current backend API:

* `https://aucrm.duckdns.org/api/...`

Current manual frontend deployment shape:

1. Build the frontend with the public backend API base:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

2. Use build output:

```text
client/dist
```

3. Upload contents of `client/dist` to the S3 bucket root:

```text
index.html
assets/
```

4. Invalidate CloudFront so users receive the latest frontend.

CloudFront SPA fallback is already configured:

* `403` -> `/index.html` -> `HTTP 200`
* `404` -> `/index.html` -> `HTTP 200`

## 3. Target Automated Deployment Flow

Target GitHub Actions flow:

1. Checkout repository.
2. Set up Node.
3. Install dependencies.
4. Build frontend with:

```text
VITE_API_BASE_URL=https://aucrm.duckdns.org
```

5. Sync `client/dist/` contents to S3 bucket root.
6. Apply appropriate cache-control metadata.
7. Invalidate CloudFront path:

```text
/*
```

8. Report deployment status in the GitHub Actions run.

## 4. Recommended GitHub Actions Trigger Strategy

Recommended initial trigger strategy:

* Start with manual trigger only:
  * `workflow_dispatch`

Why:

* Safer while learning.
* Allows controlled deployment timing.
* Avoids accidental deployments on every push.

Later trigger option:

* Add push trigger for the main production branch after the workflow is proven:
  * only when frontend CI/CD is stable,
  * only after the user is comfortable with automatic deploys.

## 5. Required GitHub Actions Job Steps

Planned workflow concept:

1. Checkout repo.
2. Set up Node.
3. Install dependencies.
4. Build frontend:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

5. Sync `client/dist/` contents to S3 bucket root.
6. Set cache-control:
  * `index.html`: short/no-cache behavior
  * hashed assets: long cache behavior
7. Invalidate CloudFront:

```text
/*
```

8. Confirm workflow completed successfully.

This phase documents the intended steps only. It does not create the workflow file.

## 6. Required Environment Variables and GitHub Secrets

Public non-secret configuration:

* `VITE_API_BASE_URL=https://aucrm.duckdns.org`
* S3 bucket name: `crm-modern-frontend-aucrm`
* CloudFront distribution identifier or target reference, to be documented only in a later workflow phase if approved
* AWS region: `ap-southeast-1`

Secrets or protected auth configuration will be needed for AWS deployment.

Preferred auth approach:

* GitHub Actions OIDC to assume an AWS IAM role.

Simpler but less ideal approach:

* AWS access key ID and AWS secret access key stored as GitHub Actions secrets.

Do not ask for or document:

* AWS access key values
* AWS secret access key values
* database credentials
* `DATABASE_URL`
* DuckDNS token
* Certbot account email
* private key material

## 7. Recommended AWS IAM Permission Scope

Use least privilege.

The frontend deploy identity should only be able to:

* Upload, overwrite, and delete frontend objects in the approved S3 bucket.
* Read/list the approved S3 bucket as needed for sync.
* Create invalidations for the approved CloudFront distribution.

It should not be able to:

* Modify EC2.
* Modify RDS.
* Modify security groups.
* Modify IAM broadly.
* Recreate S3 buckets.
* Recreate CloudFront distributions.
* Access unrelated buckets.
* Access database credentials.
* SSH to servers.

Prefer GitHub Actions OIDC if practical. If OIDC is too advanced for the current learning phase, document access-key based deployment as simpler but less ideal, then plan migration to OIDC later.

## 8. S3 Deployment Behavior

S3 deployment should:

* Sync contents of `client/dist/` to the S3 bucket root.
* Preserve target structure:

```text
index.html
assets/
```

* Avoid uploading the `dist/` folder itself as a nested directory.
* Avoid uploading `.env` files.
* Avoid uploading source files unless they are part of the built frontend output.
* Optionally delete removed files from S3 so stale assets do not remain.

## 9. CloudFront Invalidation Behavior

CloudFront invalidation will be needed after uploads so users receive the latest frontend.

Initial simple invalidation path:

```text
/*
```

Planning note:

* `/*` is simple and reliable.
* Excessive invalidations can have cost/limit implications.
* Later optimization can invalidate only changed paths if needed.

## 10. Cache-Control Recommendation

Recommended cache behavior:

* `index.html`: short/no-cache behavior
* hashed assets: long cache behavior

Reason:

* `index.html` should update quickly because it points to current asset filenames.
* Hashed asset files can be cached longer because filename changes indicate content changes.

Future workflow should upload `index.html` and `assets/` with different cache-control values if practical.

## 11. Security Boundaries

Phase 7A boundaries:

* No backend deploy automation.
* No database automation.
* No Prisma commands.
* No EC2 SSH automation.
* No Docker/Nginx changes.
* No S3 bucket recreation.
* No CloudFront distribution recreation.
* No AWS infrastructure changes.
* No GitHub secrets creation.
* No IAM creation.
* No workflow file creation yet.
* No staging, commit, or push.

Secret boundaries:

* Do not include actual AWS credentials.
* Do not include database credentials.
* Do not include `DATABASE_URL`.
* Do not include DuckDNS token.
* Do not include Certbot account email.
* Do not include private key material.
* Do not include EC2 public IP/DNS.
* Do not include user public IP.
* Do not include RDS endpoint.

## 12. Risks and Mitigations

Risk: overly broad AWS permissions.

Mitigation:

* Use least privilege.
* Prefer OIDC with scoped role.
* Limit S3 access to `crm-modern-frontend-aucrm`.
* Limit CloudFront invalidation access to the approved distribution.

Risk: accidental deploy on every push.

Mitigation:

* Start with `workflow_dispatch`.
* Add branch triggers later only after manual workflow is proven.

Risk: stale frontend due to CloudFront cache.

Mitigation:

* Invalidate CloudFront after upload.
* Use short/no-cache behavior for `index.html`.

Risk: wrong S3 object structure.

Mitigation:

* Sync contents of `client/dist/`, not the folder itself.
* Verify bucket root contains `index.html` and `assets/`.

Risk: leaking secrets into frontend build.

Mitigation:

* Only use public `VITE_API_BASE_URL`.
* Never put secrets in Vite env.
* Do not use backend runtime env values in frontend builds.

## 13. Manual Rollback / Fallback Strategy

Manual fallback options:

* Re-upload the previous known-good `client/dist` build to S3.
* Restore previous `index.html` and matching `assets/`.
* Run a CloudFront invalidation after rollback upload.
* Temporarily pause automatic deployments by disabling the workflow if needed in a later phase.

Recommended learning note:

* Keep a clear record of each deployment build and upload date.
* Avoid deleting local known-good build artifacts until the new deployment is verified.

## 14. What Should Not Be Automated Yet

Do not automate yet:

* Backend deploys.
* Database migrations.
* Prisma commands.
* EC2 SSH actions.
* Docker container restarts.
* Nginx changes.
* Certbot changes.
* DuckDNS changes.
* RDS changes.
* Security group changes.
* S3 bucket creation.
* CloudFront distribution creation.
* IAM creation.
* GitHub secret creation.

Keep Phase 7 focused on frontend static deploy automation only.

## 15. Proposed Next Phases

Recommended next phases:

* Phase 7B: IAM Policy Design for Frontend CI/CD
* Phase 7C: GitHub Actions Workflow Draft
* Phase 7D: Manual Review and Controlled Enablement

Each phase should remain reviewable, least-privilege, and secret-safe.

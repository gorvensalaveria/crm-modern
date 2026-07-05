# CODEX Phase 7G: Frontend CI/CD Workflow Draft Review Report

## 1. Phase Name and Purpose

Phase 7G documents the review of the frontend deployment GitHub Actions workflow draft before the first controlled CI/CD execution.

This phase is documentation-only. The workflow was not run, modified, or used to upload files to S3 or invalidate CloudFront.

## 2. Workflow File Path

Workflow file:

```text
.github/workflows/deploy-frontend.yml
```

Workflow name:

```text
Deploy Frontend to S3 and CloudFront
```

## 3. Trigger Review

The workflow trigger is:

```text
workflow_dispatch
```

This means the workflow is manual-only for the first controlled deployment.

No automatic push trigger was added.

## 4. OIDC/Auth Review

The workflow uses GitHub Actions OIDC, not long-lived AWS access keys.

OIDC permissions are present:

```yaml
permissions:
  id-token: write
  contents: read
```

AWS authentication uses:

```text
aws-actions/configure-aws-credentials@v4
```

With:

```text
role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
aws-region: ${{ vars.AWS_REGION }}
```

The workflow does not reference:

* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`

## 5. GitHub Variables/Secrets Usage Review

The workflow expects the following repository variables, which already exist:

* `AWS_REGION`
* `S3_BUCKET`
* `CLOUDFRONT_DISTRIBUTION_ID`
* `VITE_API_BASE_URL`

The workflow expects the following repository secret, which already exists:

* `AWS_ROLE_TO_ASSUME`

Existing frontend hosting values:

* S3 bucket: `crm-modern-frontend-aucrm`
* CloudFront distribution ID: `E1GAUKBY4OYYQZ`
* CloudFront URL: `https://d3k197cbnbmhh7.cloudfront.net`

Existing backend API:

```text
https://aucrm.duckdns.org/api/...
```

## 6. Build Step Review

The workflow uses:

* `actions/checkout@v4`
* `actions/setup-node@v4`
* Node.js version `20`

Dependency install command:

```text
npm ci
```

Frontend build command:

```text
npm run build --workspace client
```

Build environment:

```yaml
VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
```

Frontend build output:

```text
client/dist
```

## 7. S3 Upload Behavior Review

The intended S3 target structure is the bucket root:

```text
index.html
assets/
```

The workflow uploads to the S3 bucket root, not nested under `dist/`.

Assets upload behavior:

```text
syncs client/dist/assets to s3://${{ vars.S3_BUCKET }}/assets
```

The assets sync uses:

```text
--delete
```

Root files outside `assets/` are uploaded individually, except `index.html`, which is handled separately.

## 8. Cache-Control Behavior Review

Hashed assets use long cache:

```text
public,max-age=31536000,immutable
```

Root files except `index.html` use shorter cache:

```text
public,max-age=3600
```

`index.html` uses no-cache behavior:

```text
no-cache,no-store,must-revalidate
```

`index.html` is uploaded with content type:

```text
text/html
```

This cache-control strategy is appropriate for a Vite frontend:

* hashed assets can be cached for a long time,
* `index.html` should refresh quickly so users receive the latest asset references.

## 9. CloudFront Invalidation Review

CloudFront invalidation is included.

Distribution ID is read from:

```text
${{ vars.CLOUDFRONT_DISTRIBUTION_ID }}
```

Invalidation path:

```text
/*
```

## 10. Security Boundaries Preserved

The workflow does not include:

* backend deployment,
* SSH steps,
* EC2 steps,
* SSM steps,
* Docker steps,
* Nginx steps,
* Prisma commands,
* RDS steps,
* database steps.

The workflow also does not reference long-lived AWS access key secrets.

## 11. Known Caveat

The workflow deletes stale files under `assets/` because the assets sync uses `--delete`.

Root files outside `assets/` are uploaded individually and are not automatically deleted if removed from future builds.

This is acceptable for the first controlled deployment, but can be improved later if root-level generated files become important.

## 12. What Was Intentionally Not Run

During this review phase:

* the workflow was not run,
* no frontend build was run,
* no npm commands were run,
* no AWS CLI commands were run,
* no S3 upload occurred from this workflow,
* no CloudFront invalidation occurred from this workflow,
* no Prisma commands were run.

## 13. What Was Intentionally Not Modified

During this review phase:

* the workflow file was not modified,
* source code was not modified,
* package files were not modified,
* GitHub variables were not created or changed,
* GitHub secrets were not created or changed,
* AWS resources were not modified,
* IAM was not modified,
* S3 bucket configuration was not modified,
* CloudFront distribution configuration was not modified,
* backend infrastructure was not modified,
* Docker, Nginx, Certbot, DuckDNS, and RDS were not modified,
* no staging, commit, or push was performed.

## 14. Current Readiness State

The workflow draft is ready for controlled first CI/CD deployment review.

Readiness notes:

* manual trigger is appropriate for first deployment,
* OIDC permissions are present,
* OIDC role assumption uses the approved secret name,
* deployment configuration uses repository variables,
* frontend build command is present,
* S3 upload targets the bucket root,
* cache-control behavior is appropriate,
* CloudFront invalidation is included,
* backend and database systems are outside the workflow scope.

## 15. Recommended Next Phase

Recommended next phase:

* Phase 7H: Controlled First CI/CD Deployment

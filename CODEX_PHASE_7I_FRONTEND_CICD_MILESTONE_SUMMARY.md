# CODEX Phase 7I: Frontend CI/CD Milestone Summary

## 1. Phase Name and Purpose

Phase 7I summarizes the completed frontend CI/CD milestone for CRM Modern.

This phase documents the implemented GitHub Actions deployment flow for the frontend using AWS OIDC, S3, and CloudFront. It is documentation-only and does not modify workflows, infrastructure, source code, secrets, or production resources.

## 2. Executive Summary

Phase 7 completed the frontend CI/CD path from planning through first controlled deployment.

The project now has a manual GitHub Actions workflow that builds the Vite frontend, deploys `client/dist` to the existing S3 frontend bucket, applies appropriate cache-control behavior, and invalidates the existing CloudFront distribution.

The first controlled deployment succeeded using GitHub Actions OIDC instead of long-lived AWS access keys. Browser verification confirmed that the CloudFront-hosted frontend loads, role selection works, the dashboard/app loads, SPA fallback works, and the existing backend API integration continues to function.

## 3. Final CI/CD Architecture

GitHub repository:

```text
gorvensalaveria/crm-modern
```

Deployment branch:

```text
main
```

Existing CI workflow:

```text
.github/workflows/ci.yml
```

Frontend deploy workflow:

```text
.github/workflows/deploy-frontend.yml
```

Workflow name:

```text
Deploy Frontend to S3 and CloudFront
```

Workflow trigger:

```text
workflow_dispatch
```

Frontend hosting:

* S3 bucket: `crm-modern-frontend-aucrm`
* CloudFront distribution ID: `E1GAUKBY4OYYQZ`
* CloudFront URL: `https://d3k197cbnbmhh7.cloudfront.net`

Backend API:

```text
https://aucrm.duckdns.org/api/...
```

Backend infrastructure remains:

* EC2
* Docker
* Nginx
* HTTPS
* private RDS PostgreSQL

## 4. Why OIDC Was Selected

GitHub Actions OIDC was selected because it avoids long-lived AWS access keys and supports short-lived role assumption.

OIDC provider:

```text
token.actions.githubusercontent.com
```

OIDC audience:

```text
sts.amazonaws.com
```

The workflow uses OIDC rather than storing or using:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## 5. IAM Least-Privilege Summary

IAM role:

```text
crm-modern-frontend-github-actions-oidc-role
```

Trust scope:

* GitHub owner/user: `gorvensalaveria`
* GitHub repository: `crm-modern`
* Branch: `main`

Inline deploy policy:

```text
crm-modern-frontend-deploy-policy
```

The deploy policy allows only the frontend deployment permissions needed for the existing resources:

* S3 list/location on the existing frontend bucket,
* S3 object put/delete/get inside the existing frontend bucket,
* CloudFront invalidation for the existing frontend distribution.

No backend, database, EC2, SSH, SSM, security group, or RDS permissions were added for frontend CI/CD.

## 6. GitHub Variables/Secrets Summary

GitHub repository variables:

* `AWS_REGION`
* `S3_BUCKET`
* `CLOUDFRONT_DISTRIBUTION_ID`
* `VITE_API_BASE_URL`

GitHub repository secret:

* `AWS_ROLE_TO_ASSUME`

No long-lived AWS access key secrets were created.

These secrets were intentionally not created:

* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`

## 7. Workflow Design Summary

The deploy workflow performs these steps:

* checkout repository,
* setup Node.js,
* install dependencies with `npm ci`,
* build frontend with `npm run build --workspace client`,
* configure AWS credentials with OIDC,
* upload/sync `client/dist/assets` to S3 with long cache,
* upload root files,
* upload `index.html` with no-cache behavior,
* invalidate CloudFront.

Build output:

```text
client/dist
```

S3 target structure:

```text
index.html
assets/
```

The workflow was intentionally kept manual-only for the first controlled deployment.

## 8. Cache-Control Strategy

Hashed assets use long cache:

```text
public,max-age=31536000,immutable
```

`index.html` uses no-cache behavior:

```text
no-cache,no-store,must-revalidate
```

This keeps immutable assets highly cacheable while allowing the entry HTML file to refresh so users receive current asset references after each deployment.

## 9. Pre-Deployment CI Gate and Test Fixes

CI had to pass before deployment.

Initial CI runs failed due to backend test seed gaps in the fresh GitHub Actions Postgres database.

Fixes were applied in:

```text
server/src/app.test.ts
```

Test seed fixes included:

* `user-client`
* `user-agency-admin`

The latest CI passed before deployment.

## 10. First Controlled Deployment Result

First frontend deploy workflow run:

```text
Deploy Frontend to S3 and CloudFront #1
```

Result:

```text
Success
```

Duration:

```text
about 43s
```

The workflow deployed `client/dist` to the existing S3 bucket and invalidated the existing CloudFront distribution.

## 11. Browser Verification Result

Browser verification succeeded after deployment.

Verified outcomes:

* frontend root loaded,
* role selection loaded,
* selecting a role worked,
* dashboard/app loaded,
* API integration continued to work.

SPA route verification:

```text
https://d3k197cbnbmhh7.cloudfront.net/dashboard
```

Result:

* no CloudFront/S3 `403`,
* no CloudFront/S3 `404`,
* React app loaded and fallback worked,
* app redirected or returned to role-selection/home behavior when no active role/session state was present.

## 12. Security Posture

The completed frontend CI/CD setup preserves a conservative security posture:

* OIDC is used instead of long-lived AWS access keys.
* IAM trust is scoped to the approved GitHub owner, repository, and branch.
* IAM permissions are limited to the existing frontend S3 bucket and CloudFront invalidation.
* Backend deployment is not included.
* Database automation is not included.
* EC2 SSH/SSM automation is not included.
* RDS remains private.
* Backend infrastructure remains unchanged.

## 13. What Was Intentionally Not Automated

Phase 7 did not automate:

* backend deployment,
* database changes,
* Prisma commands,
* EC2 SSH,
* EC2 SSM,
* Docker changes,
* Nginx changes,
* Certbot changes,
* DuckDNS changes,
* RDS changes,
* AWS infrastructure creation,
* S3 bucket creation,
* CloudFront distribution creation.

## 14. Known Limitations/Caveats

Known caveats:

* Deploy workflow remains manual-only by design.
* Root files outside `assets/` are uploaded individually and are not automatically deleted if removed from future builds.
* GitHub Actions showed a Node.js runtime deprecation warning for some actions, but the workflow succeeded.
* CloudFront default domain is used because no paid custom domain is currently owned.
* Backend CI/CD is not yet automated.
* Infrastructure is still manually created, not IaC-managed yet.

## 15. Portfolio Skills Demonstrated

This milestone demonstrates practical Cloud and DevOps skills:

* GitHub Actions workflow design,
* AWS OIDC federation for CI/CD,
* least-privilege IAM planning,
* S3 static frontend deployment,
* CloudFront cache invalidation,
* frontend cache-control strategy,
* CI gate enforcement before deployment,
* debugging CI-only test failures against fresh Postgres,
* separating frontend deployment from backend infrastructure,
* secure handling of variables, secrets, and deployment-sensitive metadata.

## 16. Current Production/Frontend Deployment State

Current frontend deployment state:

* frontend is deployed to S3,
* CloudFront serves the frontend,
* first controlled CI/CD deployment succeeded,
* browser verification passed,
* SPA fallback works,
* frontend continues to call the existing backend API.

Current backend state:

* backend remains on EC2 + Docker + Nginx + HTTPS,
* backend API remains available at `https://aucrm.duckdns.org/api/...`,
* RDS remains private,
* backend deployment automation has not been added.

## 17. Recommended Next Phases

Recommended next phases:

* optional manual-to-automatic deploy trigger after confidence,
* optional root-file cleanup improvement,
* optional GitHub Actions runtime/action upgrade later,
* backend CI/CD planning,
* monitoring/logging with CloudWatch,
* Terraform/IaC for existing infrastructure,
* custom domain/ACM/Route 53 later.

# CODEX Phase 7H: Frontend CI/CD Controlled First Deployment Execution Report

## 1. Phase Name and Purpose

Phase 7H documents the successful first controlled frontend CI/CD deployment using GitHub Actions, AWS OIDC, S3, and CloudFront.

This report records the approved non-secret deployment facts and verification outcomes. Codex did not run workflows, modify infrastructure, upload files, invalidate CloudFront, stage, commit, or push while creating this report.

## 2. Pre-Deployment CI Gate

Existing CI was required to pass before the frontend deployment workflow was run.

The latest CI workflow passed before deployment.

This preserved the intended release gate: frontend deployment should only occur after the repository verification workflow is green.

## 3. CI Failure Summary and Resolution

Initial CI runs failed because the fresh GitHub Actions Postgres database exposed backend test seed gaps.

Test fixes were applied in:

```text
server/src/app.test.ts
```

The test seed fixes included:

* adding `user-client` for the invoice payment workflow,
* adding `user-agency-admin` for the compliance review workflow.

Local server tests passed after the fixes:

```text
npm run test --workspace server
```

Result:

```text
1 test file passed
8 tests passed
```

The fixes were committed and pushed by the user before the successful controlled deployment.

## 4. Workflow Execution Summary

Frontend deploy workflow:

```text
.github/workflows/deploy-frontend.yml
```

Workflow name:

```text
Deploy Frontend to S3 and CloudFront
```

Trigger used:

```text
workflow_dispatch
```

Branch:

```text
main
```

Workflow run:

```text
Deploy Frontend to S3 and CloudFront #1
```

Workflow result:

```text
Success
```

Workflow duration:

```text
about 43s
```

## 5. OIDC Authentication Confirmation

The workflow used AWS OIDC authentication.

The workflow used GitHub repository secret:

```text
AWS_ROLE_TO_ASSUME
```

The workflow did not use long-lived AWS access keys.

These secrets were not used or created:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## 6. GitHub Variables/Secrets Usage

The workflow used these GitHub repository variables:

* `AWS_REGION`
* `S3_BUCKET`
* `CLOUDFRONT_DISTRIBUTION_ID`
* `VITE_API_BASE_URL`

The workflow used this GitHub repository secret:

* `AWS_ROLE_TO_ASSUME`

No GitHub variables or secrets were modified during the deployment execution.

## 7. S3 Deployment Result

The workflow deployed frontend build output from:

```text
client/dist
```

The workflow uploaded to the existing S3 bucket:

```text
crm-modern-frontend-aucrm
```

The S3 target structure remained:

```text
index.html
assets/
```

The S3 bucket was not recreated.

## 8. Cache-Control Behavior

The workflow applied long cache behavior to assets:

```text
public,max-age=31536000,immutable
```

The workflow applied no-cache behavior to `index.html`:

```text
no-cache,no-store,must-revalidate
```

This matches the intended frontend deployment pattern:

* hashed assets can be cached long-term,
* `index.html` should refresh quickly so users receive the current asset references.

## 9. CloudFront Invalidation Result

The workflow invalidated the existing CloudFront distribution:

```text
E1GAUKBY4OYYQZ
```

CloudFront URL:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

The CloudFront distribution was not recreated.

## 10. Browser Verification Result

Browser verification after deployment succeeded.

Verified outcomes:

* frontend root loaded,
* role selection loaded,
* selecting a role worked,
* dashboard/app loaded,
* API integration continued to work.

Existing backend API remained:

```text
https://aucrm.duckdns.org/api/...
```

## 11. SPA Fallback Behavior

SPA route verification used:

```text
https://d3k197cbnbmhh7.cloudfront.net/dashboard
```

Result:

* did not show CloudFront/S3 `403`,
* did not show CloudFront/S3 `404`,
* React app loaded and fallback worked,
* app redirected or returned to role-selection/home behavior when no active role/session state was present.

## 12. Security Boundaries Preserved

Backend infrastructure was not changed during deployment:

* EC2 + Docker + Nginx + HTTPS remained unchanged,
* RDS remained private,
* no backend deployment was performed,
* no EC2 SSH/SSM was used,
* no database changes were made.

The deployment used OIDC rather than long-lived AWS access keys.

## 13. What Was Intentionally Not Modified

During deployment execution:

* backend infrastructure was not modified,
* IAM resources were not modified,
* GitHub variables/secrets were not modified,
* RDS was not modified,
* EC2 was not modified,
* Docker was not modified,
* Nginx was not modified,
* Certbot was not modified,
* DuckDNS was not modified,
* no database changes were made.

During this report creation:

* workflows were not run,
* workflows were not modified,
* source code was not modified,
* package files were not modified,
* AWS CLI commands were not run,
* S3 uploads were not performed,
* CloudFront invalidations were not performed,
* no staging, commit, or push was performed by Codex.

## 14. What Was Intentionally Not Created

The following were not created or recreated:

* AWS infrastructure,
* S3 bucket,
* CloudFront distribution,
* IAM resources,
* GitHub variables,
* GitHub secrets,
* long-lived AWS access key secrets.

## 15. Evidence/Security Notes

Safe evidence documented in this report:

* workflow file path,
* workflow name,
* manual trigger,
* branch `main`,
* workflow run number/result/duration,
* GitHub variable names,
* GitHub secret name,
* S3 bucket name,
* CloudFront distribution ID,
* CloudFront URL,
* public backend API base,
* cache-control strings,
* browser verification outcomes,
* CI/test-fix summary.

Excluded from this report:

* full IAM role ARN,
* AWS account ID,
* AWS access keys,
* AWS secret access keys,
* database credentials,
* `DATABASE_URL`,
* RDS endpoint,
* EC2 public IP/DNS,
* user public IP,
* DuckDNS token,
* Certbot account email,
* private key material,
* screenshots containing account metadata.

## 16. Current CI/CD State

Frontend CI/CD has completed its first controlled manual deployment successfully.

Current state:

* CI passed before deployment.
* Manual `workflow_dispatch` deployment succeeded.
* GitHub Actions used OIDC.
* Frontend build output deployed to S3.
* CloudFront invalidation completed through the workflow.
* Browser verification succeeded.
* Existing backend API integration continued to work.
* Backend infrastructure remained unchanged.

## 17. Recommended Next Phases

Recommended next phases:

* Phase 7I: Frontend CI/CD Milestone Summary
* Optional: change deploy workflow from manual-only to push-based later
* Optional: improve root-file cleanup behavior
* Optional: upgrade GitHub Actions runtime/actions if needed later
* Optional: backend CI/CD planning

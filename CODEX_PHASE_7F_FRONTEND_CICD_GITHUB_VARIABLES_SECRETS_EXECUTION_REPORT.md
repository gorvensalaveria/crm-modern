# CODEX Phase 7F: Frontend CI/CD GitHub Variables and Secrets Execution Report

## 1. Phase Name and Purpose

Phase 7F documents the completed manual GitHub repository variables and secrets setup for frontend CI/CD using AWS OIDC.

This phase is documentation-only. It records the approved setup facts and confirms that no workflow run, frontend build, S3 upload, CloudFront invalidation, AWS infrastructure change, or backend change was performed during this phase.

## 2. Why GitHub Variables/Secrets Were Needed

The frontend deployment workflow needs GitHub Actions configuration values to:

* authenticate to AWS using GitHub Actions OIDC,
* select the correct AWS region,
* target the existing frontend S3 bucket,
* invalidate the existing CloudFront distribution,
* build the frontend with the public backend API base URL.

The configuration supports the existing frontend hosting target:

* S3 bucket: `crm-modern-frontend-aucrm`
* CloudFront distribution ID: `E1GAUKBY4OYYQZ`
* Backend API base: `https://aucrm.duckdns.org`

## 3. GitHub Repository Path Used

Repository:

```text
gorvensalaveria/crm-modern
```

GitHub path used:

```text
Settings -> Secrets and variables -> Actions
```

Repository variables and the repository secret were created manually by the user in GitHub.

## 4. Repository Variables Created

The following repository variables were manually created:

```text
AWS_REGION=ap-southeast-1
```

```text
S3_BUCKET=crm-modern-frontend-aucrm
```

```text
CLOUDFRONT_DISTRIBUTION_ID=E1GAUKBY4OYYQZ
```

```text
VITE_API_BASE_URL=https://aucrm.duckdns.org
```

These values are non-secret deployment configuration values approved for documentation.

## 5. Repository Secret Created

The following repository secret was manually created:

```text
AWS_ROLE_TO_ASSUME
```

`AWS_ROLE_TO_ASSUME` stores the IAM role ARN for:

```text
crm-modern-frontend-github-actions-oidc-role
```

The full role ARN was not pasted into chat or documentation.

## 6. OIDC Authentication Confirmation

The frontend CI/CD authentication model remains:

```text
GitHub Actions OIDC
```

This confirms the workflow is planned to assume the approved IAM role through OIDC instead of long-lived AWS access keys.

No long-lived AWS access key secrets were created.

## 7. Values Intentionally Not Created

The following long-lived AWS credential secrets were intentionally not created:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

AWS account ID was not intentionally documented.

## 8. Secrets Intentionally Not Added

No database, backend, or runtime secrets were added to GitHub.

The following were intentionally not added:

* `DATABASE_URL`
* database credentials
* DuckDNS token
* Certbot account email
* private key material

## 9. What Was Intentionally Not Run

During Phase 7F:

* no GitHub Actions workflow was run,
* no frontend build was run,
* no S3 upload was performed,
* no CloudFront invalidation was performed,
* no Prisma commands were run.

## 10. What Was Intentionally Not Modified

During Phase 7F:

* no workflow file was created,
* no AWS resources were modified,
* no IAM resources were modified,
* no S3 bucket was modified,
* no CloudFront distribution was modified,
* no backend resources were modified,
* no EC2, RDS, security group, Nginx, Docker, Certbot, or DuckDNS changes were made,
* no database changes were made,
* no staging, commit, or push was performed.

## 11. Security Boundaries Preserved

The setup preserved the intended CI/CD security posture:

* OIDC is used instead of long-lived AWS access keys.
* `AWS_ACCESS_KEY_ID` was not created.
* `AWS_SECRET_ACCESS_KEY` was not created.
* `AWS_ROLE_TO_ASSUME` is stored as a GitHub secret.
* The full IAM role ARN was not documented.
* AWS account ID was not intentionally documented.
* Backend and database secrets were not added to GitHub.

## 12. Evidence/Security Notes

Safe evidence documented in this report:

* GitHub repository name
* GitHub settings path
* GitHub variable names
* approved non-secret variable values
* CloudFront distribution ID
* S3 bucket name
* public backend API base
* IAM role name
* secret name `AWS_ROLE_TO_ASSUME`

Excluded from this report:

* full IAM role ARN
* AWS account ID
* AWS access keys
* AWS secret access keys
* database credentials
* `DATABASE_URL`
* RDS endpoint
* EC2 public IP/DNS
* user public IP
* DuckDNS token
* Certbot account email
* private key path or material
* screenshots containing account metadata

## 13. Current CI/CD Readiness State

Frontend CI/CD prerequisites now include:

* GitHub repository variables for AWS region, S3 bucket, CloudFront distribution, and frontend API base URL.
* GitHub repository secret for the OIDC IAM role to assume.
* OIDC-first authentication model.
* No long-lived AWS access keys.

The repository is ready for workflow draft review and a later controlled first deployment, assuming the workflow references the approved variables and secret.

## 14. Remaining Next Steps

Recommended next phases:

* Phase 7G: GitHub Actions Workflow Draft Review
* Phase 7H: Controlled First CI/CD Deployment

# CODEX Phase 7E: Frontend CI/CD GitHub Variables and Secrets Planning Guide

## 1. Phase Name and Purpose

Phase 7E plans the GitHub repository variables and secrets needed by the future GitHub Actions frontend deployment workflow using AWS OIDC.

This phase is documentation/planning only. It does not create GitHub variables, GitHub secrets, workflow files, AWS resources, IAM resources, or modify application code.

## 2. Why GitHub Variables and Secrets Are Needed

The future frontend CI/CD workflow needs configuration values to:

* authenticate to AWS using OIDC,
* select the correct AWS region,
* deploy to the correct S3 bucket,
* invalidate the correct CloudFront distribution,
* build the frontend with the correct public backend API base URL.

Current approved CI/CD context:

* GitHub repository: `gorvensalaveria/crm-modern`
* Branch: `main`
* GitHub Actions OIDC provider: `token.actions.githubusercontent.com`
* IAM role: `crm-modern-frontend-github-actions-oidc-role`
* IAM role trust scope:
  * GitHub owner/user: `gorvensalaveria`
  * GitHub repository: `crm-modern`
  * Branch: `main`
* Inline deploy policy: `crm-modern-frontend-deploy-policy`
* Auth model: OIDC, not long-lived access keys

## 3. Difference Between GitHub Variables and GitHub Secrets

GitHub repository variables:

* Intended for non-secret configuration values.
* Useful for public or low-sensitivity deployment configuration.
* Visible to repository admins.

GitHub repository secrets:

* Intended for sensitive values.
* Masked in logs.
* Better for values the user wants to avoid displaying casually.

In this project, most frontend deploy configuration is non-secret. The OIDC role ARN is deployment-sensitive metadata, not a password, so it can be a variable or a secret depending on preferred caution.

## 4. Recommended Repository Variables

Recommended repository variables:

```text
AWS_REGION=ap-southeast-1
```

Classification:

* non-secret

```text
S3_BUCKET=crm-modern-frontend-aucrm
```

Classification:

* non-secret

```text
CLOUDFRONT_DISTRIBUTION_ID=E1GAUKBY4OYYQZ
```

Classification:

* deployment-sensitive metadata, not a password

```text
VITE_API_BASE_URL=https://aucrm.duckdns.org
```

Classification:

* public frontend build value

Existing frontend hosting:

* S3 bucket: `crm-modern-frontend-aucrm`
* CloudFront distribution ID: `E1GAUKBY4OYYQZ`
* CloudFront distribution name/comment: `crm-modern-frontend-cloudfront`
* CloudFront URL: `https://d3k197cbnbmhh7.cloudfront.net`

Existing backend API:

* `https://aucrm.duckdns.org/api/...`

## 5. Recommended Repository Secrets

Recommended secret or cautious variable:

```text
AWS_ROLE_TO_ASSUME=<ROLE_ARN_FOR_crm-modern-frontend-github-actions-oidc-role>
```

Classification:

* deployment-sensitive metadata, not a password

Recommendation:

* Store `AWS_ROLE_TO_ASSUME` as a repository secret if the user wants to reduce metadata exposure.
* Use only the placeholder in docs.
* Do not include AWS account ID.
* Do not include the full role ARN in this planning guide.
* Do not ask the user to paste the role ARN in public docs.

## 6. OIDC-Specific Notes

The future GitHub Actions workflow will need:

```yaml
permissions:
  id-token: write
  contents: read
```

The workflow should use:

```text
aws-actions/configure-aws-credentials
```

with role assumption using `AWS_ROLE_TO_ASSUME`.

OIDC-specific boundaries:

* Use the OIDC role instead of AWS access keys.
* Do not create long-lived AWS credentials.
* Do not commit AWS credentials.
* Do not store AWS access keys unless OIDC is explicitly rejected later.

## 7. Values That Should Not Be Created

Do not create:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Reason:

* The approved authentication model is OIDC.
* Access keys are long-lived credentials and are less ideal.
* No long-lived AWS credentials should be committed or stored.

Also do not create secrets for:

* database credentials,
* `DATABASE_URL`,
* DuckDNS token,
* Certbot account email,
* private key material.

## 8. GitHub Console Path for Later Manual Setup

Repository:

```text
gorvensalaveria/crm-modern
```

Path:

```text
Settings -> Secrets and variables -> Actions
```

Use:

* Variables tab for repository variables.
* Secrets tab for repository secrets if needed.

Do not create variables or secrets in this planning phase.

## 9. Validation Checklist Before Creating Variables / Secrets

Before creating GitHub variables/secrets in a later approved phase, verify:

* Repository is `gorvensalaveria/crm-modern`.
* Branch is `main`.
* AWS region is `ap-southeast-1`.
* S3 bucket is `crm-modern-frontend-aucrm`.
* CloudFront distribution ID is `E1GAUKBY4OYYQZ`.
* Backend API base is `https://aucrm.duckdns.org`.
* OIDC IAM role is `crm-modern-frontend-github-actions-oidc-role`.
* `AWS_ROLE_TO_ASSUME` value is copied from AWS IAM role details only during the approved setup phase.
* No AWS access-key secrets are created.
* No database or backend runtime secrets are added to GitHub.

## 10. Security Boundaries

This phase creates a plan only.

Do not:

* create GitHub variables,
* create GitHub secrets,
* create workflow files,
* create AWS resources,
* modify IAM,
* modify app code,
* stage, commit, or push.

OIDC remains the approved authentication model.

## 11. What Not To Expose

Do not expose:

* EC2 public IP/DNS
* User public IP
* RDS endpoint
* Database credentials
* `DATABASE_URL`
* DuckDNS token
* Certbot account email
* Private key material
* AWS access keys
* AWS secret access keys
* AWS account ID
* Full role ARN

Use this placeholder for the role ARN:

```text
<ROLE_ARN_FOR_crm-modern-frontend-github-actions-oidc-role>
```

## 12. What Not To Modify

Do not modify:

* GitHub variables
* GitHub secrets
* `.github/workflows`
* Workflow files
* Package files
* Frontend files
* Backend infrastructure
* AWS resources
* IAM resources
* S3 bucket
* CloudFront distribution
* Security groups
* EC2
* Docker
* Nginx
* Certbot
* DuckDNS
* RDS

Do not:

* build frontend,
* upload to S3,
* invalidate CloudFront,
* run Prisma commands,
* stage, commit, or push,
* run `npm audit fix --force`.

## 13. Proposed Next Phases

Recommended next phases:

* Phase 7F: GitHub Repository Variables Manual Setup
* Phase 7G: GitHub Actions Workflow Draft
* Phase 7H: Controlled First CI/CD Deployment

The next phase should manually create only the approved variables/secrets and should continue avoiding long-lived AWS access keys.

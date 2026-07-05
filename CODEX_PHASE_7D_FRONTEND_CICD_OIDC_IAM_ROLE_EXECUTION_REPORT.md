# CODEX Phase 7D: Frontend CI/CD OIDC IAM Role Execution Report

## 1. Phase Name and Purpose

Phase 7D documents the completed manual AWS IAM/OIDC setup for future GitHub Actions frontend CI/CD deployment.

This report is documentation-only. It does not create IAM resources, GitHub secrets, GitHub variables, workflow files, or modify AWS resources.

## 2. Why the IAM/OIDC Setup Was Needed

Future frontend CI/CD needs a secure way for GitHub Actions to deploy the built frontend to S3 and invalidate CloudFront.

The selected authentication model is GitHub Actions OIDC, which avoids long-lived AWS access keys and allows AWS role trust to be scoped to a specific GitHub repository and branch.

## 3. OIDC Provider Creation Result

GitHub Actions OIDC provider was checked in IAM.

Initial state:

* No identity provider existed.

Completed state:

* GitHub Actions OIDC provider was manually created.
* OIDC provider: `token.actions.githubusercontent.com`
* Provider type: OpenID Connect
* Audience: `sts.amazonaws.com`

## 4. IAM Role Creation Result

IAM role was manually created:

```text
crm-modern-frontend-github-actions-oidc-role
```

The role was initially created with no permissions attached.

## 5. Trust Relationship Summary

Role trust relationship is scoped to:

* GitHub owner/user: `gorvensalaveria`
* GitHub repository: `crm-modern`
* Branch: `main`

Effective GitHub subject condition:

```text
repo:gorvensalaveria/crm-modern:ref:refs/heads/main
```

Trust policy allows:

```text
sts:AssumeRoleWithWebIdentity
```

## 6. Permissions Policy Summary

Custom inline permissions policy was manually created and attached to the role.

Inline policy name:

```text
crm-modern-frontend-deploy-policy
```

The inline policy allows only:

* S3 bucket/list/location access for the existing frontend bucket.
* S3 object upload/delete/read access for objects inside the existing frontend bucket.
* CloudFront invalidation for the existing frontend distribution.

## 7. S3 Permission Scope

Existing S3 bucket:

```text
crm-modern-frontend-aucrm
```

Inline policy S3 bucket resource:

```text
arn:aws:s3:::crm-modern-frontend-aucrm
```

Inline policy S3 object resource:

```text
arn:aws:s3:::crm-modern-frontend-aucrm/*
```

The policy scope is limited to the existing frontend bucket and its objects.

## 8. CloudFront Invalidation Scope

CloudFront distribution ID:

```text
E1GAUKBY4OYYQZ
```

CloudFront distribution name/comment:

```text
crm-modern-frontend-cloudfront
```

CloudFront URL:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

Inline policy CloudFront action:

```text
cloudfront:CreateInvalidation
```

This supports future CI/CD cache invalidation for the existing frontend distribution.

## 9. Security Boundaries Preserved

Security boundaries preserved:

* Access keys were not created.
* IAM user fallback was not used.
* GitHub secrets were not created.
* GitHub variables were not created.
* GitHub Actions workflow file was not created.
* No frontend build was run.
* No S3 upload was performed.
* No CloudFront invalidation was performed.
* No backend resources were modified.
* No EC2/RDS/security group/Nginx/Docker/Certbot/DuckDNS changes were made.
* No database changes were made.
* No staging, commit, or push was performed.

## 10. What Was Intentionally Not Created

The following were intentionally not created:

* AWS access keys
* AWS secret access keys
* IAM user fallback
* GitHub secrets
* GitHub variables
* GitHub Actions workflow file
* Frontend build artifacts
* S3 uploads
* CloudFront invalidations

## 11. What Was Intentionally Not Modified

The following were intentionally not modified:

* Backend resources
* EC2
* RDS
* Security groups
* Nginx
* Docker
* Certbot
* DuckDNS
* Database
* Package files
* Workflow files
* Source code

## 12. Evidence and Security Notes

Safe evidence included:

* OIDC provider URL/name
* OIDC audience
* IAM role name
* Inline policy name
* GitHub owner/repository/branch
* S3 bucket name
* CloudFront distribution ID
* CloudFront distribution name/comment
* CloudFront URL
* High-level permission actions
* S3 bucket/object ARNs that do not include secrets

Deployment-sensitive values intentionally avoided:

* AWS account ID
* Full role ARN
* Screenshots showing AWS account metadata

Excluded from this report:

* AWS access keys
* AWS secret access keys
* Database credentials
* `DATABASE_URL`
* RDS endpoint
* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* Private key path or material
* Full screenshots containing account metadata

## 13. Current CI/CD Readiness State

Frontend CI/CD IAM/OIDC foundation is now ready for later GitHub Actions configuration.

Ready:

* GitHub OIDC provider exists.
* IAM role exists.
* Role trust is scoped to the intended repository and branch.
* Inline policy is attached for frontend S3 deployment and CloudFront invalidation.
* No long-lived access keys were created.

Not ready yet:

* GitHub repository variables/secrets are not configured.
* GitHub Actions workflow file is not created.
* Controlled first CI/CD deployment has not run.

## 14. Remaining Next Steps

Recommended next phases:

* Phase 7E: GitHub Repository Variables/Secrets Planning
* Phase 7F: GitHub Actions Workflow Draft
* Phase 7G: Controlled First CI/CD Deployment

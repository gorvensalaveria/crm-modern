# CODEX Phase 7C: Frontend CI/CD OIDC Role Creation Guide

## 1. Phase Name and Purpose

Phase 7C prepares a safe manual guide for creating the GitHub Actions OIDC IAM role that will later allow frontend deployment to the existing S3 bucket and CloudFront distribution.

This phase is documentation/guide only. It does not create IAM users, IAM roles, IAM policies, OIDC providers, access keys, GitHub secrets, GitHub variables, workflow files, or AWS resources.

## 2. Why OIDC Is Preferred Over Access Keys

Preferred authentication model:

```text
GitHub Actions OIDC
```

OIDC is preferred because:

* it avoids long-lived AWS access keys,
* it allows AWS to trust short-lived GitHub Actions identity tokens,
* it can be scoped to one repository and branch,
* it reduces secret rotation burden,
* it is a stronger production-style pattern for CI/CD.

Fallback model:

```text
IAM user access keys
```

Access-key IAM user deployment is easier to understand, but less ideal. It should only be used later if OIDC is rejected or blocked.

Do not create access keys in this phase.

## 3. Values the User Must Safely Collect Before Starting

Manual values needed later, but not requested in this phase:

* AWS account ID
* CloudFront distribution ID
* GitHub owner or username
* GitHub repository name
* Deployment branch, likely `main` or `master`
* IAM role name
* IAM role ARN after role creation

Security note:

* AWS account ID is not a password, but treat it as deployment-sensitive metadata.
* CloudFront distribution ID is not a password, but treat it as deployment-sensitive metadata.
* IAM role ARN is not a password, but treat it as deployment-sensitive metadata.

Do not paste secrets, AWS access keys, AWS secret access keys, database credentials, or `DATABASE_URL`.

## 4. AWS Console Path for Checking / Creating GitHub OIDC Provider

In a later approved manual phase, check whether the GitHub Actions OIDC provider already exists:

```text
AWS Console -> IAM -> Identity providers
```

Expected GitHub Actions OIDC provider URL:

```text
https://token.actions.githubusercontent.com
```

Audience:

```text
sts.amazonaws.com
```

If the provider does not exist, a later approved execution phase can create it manually.

Do not create the OIDC provider in this guide phase.

## 5. AWS Console Path for Creating IAM Role for GitHub Actions

In a later approved manual phase, the IAM role path will be:

```text
AWS Console -> IAM -> Roles -> Create role
```

Role type should use web identity / OIDC federation with:

```text
token.actions.githubusercontent.com
```

The role should be scoped to the intended GitHub repository and deployment branch.

Do not create the IAM role in this guide phase.

## 6. Trust Policy Template With Placeholders

Trust policy placeholders:

* `<AWS_ACCOUNT_ID>`
* `<GITHUB_ORG_OR_USERNAME>`
* `<GITHUB_REPOSITORY_NAME>`
* `<BRANCH_NAME>`

Trust policy concept:

* Allow `sts:AssumeRoleWithWebIdentity`.
* Federated principal:
  * `arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com`
* Audience condition:
  * `token.actions.githubusercontent.com:aud = sts.amazonaws.com`
* Subject condition:
  * `repo:<GITHUB_ORG_OR_USERNAME>/<GITHUB_REPOSITORY_NAME>:ref:refs/heads/<BRANCH_NAME>`

Template:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_ORG_OR_USERNAME>/<GITHUB_REPOSITORY_NAME>:ref:refs/heads/<BRANCH_NAME>"
        }
      }
    }
  ]
}
```

Do not invent placeholder values.

## 7. Permissions Policy Template With Placeholders

Permissions policy placeholders:

* `<AWS_ACCOUNT_ID>`
* `<CLOUDFRONT_DISTRIBUTION_ID>`

The policy should allow only frontend S3 sync/upload/delete behavior and CloudFront invalidation for the existing distribution.

Template:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListFrontendBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::crm-modern-frontend-aucrm"
    },
    {
      "Sid": "ManageFrontendBucketObjects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::crm-modern-frontend-aucrm/*"
    },
    {
      "Sid": "InvalidateFrontendCloudFrontDistribution",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::<AWS_ACCOUNT_ID>:distribution/<CLOUDFRONT_DISTRIBUTION_ID>"
    }
  ]
}
```

Important:

* CloudFront invalidation IAM ARNs use distribution IDs.
* CloudFront distribution name/comment is not enough for IAM scoping.
* Do not invent the CloudFront distribution ID.

## 8. Role Naming Recommendation

Recommended role name:

```text
crm-modern-frontend-github-actions-oidc-role
```

Recommended policy name:

```text
crm-modern-frontend-deploy-policy
```

Use names that clearly communicate:

* project,
* frontend deploy purpose,
* GitHub Actions usage,
* OIDC authentication model.

## 9. GitHub Repo / Branch Scoping Recommendation

Scope the trust policy to:

* one GitHub owner or username,
* one repository,
* one deployment branch.

Common branch choices:

* `main`
* `master`

The exact branch should match the real deployment branch.

Do not broaden the trust policy to all repositories or all branches unless explicitly approved in a later phase.

## 10. Validation Checklist Before Saving the Role

Before saving the IAM role in a future manual phase, verify:

* OIDC provider URL is `https://token.actions.githubusercontent.com`.
* Audience is `sts.amazonaws.com`.
* Trust policy uses the correct AWS account ID.
* Trust policy uses the intended GitHub owner/repository.
* Trust policy uses the intended deployment branch.
* Role name is `crm-modern-frontend-github-actions-oidc-role` or another approved name.
* Permissions policy name is `crm-modern-frontend-deploy-policy` or another approved name.
* S3 bucket resource is exactly `arn:aws:s3:::crm-modern-frontend-aucrm`.
* S3 object resource is exactly `arn:aws:s3:::crm-modern-frontend-aucrm/*`.
* CloudFront distribution ARN uses the verified distribution ID.
* Policy does not include broad permissions.
* Policy does not include backend/database/EC2/SSM/security group permissions.

## 11. What Values Are Safe vs Sensitive

Safe to document in later reports if approved:

* S3 bucket name: `crm-modern-frontend-aucrm`
* CloudFront distribution name/comment: `crm-modern-frontend-cloudfront`
* CloudFront URL: `https://d3k197cbnbmhh7.cloudfront.net`
* Existing backend API path: `https://aucrm.duckdns.org/api/...`
* IAM role name
* IAM policy name
* GitHub Actions OIDC provider URL
* OIDC audience

Deployment-sensitive metadata:

* AWS account ID
* CloudFront distribution ID
* IAM role ARN
* GitHub repository owner/name
* deployment branch

Secrets:

* AWS access keys
* AWS secret access keys
* database credentials
* `DATABASE_URL`
* DuckDNS token
* Certbot account email if not explicitly approved for documentation
* private key material

## 12. What Not To Expose

Do not expose:

* AWS access keys
* AWS secret access keys
* database credentials
* `DATABASE_URL`
* EC2 public IP/DNS
* user public IP
* RDS endpoint
* DuckDNS token
* Certbot account email
* private key material

Do not ask the user to paste secrets.

## 13. What Not To Modify

Do not modify:

* IAM resources
* S3 bucket
* CloudFront distribution
* AWS resources
* security groups
* EC2
* backend infrastructure
* Docker
* Nginx
* Certbot
* DuckDNS
* RDS
* package files
* workflow files
* source code

Do not create:

* IAM users
* IAM roles
* IAM policies in AWS
* OIDC providers
* access keys
* GitHub secrets
* GitHub variables
* `.github/workflows`

## 14. Expected Output From the Manual Phase

Expected output from a later approved manual role creation phase:

* GitHub OIDC provider exists or is created.
* IAM role exists with approved trust policy.
* IAM permissions policy exists with least-privilege S3 + CloudFront permissions.
* IAM role has a role ARN for later GitHub Actions configuration.
* No access keys are created.
* No GitHub secrets or workflow files are created yet unless separately approved.

## 15. Proposed Next Phase

Recommended next phases:

* Phase 7D: GitHub Repository Variables/Secrets Planning
* Phase 7E: GitHub Actions Workflow Draft

The next phase should continue using OIDC-first planning and avoid long-lived access keys unless OIDC is explicitly rejected later.

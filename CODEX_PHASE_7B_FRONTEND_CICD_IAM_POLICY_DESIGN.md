# CODEX Phase 7B: Frontend CI/CD IAM Policy Design

## 1. Phase Name and Purpose

Phase 7B designs the minimum AWS IAM permissions needed by GitHub Actions to deploy the frontend to the existing S3 bucket and invalidate the existing CloudFront distribution.

This phase is documentation/design only. It does not create IAM users, IAM roles, IAM policies, access keys, GitHub secrets, GitHub variables, workflow files, or AWS resources.

## 2. Why CI/CD Needs AWS Permissions

The future frontend CI/CD job will need AWS permissions to:

* upload/sync built frontend files to the existing S3 bucket,
* delete removed stale files from the S3 bucket during sync,
* set appropriate cache-control metadata,
* invalidate the existing CloudFront distribution so users receive the newest frontend.

Existing frontend hosting:

* S3 bucket: `crm-modern-frontend-aucrm`
* CloudFront distribution name/comment: `crm-modern-frontend-cloudfront`
* CloudFront URL: `https://d3k197cbnbmhh7.cloudfront.net`

Existing backend API:

* `https://aucrm.duckdns.org/api/...`

Frontend build command:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

Frontend build output:

```text
client/dist
```

S3 target structure:

```text
index.html
assets/
```

## 3. Preferred Approach: GitHub Actions OIDC With IAM Role

Preferred security model:

* GitHub Actions uses OIDC to assume an AWS IAM role.
* No long-lived AWS access keys are stored in GitHub.
* The IAM role trust policy restricts access to the intended GitHub repository and branch.
* The IAM permissions policy grants only the S3 and CloudFront actions required for frontend deployment.

Why OIDC is preferred:

* avoids long-lived credentials,
* reduces secret rotation burden,
* supports tighter repository/branch scoping,
* is the more modern GitHub Actions to AWS authentication pattern.

## 4. Fallback Approach: IAM User Access Keys

Simpler but less ideal fallback:

* Create an IAM user with access keys.
* Store the access key ID and secret access key as GitHub Actions secrets.
* Attach the same least-privilege frontend deployment policy to that IAM user.

Risks:

* access keys are long-lived,
* keys must be rotated,
* leaked keys can be abused until revoked,
* this is easier for learning but weaker than OIDC.

If access keys are used, restrict the IAM user to this exact frontend deploy policy and rotate keys regularly.

## 5. Recommended Least-Privilege S3 Permissions

Scope S3 permissions to the existing bucket only:

```text
crm-modern-frontend-aucrm
```

Bucket-level permissions:

* `s3:ListBucket`
* `s3:GetBucketLocation`

Bucket resource:

```text
arn:aws:s3:::crm-modern-frontend-aucrm
```

Object-level permissions:

* `s3:PutObject`
* `s3:DeleteObject`
* `s3:GetObject`

Object resource:

```text
arn:aws:s3:::crm-modern-frontend-aucrm/*
```

These permissions support upload/sync/delete behavior for static frontend files.

## 6. Recommended Least-Privilege CloudFront Permissions

CloudFront permission needed:

* `cloudfront:CreateInvalidation`

CloudFront invalidation should be scoped to the existing distribution once the distribution ID is known.

Use placeholder:

```text
<CLOUDFRONT_DISTRIBUTION_ID>
```

Important:

* Do not invent a distribution ID.
* Do not ask for the distribution ID until actual IAM creation or workflow configuration requires it.
* CloudFront invalidation IAM ARNs use distribution IDs, not distribution names.
* Distribution name/comment `crm-modern-frontend-cloudfront` is not enough for IAM scoping.

## 7. Permissions Intentionally Excluded

Exclude broad permissions:

* `s3:*`
* `cloudfront:*`
* `iam:*`
* `ec2:*`
* `rds:*`
* `secretsmanager:*`
* `ssm:*`
* `route53:*`
* `acm:*`
* `cloudformation:*`

Do not include permissions for:

* backend deployment,
* database access,
* creating or deleting buckets,
* creating or deleting CloudFront distributions,
* changing security groups,
* EC2 SSH or SSM,
* modifying IAM resources,
* accessing unrelated S3 buckets.

## 8. Proposed IAM Policy JSON for S3 + CloudFront Deployment

Policy design with placeholders:

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

Placeholders:

* `<AWS_ACCOUNT_ID>`
* `<CLOUDFRONT_DISTRIBUTION_ID>`

Do not use this policy in AWS until placeholders are replaced with verified values in a later approved phase.

## 9. Proposed Trust Policy Concept for GitHub Actions OIDC

OIDC trust policy should allow GitHub Actions from only the intended repository and branch.

Use placeholders:

* `<GITHUB_ORG_OR_USERNAME>`
* `<GITHUB_REPOSITORY_NAME>`
* `<BRANCH_NAME>`

Common branch choices:

* `main`
* `master`

The exact branch should match the real deployment branch.

Conceptual trust condition:

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

Do not create this trust policy yet.

## 10. GitHub Repository and Branch Scoping Concept

Repository/branch scoping should answer:

* Which GitHub owner or organization owns the repository?
* What is the exact repository name?
* Which branch is allowed to deploy?
* Should deployments be manual-only at first?

Recommended initial posture:

* OIDC role trust policy scoped to one repository.
* OIDC role trust policy scoped to one deployment branch.
* GitHub Actions workflow starts with `workflow_dispatch` before automatic branch deploys are enabled.

Do not invent the repository name or branch.

## 11. Required GitHub Actions Secret / Variable Names

### OIDC Approach

Prefer repository variables for non-secret values:

```text
AWS_REGION=ap-southeast-1
S3_BUCKET=crm-modern-frontend-aucrm
CLOUDFRONT_DISTRIBUTION_ID=<CLOUDFRONT_DISTRIBUTION_ID>
VITE_API_BASE_URL=https://aucrm.duckdns.org
```

Role reference:

```text
AWS_ROLE_TO_ASSUME=<ROLE_ARN>
```

Depending on repository policy, `AWS_ROLE_TO_ASSUME` may be stored as a variable or secret. It is not a secret in the same way as an access key, but it is still deployment-sensitive metadata.

### Access-Key Fallback

Secrets only:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Non-secret variables:

```text
AWS_REGION
S3_BUCKET
CLOUDFRONT_DISTRIBUTION_ID
VITE_API_BASE_URL
```

Do not include actual secret values in docs, chat, commits, screenshots, or workflow examples.

## 12. Security Risks and Mitigations

Risk: long-lived AWS access keys leak.

Mitigation:

* Prefer OIDC.
* If access keys are used, rotate them and restrict the IAM user to the exact policy.

Risk: overly broad AWS permissions.

Mitigation:

* Never grant `AdministratorAccess`.
* Never grant broad `s3:*` or `cloudfront:*`.
* Scope S3 access to `crm-modern-frontend-aucrm`.
* Scope object access to `arn:aws:s3:::crm-modern-frontend-aucrm/*`.
* Scope CloudFront invalidation to the distribution ARN once ID is known.

Risk: accidental backend or database access.

Mitigation:

* Exclude EC2, RDS, IAM, SSM, Secrets Manager, Route 53, ACM, and CloudFormation permissions.
* Keep Phase 7 focused only on frontend static deployment.

Risk: credentials committed to repo.

Mitigation:

* Never commit AWS credentials.
* Never paste AWS secret access keys into docs/chat.
* Use GitHub variables/secrets only in later approved phases.

## 13. Validation Checklist Before Creating IAM Resources

Before creating IAM resources in a later phase, verify:

* S3 bucket name is exactly `crm-modern-frontend-aucrm`.
* CloudFront distribution ID is known and verified.
* CloudFront distribution name/comment is `crm-modern-frontend-cloudfront`.
* The distribution ID, not the name/comment, is used in IAM ARN scoping.
* GitHub repository owner/name is confirmed.
* Deployment branch is confirmed.
* OIDC is practical for the current learning phase.
* If using access keys, user accepts the weaker security posture and plans rotation.
* Policy does not include broad wildcard service permissions.
* Policy does not include backend, database, EC2 SSH, SSM, or infrastructure creation permissions.

## 14. What Not To Do

Do not:

* Run commands.
* Inspect files.
* Modify files except creating this design document.
* Create IAM users.
* Create IAM roles.
* Create IAM policies in AWS.
* Create access keys.
* Create GitHub secrets.
* Create GitHub variables.
* Create `.github/workflows`.
* Create workflow files.
* Modify package files.
* Build frontend.
* Upload to S3.
* Invalidate CloudFront.
* Modify AWS resources.
* Modify S3 bucket.
* Modify CloudFront distribution.
* Modify backend infrastructure.
* Modify security groups.
* Modify EC2.
* SSH.
* Modify Docker.
* Modify Nginx.
* Modify Certbot.
* Modify DuckDNS.
* Modify RDS.
* Run Prisma commands.
* Expose secrets.
* Include EC2 public IP/DNS.
* Include user public IP.
* Include RDS endpoint.
* Include database credentials.
* Include `DATABASE_URL`.
* Include DuckDNS token.
* Include Certbot account email.
* Include private key material.
* Stage, commit, or push.
* Run `npm audit fix --force`.

## 15. Proposed Next Phases

Recommended next phases:

* Phase 7C: Create IAM OIDC Role or IAM User Manually
* Phase 7D: GitHub Actions Workflow Draft
* Phase 7E: Controlled First CI/CD Deployment

The next phase should decide whether to proceed with OIDC or the simpler access-key fallback, then create only the minimum approved IAM resources.

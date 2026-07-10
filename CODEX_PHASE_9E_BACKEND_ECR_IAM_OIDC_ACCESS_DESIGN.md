# CODEX Phase 9E: Backend ECR IAM/OIDC Access Design

## 1. Phase Name and Purpose

Phase 9E designs the future IAM/OIDC access model needed for backend ECR-based CI/CD.

This phase is documentation/design-only. It does not create IAM resources, modify AWS, create GitHub variables/secrets, modify workflows, modify source code, or touch production.

## 2. Why IAM/OIDC Design Is Needed

The selected backend CI/CD direction requires controlled AWS access for two future actions:

* GitHub Actions pushes backend Docker images to ECR.
* EC2 or a controlled deployment mechanism pulls selected backend images from ECR.

IAM/OIDC design is needed so these actions can happen without long-lived AWS access keys and without broad production permissions.

The access model should be least-privilege, separate from frontend deployment, and scoped to the backend ECR workflow.

## 3. Current Approved Backend CI/CD Direction

Selected strategy:

```text
Option D3: Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

Phase 9D designed:

* ECR repository name: `crm-modern-backend`
* Region: `ap-southeast-1`
* Primary image tag: `sha-<short-git-sha>`
* Optional tags: `prod-current`, `prod-previous`, `manual-YYYYMMDD-HHMM`

Current backend architecture remains:

* EC2 + Docker + Nginx + Certbot HTTPS + DuckDNS + private RDS PostgreSQL
* Backend domain: `https://aucrm.duckdns.org`
* Backend API: `https://aucrm.duckdns.org/api/...`

Future backend deployment direction:

* GitHub Actions builds backend Docker image.
* GitHub Actions authenticates to AWS using OIDC.
* GitHub Actions pushes backend image to ECR.
* EC2 or a controlled deployment mechanism pulls the selected ECR image.
* Docker API container is replaced/restarted carefully.
* `https://aucrm.duckdns.org/api/health` is verified.

No backend ECR IAM/OIDC resources exist yet. No ECR repository has been created yet. No backend deployment workflow exists yet.

## 4. Existing Frontend OIDC Context

The existing frontend CI/CD already uses GitHub Actions OIDC for S3/CloudFront deployment.

That model proves OIDC is already a good project pattern, but backend ECR access must remain separate.

The frontend deployment role should remain frontend-only and should not be expanded casually to backend ECR permissions.

## 5. Recommended Backend GitHub Actions IAM Role Design

Recommended future backend role name to evaluate:

```text
crm-modern-backend-github-actions-oidc-role
```

Alternative names:

```text
crm-modern-ecr-github-actions-oidc-role
crm-modern-backend-deploy-oidc-role
```

Recommended future inline policy name to evaluate:

```text
crm-modern-backend-ecr-push-policy
```

Alternative names:

```text
crm-modern-backend-deploy-policy
crm-modern-ecr-push-policy
```

Design principles:

* use GitHub Actions OIDC,
* do not use long-lived AWS access keys,
* create a separate backend deployment IAM role later,
* do not reuse the frontend deployment role,
* scope trust to the approved GitHub repository and branch,
* scope ECR permissions only to the backend ECR repository where AWS allows.

Do not include the full IAM role ARN or AWS account ID in documentation.

## 6. Recommended ECR Push Permissions for GitHub Actions

Recommended conceptual permission groups for GitHub Actions ECR push:

Authentication token retrieval:

```text
ecr:GetAuthorizationToken
```

Image upload/push operations for the backend repository:

```text
ecr:BatchCheckLayerAvailability
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:PutImage
```

Limited read/describe actions if needed by workflow:

```text
ecr:DescribeRepositories
ecr:DescribeImages
ecr:BatchGetImage
```

Keep permissions repository-scoped where AWS allows.

Important caveat:

* `ecr:GetAuthorizationToken` may require broader resource scope because of AWS API behavior.

This guide does not provide a final exact JSON policy. A later phase should produce a draft policy for manual review before creation.

## 7. Recommended EC2/ECR Pull Access Design

EC2 or the selected deployment mechanism will eventually need ECR pull access.

Recommended conceptual pull permissions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:BatchGetImage
ecr:GetDownloadUrlForLayer
ecr:DescribeImages
```

Pull access should not include push permissions.

### Option 1: IAM Instance Profile / Role on EC2

Pros:

* no long-lived keys on EC2,
* clean AWS-native access,
* EC2 can pull images directly from ECR.

Cons:

* requires IAM instance profile setup,
* requires EC2 role attachment,
* must be planned carefully to avoid broad permissions.

### Option 2: Controlled Deployment Mechanism Pull Model

Example future mechanism:

```text
SSM Run Command
```

Pros:

* deployment execution can be centralized,
* fits future controlled deployment design,
* may avoid manually managing credentials on EC2.

Cons:

* still needs safe AWS authorization design,
* has more moving pieces,
* should be designed in a later phase.

## 8. IAM Separation Between Frontend and Backend Deployment

IAM separation should be strict.

Frontend deployment role:

* remains frontend-only for S3/CloudFront,
* should not be expanded casually to backend ECR permissions.

Backend GitHub Actions push role:

* can push backend image to ECR,
* should not have broad EC2, RDS, S3, CloudFront, IAM admin, or ECS permissions.

EC2 pull role:

* can pull backend image from ECR,
* should not push images,
* should not manage ECR lifecycle unless explicitly approved later.

This separation keeps frontend deployment, backend image publishing, and runtime pull access understandable and safer.

## 9. GitHub Repository/Branch Trust Boundary

OIDC trust should be scoped to:

* GitHub owner/repository: `gorvensalaveria/crm-modern`
* branch: `main`

Avoid broad trust such as:

* all branches,
* all repositories,
* all organizations,
* pull requests,
* unreviewed workflow contexts.

Manual deployment workflow should be preferred first.

Pull request workflows should not receive production deployment permissions.

## 10. GitHub Variables/Secrets Planning

Future non-secret GitHub repository variables may include:

```text
AWS_REGION
ECR_REPOSITORY
```

Expected values conceptually:

```text
AWS_REGION=ap-southeast-1
ECR_REPOSITORY=crm-modern-backend
```

Future sensitive/deployment-sensitive secret name may include:

```text
BACKEND_AWS_ROLE_TO_ASSUME
```

Guidance:

* do not create variables/secrets now,
* do not document the full role ARN,
* do not store AWS access keys,
* do not store database secrets for image build,
* runtime secrets must remain runtime-only.

## 11. ECR Repository Resource Scoping

Backend ECR permissions should be scoped to:

```text
crm-modern-backend
```

Do not include the full ECR URI in this guide because it can include deployment-sensitive account metadata.

Future policy design should scope repository actions only to the backend repository where AWS allows.

The backend ECR role should not receive broad ECR permissions for unrelated repositories.

## 12. What Permissions Should Be Avoided

Avoid:

* `AdministratorAccess`,
* broad `*` permissions,
* broad ECR access to all repositories unless required for token behavior,
* IAM create/update/delete permissions,
* RDS permissions,
* S3/CloudFront permissions unrelated to backend ECR,
* ECS permissions in this phase,
* EC2 terminate/modify permissions,
* Secrets Manager broad read,
* SSM broad command execution unless designed in a later phase,
* permissions to delete ECR repositories,
* permissions to delete images unless lifecycle/cleanup is explicitly designed later.

## 13. EC2 Instance Profile vs Deployment Mechanism Pull Model

The decision between EC2 instance profile and deployment-mechanism pull should be made later.

Evaluation factors:

* simplicity,
* least privilege,
* auditability,
* whether SSM Run Command becomes the deployment mechanism,
* whether EC2 should independently pull from ECR,
* how rollback commands will be executed,
* whether credentials can remain short-lived and AWS-native.

Near-term design preference:

* avoid long-lived AWS credentials on EC2,
* prefer AWS-native role-based access,
* keep push and pull permissions separated.

## 14. Security Boundaries

Do not include or expose:

* AWS account ID,
* full IAM role ARN,
* full ECR URI,
* EC2 public IP/DNS,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL`,
* full env file contents,
* DuckDNS token,
* Certbot account email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents,
* screenshots containing account metadata.

Do not recommend:

* printing env files,
* `cat /opt/crm-modern/env/production.env`,
* `docker compose config` with production env,
* `env`,
* baking secrets into Docker images,
* long-lived AWS access keys.

## 15. Cost-Control Boundaries

Cost-control boundaries:

* design-only,
* no IAM creation,
* no ECR creation,
* no image storage yet,
* no new always-on resources,
* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager unless separately approved later,
* no CloudWatch log group creation,
* keep current EC2/Nginx/DuckDNS architecture.

## 16. What Not to Create Yet

Do not create yet:

* IAM role,
* IAM policy,
* IAM instance profile,
* ECR repository,
* ECR lifecycle policy,
* GitHub variable,
* GitHub secret,
* backend workflow,
* deployment script,
* AWS CLI commands,
* Docker image build,
* ECR login,
* image push,
* EC2 image pull,
* production deployment.

## 17. Proposed Next Phase

Recommended next phase:

```text
Phase 9F: Backend Docker Image Build Strategy
```

Phase 9F should design how the backend Docker image will be built, which Dockerfile/build context should be used, what should happen in GitHub Actions, and how to avoid baking runtime secrets into images.

## 18. Final Design Recommendation

Recommended IAM/OIDC design:

* use GitHub Actions OIDC,
* create a separate backend IAM role later,
* do not reuse the frontend deployment role,
* scope trust to `gorvensalaveria/crm-modern` on branch `main`,
* scope ECR push permissions to `crm-modern-backend` where AWS allows,
* use a separate EC2 or deployment-mechanism pull model,
* keep push and pull permissions separate,
* avoid long-lived AWS access keys,
* avoid broad AWS permissions,
* do not create anything until the later IAM/access execution phase is approved.

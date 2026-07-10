# CODEX Phase 9N: EC2 ECR Pull Access and SSM Readiness Manual Execution Report

## 1. Phase Name and Purpose

Phase 9N documents the completed manual AWS Console readiness work for EC2 ECR pull access and Systems Manager managed node readiness.

This report documents non-secret outcomes only. It does not include AWS account IDs, full ECR URIs, IAM role ARNs, EC2 identifiers, subnet IDs, private infrastructure values, credentials, secrets, or screenshots/account metadata.

## 2. Manual Steps Completed

Completed manual readiness steps:

* inspected initial EC2 IAM role / instance profile status,
* created an EC2 IAM role for ECR pull access and SSM managed instance readiness,
* attached SSM managed instance permissions,
* attached an ECR pull-only inline policy,
* attached the EC2 role to the production EC2 instance,
* verified backend health after role attachment,
* verified SSM managed node visibility.

No backend deployment was performed.

## 3. Initial EC2 Instance Profile Status

Initial inspection result:

* production EC2 initially had no IAM role / instance profile attached.

## 4. EC2 Role Creation Result

New EC2 role was created.

Role details:

* role name: `crm-modern-prod-ec2-ecr-pull-ssm-role`
* trusted entity: EC2 service
* purpose: ECR pull-only access plus SSM managed instance readiness

The full role ARN is intentionally not documented.

## 5. SSM Permission Result

SSM managed instance permission was attached.

Permission details:

* `AmazonSSMManagedInstanceCore` attached

This supports Systems Manager managed node readiness without running SSM commands in this phase.

## 6. ECR Pull Inline Policy Result

ECR pull inline policy was attached.

Policy details:

* policy name: `crm-modern-prod-ec2-ecr-pull-policy`
* attached to `crm-modern-prod-ec2-ecr-pull-ssm-role`
* pull-only ECR actions only:
  * `ecr:GetAuthorizationToken`
  * `ecr:BatchCheckLayerAvailability`
  * `ecr:BatchGetImage`
  * `ecr:GetDownloadUrlForLayer`
  * `ecr:DescribeImages`
* no ECR push permissions
* no ECR delete permissions
* no ECR admin permissions

This keeps EC2 runtime pull access separate from the GitHub Actions backend ECR push role.

## 7. EC2 Role Attachment Result

EC2 role was attached.

Attachment details:

* attached role name: `crm-modern-prod-ec2-ecr-pull-ssm-role`
* instance remained running after role attachment
* backend health still worked after role attachment:

```text
https://aucrm.duckdns.org/api/health
```

No EC2 public IP, DNS name, instance ID, subnet ID, instance ARN, or private IP is documented.

## 8. SSM Managed Node Visibility Result

SSM managed node visibility was confirmed.

Managed node details:

* managed node visible: yes
* node name: `crm-modern-prod-ec2`
* node status: Running
* ping status: Online
* platform: Linux / Ubuntu
* resource type: EC2 instance

No SSM command was run.

## 9. Validation Checklist

Validated readiness outcomes:

* initial EC2 instance profile status was known,
* production EC2 initially had no IAM role / instance profile attached,
* new EC2 role was created for ECR pull and SSM readiness,
* EC2 role trust is for EC2 service,
* SSM managed instance permission was attached,
* ECR pull-only inline policy was attached,
* ECR policy includes pull-only actions,
* ECR policy does not include push/delete/admin permissions,
* EC2 role was attached,
* instance remained running after role attachment,
* backend health still worked after role attachment,
* SSM managed node is visible,
* SSM ping status is Online,
* no SSM command was run,
* no image pull or deployment was performed.

## 10. Cost-Control Notes

Cost-control posture preserved:

* no ECS created,
* no ALB created,
* no NAT Gateway created,
* no Secrets Manager setup added,
* no CloudWatch log group creation documented,
* no always-on new compute services added,
* current EC2/Nginx/DuckDNS backend architecture preserved.

## 11. Security Notes

Security posture preserved:

* EC2 pull access is separate from GitHub Actions backend push role,
* EC2 role uses AWS-native role-based access instead of long-lived AWS access keys,
* EC2 ECR policy is pull-only,
* no ECR push/delete/admin permissions were granted to EC2,
* no production environment values were documented,
* no private infrastructure values were documented,
* no credentials or secrets were documented,
* no screenshots or account metadata were documented.

## 12. What Was Not Done

The following were intentionally not done:

* no SSM command run,
* no Session Manager session started,
* no ECR login,
* no Docker image build,
* no ECR image push,
* no EC2 image pull,
* no backend workflow creation,
* no deployment script creation,
* no Docker/container restart,
* no Nginx reload,
* no Certbot action,
* no DuckDNS change,
* no RDS change,
* no Prisma commands,
* no production migrations,
* no production deployment,
* no staging, commit, or push.

## 13. Next Recommended Phase

Recommended next phase:

```text
Phase 9O: Backend Docker Image Build and ECR Push Planning
```

Alternative next phase:

```text
Phase 9O: Backend Deployment Script Implementation Planning
```

ChatGPT Architect should decide the next safest phase based on whether the project should first verify Docker image build/push behavior or design the EC2-side deployment script now that ECR pull access and SSM managed node readiness are in place.

## 14. Current Git Status

Current git status should be captured after this report is created using:

```text
git status --short
```

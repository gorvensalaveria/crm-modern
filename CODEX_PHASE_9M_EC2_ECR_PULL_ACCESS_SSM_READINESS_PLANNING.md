# CODEX Phase 9M: EC2 ECR Pull Access and SSM Readiness Planning

## 1. Phase Name and Purpose

Phase 9M plans the next backend CI/CD readiness step: safely preparing EC2 ECR pull access and SSM readiness for future ECR-based backend deployment.

This phase is documentation/planning-only. It does not modify AWS, create IAM roles or policies, attach or modify EC2 instance profiles, modify SSM, SSH, run commands, pull images, restart containers, or deploy production.

## 2. Why EC2 ECR Pull Access Is Needed

The selected backend deployment direction uses ECR as the backend image registry while keeping the current EC2 backend runtime.

EC2 ECR pull access is needed so the production backend host can eventually pull selected backend images from:

```text
crm-modern-backend
```

The future deployment path should avoid long-lived AWS access keys and use AWS-native IAM role credentials where practical.

## 3. Why SSM Readiness Is Needed

Phase 9G recommended AWS Systems Manager Run Command as the preferred future controlled deployment execution mechanism.

SSM readiness is needed so a future approved workflow or manual operation can execute reviewed deployment commands on EC2 without using GitHub Actions SSH as the primary method.

SSM should only be used after:

* EC2 ECR pull access is ready,
* deployment script exists and is reviewed,
* Docker build/push workflow exists or manual image push is approved,
* rollback path is reviewed,
* health checks are confirmed.

## 4. Current Completed Readiness State From Phase 9L

Phase 9L completed:

* private ECR repository created:
  * `crm-modern-backend`
  * `ap-southeast-1`
  * private
  * AES-256
  * Mutable + exclusions
* ECR lifecycle policy created:
  * keeps latest 20 `sha-*` images
  * expires untagged images after 7 days
* backend GitHub Actions OIDC role created:
  * `crm-modern-backend-github-actions-oidc-role`
  * separate from frontend role
  * trust scoped to `gorvensalaveria/crm-modern`
  * branch `main`
* backend ECR push inline policy attached:
  * `crm-modern-backend-ecr-push-policy`
  * ECR push only
  * no delete/admin permissions

Current backend architecture remains:

* EC2 + Docker + Nginx + Certbot HTTPS + DuckDNS + private RDS PostgreSQL.

Backend domain:

```text
https://aucrm.duckdns.org
```

Backend API:

```text
https://aucrm.duckdns.org/api/...
```

## 5. Current Deferred Items

Deferred items:

* EC2 ECR pull access,
* SSM readiness verification,
* Docker image build,
* ECR image push,
* EC2 image pull,
* backend workflow creation,
* deployment script creation,
* container restart,
* Prisma commands,
* production migrations,
* production deployment.

No Docker image has been built. No image has been pushed to ECR. No image has been pulled on EC2. No container has been restarted. No production deployment has occurred.

## 6. Recommended EC2 ECR Pull Access Model

Recommended model:

```text
EC2 IAM role / instance profile with ECR pull-only permissions
```

Rules:

* do not store AWS access keys on EC2,
* do not give EC2 push permissions,
* do not give EC2 delete permissions,
* do not give EC2 broad ECR permissions,
* do not give EC2 admin/IAM/RDS/S3/CloudFront/ECS permissions for this purpose,
* keep EC2 role separate from GitHub Actions backend push role.

## 7. EC2 IAM Role / Instance Profile Planning

Later manual execution should check whether the production EC2 instance already has an IAM role/instance profile attached.

Planning outcomes:

* if no role exists, plan creation of a new EC2 role with pull-only ECR permissions,
* if a role already exists, do not casually expand it without review,
* any role attachment/modification should be reviewed before execution because it affects the production backend host.

Do not perform this check in Phase 9M.

Do not include EC2 instance ID in docs.

## 8. ECR Pull-Only Policy Planning

Conceptual EC2 pull permissions:

```text
ecr:GetAuthorizationToken
ecr:BatchCheckLayerAvailability
ecr:BatchGetImage
ecr:GetDownloadUrlForLayer
ecr:DescribeImages
```

Notes:

* `ecr:DescribeImages` is optional.
* `ecr:GetAuthorizationToken` may require broader resource scope.
* repository actions should be scoped to `crm-modern-backend` where AWS allows.
* do not include exact ARN values in public docs.
* do not include AWS account ID.

Policy must not grant:

* push permissions,
* delete permissions,
* admin permissions,
* IAM permissions,
* RDS permissions,
* unrelated S3/CloudFront permissions,
* ECS permissions.

## 9. Existing EC2 Role/Profile Discovery Plan

Later manual execution should safely determine:

* whether the production EC2 instance already has an IAM role,
* whether that role is appropriate to modify,
* whether a new role is safer,
* whether instance profile attachment would require additional caution.

Discovery should be performed through AWS Console in the later approved manual execution phase.

No EC2 role/profile discovery is performed in Phase 9M.

## 10. Safe EC2 Role Attachment Considerations

Attaching or modifying an EC2 instance profile affects the production backend host.

Safety considerations:

* review current EC2 role/profile status before changes,
* prefer least privilege,
* avoid adding unrelated permissions,
* avoid removing existing required permissions,
* avoid broad managed policies unless explicitly approved,
* confirm change is limited to ECR pull and possibly SSM readiness if approved.

Create or attach EC2 ECR pull-only role only after Architect approval in the next manual execution phase.

## 11. SSM Readiness Planning

Goal:

```text
EC2 can eventually receive SSM Run Command for controlled deployment.
```

Later manual verification should check:

* whether EC2 appears as a managed instance in Systems Manager,
* whether SSM Agent is installed/running,
* whether the EC2 IAM role includes required SSM managed instance permissions if needed,
* whether command output would be safe,
* whether future deployment script is non-interactive.

Do not run SSM commands.

Do not create SSM documents.

Do not grant broad SSM permissions in this phase.

Do not use SSM to deploy anything.

## 12. SSM Managed Instance Requirements to Verify Later

Later verification should confirm:

* managed instance visibility,
* SSM Agent readiness,
* required IAM permissions,
* network/connectivity requirements,
* non-interactive command compatibility,
* safe command output behavior.

SSM should not print secrets, run env-printing commands, or run deployment yet.

## 13. Separation Between GitHub Push Role and EC2 Pull Role

Backend GitHub Actions push role:

* pushes images to ECR,
* uses GitHub Actions OIDC,
* remains separate from frontend deployment role.

EC2 pull role:

* pulls images from ECR,
* does not push images,
* does not delete images,
* does not administer ECR,
* does not receive unrelated AWS permissions.

This separation keeps publishing and runtime deployment access easier to reason about and safer to audit.

## 14. Manual Verification Checklist

Manual verification checklist for the next phase:

* production EC2 role/profile status is known,
* EC2 ECR pull role design is reviewed,
* pull policy is pull-only,
* no AWS access keys are created,
* no push/delete/admin permissions are granted to EC2,
* SSM readiness status is known or deferred,
* no SSM command is run,
* no Docker image is pulled,
* no container restart occurs,
* backend health remains available at `https://aucrm.duckdns.org/api/health`.

## 15. What Should Be Done in the Next Manual Execution Phase

Next manual execution phase should:

* check EC2 instance profile status in AWS Console,
* decide whether to create a new EC2 pull role or modify/attach an existing role,
* create/attach EC2 ECR pull-only role only after Architect approval,
* verify SSM managed instance readiness only if safe,
* stop before image pull or deployment.

## 16. What Must Not Be Done Yet

Do not do yet:

* Docker image build,
* ECR login,
* ECR push,
* EC2 image pull,
* SSM Run Command execution,
* deployment script creation,
* backend workflow creation,
* container restart,
* Prisma commands,
* production migrations,
* production deployment.

## 17. Cost-Control Boundaries

Cost-control boundaries:

* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager unless separately approved,
* no CloudWatch log group creation unless separately approved,
* no always-on new compute services,
* IAM role/profile planning only,
* SSM readiness planning only,
* keep current EC2/Nginx/DuckDNS architecture.

## 18. Security Boundaries

Do not include or expose:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
* EC2 instance ID,
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
* long-lived AWS access keys,
* `set -x` in deployment scripts.

## 19. Proposed Next Phase

Recommended next phase:

```text
Phase 9N: EC2 ECR Pull Access and SSM Readiness Manual Execution
```

Phase 9N would be a controlled manual AWS Console phase. It may check EC2 instance profile/role status, may create/attach EC2 pull-only role only after Architect approval, and may verify SSM readiness only.

Phase 9N must still stop before image pull, workflow creation, deployment script creation, container restart, or production deployment.

## 20. Final Planning Recommendation

Recommended Phase 9M planning position:

* prefer EC2 IAM role / instance profile with ECR pull-only permissions,
* keep EC2 pull access separate from GitHub Actions backend push role,
* verify existing EC2 role/profile status before making changes,
* avoid broad permissions,
* avoid long-lived AWS access keys,
* plan SSM readiness only,
* do not run SSM commands,
* stop before image pull or deployment,
* keep the current EC2/Nginx/DuckDNS backend architecture unchanged.

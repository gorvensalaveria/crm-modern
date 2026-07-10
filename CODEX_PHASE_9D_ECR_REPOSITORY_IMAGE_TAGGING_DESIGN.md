# CODEX Phase 9D: ECR Repository and Image Tagging Design

## 1. Phase Name and Purpose

Phase 9D designs the future Amazon ECR repository, backend Docker image naming, image tagging strategy, lifecycle/retention approach, and rollback model for CRM Modern backend CI/CD.

This phase is documentation/design-only. It does not create ECR resources, modify AWS, modify workflows, modify source code, modify Dockerfiles, or touch production.

## 2. Why ECR Is Being Added

Phase 9C selected:

```text
Option D3: Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

ECR is being added to improve backend deployment maturity while preserving the existing backend architecture.

ECR will eventually allow:

* GitHub Actions to build backend Docker images,
* GitHub Actions to push versioned images using AWS OIDC,
* EC2 to pull a selected backend image,
* rollback to a previous known-working image tag,
* a future path toward ECS/Fargate if approved later.

## 3. Current Backend Deployment Baseline

Current backend architecture remains:

* EC2,
* Docker,
* Nginx,
* Certbot HTTPS,
* DuckDNS,
* private RDS PostgreSQL.

Backend domain:

```text
https://aucrm.duckdns.org
```

Backend API:

```text
https://aucrm.duckdns.org/api/...
```

Future direction:

* GitHub Actions will eventually build backend Docker images.
* GitHub Actions will eventually push backend images to ECR using AWS OIDC.
* EC2 will eventually pull a selected backend image from ECR.
* Docker API container will be replaced/restarted carefully.
* `/api/health` will be verified after deployment.

No ECR repository, backend deployment workflow, or backend ECR IAM/OIDC policy exists yet.

## 4. Proposed ECR Repository Naming

Recommended ECR repository name:

```text
crm-modern-backend
```

Why this is preferred:

* clear project name,
* clear backend purpose,
* simple to type,
* easy to use in beginner CI/CD scripts,
* avoids path-like naming complexity.

Alternative names:

```text
crm-modern-api
crm-modern-prod-api
crm-modern/backend
```

Notes:

* `crm-modern-api` is concise, but less explicit than `crm-modern-backend`.
* `crm-modern-prod-api` includes environment context, but may be too narrow if non-production environments are added later.
* `crm-modern/backend` uses a namespace-style slash, but simple flat names are easier for early CI/CD learning.

## 5. Proposed Image Naming Convention

Future image references should use the selected ECR repository plus explicit tags.

Conceptual image name:

```text
crm-modern-backend:<tag>
```

Do not document the full ECR URI in this guide because it can include deployment-sensitive account metadata.

The actual full ECR URI should be handled later through GitHub variables, AWS CLI output, or deployment scripts without exposing private account metadata in documentation.

## 6. Proposed Image Tagging Strategy

Recommended primary image tag strategy:

```text
sha-<short-git-sha>
```

Optional human-readable release tag:

```text
manual-YYYYMMDD-HHMM
```

Avoid relying only on:

```text
latest
```

Every pushed image should receive an immutable deployment tag based on the source commit. This makes it possible to know exactly what code is running.

## 7. Recommended Immutable vs Mutable Tag Approach

Recommended practical tagging model:

* every pushed image gets `sha-<short-git-sha>`,
* optionally tag the manually deployed image as `prod-current`,
* optionally retain the previous production tag as `prod-previous`.

Tag meaning:

* `sha-<short-git-sha>`: immutable rollback anchor,
* `prod-current`: mutable convenience label for current production,
* `prod-previous`: mutable convenience label for previous production.

`prod-current` and `prod-previous` can be useful, but they should not replace immutable SHA tags.

`latest` should not be the main production deployment tag because it is ambiguous and does not clearly identify the deployed source version.

## 8. Rollback Tagging Strategy

Recommended rollback logic:

1. Before deploying a new image, know the currently running image tag.
2. Keep the previous known-working SHA tag.
3. Deploy the new SHA-tagged image.
4. Verify `https://aucrm.duckdns.org/api/health`.
5. If the new image fails health checks, redeploy the previous SHA tag.
6. Do not delete the previous production image immediately.

Important rollback distinction:

* app rollback and database rollback are different risks,
* rolling back a container image is usually simpler,
* rolling back database migrations is harder and should not be done casually.

## 9. ECR Lifecycle Policy Design

Recommended lifecycle policy design for later:

* keep recent images by count, such as the last 10-20 images,
* keep images tagged with production labels longer,
* avoid unlimited image retention,
* avoid deleting the previous known-working production image,
* design lifecycle rules when the ECR repository is created.

Lifecycle rules reduce stale image storage cost and keep the repository understandable.

No lifecycle policy is implemented in this phase.

## 10. Image Retention/Cost-Control Strategy

ECR cost is mainly affected by:

* image storage,
* data transfer,
* number and size of retained images.

Cost-control recommendations:

* avoid retaining too many old backend images,
* use an ECR lifecycle policy later,
* avoid cross-region image pulls,
* keep ECR in the same region as EC2:

```text
ap-southeast-1
```

Do not add ECS, ALB, NAT Gateway, or always-on infrastructure in this phase.

## 11. GitHub Actions Image Build Context Considerations

The backend is part of the existing repository.

Future workflow design should verify:

* exact backend Dockerfile path,
* exact Docker build context,
* required build args,
* whether any generated files are needed before image build,
* whether the image should be built from repo root or backend subdirectory.

Design rules:

* do not inspect files in this phase,
* do not modify Dockerfile,
* do not modify package files,
* do not send secrets as Docker build args,
* do not bake runtime secrets into Docker images,
* runtime secrets should remain runtime-only.

## 12. Local/EC2 Pull Considerations

EC2 will eventually need permission to pull backend images from ECR.

Possible approaches to design later:

* IAM instance profile for EC2,
* controlled AWS authentication through the deployment mechanism.

Do not:

* create IAM now,
* add AWS credentials to EC2 manually in this phase,
* store long-lived AWS access keys on EC2,
* run ECR login,
* pull images,
* restart containers.

The ECR login/pull mechanism should be designed in a later phase.

## 13. Security Boundaries

Do not include or expose:

* AWS account ID,
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
* IAM role ARN,
* GitHub secrets,
* SSH private key contents,
* screenshots containing account metadata.

Do not recommend:

* printing env files,
* `cat /opt/crm-modern/env/production.env`,
* `docker compose config` with production env,
* `env`,
* baking secrets into Docker images.

## 14. Cost-Control Boundaries

Cost-control boundaries:

* documentation/design only,
* no ECR repository yet,
* no lifecycle policy yet,
* no ECS,
* no ALB,
* no NAT Gateway,
* no always-on infrastructure,
* keep ECR in the same region as EC2 when created later,
* use lifecycle policies later to avoid stale image buildup.

## 15. What Not to Create Yet

Do not create yet:

* ECR repository,
* lifecycle policy,
* image scan settings,
* IAM policies,
* IAM roles,
* GitHub variables/secrets,
* backend workflow,
* Docker image build,
* ECR login,
* image push,
* EC2 pull,
* deployment script,
* container restart,
* production migration.

## 16. Proposed Next Phase

Recommended next phase:

```text
Phase 9E: Backend ECR IAM/OIDC Access Design
```

Phase 9E should design the least-privilege IAM/OIDC access needed for GitHub Actions to push backend images to ECR and for EC2 or the chosen deployment mechanism to pull selected images safely.

## 17. Final Design Recommendation

Recommended ECR design:

* repository name: `crm-modern-backend`,
* region: `ap-southeast-1`,
* primary deployment tag: `sha-<short-git-sha>`,
* optional release tag: `manual-YYYYMMDD-HHMM`,
* optional mutable convenience tags: `prod-current` and `prod-previous`,
* avoid using `latest` as the main production deployment tag,
* retain recent images by count later, such as last 10-20 images,
* retain production-tagged images longer,
* use immutable SHA tags as rollback anchors.

This keeps backend image management understandable, rollback-friendly, and cost-conscious while preparing for ECR-based backend CI/CD in later phases.

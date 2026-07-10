# CODEX Phase 9H: Backend Deployment Script Design

## 1. Phase Name and Purpose

Phase 9H designs the future backend deployment script logic that will run on EC2 to deploy a selected backend image from ECR, preserve runtime configuration, restart/replace the API container safely, verify health, and support rollback.

This phase is documentation/design-only. It does not create deployment scripts, modify source code, modify Dockerfiles, modify package files, modify workflows, modify AWS, or touch production.

## 2. Why a Deployment Script Design Is Needed

The future ECR-based backend deployment needs a repeatable, safe script flow before any automation is created.

The script must eventually:

* accept an explicit image tag,
* reject ambiguous tags like `latest`,
* pull the selected image from ECR,
* preserve the current runtime configuration,
* replace/restart the API container,
* verify backend health,
* rollback if health fails,
* emit safe logs that do not expose secrets.

Designing the script first reduces deployment risk before GitHub Actions or SSM automation is added.

## 3. Current Backend Runtime Baseline

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

Nginx continues to proxy `/api/` traffic to the local Docker API container.

## 4. Future Script Execution Model

Future deployment script will eventually run on EC2.

Likely execution paths:

* SSM Run Command after later approval,
* manual EC2 validation first if needed.

Phase 9G recommended:

* prefer SSM Run Command as future controlled execution mechanism,
* prefer EC2 IAM instance profile/role for ECR pull access if practical,
* avoid GitHub Actions SSH as the primary method,
* avoid self-hosted runner on production EC2,
* keep Nginx/Certbot/DuckDNS unchanged.

## 5. Script Inputs

Required input:

```text
image tag, for example sha-<short-git-sha>
```

Optional future inputs:

* whether to run an approved migration step,
* dry-run mode,
* rollback target tag.

First-version recommendation:

* require explicit image tag,
* do not deploy `latest`,
* do not require secret inputs,
* do not require database credentials as script arguments,
* do not run automatic migrations unless later explicitly approved.

## 6. Script Preflight Checks

Recommended preflight checks:

* confirm image tag input is present,
* confirm image tag is non-empty,
* confirm image tag does not equal `latest`,
* confirm Docker is available,
* confirm ECR authentication can be performed using role credentials,
* confirm target image exists or can be pulled,
* confirm current container/runtime pattern is known,
* confirm runtime env source exists without printing contents,
* confirm current backend health before deployment if practical,
* confirm rollback candidate is known before replacing container.

The script should fail before container replacement if preflight checks fail.

## 7. ECR Authentication and Image Pull Logic

Future ECR pull logic should use AWS-native credentials from the EC2 role or approved deployment mechanism.

Design rules:

* use ECR login mechanism later with AWS-native credentials,
* pull selected image tag before stopping the current container where practical,
* do not print full ECR URI in public docs,
* do not hardcode AWS account ID in docs,
* avoid long-lived AWS access keys,
* fail before container replacement if image pull fails.

## 8. Current Image/Container Discovery

Later phases must verify:

* container name,
* image label/tag currently running,
* Docker run vs Docker Compose pattern,
* network/port mapping,
* restart policy,
* mounted volumes, if any,
* runtime env source.

Do not inspect now.

Do not run Docker commands now.

## 9. Runtime Environment Preservation

Production env remains on EC2.

Script design rules:

* reference runtime env source safely later without printing it,
* do not print env file path if considered sensitive,
* do not print env values,
* do not bake env into image,
* do not copy env into the Docker image,
* new container must receive the same runtime environment as current production container,
* runtime secrets remain runtime-only.

## 10. Container Replacement Strategy

Recommended replacement strategy:

* pull before stop,
* record previous image/tag,
* start new container with same runtime config source,
* keep internal port expected by Nginx,
* avoid Nginx reload unless necessary,
* verify health after start,
* if health fails, stop failed new container and restore previous image,
* remove failed temporary container only after logs are safely reviewed if needed,
* do not delete previous image immediately.

The exact Docker CLI or Docker Compose implementation should be designed after current runtime details are verified.

## 11. Health Check Logic

Primary public health check:

```text
https://aucrm.duckdns.org/api/health
```

Health check design:

* use retry logic with short delay because container startup may take time,
* health check failure should trigger rollback logic,
* health check success should mark deployment successful,
* health check output should not expose internal infrastructure.

Future optional local health check may be added later.

## 12. Rollback Logic

Rollback target should be the previous known-working SHA image tag.

Do not use:

```text
latest
```

If new deployment fails:

1. Stop failed new container.
2. Redeploy previous SHA image.
3. Run health check again.
4. Report rollback success or failure.

Rollback rules:

* do not roll back database migrations automatically,
* previous image should not be deleted immediately,
* rollback path must be tested before enabling automated deployment.

## 13. Production Migration Handling

Migrations are not part of the first deployment script by default.

Production migrations must use:

```text
prisma migrate deploy
```

Production must not use:

```text
prisma db push
prisma migrate dev
```

Migration step should be:

* optional,
* explicit,
* reviewed,
* rollback-aware,
* not run during Docker image build,
* not run automatically on every restart.

## 14. Logging and Safe Output Rules

Log high-level steps only:

* starting deploy,
* validating tag,
* pulling image,
* recording previous image tag,
* replacing container,
* checking health,
* rollback triggered/succeeded/failed.

Do not log:

* env values,
* database URLs,
* credentials,
* AWS account ID,
* full ECR URI,
* private IPs,
* RDS endpoint,
* DuckDNS token,
* Certbot email,
* secret file contents.

Avoid:

```text
set -x
```

because it may print sensitive command arguments.

## 15. Monitoring Checks After Deployment

After deployment, review:

* public backend health,
* Docker/API logs if container fails,
* Nginx logs if proxy behavior fails,
* Phase 8 CloudWatch alarms.

Phase 8 alarm areas:

* EC2 status/CPU,
* RDS CPU/storage/connections,
* CloudFront 4xx/5xx where relevant.

Do not enable new logging in this phase.

## 16. Failure Handling and Exit Codes

Future script should:

* use strict error handling, but avoid leaking secrets,
* fail fast on missing image tag,
* fail fast if `latest` is requested,
* fail before container replacement if image pull fails,
* trigger rollback if health check fails after replacement,
* return non-zero exit code on failed deployment or failed rollback,
* return zero only when deployment and health check pass.

Failure categories should be clear:

* image pull failure,
* container start failure,
* health check failure,
* rollback failure.

## 17. Idempotency and Repeatability Considerations

Future script should be safe to reason about when repeated.

Design considerations:

* deploying the same SHA tag again should be predictable,
* failed partial deployments should not leave ambiguous container state,
* previous image/tag should be recorded before replacement,
* health checks should decide success,
* rollback behavior should be deterministic,
* log output should help identify the failure stage without exposing secrets.

## 18. SSM Run Command Compatibility Considerations

Script should be compatible with future SSM Run Command execution.

Design rules:

* output should be safe for SSM logs,
* script should not require interactive input,
* script should accept image tag as a parameter later,
* script should have bounded runtime,
* script should avoid huge log output,
* script should not require SSH agent or local user prompts,
* script should be designed so GitHub Actions can trigger it later through SSM after approval.

## 19. Required Later Verification Items

Later phases must verify:

* actual deployment script path,
* actual container name,
* actual Docker command or Compose service name,
* actual internal port,
* actual runtime env source,
* whether Docker Compose is used in production,
* whether current image tag can be discovered reliably,
* whether current deployment has named containers,
* whether health endpoint timing needs retries,
* whether migrations need separate script,
* whether EC2 has or will have SSM agent/role readiness,
* whether EC2 has or will have ECR pull permissions,
* whether rollback can be tested safely.

Do not verify these in this phase.

## 20. Security Boundaries

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

## 21. Cost-Control Boundaries

Cost-control boundaries:

* design-only,
* no new AWS resources,
* no ECR repository creation,
* no IAM creation,
* no SSM setup changes,
* no CloudWatch log group creation,
* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager,
* no image pull,
* no image storage,
* no production deployment,
* keep current EC2/Nginx/DuckDNS architecture.

## 22. What Not to Create or Modify Yet

Do not create or modify:

* deployment script,
* source code,
* Dockerfile,
* `.dockerignore`,
* package files,
* workflows,
* GitHub variables/secrets,
* AWS resources,
* IAM role/policy/instance profile,
* ECR repository,
* SSM,
* EC2,
* Docker,
* Nginx,
* Certbot,
* DuckDNS,
* RDS.

Do not perform:

* Docker image pull,
* ECR login,
* image deployment,
* container restart,
* production migration.

## 23. Proposed Next Phase

Recommended next phase:

```text
Phase 9I: Backend GitHub Actions Workflow Draft
```

Phase 9I should design the future backend GitHub Actions workflow that will eventually build and push the backend image to ECR and trigger the approved deployment path only after all required infrastructure/access pieces are approved.

## 24. Final Design Recommendation

Recommended future deployment script design:

* require explicit `sha-<short-git-sha>` image tag input,
* reject `latest`,
* pull image before stopping current container,
* use AWS-native credentials for ECR pull,
* record previous image/tag before replacement,
* preserve runtime env source without printing it,
* start the new container with the same runtime configuration pattern,
* keep Nginx/Certbot/DuckDNS unchanged,
* verify `https://aucrm.duckdns.org/api/health`,
* rollback to previous known-working SHA tag if health fails,
* log only safe high-level steps,
* avoid automatic migrations in the first script version,
* remain compatible with future SSM Run Command execution.

# CODEX Phase 9Z: Backend Deployment Script and Rollback Planning

## 1. Phase Name and Purpose

Phase 9Z plans a future EC2 backend deployment script and rollback flow using an explicit selected ECR image tag.

This phase is planning/documentation-only. It does not create a deployment script, run Docker, pull images, modify AWS, run SSM, SSH, restart containers, run Prisma commands, run migrations, or deploy production.

## 2. Current Readiness Context

Phase 9C selected the D3 backend CI/CD direction:

* keep current EC2 backend runtime,
* use Amazon ECR as backend image registry.

Phase 9N completed EC2 pull and SSM readiness:

* EC2 pull/SSM role created,
* EC2 role attached to production EC2,
* EC2 has ECR pull-only access,
* SSM managed node visible and online.

Phase 9R completed local backend Docker build validation.

Phase 9V created:

```text
.github/workflows/deploy-backend-image.yml
```

Phase 9Y completed the first controlled backend ECR build-and-push workflow run:

* workflow succeeded,
* backend image pushed to ECR repository `crm-modern-backend`,
* image tag format: `sha-<short-git-sha>`,
* no `latest` tag used,
* no EC2 pull,
* no SSM command,
* no container restart,
* no Prisma migration,
* no production deployment.

Current backend production architecture:

* EC2 + Docker,
* Nginx reverse proxy,
* Certbot HTTPS,
* DuckDNS backend domain,
* private RDS PostgreSQL,
* protected EC2 runtime env source.

Backend public health endpoint:

```text
https://aucrm.duckdns.org/api/health
```

## 3. Deployment Script Purpose

The future deployment script should safely deploy one explicitly selected backend image from ECR to the existing EC2 Docker runtime.

The script should:

* accept an approved immutable image tag,
* validate that tag,
* pull the selected image,
* preserve runtime configuration,
* replace the current API container safely,
* verify health,
* roll back to the previous known-good image/container if health fails,
* emit safe logs,
* return a clear success or failure exit code.

The script should not choose an image automatically.

## 4. Recommended Future Script Path

Recommended future script path:

```text
scripts/deploy-backend-ecr.sh
```

Reasoning:

* it is clearly a repository-level deployment utility,
* it is not part of backend application source code,
* it avoids placing infrastructure/deployment behavior under `server/`,
* it is simple for future SSM Run Command or manual EC2 execution to reference,
* it leaves room for future related deployment scripts under `scripts/`.

Alternatives considered:

* `server/scripts/deploy-backend-ecr.sh`: too close to application source and may imply it is part of the server package,
* `infra/scripts/deploy-backend-ecr.sh`: reasonable long-term option, but the repo does not yet appear to be IaC/infra-structured enough to require it.

## 5. Image Tag Input and Validation Design

The future script should require one explicit image tag argument:

```text
sha-<short-git-sha>
```

Validation rules:

* tag must be present,
* tag must be non-empty,
* tag must match the expected `sha-*` pattern,
* tag must not contain shell metacharacters,
* tag must not be inferred from local state,
* tag must not be discovered automatically from ECR,
* tag must be logged only as a sanitized image tag.

Conceptual valid example:

```text
sha-abcdef1
```

## 6. Unsafe Tag Rejection

The future script must reject:

```text
latest
```

It must also reject:

* empty tag,
* missing tag,
* unvalidated input,
* tags not starting with `sha-`,
* tags containing unsafe characters,
* any command argument that appears to contain secrets.

The script should fail fast before ECR login, image pull, or container replacement if tag validation fails.

## 7. ECR Pull Design

The future script should target ECR repository:

```text
crm-modern-backend
```

Conceptual pull flow:

1. validate image tag,
2. authenticate Docker to ECR using EC2 IAM role credentials,
3. pull the selected image,
4. fail before container replacement if pull fails.

The script should not use long-lived AWS access keys.

The script should not print the full ECR URI in logs.

## 8. Current Container and Image Discovery Design

Before replacement, the script should discover and record:

* current API container name,
* current running image reference or tag,
* current Docker run or Compose pattern,
* current port mapping,
* current network settings,
* restart policy,
* runtime env source reference without printing values.

Discovery should be read-only and safe.

If the current container/image cannot be identified confidently, the script should stop before making changes.

## 9. Runtime Env Preservation Design

The script must preserve the current production runtime env source.

Runtime env rules:

* do not print env file contents,
* do not copy env file contents into logs,
* do not include `DATABASE_URL` in logs,
* do not pass secrets through command-line arguments if avoidable,
* do not bake secrets into images,
* do not use `docker compose config` with production env,
* pass runtime configuration to the new container using the same approved pattern currently used on EC2.

If the runtime env source is missing or unreadable, the script should stop before replacing the container.

## 10. Container Replacement Sequence

Conceptual deployment sequence:

1. Receive approved image tag such as `sha-<short-git-sha>`.
2. Validate tag format.
3. Confirm target repository: `crm-modern-backend`.
4. Authenticate Docker to ECR using EC2 IAM role.
5. Pull selected image from ECR.
6. Record current running API container and image tag.
7. Start replacement container with the same runtime configuration pattern currently used.
8. Run health check.
9. If health check succeeds, keep new container.
10. Optionally clean up old stopped container later.
11. If health check fails, trigger rollback.
12. Stop after deployment result.

The exact Docker command or Compose pattern should be designed only after confirming current production runtime details.

## 11. Health Check Design

Primary public health endpoint:

```text
https://aucrm.duckdns.org/api/health
```

Optional local health endpoint may be used if safer and available.

Health check design:

* use a bounded retry count,
* use a short delay between attempts,
* check for successful response status,
* avoid printing sensitive response details,
* treat health failure as deployment failure,
* require health success before marking deployment complete.

Conceptual behavior:

* health success: deployment succeeds,
* health failure: rollback starts.

## 12. Rollback Design

Rollback target:

```text
previous known-good image/container
```

Rollback sequence if the new container fails health checks:

1. stop failed new container,
2. remove failed new container if safe,
3. restore previous known-good image/container,
4. re-run health check,
5. report rollback success or failure,
6. return nonzero exit code if deployment failed.

Rollback should not roll back database migrations automatically.

The previous image should not be deleted immediately.

## 13. Safe Logging Rules

The script may print:

* sanitized image tag,
* step names,
* success/failure state,
* container names if non-sensitive,
* health status code,
* rollback started/succeeded/failed.

The script must not print:

* env file contents,
* `DATABASE_URL`,
* database password,
* RDS endpoint,
* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 instance ID,
* private IPs,
* DuckDNS token,
* Certbot email,
* private keys,
* GitHub secrets.

Avoid:

```text
set -x
env
docker compose config
```

## 14. Secret Handling Rules

Secret handling rules:

* runtime secrets remain on EC2,
* secrets are provided only through the approved runtime configuration pattern,
* secrets are not passed as script arguments,
* secrets are not baked into Docker images,
* secrets are not printed in logs,
* secrets are not copied into reports,
* production env files are not inspected or displayed.

The deployment script should treat secret exposure as a stop condition.

## 15. Prisma Migration Separation

The deployment script should not run migrations automatically.

Production migrations should remain a separate controlled phase.

Approved production migration command for a later phase:

```text
prisma migrate deploy
```

Never use in production:

```text
prisma db push
prisma migrate dev
```

Database rollback is harder than app rollback, so migration planning must remain separate from container image rollback.

## 16. SSM Compatibility Requirements

The future script should be compatible with SSM Run Command.

SSM compatibility requirements:

* non-interactive,
* explicit image tag argument,
* fail fast on invalid input,
* bounded runtime,
* safe log output,
* no `set -x`,
* no secret printing,
* nonzero exit code on failure,
* no user prompts,
* no dependency on local SSH agent.

The SSM command itself should be planned later, not in this phase.

## 17. Manual Execution Safety Requirements

Manual execution safety requirements:

* user should run only Architect-approved command,
* user should pass only a reviewed `sha-*` image tag,
* user should not paste secrets into the command,
* user should not print env files,
* user should not run migrations as part of deployment,
* user should stop if preflight checks fail,
* user should capture sanitized output only,
* user should verify health after deployment,
* user should confirm rollback result if rollback occurs.

## 18. What Must Not Be Implemented Yet

Do not implement yet:

* deployment script,
* SSM command,
* EC2 image pull,
* container restart,
* production deployment,
* Prisma migration execution,
* runtime env changes,
* Nginx changes,
* Certbot changes,
* DuckDNS changes,
* RDS changes,
* GitHub Actions deployment trigger,
* automatic deployment after ECR push.

## 19. Proposed Next Phase

Recommended next phase:

```text
Phase 10A: Backend Deployment Script Draft
```

Phase 10A should create the deployment script only after this planning guide is accepted.

Phase 10A should still include:

* no execution,
* no EC2 pull,
* no SSM command,
* no deployment,
* no container restart,
* no migration.

## 20. Final Recommendation

Recommended future deployment script design:

* path: `scripts/deploy-backend-ecr.sh`,
* explicit `sha-<short-git-sha>` image tag input only,
* reject `latest`, empty tags, and unsafe input,
* pull selected image from `crm-modern-backend` using EC2 IAM role access,
* preserve current runtime env source without printing values,
* record current container/image before replacement,
* start replacement container using the current runtime pattern,
* require health check success before completion,
* roll back to previous known-good image/container on health failure,
* avoid automatic migrations,
* stay compatible with future SSM Run Command,
* keep logs sanitized and non-secret.

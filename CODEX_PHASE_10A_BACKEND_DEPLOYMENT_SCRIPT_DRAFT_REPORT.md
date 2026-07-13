# CODEX Phase 10A: Backend Deployment Script Draft Report

## 1. Phase Name and Purpose

Phase 10A creates the first draft of the backend EC2 deployment script that will later deploy a selected ECR image tag with health check and rollback behavior.

This phase creates the script and report only. It does not execute the script, run Docker, pull images, modify AWS, use SSM, SSH, restart containers, run Prisma commands, run migrations, or deploy production.

## 2. Script File Created

Script file created:

```text
scripts/deploy-backend-ecr.sh
```

The script is a draft for later review and must not be executed until a separate execution phase is approved.

## 3. Script Path

Recommended and implemented draft script path:

```text
scripts/deploy-backend-ecr.sh
```

This keeps deployment utility logic outside backend application source while remaining easy to reference from future manual or SSM-based execution.

## 4. Input Validation Behavior

The script accepts exactly one argument:

```text
sha-<short-git-sha>
```

Validation requires:

```text
sha-<7 to 40 lowercase hex characters>
```

The script rejects:

* `latest`,
* empty tag,
* missing tag,
* tags that do not match the validated `sha-*` format,
* extra arguments.

The usage message does not reveal secrets.

## 5. ECR Registry Resolution Approach

The script does not hardcode an AWS account ID.

The script does not hardcode a full ECR URI.

It resolves the ECR registry dynamically with AWS CLI using:

```text
aws ecr describe-repositories
```

The resolved registry is used internally and is not printed in sanitized script logs.

The script logs in to ECR using EC2 IAM role credentials through AWS CLI and Docker login.

## 6. Container Replacement Approach

The script uses configurable non-secret constants:

```text
AWS_REGION="ap-southeast-1"
ECR_REPOSITORY="crm-modern-backend"
APP_CONTAINER_NAME="crm-modern-api"
APP_PORT="4000"
HEALTH_URL="https://aucrm.duckdns.org/api/health"
ENV_FILE="/opt/crm-modern/env/production.env"
```

Important review note:

* `APP_CONTAINER_NAME` must be reviewed against the actual production API container name before execution.
* This phase does not inspect EC2 to determine the real production container name.

Replacement behavior:

* identify an existing container by `APP_CONTAINER_NAME`,
* capture previous image reference if present,
* stop and rename the old container to a timestamped rollback name,
* start a replacement container with the selected image,
* bind to `127.0.0.1:${APP_PORT}:${APP_PORT}`,
* use `--restart unless-stopped`,
* use the configured runtime env file with `--env-file`.

## 7. Health Check Behavior

The script checks:

```text
https://aucrm.duckdns.org/api/health
```

Health check behavior:

* bounded retries,
* short delay between attempts,
* sanitized status logging,
* success requires a 2xx response,
* failure triggers rollback.

Health success is required before deployment is considered complete.

## 8. Rollback Behavior

If replacement startup or health check fails, the script:

* stops/removes the failed new container,
* restores the previous container by renaming the rollback container back,
* starts the previous container,
* re-runs the health check,
* exits nonzero if deployment failed,
* exits nonzero if rollback also fails.

On successful deployment, the draft script removes the old renamed rollback container after the new container passes health check.

This cleanup behavior should be reviewed before execution because retaining the previous stopped container temporarily may be safer for the first real deployment.

## 9. Runtime Env Preservation Approach

The script preserves runtime configuration by using:

```text
--env-file "$ENV_FILE"
```

The script does not:

* print env file contents,
* cat the env file,
* print `DATABASE_URL`,
* pass secrets as command arguments,
* use `docker compose config`,
* bake secrets into images.

The script only checks that the configured env file exists before replacing the container.

## 10. Safe Logging Choices

The script logs only sanitized details:

* step names,
* repository name,
* image tag,
* container names,
* health result,
* success/failure state.

The script avoids:

* `set -x`,
* env printing,
* full ECR URI printing,
* secret echoing.

## 11. Prisma and Migration Exclusions

The script does not run Prisma commands.

The script does not run:

```text
prisma migrate deploy
prisma db push
prisma migrate dev
```

Production migrations remain a separate controlled phase.

## 12. SSM Compatibility Notes

The script is designed to be SSM-compatible later because it:

* is non-interactive,
* accepts explicit arguments,
* fails fast on invalid input,
* avoids `set -x`,
* avoids secret printing,
* returns nonzero on failure,
* avoids user prompts.

The SSM command itself is not created in this phase.

## 13. What Must Be Reviewed Before Execution

Before any execution phase:

* verify actual production API container name,
* verify actual runtime env file path,
* verify Docker network/port mapping matches current Nginx proxy expectations,
* verify whether the old rollback container should be retained instead of removed after success,
* verify AWS CLI and Docker availability on EC2,
* verify ECR pull permissions on EC2,
* verify health check retry timing,
* verify rollback behavior in a safe controlled plan,
* verify SSM command invocation design separately.

## 14. What Was Not Done

The following were intentionally not done:

* script was not executed,
* no Docker command was run,
* no image was built,
* no ECR login was performed,
* no image was pulled,
* no image was pushed,
* no AWS resource was modified,
* no SSM command was run,
* no SSH was performed,
* no deployment occurred,
* no container was restarted,
* no Prisma command was run,
* no migration was run,
* no env file was inspected,
* no env values were printed,
* no workflow file was modified,
* no source code was modified,
* no Dockerfile was modified,
* no `.dockerignore` was modified,
* no package file was modified,
* no staging, commit, or push was performed.

## 15. Security Boundaries Confirmed

This report does not include:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL` value,
* env file contents,
* DuckDNS token,
* Certbot email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents.

## 16. Final Recommendation

The draft script is ready for review only.

Recommended next phase:

```text
Phase 10B: Backend Deployment Script Review
```

Phase 10B should review the script for safety, correctness, runtime assumptions, rollback behavior, and SSM compatibility before any execution is approved.

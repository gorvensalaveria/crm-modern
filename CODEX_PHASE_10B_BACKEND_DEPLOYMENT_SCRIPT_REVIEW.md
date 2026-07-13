# CODEX Phase 10B: Backend Deployment Script Review

## 1. Phase Name and Purpose

Phase 10B reviews the drafted backend EC2 deployment script for safety, correctness, production assumptions, rollback behavior, runtime env handling, and SSM compatibility before any execution is approved.

This phase is review/documentation-only. It does not execute the script, run Docker, pull images, modify AWS, run SSM, SSH, restart containers, run Prisma commands, run migrations, or deploy production.

## 2. Script Reviewed

Script reviewed:

```text
scripts/deploy-backend-ecr.sh
```

The script exists and was reviewed from the repository copy.

## 3. Major Block Review

Script header and strict mode:

* uses Bash shebang,
* uses `set -euo pipefail`,
* does not use `set -x`,
* includes an explicit note that `APP_CONTAINER_NAME` must be reviewed before execution.

Configuration block:

* defines non-secret constants for region, ECR repository, container name, app port, health URL, env file path, and health retry timing.
* does not hardcode AWS account ID.
* does not hardcode full ECR URI.

Utility functions:

* `usage` prints safe usage guidance.
* `log` prints sanitized step messages.
* `fail` prints sanitized errors and exits nonzero.
* `require_command` checks required commands without printing sensitive values.
* `validate_tag` enforces the image tag policy.

ECR functions:

* `resolve_ecr_registry` uses AWS CLI to look up the ECR repository URI and derives the registry internally.
* `ecr_login` uses AWS CLI login password and Docker login through role-based credentials.
* both avoid printing the resolved registry or full image URI in script logs.

Container helpers:

* `container_exists` checks whether a named container exists.
* `container_is_running` checks whether the named container is running.

Health check:

* uses bounded retries against the configured health URL.
* treats 2xx status as success.
* logs sanitized health status only.

Rollback function:

* restores the renamed rollback container if available.
* removes a failed active container name if needed.
* restarts the previous container and re-runs health check.
* returns failure if rollback is unavailable or unhealthy.

Main flow:

* requires exactly one image tag,
* validates command availability,
* checks that the env file path exists without printing contents,
* resolves registry,
* logs in to ECR,
* pulls the selected image,
* renames existing container to a rollback name,
* starts replacement container with the configured env file and localhost port binding,
* health-checks the replacement,
* removes old rollback container on success,
* restores previous container on startup or health failure.

## 4. Strict Mode and Debug Safety

Result:

```text
pass
```

The script uses:

```text
set -euo pipefail
```

The script does not use:

```text
set -x
```

## 5. Image Tag Validation

Result:

```text
pass
```

The script validates image tags with:

```text
^sha-[0-9a-f]{7,40}$
```

This accepts only:

```text
sha-<7 to 40 lowercase hex characters>
```

The script rejects:

* empty tag,
* missing tag,
* extra arguments,
* `latest`,
* tags outside the validated `sha-*` format.

## 6. ECR Registry Resolution

Result:

```text
pass with pre-execution verification required
```

The script resolves the ECR registry dynamically with:

```text
aws ecr describe-repositories
```

It does not hardcode AWS account ID or a full ECR URI.

The script suppresses command output and does not log the full registry value.

Before execution, EC2 AWS CLI availability, IAM role access, and ECR pull permissions must be verified safely.

## 7. ECR Login Behavior

Result:

```text
pass with pre-execution verification required
```

The script logs in with:

```text
aws ecr get-login-password
docker login --username AWS --password-stdin
```

This is appropriate for EC2 IAM role-based credentials and avoids long-lived AWS access keys.

The script suppresses login output.

## 8. Docker Pull Behavior

Result:

```text
pass
```

The script pulls the selected validated image tag and fails before container replacement if the pull fails.

The script suppresses full pull output, which helps avoid logging full image references.

## 9. Existing Container Detection

Result:

```text
requires verification before execution
```

The script identifies the current container by:

```text
APP_CONTAINER_NAME="crm-modern-api"
```

This is a major production assumption.

Before execution, the actual production API container name must be verified. If production is Docker Compose-managed or uses a different container name, the current default may not match the real API container.

## 10. Rollback Container Naming

Result:

```text
pass
```

If an existing container is found, the script renames it to:

```text
<app-container-name>-rollback-<utc-timestamp>
```

This is a clear rollback naming approach and avoids immediately deleting the previous container.

## 11. Replacement Container Startup

Result:

```text
requires verification before execution
```

The replacement container starts with:

```text
--env-file "$ENV_FILE"
--name "$APP_CONTAINER_NAME"
--restart unless-stopped
-p "127.0.0.1:${APP_PORT}:${APP_PORT}"
```

This is reasonable for a localhost Nginx reverse proxy pattern, but the following must be verified before execution:

* actual production API container name,
* whether production is Docker Compose-managed,
* actual internal API port,
* actual host binding expected by Nginx,
* whether additional Docker network settings are required,
* whether volumes or other runtime options are required.

## 12. Runtime Env Preservation

Result:

```text
pass with pre-execution verification required
```

The script preserves runtime env with:

```text
--env-file "$ENV_FILE"
```

It checks the env file path exists but does not print contents.

It does not:

* cat env files,
* print env,
* run `docker compose config`,
* print `DATABASE_URL`,
* pass secrets as command arguments.

The configured env file path must be verified before execution without printing its contents.

## 13. Health Check Retry Behavior

Result:

```text
pass with recommended improvement
```

The script uses:

* `HEALTH_RETRIES="12"`,
* `HEALTH_DELAY_SECONDS="5"`,
* public health URL: `https://aucrm.duckdns.org/api/health`,
* 2xx status as success.

This provides a bounded health check window.

Recommended improvement:

* later support a local health check endpoint in addition to the public endpoint, because a local endpoint may isolate app/container health from DNS/TLS/proxy factors.

## 14. Rollback on Startup Failure

Result:

```text
pass
```

If `docker run` fails, the script attempts to restore the previous renamed container if available.

It exits nonzero after reporting that deployment failed, whether rollback succeeds or fails.

## 15. Rollback on Health Failure

Result:

```text
pass
```

If the new container fails health checks, the script:

* removes the failed new container,
* restores the previous renamed container,
* starts the previous container,
* re-runs health check,
* exits nonzero if deployment failed.

This matches the intended rollback model.

## 16. Rollback Retention Behavior

Result:

```text
requires revision or explicit approval before first real deployment
```

On successful deployment, the script removes the old renamed rollback container.

This may be too aggressive for the first real production deployment. A safer first-production behavior would be one of:

* retain the rollback container temporarily after success,
* make cleanup configurable,
* require a separate cleanup command after manual verification.

This should be addressed before a real deployment execution phase.

## 17. Safe Logging Behavior

Result:

```text
pass
```

The script logs:

* step names,
* repository name,
* image tag,
* container names,
* health result,
* success/failure state.

The script does not intentionally log:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* `DATABASE_URL`,
* env file contents,
* database credentials,
* RDS endpoint,
* private IPs,
* DuckDNS token,
* Certbot email,
* private keys,
* GitHub secrets.

## 18. Prisma and Migration Review

Result:

```text
pass
```

The script contains no Prisma commands and no migration commands.

It does not run:

```text
prisma migrate deploy
prisma db push
prisma migrate dev
```

Production migrations remain separate from this deployment script.

## 19. SSM Compatibility

Result:

```text
pass with pre-execution verification required
```

The script is compatible with future SSM Run Command because it:

* is non-interactive,
* accepts explicit arguments,
* avoids `set -x`,
* avoids secret printing,
* returns nonzero on failure,
* avoids prompts.

Before SSM execution, the command invocation, working directory, script path on EC2, permissions, output handling, and timeout behavior must be planned.

## 20. Blocking Issues Before Execution

Script ready for future execution:

```text
no
```

Blocking issues before execution:

* verify actual production API container name,
* verify whether production is Docker Compose-managed,
* verify runtime env file path without printing contents,
* verify port mapping and Nginx upstream expectations,
* verify whether additional Docker network/volume/runtime options are required,
* verify AWS CLI, Docker, and curl availability on EC2,
* verify rollback retention behavior; current immediate rollback-container cleanup may be too aggressive,
* verify whether local health check support should be added before first real deployment.

## 21. Non-Blocking Improvements

Non-blocking improvements:

* make rollback cleanup configurable,
* add optional local health URL support,
* add a dry-run/preflight mode that validates inputs and dependencies without replacing containers,
* log Docker image tag and container names only, while continuing to suppress full image URI,
* consider a configurable Docker network if production uses a custom network.

## 22. Required Before Execution

Required before execution:

* verify actual production container name,
* verify env file path,
* verify port mapping and Nginx upstream,
* verify AWS CLI/Docker/curl availability on EC2,
* verify ECR pull access still works on EC2,
* verify Docker runtime mode, especially Docker Compose versus direct Docker run,
* verify rollback retention behavior,
* decide whether local health check should be added,
* review SSM invocation design separately.

## 23. Review Conclusion

Script ready for future execution:

```text
no
```

Blocking issues:

* production runtime assumptions must be discovered and verified before execution,
* rollback cleanup behavior should be revised or explicitly approved,
* local health check support should be considered before first real deployment.

Overall conclusion:

* the script is a good structural draft,
* it is not yet ready to execute against production,
* the next safest step is runtime assumption discovery, not deployment.

## 24. Recommended Next Phase

Recommended next phase:

```text
Phase 10C: EC2 Runtime Assumption Discovery Guide
```

This is preferred over immediate script revision because the main blockers depend on production runtime facts that should be discovered safely first.

Phase 10C should plan safe, sanitized discovery of:

* actual API container name,
* Docker run versus Docker Compose shape,
* port bindings,
* Nginx upstream expectations,
* env file path existence without printing contents,
* Docker network and volume requirements,
* AWS CLI/Docker/curl availability.

## 25. What Was Not Done

The following were intentionally not done:

* deployment script was not executed,
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
* no `docker compose config` was run,
* no production env file was read,
* deployment script was not modified,
* workflow files were not modified,
* source code was not modified,
* Dockerfile was not modified,
* `.dockerignore` was not modified,
* package files were not modified,
* no staging, commit, or push was performed.

## 26. Security Boundaries Confirmed

This review does not include:

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

## 27. Current Git Status

Current git status should be captured after this review is created using:

```text
git status --short
```

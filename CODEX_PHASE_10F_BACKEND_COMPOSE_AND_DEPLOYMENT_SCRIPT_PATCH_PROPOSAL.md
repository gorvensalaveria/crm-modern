# CODEX Phase 10F: Backend Compose and Deployment Script Patch Proposal

## 1. Purpose

Phase 10F provides a patch proposal and manual edit instructions for revising the backend production Docker Compose file and backend ECR deployment script.

This phase is patch-proposal/instruction-only. It does not modify operational/deployment files.

The user will inspect and apply any approved operational/deployment changes manually.

## 2. Files Proposed for Future Manual Editing

Future manual edits would affect:

```text
docker-compose.prod.yml
scripts/deploy-backend-ecr.sh
```

Do not apply these edits in Phase 10F.

## 3. Design Summary

Recommended design:

```text
Docker Compose remains the production deployment mechanism.
```

The future patch should:

* keep Compose service `api`,
* preserve Compose-managed runtime,
* preserve restart policy `unless-stopped`,
* preserve backend port `4000` compatibility with Nginx,
* add `env_file: /opt/crm-modern/env/production.env`,
* reduce secret-dependent Compose interpolation,
* support selected backend image through non-secret `BACKEND_IMAGE`,
* avoid `latest`,
* revise the deployment script to use Compose rather than direct `docker run`,
* use local health first and public health second,
* roll back to the previous image if health fails.

## 4. Why env_file Is Better Than Manual Shell Sourcing

The current production shape appears to rely on shell-sourced variables before running Compose.

Using `env_file` is safer and more repeatable for this project because:

* runtime env injection is declared in Compose,
* the operator does not need to manually source secrets into the shell,
* SSM-compatible execution becomes easier to reason about,
* the deployment script can avoid printing env values,
* the Compose file documents where runtime env comes from without exposing contents.

Important distinction:

```text
env_file injects variables into the container.
Compose interpolation is separate and happens while Compose parses the YAML.
```

Therefore, a future Compose patch should remove or simplify secret-dependent interpolation in the YAML. Keep only non-secret static `environment` entries if needed.

## 5. Why Compose Should Remain the Deployment Mechanism

Phase 10D found production is already Compose-managed:

* project: `app`,
* service: `api`,
* container: `app-api-1`,
* network: `app_default`,
* restart policy: `unless-stopped`,
* Nginx targets backend port `4000`.

Keeping Compose avoids a deployment-style change. Direct `docker run` would risk drift between the Compose file and the actual running service.

## 6. BACKEND_IMAGE Selection Model

The future Compose file should use a non-secret image selector:

```text
BACKEND_IMAGE
```

The future deployment script should construct the selected ECR image internally from:

* resolved ECR registry,
* repository name,
* validated `sha-*` tag.

The script should pass `BACKEND_IMAGE` only to the Compose command invocation and should not print the full image URI.

The Compose file should reject missing image selection with a clear interpolation requirement:

```yaml
image: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
```

This does not expose secrets because `BACKEND_IMAGE` is an image reference selector, not a credential. The script should still avoid printing the full value because it may include account/registry metadata.

## 7. Proposed Compose Patch

Manual edit target:

```text
docker-compose.prod.yml
```

Proposed unified diff-style patch:

```diff
 services:
   api:
-    build:
-      context: .
-      dockerfile: server/Dockerfile
-    image: crm-modern-api:prod
+    image: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
     restart: unless-stopped
     ports:
       - "${HOST_API_PORT:-4000}:4000"
+    env_file:
+      - /opt/crm-modern/env/production.env
     environment:
       NODE_ENV: production
-      PORT: ${PORT:-4000}
-      DATABASE_URL: ${DATABASE_URL:?DATABASE_URL is required}
-      CLIENT_ORIGIN: ${CLIENT_ORIGIN}
-      AI_PROVIDER: ${AI_PROVIDER:-local}
-      OPENAI_MODEL: ${OPENAI_MODEL:-gpt-5.4-mini}
-      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
+      PORT: "4000"
```

Manual edit notes:

* Remove the production `build` block so production deployment uses the selected published image.
* Replace the local image `crm-modern-api:prod` with `BACKEND_IMAGE`.
* Add `env_file` for runtime container environment injection.
* Keep only non-secret static `environment` entries.
* Do not add `latest`.
* Do not paste or inspect env file contents.
* Do not run `docker compose config`.

## 8. Proposed Deployment Script Replacement

Manual edit target:

```text
scripts/deploy-backend-ecr.sh
```

Recommended manual action:

```text
Replace the current direct-docker-run draft with a Compose-managed deployment script based on the proposal below.
```

Proposed script content:

```bash
#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="ap-southeast-1"
ECR_REPOSITORY="crm-modern-backend"
COMPOSE_PROJECT="app"
COMPOSE_FILE="/opt/crm-modern/app/docker-compose.prod.yml"
COMPOSE_SERVICE="api"
APP_CONTAINER_NAME="app-api-1"
LOCAL_HEALTH_URL="http://127.0.0.1:4000/api/health"
PUBLIC_HEALTH_URL="https://aucrm.duckdns.org/api/health"
HEALTH_RETRIES="12"
HEALTH_DELAY_SECONDS="5"

usage() {
  cat <<'USAGE'
Usage: deploy-backend-ecr.sh sha-<short-git-sha>

Deploys one explicitly selected backend image tag through Docker Compose.

Requirements:
  - tag must match sha-<7 to 40 lowercase hex characters>
  - do not use latest
  - do not pass secrets as arguments
USAGE
}

log() {
  printf '[deploy-backend] %s\n' "$*"
}

fail() {
  printf '[deploy-backend] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command is not available: $1"
}

require_docker_compose() {
  docker compose version >/dev/null 2>&1 || fail "Docker Compose support is not available."
}

validate_tag() {
  local tag="$1"

  if [[ -z "$tag" ]]; then
    fail "Image tag is required."
  fi

  if [[ "$tag" == "latest" ]]; then
    fail "Refusing to deploy latest. Use an explicit sha-* tag."
  fi

  if [[ ! "$tag" =~ ^sha-[0-9a-f]{7,40}$ ]]; then
    fail "Invalid image tag. Expected sha-<7 to 40 lowercase hex characters>."
  fi
}

resolve_ecr_registry() {
  local repository_uri

  if ! repository_uri="$(aws ecr describe-repositories \
    --repository-names "$ECR_REPOSITORY" \
    --region "$AWS_REGION" \
    --query 'repositories[0].repositoryUri' \
    --output text 2>/dev/null)"; then
    fail "Unable to resolve ECR repository. Check EC2 role permissions and repository name."
  fi

  if [[ -z "$repository_uri" || "$repository_uri" == "None" ]]; then
    fail "ECR repository was not found."
  fi

  printf '%s\n' "${repository_uri%%/*}"
}

ecr_login() {
  local registry="$1"

  if ! aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$registry" >/dev/null 2>&1; then
    fail "ECR login failed."
  fi
}

current_container_image() {
  docker inspect -f '{{.Config.Image}}' "$APP_CONTAINER_NAME" 2>/dev/null || true
}

compose_up_with_image() {
  local image_ref="$1"

  BACKEND_IMAGE="$image_ref" docker compose \
    -p "$COMPOSE_PROJECT" \
    -f "$COMPOSE_FILE" \
    up -d --no-deps "$COMPOSE_SERVICE" >/dev/null
}

health_check_url() {
  local label="$1"
  local url="$2"
  local attempt status

  for attempt in $(seq 1 "$HEALTH_RETRIES"); do
    status="$(curl -fsS -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"

    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
      log "${label} health check passed with status ${status}."
      return 0
    fi

    log "${label} health check attempt ${attempt}/${HEALTH_RETRIES} did not pass."
    sleep "$HEALTH_DELAY_SECONDS"
  done

  return 1
}

health_check_all() {
  health_check_url "Local" "$LOCAL_HEALTH_URL" && \
    health_check_url "Public" "$PUBLIC_HEALTH_URL"
}

rollback_to_image() {
  local previous_image="$1"

  if [[ -z "$previous_image" ]]; then
    log "No previous image is available for rollback."
    return 1
  fi

  log "Rolling back Compose service to previous image."

  if ! compose_up_with_image "$previous_image"; then
    log "Rollback Compose update failed."
    return 1
  fi

  if health_check_all; then
    log "Rollback health checks passed."
    return 0
  fi

  log "Rollback health checks failed."
  return 1
}

main() {
  if [[ "$#" -ne 1 ]]; then
    usage
    exit 2
  fi

  local image_tag="$1"
  validate_tag "$image_tag"

  require_command aws
  require_command docker
  require_command curl
  require_docker_compose

  if [[ ! -f "$COMPOSE_FILE" ]]; then
    fail "Compose file was not found. Refusing to continue."
  fi

  log "Starting Compose-managed backend deployment."
  log "Repository: ${ECR_REPOSITORY}"
  log "Image tag: ${image_tag}"
  log "Compose project: ${COMPOSE_PROJECT}"
  log "Compose service: ${COMPOSE_SERVICE}"

  local ecr_registry image_ref previous_image

  previous_image="$(current_container_image)"

  if [[ -n "$previous_image" ]]; then
    log "Previous image reference captured for rollback."
  else
    log "No previous image reference found. Rollback may be unavailable."
  fi

  log "Resolving ECR registry."
  ecr_registry="$(resolve_ecr_registry)"
  image_ref="${ecr_registry}/${ECR_REPOSITORY}:${image_tag}"

  log "Logging in to ECR using role credentials."
  ecr_login "$ecr_registry"

  log "Pulling selected backend image."
  if ! docker pull --quiet "$image_ref" >/dev/null 2>&1; then
    fail "Image pull failed."
  fi

  log "Updating Compose service with selected image."
  if ! compose_up_with_image "$image_ref"; then
    log "Compose service update failed."
    if rollback_to_image "$previous_image"; then
      fail "Deployment failed. Previous image was restored."
    fi
    fail "Deployment failed and rollback failed."
  fi

  log "Running health checks."
  if health_check_all; then
    log "Backend deployment completed successfully."
    log "Active image tag: ${image_tag}"
    return 0
  fi

  log "Health checks failed. Starting rollback."

  if rollback_to_image "$previous_image"; then
    fail "Deployment failed. Previous image was restored."
  fi

  fail "Deployment failed and rollback failed."
}

main "$@"
```

## 9. Deployment Script Explanation

The proposed script:

* keeps strict mode,
* keeps `set -x` out,
* accepts exactly one image tag,
* rejects `latest`,
* validates only `sha-<7 to 40 lowercase hex characters>`,
* fails early if `aws`, `docker`, `curl`, or Docker Compose support is missing,
* captures the previous running image for rollback,
* resolves ECR registry internally,
* avoids printing the full image URI,
* logs into ECR using role credentials,
* pulls the selected image,
* updates only Compose service `api`,
* uses local health first,
* uses public health second,
* rolls back to the previous image if update or health checks fail,
* avoids env printing,
* avoids `docker compose config`,
* runs no Prisma or migration commands.

## 10. Rollback Model

Compose-compatible rollback should use the previous image reference captured from the existing container.

If the new deployment fails:

1. run Compose again with `BACKEND_IMAGE` set to the previous image,
2. bring up only service `api`,
3. run local health,
4. run public health,
5. exit nonzero so failure is visible even if rollback succeeds.

This avoids direct container renaming and keeps runtime lifecycle under Compose.

## 11. Health Check Order

Recommended order:

1. local health: `http://127.0.0.1:4000/api/health`,
2. public health: `https://aucrm.duckdns.org/api/health`.

Local health should run first because it verifies the backend service on the EC2 host before testing public routing through Nginx and TLS.

Public health should run second because it confirms the externally reachable API path still works.

## 12. Known Blocker

Current EC2 discovery found:

```text
aws available: no
```

This blocks real ECR deployment because the script needs AWS CLI to:

* resolve ECR repository metadata,
* get ECR login password,
* authenticate Docker to ECR.

Do not solve this in Phase 10F.

AWS CLI availability must be handled in a separately approved phase before real ECR deployment can run.

## 13. Manual Application Instructions

When ChatGPT Architect approves a later application phase:

1. Open `docker-compose.prod.yml`.
2. Apply the Compose patch manually.
3. Review that no secret values were added.
4. Open `scripts/deploy-backend-ecr.sh`.
5. Replace the direct-`docker run` script with the Compose-managed proposal.
6. Confirm the script still has executable permission if needed.
7. Do not run the script yet.
8. Do not run Docker, Compose, AWS CLI, curl, or production commands unless a later phase explicitly approves them.
9. Do not stage, commit, or push until the user chooses to do so.

## 14. Safety Notes

Do not run:

```text
docker compose config
cat /opt/crm-modern/env/production.env
env
printenv
scripts/deploy-backend-ecr.sh
docker pull
docker login
docker compose up
prisma migrate deploy
prisma db push
prisma migrate dev
```

Do not:

* inspect env variables,
* inspect env files,
* print secrets,
* deploy,
* restart containers,
* run migrations,
* use `latest`,
* modify AWS,
* run SSM,
* SSH.

## 15. Security Boundaries

Do not include or expose:

* AWS account ID,
* full ECR URI,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* public IPs,
* RDS endpoint,
* credentials,
* `DATABASE_URL` value,
* env contents,
* Certbot email,
* private key paths/material,
* secrets.

## 16. What Was Not Done

The following were intentionally not done:

* `scripts/deploy-backend-ecr.sh` was not modified,
* `docker-compose.prod.yml` was not modified,
* workflow files were not modified,
* Dockerfile was not modified,
* source code was not modified,
* package files were not modified,
* `.dockerignore` was not modified,
* no EC2 command was run,
* no SSH was performed,
* no SSM command was run,
* no Docker command was run,
* no AWS CLI command was run,
* no curl command was run against production,
* no deployment script was executed,
* no env file was inspected,
* no `docker compose config` was run,
* no image was built, pulled, or pushed,
* no container was restarted,
* no Prisma command or migration was run,
* no staging, commit, or push was performed.

## 17. Recommended Next Phase

Recommended next phase:

```text
Phase 10G: User-Applied Backend Compose + Deployment Script Patch
```

Phase 10G should:

* have the user manually apply approved edits,
* perform no production execution,
* run no EC2 commands,
* perform no deployment.

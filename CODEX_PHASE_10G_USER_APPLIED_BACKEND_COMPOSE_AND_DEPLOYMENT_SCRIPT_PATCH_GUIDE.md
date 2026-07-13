# CODEX Phase 10G: User-Applied Backend Compose and Deployment Script Patch Guide

## 1. Purpose

Phase 10G gives the user clear manual edit instructions for applying the approved Phase 10F backend Compose and deployment script patch.

This phase is manual-edit support only. Codex does not modify operational/deployment files.

The user will inspect and edit the files manually.

## 2. Files to Open Manually

Open these files manually:

```text
docker-compose.prod.yml
scripts/deploy-backend-ecr.sh
```

Do not edit workflow files, Dockerfile, source code, package files, or `.dockerignore`.

## 3. Exact Compose Edit Instructions

In `docker-compose.prod.yml`, edit only the `api` service.

Manual edits:

1. Remove the production `build` block from the `api` service.
2. Replace the current image value with the `BACKEND_IMAGE` selector:

   ```yaml
   image: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
   ```

3. Add runtime env injection:

   ```yaml
   env_file:
     - /opt/crm-modern/env/production.env
   ```

4. Keep:

   ```yaml
   restart: unless-stopped
   ```

5. Keep port `4000` compatibility with Nginx:

   ```yaml
   ports:
     - "${HOST_API_PORT:-4000}:4000"
   ```

6. Keep only non-secret static environment values:

   ```yaml
   environment:
     NODE_ENV: production
     PORT: "4000"
   ```

7. Remove secret-dependent interpolation from the `environment` block.

Remove these environment entries from Compose because runtime values should come from the env file instead:

```text
DATABASE_URL
CLIENT_ORIGIN
AI_PROVIDER
OPENAI_MODEL
OPENAI_API_KEY
```

Do not read or paste the env file contents.

## 4. Final Target Compose Backend Service Section

Copyable final target section:

```yaml
services:
  api:
    image: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
    restart: unless-stopped
    ports:
      - "${HOST_API_PORT:-4000}:4000"
    env_file:
      - /opt/crm-modern/env/production.env
    environment:
      NODE_ENV: production
      PORT: "4000"
```

Notes:

* This keeps the service name `api`.
* This keeps Compose-managed production runtime.
* This avoids `latest`.
* This avoids secret-dependent Compose interpolation for runtime secrets.
* `env_file` injects runtime variables into the container.
* `BACKEND_IMAGE` is still Compose interpolation and must be supplied by the deployment script.

## 5. Exact Deployment Script Replacement Instructions

In `scripts/deploy-backend-ecr.sh`, replace the current direct-`docker run` draft with the Compose-based script below.

The replacement script should:

* keep strict mode,
* validate `sha-*` tag,
* reject `latest`,
* require `aws`, `docker`, `curl`, and Docker Compose support,
* operate through Compose project `app` and service `api`,
* use local health first,
* use public health second,
* rollback to previous image,
* run no Prisma commands or migrations,
* print no env values,
* never run `docker compose config`.

## 6. Final Target deploy-backend-ecr.sh

Copyable final target script:

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

## 7. Manual Verification Checklist After Editing

After manually editing the files, verify by inspection only.

Check `docker-compose.prod.yml`:

* service name remains `api`,
* `build` block is removed,
* image uses `BACKEND_IMAGE`,
* `restart: unless-stopped` remains,
* port `4000` mapping remains,
* `env_file` points to `/opt/crm-modern/env/production.env`,
* `environment` contains only `NODE_ENV: production` and `PORT: "4000"`,
* no secret values were added.

Check `scripts/deploy-backend-ecr.sh`:

* strict mode remains,
* no `set -x`,
* tag validation uses `sha-*`,
* `latest` is rejected,
* required commands include `aws`, `docker`, `curl`, and Docker Compose support,
* script uses Compose project `app` and service `api`,
* local health runs before public health,
* rollback uses previous image,
* no Prisma commands,
* no migration commands,
* no env printing,
* no `docker compose config`.

Do not run:

```text
scripts/deploy-backend-ecr.sh
docker
aws
docker compose config
cat /opt/crm-modern/env/production.env
```

## 8. What to Paste Back to ChatGPT Architect

After manual edits, paste only a sanitized summary:

```text
Files edited:
- docker-compose.prod.yml
- scripts/deploy-backend-ecr.sh

Secret values added: yes/no
Script still has executable permission: yes/no/unknown
Git diff summary only, if safe:
- Compose api service changed to BACKEND_IMAGE and env_file
- Deployment script changed from direct docker run to Compose-managed flow
```

Do not paste secret values, env file contents, full ECR URI, account metadata, infrastructure identifiers, or raw sensitive output.

## 9. Reminder

AWS CLI is missing on EC2 and remains a future blocker.

Real ECR deployment cannot run until AWS CLI availability is handled in a separately approved phase.

No production execution should happen in Phase 10G.

## 10. What Not to Do

Do not:

* run the deployment script,
* run Docker,
* run AWS CLI,
* run `docker compose config`,
* read or print production env files,
* inspect env variables,
* build images,
* pull images,
* push images,
* log in to ECR,
* restart containers,
* deploy,
* run Prisma commands,
* run migrations,
* stage, commit, or push.

## 11. Security Boundaries

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

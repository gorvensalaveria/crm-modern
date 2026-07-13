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

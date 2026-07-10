# CODEX Phase 9O: Backend Dockerfile and Build Context Review

## 1. Phase Name and Purpose

Phase 9O reviews the current backend Dockerfile and Docker build context for readiness to build backend images in GitHub Actions and publish them to ECR in a later approved phase.

This phase is review/documentation-only. It does not build Docker images, modify Dockerfiles, modify `.dockerignore`, create workflows, push images, pull images, run Prisma commands, run migrations, modify AWS, or deploy production.

## 2. Current Backend Dockerfile Path

Current backend Dockerfile path:

```text
server/Dockerfile
```

No root `Dockerfile`, `api/Dockerfile`, or `apps/api/Dockerfile` was identified in the inspected paths.

## 3. Current Docker Build Context

Current production Compose build configuration uses:

```text
context: .
dockerfile: server/Dockerfile
```

This means the build context is the repository root.

The root context is currently useful because the Dockerfile needs:

* root `package.json`,
* root `package-lock.json`,
* workspace package manifests,
* `prisma/`,
* `tsconfig.base.json`,
* `shared/`,
* `server/`.

However, repo-root context can also send unrelated frontend and documentation files to the Docker daemon unless `.dockerignore` excludes them.

## 4. Dockerfile Build Flow Reviewed

The Dockerfile currently:

1. uses `node:20-bookworm-slim`,
2. installs `openssl` and `ca-certificates`,
3. copies root and workspace package manifests,
4. runs `npm ci`,
5. copies `prisma/`, `tsconfig.base.json`, `shared/`, and `server/`,
6. runs `npm run db:generate`,
7. runs `npm run build --workspace shared`,
8. runs `npm run build --workspace server`,
9. sets `NODE_ENV=production` and `PORT=4000`,
10. starts the server with `npm run start --workspace server`.

This is suitable as a baseline for a GitHub Actions image build because it builds from committed repository files and does not rely on manually copied EC2 files.

## 5. Prisma Generation and Migration Review

The Dockerfile runs:

```text
npm run db:generate
```

The root script maps this to:

```text
prisma generate --schema prisma/schema.prisma
```

This is acceptable for image build as long as Prisma generation only uses the schema and installed dependencies.

The Dockerfile does not run:

```text
prisma migrate deploy
prisma db push
prisma migrate dev
```

Production migrations are avoided during image build, which matches the Phase 9 requirements.

The Prisma schema references `DATABASE_URL` as the datasource URL, but the inspected build path does not run a database migration or database connectivity command. Actual database connectivity should remain runtime/deployment-time only.

## 6. Runtime Environment Review

Runtime environment values are expected at container runtime, not baked into the image.

`docker-compose.prod.yml` provides runtime environment variable references for the API container, including database and application configuration values. The Dockerfile itself does not copy an env file and does not set production database credentials.

This matches the intended model:

* image contains application code and generated build artifacts,
* production runtime configuration remains outside the image,
* EC2-protected runtime env source is used later at container start.

## 7. Secret Handling Review

No production env file is copied by the Dockerfile.

`.dockerignore` excludes:

```text
.env
.env.local
```

The inspected Dockerfile does not bake production secrets into image layers.

Required caution for later phases:

* do not pass production secrets as Docker build args,
* do not add env files to the Docker build context,
* do not print runtime env values in GitHub Actions logs,
* do not run `docker compose config` against production env in a way that prints secrets.

## 8. `.dockerignore` Coverage Review

Current `.dockerignore` excludes:

```text
.git
node_modules
.env
.env.local
coverage
*.log
.DS_Store
*.tsbuildinfo
uploads
server/uploads
client/dist
server/dist
shared/dist
```

Good coverage:

* excludes Git metadata,
* excludes installed dependencies,
* excludes common env files,
* excludes logs and coverage,
* excludes generated build output,
* excludes upload directories.

Potential improvement:

* consider excluding frontend source from backend image context if the backend build does not need it,
* consider excluding repository documentation files from backend image context if not needed,
* consider explicitly excluding additional env file patterns only if they exist and can be excluded safely without inspecting their contents.

## 9. Frontend/Client Context Review

The Dockerfile copies:

```text
client/package.json
```

It does not copy full client source into the image.

Reason this exists:

* the project uses npm workspaces,
* root `npm ci` expects workspace package metadata.

Concern:

* because the build context is repo root and `.dockerignore` does not exclude client source, frontend files may still be sent to the Docker daemon even though they are not copied into the final image,
* root `npm ci` may install more workspace dependencies than the backend runtime strictly needs.

This is not a deployment blocker, but it is an optimization and cost-control item before frequent CI image builds.

## 10. Local-Only File Dependency Review

The Dockerfile appears to build from committed repository files:

* root package manifests,
* workspace package manifests,
* Prisma schema directory,
* base TypeScript config,
* shared source,
* server source.

No dependency on manually copied EC2 files was identified.

The build should be reproducible in GitHub Actions if the same repository state and lockfile are available.

## 11. Database Connectivity Review

The inspected Dockerfile build path does not intentionally connect to the database.

Important distinction:

* `prisma generate` is acceptable during image build if it only reads schema and dependencies,
* production database migrations and connectivity checks must not run during Docker image build,
* runtime database connectivity should be verified only after the container starts with approved runtime configuration.

## 12. Suitability for GitHub Actions Image Build

The current Dockerfile is broadly suitable for an initial GitHub Actions build-and-push workflow because it:

* uses committed source,
* uses lockfile-based dependency installation,
* builds shared and server workspaces,
* generates Prisma client without running migrations,
* does not copy env files,
* starts the backend from built server output.

Main readiness concerns before ECR push:

* image may be larger than necessary because it is single-stage and retains dev/build dependencies,
* root `npm ci` may install client workspace dependencies,
* repo-root build context may send unnecessary frontend/docs files,
* no actual image build has been verified yet in this phase.

## 13. Required Improvements or Follow-Up Items

Recommended improvements to evaluate later:

* tighten `.dockerignore` to reduce backend build context size,
* consider excluding client source while preserving any workspace package metadata needed for `npm ci`,
* consider a multi-stage Dockerfile to keep build tooling and dev dependencies out of the final runtime image,
* consider pruning dev dependencies or using a runtime stage after server/shared builds,
* confirm the final image still contains the generated Prisma client and required runtime files,
* confirm the container listens on the internal port expected by the existing Nginx/Docker setup.

Do not make these changes until a later implementation phase is approved.

## 14. Safest Future Build Command Recommendation

Recommended future local/GitHub Actions build shape:

```text
docker build -f server/Dockerfile -t crm-modern-backend:sha-<short-git-sha> .
```

For GitHub Actions, the tag should later use the ECR repository target without documenting the full ECR URI in public project docs.

No Docker build was run in this phase.

## 15. Future ECR Tag Recommendation

Recommended immutable image tag:

```text
sha-<short-git-sha>
```

Avoid using:

```text
latest
```

Optional later mutable labels may still be used as convenience tags only after deployment and rollback behavior is designed:

```text
prod-current
prod-previous
```

Rollback should rely on immutable SHA tags.

## 16. What Must Still Be Reviewed Before Image Build/Push

Before any actual image build or ECR push:

* Architect should approve whether the current Dockerfile is acceptable for first build,
* Architect should decide whether `.dockerignore` should be tightened first,
* Dockerfile optimization should be deferred or explicitly approved,
* GitHub variables/secrets should be planned and approved,
* backend ECR push workflow should be created only in an approved phase,
* actual build output should be reviewed for secret-safe logs,
* no production database connection should be used during build,
* no migrations should run during build,
* no image should be pulled on EC2 until deployment planning is approved.

## 17. Security Boundaries Confirmed

This review did not include or expose:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL`,
* env file contents,
* DuckDNS token,
* Certbot email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents.

No env files were inspected.

## 18. What Was Not Done

The following were intentionally not done:

* no Docker image build,
* no `docker build`,
* no `docker compose`,
* no Docker container run,
* no ECR login,
* no image push,
* no image pull,
* no AWS modification,
* no SSM command,
* no SSH,
* no container restart,
* no Prisma command execution,
* no migration execution,
* no source code modification,
* no Dockerfile modification,
* no `.dockerignore` modification,
* no package file modification,
* no GitHub Actions workflow creation,
* no deployment script creation,
* no GitHub variables/secrets creation,
* no staging, commit, or push.

## 19. Final Review Recommendation

Current backend Dockerfile/build context is acceptable for a cautious first build-and-push design, with the key caveat that it is not yet optimized for CI image size or minimal dependency footprint.

Recommended next decision:

* either approve a first safe Docker image build test using the existing Dockerfile,
* or run a small implementation phase to tighten `.dockerignore` and/or introduce a multi-stage Dockerfile before first ECR push.

The safest production posture remains:

* build immutable images from committed source,
* tag with `sha-<short-git-sha>`,
* avoid `latest` as production deployment tag,
* keep runtime secrets outside the image,
* keep migrations out of image builds,
* stop before EC2 image pull or deployment until a deployment script and rollback plan are approved.

## 20. Current Git Status

Current git status should be captured after this review is created using:

```text
git status --short
```

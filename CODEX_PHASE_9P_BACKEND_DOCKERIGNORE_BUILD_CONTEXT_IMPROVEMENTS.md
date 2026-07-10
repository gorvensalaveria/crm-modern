# CODEX Phase 9P: Backend Docker Ignore and Build Context Improvements

## 1. Phase Name and Purpose

Phase 9P implements small, safe Docker build context improvements before the first backend ECR build-and-push phase.

This phase updates `.dockerignore` only and documents the change. It does not build Docker images, run Docker Compose, run npm commands, run Prisma commands, modify Dockerfiles, modify source code, modify package files, modify AWS, create workflows, or deploy production.

## 2. Current Backend Build Shape

Current intended backend image build shape:

```text
docker build -f server/Dockerfile -t crm-modern-backend:sha-<short-git-sha> .
```

Current backend Dockerfile path:

```text
server/Dockerfile
```

Current build context:

```text
.
```

The Dockerfile requires these files/directories from the repo root build context:

* `package.json`
* `package-lock.json`
* `server/package.json`
* `shared/package.json`
* `client/package.json`
* `prisma/`
* `tsconfig.base.json`
* `shared/`
* `server/`

## 3. What Changed

`.dockerignore` was updated to exclude additional local-only and frontend-only files from the backend Docker build context.

Added entries:

```text
.github
.env.*
client/*
!client/package.json
docs/
screenshots/
CODEX_*.md
README.md
AGENTS.md
vercel.json
```

Existing exclusions such as `.git`, `node_modules`, `.env`, `.env.local`, logs, generated build output, and upload directories were preserved.

## 4. Why These Changes Were Made

The backend Docker image is built from repo root because the project uses npm workspaces and shared backend dependencies. However, the backend image build does not need most root documentation, phase reports, GitHub workflow files, frontend source files, frontend config files, or local deployment metadata.

These exclusions reduce unnecessary files sent to Docker during backend image builds while keeping the current Dockerfile shape intact.

## 5. What Was Intentionally Preserved

The following required build inputs remain available:

* root `package.json`
* root `package-lock.json`
* `server/package.json`
* `shared/package.json`
* `client/package.json`
* `prisma/`
* `server/`
* `shared/`
* `tsconfig.base.json`

The update does not exclude root package manifests, server source, shared source, Prisma schema/migrations, or TypeScript base config.

## 6. Why npm Workspace Behavior Should Remain Safe

The root `package.json` declares npm workspaces:

```text
client
server
shared
```

The Dockerfile copies:

```text
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json
COPY client/package.json ./client/package.json
```

Because of that, `client/package.json` is intentionally preserved with:

```text
client/*
!client/package.json
```

This excludes frontend source/config from the backend build context while retaining the client workspace package metadata needed by `npm ci`.

The Dockerfile does not copy or build the full client source, so excluding client source should not affect the current backend image build path.

## 7. Secret Safety Notes

The update adds:

```text
.env.*
```

This broadens env-file exclusion coverage beyond the already-present `.env` and `.env.local` entries.

No env files were inspected. No env values, credentials, or production runtime secrets were documented.

## 8. What Was Not Changed

The following were intentionally not changed:

* `server/Dockerfile`
* `docker-compose.yml`
* `docker-compose.prod.yml`
* `package.json`
* `package-lock.json`
* `server/package.json`
* `shared/package.json`
* `client/package.json`
* source code
* Prisma schema or migrations
* GitHub Actions workflows
* deployment scripts

## 9. Remaining Risks

Remaining risks:

* This phase did not run `docker build`, so build success is not verified yet.
* If a future Dockerfile starts copying frontend source, the new `client/*` exclusion would need to be revisited.
* If future workspace install behavior changes and needs additional client files during install, the `client/*` exclusion may need adjustment.
* The Dockerfile remains single-stage and may still produce a larger image than a later multi-stage runtime image would.

These are acceptable for this phase because the change is intentionally small and the current Dockerfile only needs `client/package.json` from the client workspace.

## 10. What Was Not Done

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
* no npm install,
* no npm ci,
* no npm build,
* no Dockerfile modification,
* no source code modification,
* no package file modification,
* no GitHub Actions workflow creation,
* no deployment script creation,
* no GitHub variables/secrets creation,
* no staging, commit, or push.

## 11. Next Recommended Phase

Recommended next phase:

```text
Phase 9Q: Backend Docker Image Build Test Planning
```

Phase 9Q should decide whether to run a controlled local or GitHub Actions image build test using the existing `server/Dockerfile`, without pushing to ECR or deploying production unless separately approved.

## 12. Final Recommendation

The `.dockerignore` improvements are safe for the current backend build path and reduce unnecessary Docker build context content.

Before the first ECR push, the project should still verify the image build in a controlled phase and inspect build logs for secret safety.

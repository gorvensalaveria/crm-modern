# CODEX Phase 9Q: Backend Docker Image Build Test Planning

## 1. Phase Name and Purpose

Phase 9Q plans the first controlled backend Docker image build test after the Phase 9P `.dockerignore` improvements.

This phase is planning/documentation-only. It does not run Docker, build images, run containers, push images, pull images, run npm commands, run Prisma commands, modify AWS, create workflows, or affect production.

## 2. Current Readiness Context

Phase 9L completed backend ECR and GitHub Actions OIDC readiness:

* private ECR repository created: `crm-modern-backend`
* backend GitHub Actions OIDC role created
* backend ECR push policy attached

Phase 9N completed EC2 pull and SSM readiness:

* EC2 pull/SSM role created
* EC2 role attached to production EC2
* EC2 has ECR pull-only access
* SSM managed node is visible and online
* backend health remained working

Phase 9O reviewed the backend Docker build shape:

* backend Dockerfile path: `server/Dockerfile`
* build context: repo root `.`
* Dockerfile runs `npm ci`, Prisma generate, shared build, and server build
* Dockerfile does not run migrations
* Dockerfile does not copy production env files

Phase 9P tightened `.dockerignore`:

* frontend source excluded while preserving `client/package.json`
* env-file pattern coverage improved with `.env.*`
* local docs/reports excluded from backend build context

No Docker image has been built yet after the `.dockerignore` change.

## 3. Recommended First Test Location

Recommended first test location:

```text
local developer machine
```

The first build test should run locally only if Docker is available and only after Architect approval in a later phase.

## 4. Recommended First Build Command

Recommended future build command:

```text
docker build -f server/Dockerfile -t crm-modern-backend:local-build-test .
```

This command should not be run in Phase 9Q.

## 5. Why Local-First Is Safer Than GitHub Actions

Local-first is safer for the first build test because it:

* avoids publishing any image,
* avoids ECR authentication,
* avoids GitHub Actions secrets or variables,
* avoids CI/CD workflow changes,
* keeps failures local and easy to inspect,
* allows build logs to be reviewed before automation is introduced,
* avoids touching EC2, SSM, or production runtime.

GitHub Actions should come later after the local build behavior is understood.

## 6. Expected Docker Build Behavior

Expected safe build behavior:

* Docker uses repository files only.
* `npm ci` runs using `package-lock.json`.
* Prisma Client generation runs from `prisma/schema.prisma`.
* shared workspace builds.
* server workspace builds.
* no `prisma migrate deploy` runs.
* no `prisma db push` runs.
* no `prisma migrate dev` runs.
* no production env file is copied.
* no database connection is attempted.
* no production runtime container is affected.

## 7. Logs and Output to Inspect

After a later approved build test, inspect:

* Docker build step order,
* `npm ci` success or failure,
* Prisma generate output,
* shared build output,
* server build output,
* final image creation message,
* final image tag: `crm-modern-backend:local-build-test`.

## 8. Values That Must Not Appear in Logs

Build logs must not show:

* secret-looking values,
* `DATABASE_URL` value,
* production env file contents,
* RDS endpoint,
* database credentials,
* AWS credentials,
* GitHub secrets,
* private keys,
* full ECR URI,
* AWS account ID,
* EC2 identifiers,
* private IPs,
* DuckDNS token,
* Certbot email.

The literal name `DATABASE_URL` may appear in source/config references, but no actual value should appear.

## 9. Confirming No Production Secrets Are Used

The later build test should use no production env files and pass no production variables.

Safety checks:

* do not pass `--build-arg` values for secrets,
* do not provide `DATABASE_URL`,
* do not run Docker Compose,
* do not use production env files,
* confirm `.dockerignore` excludes env file patterns,
* inspect logs for absence of secret values.

No env files should be inspected or printed.

## 10. Confirming Prisma Generate Is Safe

Expected Prisma build step:

```text
prisma generate --schema prisma/schema.prisma
```

This is acceptable if it only generates Prisma Client from schema and installed dependencies.

The later build test should confirm:

* Prisma Client generation completes,
* no database connection message appears,
* no migration command appears,
* no production database endpoint appears,
* no `DATABASE_URL` value appears.

## 11. Confirming No Migrations Run

Build logs must not include:

```text
prisma migrate deploy
prisma db push
prisma migrate dev
```

If any migration command appears during image build, stop and treat that as a build safety failure.

Production migrations must remain a separate deployment-time operation in a later approved phase.

## 12. Expected Success Indicators

Expected success indicators:

* `npm ci` completes.
* Prisma Client generation completes.
* shared build completes.
* server build completes.
* final image is tagged `crm-modern-backend:local-build-test`.
* no secret values appear.
* no migration command appears.
* no production endpoint or database value appears.
* no production service is changed.

## 13. Expected Failure Handling

If the later build test fails:

* stop immediately after failure,
* do not retry with secrets,
* do not add production env,
* do not provide `DATABASE_URL`,
* do not run migrations,
* do not run the image,
* capture a sanitized error summary only,
* propose Dockerfile/package/`.dockerignore` fixes in a later approved phase if needed.

Build failure should not trigger AWS, ECR, EC2, SSM, or production actions.

## 14. Image Size and Metadata Inspection

Optional after a successful local build:

* inspect image size,
* confirm local tag exists,
* optionally review basic non-secret image metadata.

This should remain local-only and should not require running the image.

Do not inspect image layers for secrets in a way that prints sensitive content. If deeper image inspection is needed, plan it separately.

## 15. Whether to Run the Built Image

Do not run the built image during the first build test unless separately approved.

Reason:

* running the image introduces runtime env and database connectivity questions,
* runtime testing should be a separate phase,
* this first test is only about whether the image builds safely.

## 16. Whether to Push to ECR

Do not push to ECR during the first build test.

Reasons:

* first build logs should be reviewed before publishing images,
* ECR push introduces AWS authentication,
* ECR image retention and tag handling should be tested only after build behavior is confirmed.

## 17. Whether to Pull on EC2

Do not pull the image on EC2 during the first build test.

Reasons:

* EC2 pull is part of deployment readiness, not local build validation,
* pulling on EC2 would move closer to production runtime change,
* deployment script and rollback behavior are not implemented yet.

## 18. Production Impact Statement

The planned first build test should have no production impact.

It must not:

* touch EC2,
* use SSM,
* connect to RDS,
* restart containers,
* reload Nginx,
* change Certbot,
* change DuckDNS,
* run Prisma migrations,
* deploy production.

## 19. Stop Conditions

Stop immediately if:

* Docker asks for production env input,
* build logs show secret values,
* build logs show a production database endpoint,
* Prisma attempts database connectivity,
* any migration command runs,
* the build requires `DATABASE_URL`,
* the build requires AWS credentials,
* the build attempts to push or pull an image,
* the build suggests runtime/deployment actions.

Do not work around failures by adding secrets or production configuration.

## 20. Proposed Next Phase

Recommended next phase:

```text
Phase 9R: Controlled Local Backend Docker Image Build Test
```

Phase 9R should:

* run the local Docker build only after Architect approval,
* use no production env files,
* pass no `DATABASE_URL`,
* perform no ECR push,
* perform no EC2 pull,
* use no SSM,
* perform no deployment,
* capture sanitized success/failure result,
* document failure and propose fixes if build fails,
* stop before running or pushing the image if build succeeds.

## 21. Security Boundaries

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
* env file contents,
* DuckDNS token,
* Certbot email,
* private key paths/material,
* GitHub secrets,
* SSH private key contents.

## 22. What Was Not Done

The following were intentionally not done:

* no Docker build,
* no Docker image creation,
* no Docker Compose command,
* no container run,
* no npm install,
* no npm ci outside Docker,
* no npm build,
* no Prisma command,
* no migration command,
* no ECR login,
* no image push,
* no image pull,
* no AWS modification,
* no SSM command,
* no SSH,
* no container restart,
* no Dockerfile modification,
* no `.dockerignore` modification,
* no package file modification,
* no source code modification,
* no GitHub Actions workflow creation,
* no deployment script creation,
* no GitHub variables/secrets creation,
* no staging, commit, or push.

## 23. Final Planning Recommendation

The first backend Docker image build test should be local-only, build-only, and stop-only.

Recommended command for the next approved phase:

```text
docker build -f server/Dockerfile -t crm-modern-backend:local-build-test .
```

The test should verify build safety and logs only. It should not run the image, push the image, pull on EC2, use SSM, or affect production.

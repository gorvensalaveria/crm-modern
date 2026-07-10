# CODEX Phase 9F: Backend Docker Image Build Strategy

## 1. Phase Name and Purpose

Phase 9F designs how the CRM Modern backend Docker image should eventually be built for ECR-based backend CI/CD.

This phase is documentation/design-only. It does not modify source code, Dockerfiles, package files, workflows, AWS, ECR, IAM, GitHub variables/secrets, EC2, or production.

## 2. Why Backend Image Build Strategy Is Needed

The selected backend CI/CD direction requires a repeatable Docker image build process before images can be pushed to ECR and deployed on EC2.

A build strategy is needed to define:

* where the image is built,
* what Dockerfile/build context should be used,
* how dependencies and generated artifacts are handled,
* how Prisma client generation fits,
* how secrets are kept out of the image,
* how images are tagged for deployment and rollback,
* what must be verified before implementation.

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

Nginx continues to proxy `/api/` traffic to the local API container.

## 4. Future ECR-Based Image Flow

Future direction:

1. GitHub Actions builds the backend Docker image.
2. GitHub Actions tags the image with `sha-<short-git-sha>`.
3. GitHub Actions pushes the image to ECR.
4. EC2 pulls the selected image from ECR.
5. Docker API container is replaced/restarted carefully.
6. `/api/health` is verified after deployment.

This phase does not create the workflow, build an image, push to ECR, or deploy.

## 5. Docker Build Context Considerations

Later phases must verify whether the Docker build context should be:

* repository root, or
* backend/server subdirectory.

If the project uses workspaces or monorepo dependencies, repo-root build context may be required.

Design guidance:

* smaller build context is better,
* correctness matters more than minimum context size,
* `.dockerignore` should be reviewed later to avoid copying unnecessary files,
* secrets and env files must not be copied into the image.

Do not inspect or modify `.dockerignore` in this phase.

## 6. Dockerfile Path Considerations

Later phases must verify the exact backend Dockerfile path.

The Dockerfile should:

* install only needed dependencies where practical,
* build or generate required backend artifacts,
* avoid copying secrets,
* avoid requiring production env values at build time,
* run the backend using the expected production command,
* expose or use the same internal API port expected by Nginx/Docker setup.

Do not inspect or modify Dockerfile in this phase.

## 7. Monorepo/Workspace Considerations

The backend is part of the existing repository.

If the repository uses workspaces or shared packages, future build design must verify:

* whether root package metadata is needed,
* whether workspace dependencies must be installed from repo root,
* whether shared code is needed in the image,
* whether the backend build depends on generated client/server artifacts.

The image should be built from committed source, not manually copied EC2 files.

## 8. Dependency Installation Considerations

Future Docker image design should verify:

* production dependency installation strategy,
* whether dev dependencies are needed for build steps,
* whether a multi-stage build is appropriate,
* whether lockfile-based installation is used,
* whether dependency install can be cached efficiently.

The final image should contain only what is needed to run the backend where practical.

## 9. Prisma/Client Generation Considerations

The build process may need Prisma client generation.

Prisma client generation is acceptable at build time if it does not require a production database connection.

Production database migrations must not run during Docker image build.

Production migrations should remain a deployment-time/runtime operation using:

```text
prisma migrate deploy
```

Do not use in production:

```text
prisma db push
prisma migrate dev
```

Do not run Prisma commands in this phase.

## 10. Build-Time vs Runtime Configuration

Build-time configuration should be limited to non-secret values required to compile or build.

Runtime configuration should provide production values at container start.

Production runtime environment should remain on EC2 and must not be printed, copied into the image, or stored in GitHub Actions image build context.

Runtime secrets should remain runtime-only.

## 11. Secret-Handling Rules

Do not bake secrets into Docker images.

Do not include:

* `DATABASE_URL`,
* database credentials,
* DuckDNS token,
* Certbot account email,
* private keys,
* AWS credentials,
* GitHub secrets,
* production env files.

Do not use Docker build args for secrets.

Do not include `.env` files in the image.

## 12. Environment Variable Rules

Environment variable rules:

* production env values should be provided at runtime,
* production env file should remain on EC2,
* env files should not be printed,
* env files should not be copied into image layers,
* build logs should not expose runtime config,
* GitHub Actions image build should not contain production env values.

The Docker image should be generic enough to run with runtime-provided configuration.

## 13. Image Tagging During Build

Every image built for deployment should receive:

```text
sha-<short-git-sha>
```

Optional manual deployment tag:

```text
manual-YYYYMMDD-HHMM
```

Optional mutable labels later:

```text
prod-current
prod-previous
```

Do not rely on `latest` for production deployment.

This tag strategy stays consistent with Phase 9D.

## 14. Local Build vs GitHub Actions Build

Preferred future deployment image source:

```text
GitHub Actions
```

Reasons:

* reproducible from committed source,
* tied to CI and commit SHA,
* can push directly to ECR through OIDC,
* avoids manually copied EC2 files.

Local builds may still be useful for development testing, but production deployment images should be built through the approved CI/CD path once implemented.

## 15. CI Checks Before Image Build

Preferred future sequence:

1. Checkout repository.
2. Run existing CI checks where practical.
3. Build backend Docker image.
4. Tag image as `sha-<short-git-sha>`.
5. Authenticate to ECR using OIDC-based AWS credentials.
6. Push image to ECR.
7. Do not deploy automatically until a later deployment phase is approved.

CI guidance:

* prefer passing typecheck/tests/build before publishing deploy image,
* reuse existing CI knowledge where appropriate,
* do not weaken existing CI,
* do not use production database for CI tests,
* do not use production secrets in CI image build.

## 16. Production Migration Considerations

Production migrations are separate from image build.

Do not run production migrations during Docker image build.

Production migrations should be designed later as a deployment-time operation using:

```text
prisma migrate deploy
```

Database rollback is harder than app rollback, so migration execution must be reviewed carefully in later deployment design.

## 17. Image Size and Layer Caching Considerations

Future image design should consider:

* minimizing unnecessary files in the build context,
* using `.dockerignore` effectively,
* ordering Dockerfile steps for cache reuse,
* avoiding unnecessary dev tools in final runtime image where practical,
* avoiding excessive image size because image storage and transfer can affect cost.

Optimization should not come before correctness and secret safety.

## 18. Health Check Readiness Considerations

Future image should support the existing backend health endpoint:

```text
https://aucrm.duckdns.org/api/health
```

Nginx will continue proxying `/api/` to the local API container.

The container must listen on the expected internal port used by the current Nginx/Docker setup.

The exact internal port should be verified later without exposing secrets.

## 19. Security Boundaries

Do not include or expose:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
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
* long-lived AWS access keys.

## 20. Cost-Control Boundaries

Cost-control boundaries:

* design-only,
* no image builds,
* no ECR pushes,
* no ECR storage created,
* no new AWS services,
* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager,
* no CloudWatch log group creation,
* keep current EC2/Nginx/DuckDNS architecture.

## 21. What Not to Modify Yet

Do not modify:

* Dockerfile,
* `.dockerignore`,
* package files,
* source code,
* workflows,
* GitHub variables/secrets,
* AWS resources,
* ECR repository,
* IAM policy/role,
* EC2 deployment scripts.

Do not perform:

* Docker image build,
* Docker commands,
* ECR login,
* image push,
* EC2 pull,
* container restart,
* production migration.

## 22. Proposed Next Phase

Recommended next phase:

```text
Phase 9G: EC2 ECR Pull/Deploy Mechanism Design
```

Phase 9G should design how EC2 or a controlled deployment mechanism will authenticate to ECR, pull the selected image, replace/restart the API container, verify health, and support rollback.

## 23. Final Design Recommendation

Recommended backend Docker image build strategy:

* build production deployment images from committed source,
* prefer GitHub Actions as the future deployment image builder,
* verify exact Dockerfile path and build context later,
* account for monorepo/workspace needs,
* generate Prisma client at build time only if no production DB connection is required,
* keep production migrations out of image build,
* keep runtime secrets out of image layers and build logs,
* tag deployment images with `sha-<short-git-sha>`,
* do not rely on `latest`,
* run CI checks before publishing deploy images where practical,
* keep the current EC2/Nginx/DuckDNS runtime architecture.

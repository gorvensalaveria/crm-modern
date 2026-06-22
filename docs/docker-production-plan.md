# Docker Production Plan

## Purpose

This document defines the future production Docker direction for CRM Modern / Modern Fullstack.

It is a planning document only. It does not create Dockerfiles, production Compose files, Nginx configuration, AWS resources, RDS configuration, CI/CD, DNS, SSL, or deployment work.

## Current Docker Status

The current Docker setup is local-development focused.

Current known status:

- `docker-compose.yml` runs local PostgreSQL for development.
- `.dockerignore` exists and protects the future Docker build context.
- The application does not currently have production Dockerfiles.
- Production application containers have not been implemented yet.
- Amazon RDS PostgreSQL is the intended future production database target.

## Production Containerization Target

Future production Docker work should focus on containerizing the application runtime, not the production database.

Likely future container targets:

- Express API container
- Build stages for shared TypeScript code
- Build stages for server TypeScript code
- Build stages for client production assets
- Nginx container later for serving `client/dist` and reverse-proxying `/api`

The exact implementation should be handled in a later approved Dockerfile ticket.

## What Should Not Be Containerized

Production PostgreSQL should not run in Docker on EC2.

The production database should use Amazon RDS PostgreSQL because RDS provides managed database operations such as:

- Durable storage
- Backups
- Recovery options
- Database monitoring
- Security group control
- Managed maintenance options
- Separation between app runtime and data storage

Running production PostgreSQL inside Docker on the same EC2 instance would increase operational risk and make backups, recovery, scaling, and security harder.

## API Container Plan

The future API container should run the built Express server.

Expected direction:

- Build the server TypeScript code before runtime.
- Run the compiled entrypoint, likely `server/dist/server.js`.
- Use `PORT` for the API listening port.
- Connect to PostgreSQL through `DATABASE_URL`.
- Keep `.env` and real secrets outside the image.
- Use runtime environment variables supplied by the approved deployment method.
- Expose only the port needed by the internal runtime or reverse proxy.

The API image should not contain real credentials, private keys, or production environment files.

## Prisma Plan

Prisma Client generation must be handled intentionally.

Expected direction:

- Generate Prisma Client during the image build or another approved controlled setup step.
- Ensure the generated Prisma Client matches the installed dependencies and schema.
- Do not run schema-changing commands automatically on every container startup.

Database schema changes should not run automatically on every app boot because that can:

- Hide migration failures during deployment
- Apply unexpected changes at runtime
- Make rollback harder
- Create risk when multiple containers start at the same time
- Mix application startup with database administration

The migration approach should be planned and approved separately before production deployment.

## Frontend Build Plan

The Vite frontend should be built into static production assets.

Expected direction:

- Build the frontend into `client/dist`.
- Avoid relying on the Vite development proxy in production.
- Prefer same-origin `/api` calls in production where possible.
- Keep frontend build-time environment variables limited and non-secret.

The frontend output should be served by Nginx or another approved static serving approach in a later phase.

## Nginx Direction

Nginx should likely serve the frontend and reverse-proxy API traffic later.

Expected future responsibilities:

- Serve `client/dist` static files.
- Proxy `/api` requests to the API container.
- Support SPA fallback routing to `index.html`.
- Configure request body limits that match application upload behavior.
- Add basic production headers where appropriate.
- Later support SSL only after DNS and Certbot phases are approved.

Nginx configuration should not be created in this ticket.

## Build Context And `.dockerignore`

`.dockerignore` protects Docker builds by keeping local, sensitive, or unnecessary files out of the build context.

It should exclude items such as:

- `.git`
- `node_modules`
- `.env` files
- logs
- coverage output
- build output
- TypeScript build info
- local uploads
- OS/editor noise

This helps reduce image build size, prevents accidental secret inclusion, and keeps Docker builds more predictable.

## Runtime Environment And Secrets

Runtime configuration should be provided through approved deployment mechanisms, not baked into Docker images.

Examples of runtime environment variables may include:

- `DATABASE_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_API_KEY`, if live AI is approved later

Rules:

- Do not commit real secret values.
- Do not include `.env` in Docker images.
- Do not paste secrets into documentation or chat.
- Use placeholders in documentation.
- Store production secrets only in approved secret-management locations.

## Pre-Implementation Verification

Before creating Dockerfiles, verify the local application baseline.

Recommended checks:

- Confirm root workspace scripts.
- Confirm server production start script.
- Confirm `.dockerignore`.
- Run `npm run typecheck`.
- Run `npm run lint`, if available.
- Run `npm run test`.
- Run `npm run build`.
- Confirm the API health endpoint path.
- Confirm required environment variable names without exposing values.
- Confirm build outputs are generated where expected.

Any failures should be fixed before Dockerfile implementation starts.

## Open Questions Before Dockerfiles

These questions must be answered before creating Dockerfiles:

- Should the first implementation use API-only Docker first, then add Nginx/static frontend later?
- Should there be separate images for API and Nginx/static frontend?
- Should the frontend be built inside an Nginx image or copied from a separate build stage?
- What exact Node.js version should the images use?
- How should Prisma Client generation be handled?
- What is the approved migration workflow for production?
- Should uploads remain local temporarily, or should object storage be planned later?
- What runtime user should the container use?
- What ports should be exposed internally and externally?
- What should the production Compose service layout look like later?
- What deployment directory structure should be used on EC2 later?

## Out Of Scope

This ticket does not create or configure:

- Dockerfiles
- Production Docker Compose files
- AWS resources
- EC2 deployment
- Amazon RDS configuration
- Terraform
- GitHub Actions deployment CI/CD
- DNS
- SSL / Certbot
- Nginx production configuration
- Production deployment work
- `.env` changes
- Real secrets

## Acceptance Criteria

This planning ticket is complete when:

- The future production Docker direction is documented.
- The document clearly states what should and should not be containerized.
- The RDS PostgreSQL direction is documented.
- The API container direction is documented.
- The Prisma and migration risks are documented.
- The frontend and Nginx direction is documented.
- `.dockerignore` and build-context safety are documented.
- Runtime environment and secret rules are documented.
- Pre-implementation verification is documented.
- Open questions before Dockerfile creation are listed.
- No Dockerfiles, production Compose, AWS, RDS, CI/CD, DNS, SSL, Nginx config, deployment work, `.env` changes, or secrets are introduced.
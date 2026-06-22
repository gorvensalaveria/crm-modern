# Codex Architecture Feedback

## 1. My understanding of the project goal

The goal is to turn `crm-modern` into a production-style DevOps portfolio project that proves the ability to operate a real full-stack system, not only build application features.

This portfolio should demonstrate:

- reliable local Docker-backed development
- AWS deployment on a simple first-version architecture
- CI/CD through GitHub Actions
- Infrastructure as Code with Terraform after the manual deployment is understood
- basic monitoring, logs, alarms, health checks, and rollback operations
- safe secret handling
- clear documentation that explains how the system is built, deployed, verified, and operated

The intended outcome is a credible DevOps case study: a real CRM-style application running on AWS with deployment automation, operational visibility, and documentation/screenshots suitable for a portfolio.

## 2. My understanding of the selected application

The selected application is `crm-modern`, currently branded in the repository as the ASUN Migrations Platform. It is a stronger DevOps portfolio candidate than a small demo API because it already has realistic product surface area and operational needs.

The app currently includes:

- React + Vite + TypeScript frontend in `client/`
- Node.js + Express + TypeScript backend in `server/`
- shared TypeScript contracts in `shared/`
- Prisma + PostgreSQL data layer in `prisma/`
- Docker Compose for local PostgreSQL
- GitHub Actions CI in `.github/workflows/ci.yml`
- `/api/health` endpoint through the Express API
- tests, typecheck, build scripts, and database setup scripts
- domain features covering clients, matters, billing, reports, audit logs, RBAC, client portal, compliance, mock integrations, and optional AI workflows

This app is useful for the portfolio because deployment decisions are more meaningful: environment variables, database setup, API/frontend routing, health checks, logging, secrets, and operational documentation all matter.

## 3. My understanding of the target architecture

The first target architecture should stay intentionally simple:

```text
User
  -> Cloudflare DNS
  -> Nginx Reverse Proxy + SSL
  -> AWS EC2 Ubuntu Server
  -> Dockerized crm-modern app
  -> Amazon RDS PostgreSQL
  -> CloudWatch logs / monitoring
```

My understanding is that the first version should prove the full deployment path with the fewest moving parts:

- one Ubuntu EC2 instance
- Docker and Docker Compose on the instance
- Nginx as the public reverse proxy
- SSL certificate for HTTPS
- domain or subdomain routing through Cloudflare DNS
- application containers started by Compose
- local development PostgreSQL remains Docker Compose based
- AWS production PostgreSQL should use Amazon RDS, not a database container on EC2
- CloudWatch logs and basic monitoring once the app is reachable

The later target architecture can evolve after the basic deployment is working:

```text
User
  -> Cloudflare or Route 53
  -> AWS Application Load Balancer
  -> EC2 running Docker Compose
  -> RDS PostgreSQL
  -> S3 for backups or file artifacts
  -> CloudWatch logs, metrics, and alarms
  -> GitHub Actions CI/CD
  -> Terraform-managed infrastructure
```

My understanding is that RDS has now moved into the first AWS production version, while the later version can add or deepen the rest of the managed AWS architecture: ALB, S3 backups/artifacts, stronger CloudWatch integration, and Terraform-managed infrastructure.

## 4. My understanding of the required phases

The phases should happen in this order:

1. Confirm local setup
2. Review current Docker setup
3. Plan production Docker setup
4. Plan AWS EC2 deployment
5. Plan CI/CD
6. Plan Terraform
7. Plan monitoring and operations

Phase 1 must verify the existing local app before any deployment work:

- install dependencies
- create `.env` from `.env.example`
- start PostgreSQL with Docker Compose
- run Prisma generate/push/seed
- run the development server
- confirm frontend works
- confirm API works
- confirm `/api/health` works
- run typecheck, tests, and build

Phase 2 should inspect Docker and environment readiness before rewriting anything. Current initial findings:

- `docker-compose.yml` currently runs PostgreSQL only
- no Dockerfile was found during initial inspection
- the app is split into `client`, `server`, and `shared` npm workspaces
- the root scripts already support `dev`, `build`, `test`, `typecheck`, and Prisma commands
- `.env.example` exists and includes database, client origin, port, OpenAI, model, and AI provider values
- `.github/workflows/ci.yml` already runs PostgreSQL, installs dependencies, generates Prisma, pushes schema, typechecks, tests, and builds

Phase 3 should design the simplest production-ready Docker setup. The likely direction is either:

- separate production services for frontend and API, with RDS as the production database, or
- a simpler combined app image if that better fits the portfolio and current repository structure

This decision should be made after confirming how the frontend should be served in production: static assets through Nginx, a frontend container, or a combined server image. The production Compose stack should not include PostgreSQL for AWS production, because RDS is now the intended production database.

Phase 4 should deploy manually to EC2 first:

- Ubuntu EC2 instance
- Docker and Docker Compose installed
- Nginx reverse proxy
- SSL certificate
- security group with minimal open ports
- RDS PostgreSQL reachable only from the application environment
- domain/subdomain configured
- health check available at `/api/health`

Phase 5 should add GitHub Actions deployment after the manual deployment is proven:

- install dependencies
- typecheck
- test
- build
- deploy to EC2 only after checks pass
- restart containers
- run post-deploy health check
- store all deploy secrets in GitHub Secrets or GitHub Environments

Phase 6 should introduce Terraform after the manual AWS shape is known:

```text
infra/
  providers.tf
  main.tf
  variables.tf
  outputs.tf
  README.md
```

Terraform should eventually manage EC2, security group, IAM role where needed, S3, RDS PostgreSQL, and outputs.

Phase 7 should add operational polish:

- CloudWatch logs
- basic CPU alarm
- app health endpoint usage
- deployment health check
- rollback steps
- troubleshooting guide
- portfolio documentation and screenshots

## 5. Files I will inspect first

Before implementation, I will inspect:

- `README.md`
- `.env.example`
- `.gitignore`
- `docker-compose.yml`
- any current or future `Dockerfile`
- any current or future `.dockerignore`
- `.github/workflows/`
- root `package.json`
- `client/package.json`
- `server/package.json`
- `shared/package.json`
- `server/src/server.ts`
- `server/src/app.ts`
- `server/src/routes/system-routes.ts`
- `server/src/controllers/system-controller.ts`
- `client/vite.config.ts`
- `client/src/services/api.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `docs/`

## 6. Assumptions I am making

- The repository to prepare is `gorvensalaveria/crm-modern`, locally available as the current workspace.
- The first approved task is not implementation; it is confirming understanding through this feedback file.
- Kubernetes, EKS, Jenkins, and Ansible are intentionally out of scope.
- The first AWS deployment should use EC2 and Docker Compose, not a managed container platform.
- The current `docker-compose.yml` is for local PostgreSQL only and is not yet a production application Compose stack.
- The production Docker plan will need at least one application Dockerfile and likely a production Compose file, but production PostgreSQL should be RDS rather than a Compose service.
- The API listens on `PORT`, defaulting to `4000`.
- The frontend uses `VITE_API_BASE_URL` when API calls should target a non-same-origin backend.
- The existing Vite development proxy only applies in local development, not production.
- The `/api/health` endpoint is available and should become the deployment verification endpoint.
- `.env.example` is a starting point, but production deploys must use real secret stores or environment configuration, not committed values.
- `OPENAI_API_KEY` should remain optional because the app supports `AI_PROVIDER="local"` for deterministic fallback behavior.
- PostgreSQL stays containerized only for local development.
- AWS production should use the smallest appropriate free-tier or credit-eligible Amazon RDS PostgreSQL option.
- RDS Multi-AZ should not be enabled for the first portfolio version.
- RDS storage should be minimal and intentionally documented for cost control.
- Production database credentials must not be hardcoded; the production `DATABASE_URL` should come from EC2 environment configuration, a deployment secret, or GitHub Secrets/GitHub Environments.
- Terraform should be added only after the manual deployment path is known and working.
- Portfolio documentation is part of the deliverable, not an afterthought.

## 7. Questions or risks before implementation

- Should the production frontend be served by Nginx as static files, by a dedicated frontend container, or by a combined full-stack container?
- Should there be one production Compose file or separate files such as `docker-compose.yml` for local database and `docker-compose.prod.yml` for EC2 app services only?
- What domain/subdomain will be used for the portfolio deployment?
- Confirming that DNS will be managed through Cloudflare for the first version.
- Which SSL path is preferred: Certbot on EC2/Nginx, Cloudflare edge SSL with origin cert, or another approach?
- Are screenshots and public portfolio docs allowed to show ASUN branding and migration-agency domain data, or should demo labels be sanitized?
- Should deployment use SSH from GitHub Actions directly to EC2, or should the later pipeline evolve toward AWS-native deploy mechanisms?
- Should GitHub Actions deploy from `main` only, or should GitHub Environments require manual approval before production deploy?
- Should the EC2 host pull source code and build there, or should CI build images/artifacts and deploy those?
- What RDS instance class, storage size, backup retention, deletion protection, and public accessibility settings should be used for cost control and safety?
- Should RDS be private-only inside the EC2 security group path, or temporarily public-reachable with strict inbound rules for setup/debugging?
- Does the app currently write uploaded document metadata only, or are there local file artifacts that need persistent volume/S3 planning?
- Should CloudWatch receive Docker container logs through the CloudWatch agent in the first version, or is basic host monitoring acceptable first?
- Are there any budget constraints for EC2 instance size, Cloudflare DNS, CloudWatch logs retention, RDS, or later ALB?
- The documentation must include how to stop/delete EC2 and RDS resources after testing and must clearly call out AWS billing risks.
- The current `.env.example` includes `OPENAI_MODEL="gpt-5.4-mini"`; this should be verified before production docs rely on it.

## 8. Proposed first action after ChatGPT approval

After ChatGPT confirms this understanding, the first implementation action should be Phase 1 only: verify the local application setup end to end.

I would run the existing local setup flow and record the results:

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Then I would verify:

- frontend at `http://localhost:5173`
- API at `http://localhost:4000`
- health check at `http://localhost:4000/api/health`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Only after the local baseline is confirmed would I move to Docker production planning.

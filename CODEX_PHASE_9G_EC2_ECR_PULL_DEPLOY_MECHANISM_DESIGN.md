# CODEX Phase 9G: EC2 ECR Pull/Deploy Mechanism Design

## 1. Phase Name and Purpose

Phase 9G designs how the EC2 backend host will eventually pull a selected backend image from ECR, replace/restart the Docker API container safely, verify health, and support rollback.

This phase is documentation/design-only. It does not modify source code, Dockerfiles, package files, workflows, AWS, ECR, IAM, GitHub variables/secrets, EC2, Docker, Nginx, Certbot, DuckDNS, RDS, or production.

## 2. Why an EC2 Pull/Deploy Mechanism Is Needed

Phase 9C selected:

```text
Option D3: Hybrid transition with current EC2 backend plus Amazon ECR image registry
```

That means future backend CI/CD needs a safe bridge between ECR and the existing EC2 runtime.

The deploy mechanism must eventually:

* authenticate EC2 or a controlled deployment path to ECR,
* pull the selected backend image,
* preserve runtime configuration,
* replace/restart the Docker API container,
* keep Nginx proxy expectations intact,
* verify `https://aucrm.duckdns.org/api/health`,
* support rollback to the previous known-working SHA image tag.

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

Nginx continues to proxy `/api/` traffic to the local Docker API container.

## 4. Future ECR-Based Deployment Sequence

Conceptual future sequence:

1. GitHub Actions builds backend Docker image.
2. GitHub Actions pushes image to ECR.
3. EC2 pulls selected image from ECR.
4. Docker API container is replaced/restarted carefully.
5. Health endpoint is verified.
6. Rollback uses previous known-working SHA image tag if needed.

Phase 9G does not implement this sequence.

## 5. Recommended Deployment Mechanism Direction

Recommended direction to evaluate:

* prefer AWS Systems Manager Run Command as the future controlled deployment execution mechanism,
* prefer EC2 IAM instance profile/role for ECR pull access if practical,
* avoid SSH from GitHub Actions as the primary deployment method,
* avoid long-lived AWS access keys on EC2,
* avoid self-hosted runner on production EC2,
* keep Nginx/Certbot/DuckDNS unchanged.

This direction keeps deployment AWS-native, auditable, and less dependent on inbound SSH from GitHub-hosted runners.

## 6. EC2 ECR Authentication Design

Preferred future design:

* EC2 receives ECR pull permission through an IAM instance profile/role,
* EC2 uses AWS-native role credentials,
* no long-lived AWS access keys are stored on EC2,
* GitHub Actions does not need an SSH private key to execute deployment commands.

Alternative controlled design:

* GitHub Actions authenticates to AWS using OIDC,
* GitHub Actions invokes a controlled deployment mechanism such as SSM Run Command,
* the command runs on EC2,
* EC2 role provides ECR pull access.

Do not create IAM, SSM, or ECR resources in this phase.

## 7. SSM Run Command vs SSH vs Manual EC2 Execution Comparison

### Option G1: SSM Run Command + EC2 IAM Role for ECR Pull

Flow:

* GitHub Actions authenticates to AWS via OIDC.
* GitHub Actions eventually invokes SSM Run Command.
* SSM runs an approved deployment script/commands on EC2.
* EC2 role provides ECR pull access.

Pros:

* no inbound SSH from GitHub runner,
* no SSH private key in GitHub,
* AWS-native and auditable,
* aligns with job-relevant operations pattern.

Cons:

* requires SSM readiness,
* requires EC2 IAM instance profile,
* requires careful command/script design.

Recommendation:

```text
Preferred future automated direction
```

### Option G2: Manual EC2 Execution With EC2 IAM Role for ECR Pull

Flow:

* User manually SSHes to EC2 and runs approved deployment commands later.
* EC2 role provides ECR pull access.

Pros:

* safest first validation,
* easier to observe and debug,
* less automation risk.

Cons:

* not full CI/CD,
* manual and slower,
* not ideal long-term.

Recommendation:

```text
Useful first validation path before automation
```

### Option G3: GitHub Actions SSH to EC2

Flow:

* GitHub Actions uses SSH key to run deployment commands.

Pros:

* common and simple.

Cons:

* requires SSH private key in GitHub,
* requires SSH network access from GitHub runner,
* higher credential/security risk,
* less AWS-native than SSM.

Recommendation:

```text
Fallback only, not primary
```

### Option G4: Self-Hosted Runner on Production EC2

Flow:

* GitHub runner runs on production EC2.

Pros:

* deployment runs locally.

Cons:

* production runner risk,
* maintenance burden,
* security concerns,
* blurs CI and production boundaries.

Recommendation:

```text
Avoid
```

## 8. Docker Container Replacement Strategy

Recommended conceptual deployment sequence:

1. Confirm selected image tag, usually `sha-<short-git-sha>`.
2. Authenticate EC2 to ECR using AWS-native role credentials.
3. Pull selected image from ECR.
4. Record currently running image/tag before replacement.
5. Stop or replace API container using a safe Docker strategy.
6. Start new API container with the same runtime env configuration source.
7. Keep internal port/proxy expectations consistent with Nginx.
8. Run health check.
9. If health passes, mark deployment as successful.
10. If health fails, redeploy previous known-working image tag.
11. Review Docker/API logs, Nginx logs, and Phase 8 CloudWatch alarms.

Later phases must verify:

* current container name,
* current Docker run/compose pattern,
* internal port and network mapping,
* runtime env source without printing it,
* restart policy,
* whether deployment should use Docker CLI, Docker Compose, or an existing app directory/deploy script.

Do not inspect these in this phase.

## 9. Runtime Environment Preservation

Production env should remain on EC2.

Rules:

* do not print env file,
* do not copy env into image,
* do not bake secrets into image,
* new container must receive the same approved runtime configuration source as the current container,
* later deploy script design must reference env safely without exposing contents.

Runtime secrets must remain runtime-only.

## 10. Nginx Proxy Continuity

Nginx should continue proxying:

```text
/api/
```

to the local API container.

Design rules:

* avoid Nginx config changes in this deployment path unless later review proves necessary,
* new container must listen where Nginx expects it to listen,
* if health fails, check API container first, then Nginx proxy behavior.

Keep Nginx/Certbot/DuckDNS unchanged.

## 11. Health Check Strategy

Primary external health check:

```text
https://aucrm.duckdns.org/api/health
```

Optional local/internal health check can be designed later.

Health check rules:

* health check is required before marking deployment successful,
* failed health check should trigger rollback plan,
* health check should not expose private infrastructure values,
* health check should verify Nginx and API container path together.

## 12. Rollback Strategy

Rollback should use the previous known-working immutable SHA image tag.

Rules:

* record previous running image/tag before replacing container,
* do not delete previous image immediately,
* do not use `latest` as rollback target,
* rollback should redeploy immutable SHA tag,
* database rollback is different from app image rollback,
* avoid casual database migration rollback.

Rollback path must exist before the first automated deployment.

## 13. Production Migration Handling

Do not run migrations automatically until a later design explicitly approves it.

Production migrations must use:

```text
prisma migrate deploy
```

Production must not use:

```text
prisma db push
prisma migrate dev
```

Migration step should be:

* separate,
* reviewed,
* rollback-aware,
* not part of Docker image build,
* not casually tied to every container restart.

Database rollback is harder than app image rollback.

## 14. Logging and Monitoring Checks

If deployment or health check fails:

* review Docker/API logs,
* review Nginx logs if proxy behavior fails,
* review Phase 8 CloudWatch alarms after deployment.

Phase 8 alarm areas:

* EC2 status/CPU,
* RDS CPU/storage/connections,
* CloudFront 4xx/5xx where relevant.

Do not enable new logging in this phase.

## 15. Deployment Safety Gates

Future deployment should include safety gates:

* manual workflow first,
* require image tag input,
* require CI passing before deployment,
* verify selected image exists in ECR before deploy,
* record previous image tag before replacing container,
* require health check before success,
* require rollback path before first automated deploy,
* do not deploy database migrations casually,
* do not allow PR-triggered production deployment.

## 16. Required Later Verification Items

Later phases must verify:

* EC2 SSM readiness if SSM is selected,
* EC2 IAM instance profile/role design,
* ECR pull permissions,
* current Docker container name,
* current Docker run/compose pattern,
* internal port and network mapping,
* runtime env source without printing contents,
* restart policy,
* exact health check command/path,
* log review commands that do not expose secrets,
* rollback command sequence.

Do not verify these by running commands in this phase.

## 17. Security Boundaries

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

## 18. Cost-Control Boundaries

Cost-control boundaries:

* design-only,
* no new AWS resources,
* no ECR repository creation,
* no IAM creation,
* no SSM setup changes,
* no CloudWatch log group creation,
* no ECS,
* no ALB,
* no NAT Gateway,
* no Secrets Manager,
* keep current EC2/Nginx/DuckDNS architecture,
* evaluate SSM Run Command and EC2 IAM role design before creation,
* avoid adding always-on services.

## 19. What Not to Modify Yet

Do not modify:

* source code,
* Dockerfile,
* `.dockerignore`,
* package files,
* workflows,
* GitHub variables/secrets,
* AWS resources,
* IAM role/policy/instance profile,
* ECR repository,
* SSM,
* EC2,
* Docker,
* Nginx,
* Certbot,
* DuckDNS,
* RDS.

Do not create or run:

* deployment script,
* Docker image pull,
* ECR login,
* image deployment,
* container restart,
* production migration.

## 20. Proposed Next Phase

Recommended next phase:

```text
Phase 9H: Backend Deployment Script Design
```

Phase 9H should design the actual deployment script logic, including image tag input, previous-image recording, ECR pull, safe container replacement, health checks, log checks, and rollback path.

## 21. Final Design Recommendation

Recommended EC2 ECR pull/deploy mechanism:

* prefer SSM Run Command as the future controlled execution mechanism,
* prefer EC2 IAM instance profile/role for ECR pull access if practical,
* use manual EC2 execution as a safe first validation path if needed,
* keep GitHub Actions SSH as fallback only,
* avoid self-hosted runner on production EC2,
* preserve runtime env on EC2,
* keep Nginx/Certbot/DuckDNS unchanged,
* verify `https://aucrm.duckdns.org/api/health`,
* rollback to previous known-working immutable SHA tag if health fails.

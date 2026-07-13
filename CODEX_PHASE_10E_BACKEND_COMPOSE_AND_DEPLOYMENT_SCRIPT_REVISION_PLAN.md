# CODEX Phase 10E: Backend Compose and Deployment Script Revision Plan

## 1. Purpose

Phase 10E creates a revision plan for the backend Docker Compose production configuration and backend ECR deployment script, based on sanitized EC2 runtime facts discovered manually in Phase 10D.

This phase is planning/documentation-only. It does not modify deployment scripts, Compose files, workflow files, Dockerfiles, source code, package files, `.dockerignore`, AWS resources, EC2 runtime, SSM, Docker, Nginx, or production.

Codex is a technical guide. Future operational/deployment changes should be patch-first or instruction-first, and the user will apply them manually unless explicitly approved otherwise.

## 2. Current Runtime Facts Summary

Sanitized Phase 10D findings:

* `aws` is currently unavailable on EC2.
* `docker` is available.
* `curl` is available.
* production API container name is `app-api-1`.
* current API image is local image `crm-modern-api:prod`.
* production runtime is Docker Compose-managed.
* Compose project is `app`.
* Compose service is `api`.
* restart policy is `unless-stopped`.
* Docker network is `app_default`.
* mount count is `0`.
* mount destinations are none.
* current backend port behavior is port `4000`.
* Nginx proxies API traffic to `http://localhost:4000/api/`.
* runtime env file exists at `/opt/crm-modern/env/production.env`.
* public health status was `200`.
* local health status was `200`.
* current Compose file path is `/opt/crm-modern/app/docker-compose.prod.yml`.
* current Compose file uses environment variable interpolation.
* `env_file` is absent.
* Compose file includes build context and `server/Dockerfile`.
* networks and volumes were not explicitly shown in the selected safe output.

## 3. Current Problems With the Draft Script

The current draft deployment script was structurally useful, but it does not yet fit the discovered runtime facts.

Main problems:

* it assumes a direct `docker run` replacement model,
* production is currently Docker Compose-managed,
* it uses a drafted container name that does not match the discovered container,
* it does not preserve the Compose project/service model,
* it does not use Compose-native lifecycle behavior,
* it depends on AWS CLI, which is currently missing on EC2,
* it assumes direct container rename rollback, which is less natural for Compose-managed services,
* it does not yet account for Compose image selection using an ECR `sha-*` image,
* it should prefer local health first and public health second based on discovery results.

Executing the current draft script without revision would risk moving production away from its current Compose-managed shape.

## 4. Current Problems With Manually Sourced production.env

The current production Compose design appears to rely on shell-sourced variables from:

```text
/opt/crm-modern/env/production.env
```

This creates operational risk because deployment depends on the operator's shell state before running Compose.

Problems:

* secrets may need to be loaded into the shell environment,
* command history or debugging mistakes could expose sensitive values,
* future SSM execution becomes harder to reason about,
* missing shell variables can cause Compose interpolation failures,
* runtime env injection and Compose YAML interpolation become easy to confuse,
* repeatability is weaker than explicit Compose configuration.

Do not solve this by printing, reading, or documenting env file contents.

## 5. Industry-Style Improvement Recommendation

The preferred improvement is to make runtime environment injection explicit and repeatable while keeping secrets out of logs and docs.

Recommended direction:

```text
Keep Docker Compose as the deployment mechanism, and revise the production Compose design to use env_file for container runtime environment injection.
```

Important distinction:

* `env_file` injects variables into the running container.
* Compose variable interpolation is separate and happens while Compose parses the YAML.

Therefore, adding `env_file` is not enough if the Compose YAML still contains secret-dependent interpolation such as environment entries that require shell variables. A future patch should simplify or remove secret-dependent Compose interpolation, keeping only non-secret static environment entries in the YAML when needed.

## 6. Approach A: Keep Docker Compose as Deployment Mechanism

Approach A keeps the current production runtime model:

* Compose project: `app`,
* Compose service: `api`,
* Compose container pattern: `app-api-1`,
* restart policy: `unless-stopped`,
* network: `app_default`,
* Nginx proxy target: `http://localhost:4000/api/`,
* backend port: `4000`,
* runtime env file path: `/opt/crm-modern/env/production.env`.

Future Compose design should evaluate:

* adding `env_file: /opt/crm-modern/env/production.env`,
* removing or simplifying secret-dependent `environment` interpolation,
* preserving service name `api`,
* preserving project name `app`,
* preserving port `4000` behavior and Nginx compatibility,
* preserving restart policy,
* preserving current network behavior unless an explicit network is needed,
* switching image source from local `crm-modern-api:prod` to selected ECR `sha-*` image,
* passing selected image via a controlled non-secret variable such as `BACKEND_IMAGE`,
* avoiding `latest`,
* avoiding `docker compose config`,
* avoiding env output,
* avoiding Prisma migrations inside the deployment script.

Deployment script direction for Approach A:

* validate the requested `sha-*` tag,
* resolve or accept a selected image reference without printing full sensitive registry values,
* verify AWS CLI availability before any ECR operation,
* log in to ECR through EC2 IAM role credentials only after AWS CLI is available,
* pull the selected image,
* run Compose against the existing project/service,
* update only the `api` service,
* perform local health check first,
* perform public health check second,
* rollback using Compose-compatible image/service restoration.

## 7. Approach B: Replace Compose-Managed Runtime With Direct docker run

Approach B would move deployment away from Compose and use direct `docker run`.

Possible design:

* choose a stable container name,
* use `--env-file /opt/crm-modern/env/production.env`,
* attach to `app_default` or a new explicit network if required,
* preserve port `4000`,
* bind to localhost if compatible with Nginx,
* implement rename-based rollback,
* health-check and restore previous container on failure.

Risks:

* changes the production runtime model,
* abandons existing Compose project/service behavior,
* may create drift between Compose file and actual running container,
* may surprise future operators expecting Compose,
* may require manual cleanup of old Compose-managed resources,
* may complicate rollback and future maintenance.

Approach B should be avoided unless Compose is proven unsuitable.

## 8. Recommended Approach

Recommended approach:

```text
Approach A: keep Docker Compose as the deployment mechanism.
```

Reasons:

* production is already Compose-managed,
* discovered service and project names are clear,
* Nginx and health checks already work with the current Compose runtime,
* changing runtime style adds unnecessary risk,
* Compose can support controlled image replacement,
* Compose keeps deployment behavior closer to the current production shape,
* future SSM execution can still run a non-interactive Compose-based script.

No strong reason has been identified to replace Compose with direct `docker run`.

## 9. Required Changes in Future Patch

Future patch should be proposed first and applied manually by the user.

Required future changes to evaluate:

* revise `docker-compose.prod.yml` to use `env_file` for runtime env injection,
* remove or simplify secret-dependent `environment` interpolation,
* preserve non-secret static environment entries only if needed,
* revise image selection so the `api` service can use a selected ECR `sha-*` image,
* preserve service name `api`,
* preserve port `4000` behavior,
* preserve restart policy `unless-stopped`,
* avoid `latest`,
* revise `scripts/deploy-backend-ecr.sh` to operate through Compose rather than direct `docker run`,
* add AWS CLI preflight handling because AWS CLI is currently missing,
* use local health first and public health second,
* define Compose-compatible rollback.

Do not apply these changes in Phase 10E.

## 10. Script Revision Direction

Future script revision should:

* remain Bash with strict mode,
* keep `set -euo pipefail`,
* never use `set -x`,
* accept exactly one `sha-*` image tag,
* reject `latest`,
* avoid printing full ECR URI,
* avoid printing env values,
* avoid `docker compose config`,
* check required commands before deployment work,
* fail early if AWS CLI is missing,
* use EC2 IAM role credentials for ECR login once AWS CLI is installed,
* pull the selected image,
* update the Compose-managed `api` service,
* avoid direct container rename replacement unless Approach B is later approved,
* perform local health check first,
* perform public health check second,
* return nonzero on failure,
* include rollback handling.

The script must not run Prisma commands or production migrations.

## 11. Compose Revision Direction

Future Compose revision should:

* keep service `api`,
* keep project compatibility with `app`,
* use `env_file: /opt/crm-modern/env/production.env` for runtime env injection,
* avoid secret-dependent Compose interpolation where possible,
* preserve port `4000` behavior needed by Nginx,
* preserve `restart: unless-stopped`,
* use a selectable backend image, likely through a non-secret image reference variable,
* avoid `latest`,
* avoid exposing env values in documentation or logs,
* avoid adding production migrations to Compose startup.

Compose interpolation note:

```text
env_file supplies variables to the container at runtime.
It does not automatically supply variables for Compose YAML interpolation.
```

If the Compose YAML uses `${...}` values, those values still need to come from the Compose environment or a Compose `.env` file. Secret-dependent interpolation should be reduced where practical.

## 12. AWS CLI Missing Blocker

Current EC2 finding:

```text
aws available: no
```

This blocks ECR login and image pull from EC2.

Later options to address:

* install AWS CLI on EC2 in a separately approved manual phase,
* use a deployment method that does not require AWS CLI on EC2, if approved,
* verify EC2 IAM role credentials only after AWS CLI exists,
* verify ECR pull access only after AWS CLI installation is approved.

Do not install AWS CLI in Phase 10E.

## 13. Health Check Strategy

Recommended health check order:

1. local health check first,
2. public health check second.

Local health first:

* verifies the app is responding on EC2 localhost,
* avoids mixing app readiness with public DNS/TLS/proxy concerns,
* uses the discovered local backend port.

Public health second:

* verifies Nginx and public routing still work,
* confirms the external API path remains healthy,
* should run only after local health succeeds.

The deployment script should not print response bodies.

## 14. Rollback Strategy

For Compose-based deployment, rollback should be Compose-compatible.

Future rollback design should capture:

* previously running image reference shape,
* selected new `sha-*` image tag,
* whether Compose service update succeeded,
* local health result,
* public health result.

If new deployment health fails:

* revert the Compose service to the previous image,
* bring the `api` service back up through Compose,
* run local health check,
* run public health check if local health succeeds,
* exit nonzero if rollback fails.

Rollback design should avoid deleting the prior known-good state too aggressively during the first real deployment.

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

Do not ask the user to paste production env values.

Do not recommend:

* `cat /opt/crm-modern/env/production.env`,
* `env`,
* `printenv`,
* `docker compose config`,
* `set -x`,
* production migrations inside the deployment script.

## 16. What Must Not Be Done

Do not do in Phase 10E:

* execute commands on EC2,
* SSH,
* run SSM,
* run Docker,
* run AWS CLI,
* run curl against production,
* run Nginx commands,
* execute deployment script,
* inspect env variables,
* inspect env files,
* print env,
* run `docker compose config`,
* read production env file contents,
* build images,
* pull images,
* push images,
* log in to ECR,
* deploy,
* restart containers,
* run Prisma commands,
* run migrations,
* modify deployment script,
* modify Compose file,
* modify workflows,
* modify source code,
* modify Dockerfile,
* modify `.dockerignore`,
* modify package files,
* stage, commit, or push.

## 17. Recommended Next Phase

Recommended next phase:

```text
Phase 10F: Backend Compose + Deployment Script Patch Proposal
```

Phase 10F should:

* provide exact patch/instructions only,
* let the user inspect proposed operational/deployment changes,
* let the user apply operational/deployment changes manually,
* keep production execution out of scope,
* avoid staging, committing, or pushing unless separately handled by the user.

## 18. Final Recommendation

Keep the backend production runtime Compose-managed and revise the Compose/script design around that fact.

Recommended path:

```text
Docker Compose-managed deployment with env_file runtime injection, selected ECR sha-* image, Compose-compatible rollback, local health first, public health second.
```

Do not move to direct `docker run` unless a later approved phase finds a strong reason to leave Compose.

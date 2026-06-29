# Codex Phase 4C: EC2 Host Setup Plan

## 1. Phase Name And Purpose

Phase 4C: EC2 Host Setup Plan

Purpose:

Plan the future EC2 host setup for the full public AWS deployment milestone.

This is a planning-only phase.

No AWS resources, EC2 resources, deployment resources, secrets, Docker files, Compose files, GitHub Actions, Prisma migrations, databases, or `.env` files were created or modified.

## 2. Practical EC2 Host Configuration

Recommended EC2 host posture for this portfolio deployment:

- Use one EC2 instance for the first public deployment.
- EC2 will host:
  - Docker
  - Docker Compose
  - API container
  - Project repository or deployment copy
  - Server-local production env file
  - Future frontend production static assets
  - Future Nginx reverse proxy
- PostgreSQL should not run on EC2.
- Production PostgreSQL should remain on Amazon RDS.
- Keep the first EC2 setup simple, low-cost, and easy to reason about.

This is appropriate for a portfolio deployment because it shows realistic cloud hosting skills without adding unnecessary orchestration complexity.

## 3. AWS Region Alignment With RDS

Recommendation:

- EC2 and RDS should be created in the same AWS region.
- Prefer the same VPC when possible.
- Avoid cross-region EC2-to-RDS connections.
- Keep networking simple for the first deployment.

Region should be chosen later based on:

- Cost
- Latency
- User location or likely audience
- EC2/RDS availability
- Free-tier or low-cost eligibility
- Simplicity

## 4. AMI Choice Considerations

Recommended AMI direction:

- Use a stable, mainstream Linux AMI.
- Good choices include:
  - Amazon Linux 2023
  - Ubuntu LTS
- Prefer an AMI with strong documentation and easy Docker installation.
- Avoid niche or custom AMIs for the first deployment.
- Use 64-bit x86_64 unless there is a deliberate reason to choose ARM.

Selection criteria:

- Easy SSH access
- Docker/Compose support
- Security update support
- Familiar command-line tooling
- Clear package manager behavior

## 5. Instance Type Considerations

Recommended first instance posture:

- Use a small, low-cost instance suitable for portfolio/demo traffic.
- Choose an instance class with enough memory for:
  - Docker daemon
  - API container
  - Node runtime
  - Nginx
  - Frontend static serving
- Avoid oversized compute for the first deployment.
- Avoid underpowered choices that make Docker builds fail due to memory pressure.

Selection criteria:

- Low monthly cost
- Enough RAM for build/runtime
- Compatible with chosen AMI architecture
- Easy to resize later if needed

## 6. Storage/Root Volume Considerations

Recommended storage posture:

- Use a modest root EBS volume.
- Ensure enough space for:
  - OS packages
  - Docker images
  - Docker build cache
  - Application repo
  - Frontend build artifacts
  - Logs
- Avoid very small root volumes that can fill up during Docker builds.
- Avoid oversized storage until the app needs it.

Future maintenance considerations:

- Monitor disk usage with safe read-only commands.
- Clean Docker build cache only after review if disk fills up.
- Do not delete app files, env files, or volumes without approval.

## 7. SSH/Key Pair Considerations

Recommended SSH/key posture:

- Use an AWS key pair or approved SSH key method.
- Keep private keys only on the user’s machine or approved secure location.
- Do not paste private keys into chat.
- Do not commit private keys.
- Do not store private keys inside the repo.
- Restrict SSH security group access to the user’s current trusted IP where possible.
- Avoid public SSH access from `0.0.0.0/0`.

Future note:

If the user’s IP changes often, SSH allowlisting may require careful updates rather than opening SSH broadly.

## 8. Linux User/Access Approach

Recommended approach:

- Use the default AMI user initially:
  - Amazon Linux commonly uses `ec2-user`.
  - Ubuntu commonly uses `ubuntu`.
- Avoid logging in as root directly.
- Use `sudo` for administrative setup.
- Keep app files under a clear application directory.
- Avoid mixing deployment files into random home directory paths without a plan.

Potential later directory base:

```text
/opt/crm-modern
```

Example future structure:

```text
/opt/crm-modern/app
/opt/crm-modern/env
/opt/crm-modern/logs
```

## 9. Security Group Inbound Planning

SSH:

- Allow port `22` only from the user’s approved IP.
- Do not allow SSH from `0.0.0.0/0` unless separately approved for a temporary troubleshooting window.

HTTP:

- Allow port `80` when Nginx/public HTTP testing begins.
- Needed for initial public HTTP verification and Certbot HTTP challenge if used.

HTTPS:

- Allow port `443` when SSL/public HTTPS testing begins.
- This should become the primary public app entry point.

Temporary API/app port:

- The API currently maps to a host API port in production Compose.
- For early EC2 testing, a temporary app/API port may be opened only if explicitly approved.
- Prefer using Nginx as the public entry point once Nginx is configured.
- Close any temporary API/app port after Nginx reverse proxy is verified.

General rule:

- Open only the ports needed for the current approved sub-phase.
- Avoid broad inbound access.
- Review security group changes before applying them.

## 10. Outbound Access Expectations

EC2 will need outbound access for:

- OS package updates
- Docker installation
- Pulling base images or dependencies if building on EC2
- Git clone or repository access
- API calls to external services if enabled, such as OpenAI
- Connecting to RDS within the VPC/security group path

Recommended posture:

- Default outbound internet access is usually acceptable for the first portfolio deployment.
- Avoid adding unnecessary outbound restrictions until the deployment is working.
- Do not expose secrets through logs or command output when testing outbound integrations.

## 11. Installing Docker And Docker Compose Later

Future EC2 setup should include:

- OS package update
- Docker installation
- Docker service enable/start
- Docker Compose plugin availability
- Permission strategy for running Docker commands
- Verification with non-secret commands

Future verification examples may include:

```bash
docker --version
```

```bash
docker compose version
```

```bash
docker ps
```

These are safe because they do not print resolved application secrets.

Do not run app Compose with real secrets until the production env file and command pattern have been approved.

## 12. App Directory Layout On EC2

Recommended future layout:

```text
/opt/crm-modern/
  app/
  env/
  logs/
```

Purpose:

- `app/`: project repo or deployment copy
- `env/`: server-local env files outside the repo working tree
- `logs/`: optional deployment/runtime notes or exported logs if needed

Accepted production env file path from prior planning:

```text
/opt/crm-modern/env/production.env
```

The env file should stay outside the repo so it cannot be accidentally staged or committed.

## 13. Future Production Env File Path And Permission Expectations

Recommended future env path:

```text
/opt/crm-modern/env/production.env
```

Expected properties:

- Stored only on EC2.
- Outside the repo working tree.
- Not committed.
- Not printed.
- Not included in screenshots.
- Contains production runtime values such as:
  - `DATABASE_URL`
  - `CLIENT_ORIGIN`
  - `AI_PROVIDER`
  - `OPENAI_MODEL`
  - `OPENAI_API_KEY`, if needed
  - `PORT`
  - `HOST_API_PORT`

Permission expectations:

- Restrict read/write access to the deployment user and/or root.
- Avoid world-readable permissions.
- Verify existence without printing contents.
- Use redacted validation only.

## 14. Future Nginx/Frontend Hosting Implications

EC2 will eventually need to support:

- Frontend production build output.
- Nginx serving static frontend assets.
- Nginx reverse proxying API routes to the API container.
- HTTP to HTTPS transition after Certbot.
- DNS pointing to EC2 public IP.

Implications:

- Port `80` and `443` will be needed later.
- The API should not remain directly exposed long-term if Nginx is the intended public entry point.
- Frontend build location should be planned clearly.
- Nginx config should avoid hardcoded secrets.
- Nginx logs should be reviewed for useful troubleshooting without exposing sensitive data.

## 15. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- EC2 instance running state.
- EC2 AMI and instance type, with account details redacted if needed.
- Security group inbound rules showing only intended ports.
- SSH connection success, without private key content.
- Docker version installed.
- Docker Compose version installed.
- Project directory layout on EC2.
- Production env file existence check, without contents.
- API container running later.
- Nginx service status later.
- Public HTTP/HTTPS verification later.

Do not capture:

- Private key contents
- Full env file contents
- Full `DATABASE_URL`
- API keys
- Passwords
- Sensitive AWS account identifiers unless intentionally redacted
- Commands that print resolved secrets

## 16. Risks And Rollback/Safety Notes

Risks:

- Opening SSH to the whole internet.
- Opening temporary API ports and forgetting to close them.
- Storing secrets inside the repo.
- Printing env file contents during troubleshooting.
- Using an EC2 instance too small for Docker builds.
- Letting disk space fill up from Docker images/build cache.
- Installing app/runtime files in unclear locations.
- Accidentally running PostgreSQL in Docker on EC2 for production.
- Mixing production and local database targets.
- Running deployment commands before RDS/env/security groups are reviewed.

Rollback/safety notes:

- If EC2 setup becomes messy, it may be safer to stop and rebuild the instance before production data exists.
- Do not delete EC2 resources without Architect approval.
- Do not delete env files, app files, or Docker volumes without review.
- If a temporary API port is opened, close it after Nginx is verified.
- If SSH access is misconfigured, fix security group rules carefully rather than broadening access permanently.
- Keep RDS independent from EC2 so EC2 can be replaced without losing database state.

## 17. Boundaries Respected

Boundaries respected during Phase 4C:

- No AWS resources were created.
- No EC2 resources were created.
- `.env` was not modified.
- No real secrets were created or edited.
- No secrets were exposed.
- No private keys or secret values were requested.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands that print resolved secrets were run.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
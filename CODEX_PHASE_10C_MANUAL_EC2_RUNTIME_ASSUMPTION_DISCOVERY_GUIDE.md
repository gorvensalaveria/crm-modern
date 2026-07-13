# CODEX Phase 10C: Manual EC2 Runtime Assumption Discovery Guide

## 1. Purpose

Phase 10C provides a safe manual discovery guide for verifying EC2 backend runtime assumptions before revising or executing the backend ECR deployment script.

Codex is acting as a technical guide, not an autonomous production operator.

For operational/deployment files and production checks:

* Codex should not automatically change operational/deployment files unless explicitly approved.
* Codex should prefer instruction-first or patch-first workflow.
* The user applies operational/deployment changes manually.
* The user alone stages, commits, and pushes.

This guide is documentation/planning-only. It does not run production checks, SSH, SSM, Docker, AWS, Prisma, migration, or deployment commands.

## 2. Strict Safety Rules

The user should run discovery commands only after ChatGPT Architect approves the exact command set.

Discovery must:

* avoid printing secrets,
* avoid printing env file contents,
* avoid `docker compose config`,
* avoid container restart,
* avoid ECR image pull,
* avoid production deployment,
* avoid Prisma commands and migrations,
* capture only sanitized output.

If a command output includes sensitive values, stop and redact before sharing anything.

## 3. Commands Codex Must Not Run

Codex must not run:

* deployment script execution,
* Docker commands,
* Docker Compose commands,
* AWS commands,
* ECR login/pull/push commands,
* SSM commands,
* SSH commands,
* Prisma commands,
* migration commands,
* env-printing commands,
* production env file reads,
* deployment commands,
* container restart commands.

Codex must not run:

```text
docker compose config
cat /opt/crm-modern/env/production.env
env
npm audit fix --force
```

## 4. Commands the User May Run Later After Approval

The user may later run approved commands manually on EC2 to discover:

* actual production API container name,
* whether Docker Compose or direct `docker run` is used,
* current image reference shape,
* port bindings,
* Nginx `/api` upstream/proxy target,
* env file existence only,
* Docker networks and volumes,
* availability of `aws`, `docker`, and `curl`,
* safe health check behavior.

The user should not run these commands until ChatGPT Architect approves the exact manual discovery step.

## 5. Safe Container Discovery

Goal:

```text
Find the actual production API container name.
```

Future approved command examples:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
```

If output includes a full ECR URI, redact the account/registry portion before sharing.

Safer sanitized output to paste back:

```text
API container candidate name: <container-name>
Image shape: sha-tagged ECR image / local image / other
Status: running / not running
```

Do not paste full image registry values.

## 6. Safe Port Binding Discovery

Goal:

```text
Confirm how the backend container port is bound on EC2.
```

Future approved command example:

```bash
docker ps --filter "name=<api-container-name>" --format '{{.Names}} {{.Ports}}'
```

What to identify:

* whether host binding is `127.0.0.1`,
* host port,
* container port,
* whether it matches Nginx upstream expectations.

Sanitized output to paste back:

```text
Container name: <container-name>
Port binding shape: 127.0.0.1:<host-port>-><container-port>/tcp
```

Do not paste private IPs.

## 7. Safe Docker Compose or Direct Docker Run Discovery

Goal:

```text
Determine whether production backend is Docker Compose-managed or direct docker run.
```

Future approved command examples:

```bash
docker inspect <api-container-name> --format '{{ index .Config.Labels "com.docker.compose.project" }}'
docker inspect <api-container-name> --format '{{ index .Config.Labels "com.docker.compose.service" }}'
```

Interpretation:

* if Compose labels are present, production may be Docker Compose-managed,
* if Compose labels are empty, production may be direct `docker run` or another pattern.

Do not run:

```text
docker compose config
```

because it can print production env values.

Sanitized output to paste back:

```text
Compose project label present: yes/no
Compose service label present: yes/no
Likely runtime mode: compose/direct/unclear
```

## 8. Safe Nginx Upstream Discovery

Goal:

```text
Confirm where Nginx proxies /api traffic.
```

Future approved command examples should read only relevant Nginx proxy lines, not full unrelated config dumps.

Example pattern:

```bash
sudo nginx -T 2>/dev/null | grep -E 'location /api|proxy_pass'
```

If the output includes IPs or unrelated sensitive values, redact before sharing.

Sanitized output to paste back:

```text
/api upstream shape: http://127.0.0.1:<port> or other sanitized target
Nginx expects backend port: <port>
```

Do not paste private IPs, public IPs, account metadata, or unrelated config.

## 9. Safe Env File Existence Check

Goal:

```text
Confirm runtime env file exists without printing contents.
```

Expected draft script path:

```text
/opt/crm-modern/env/production.env
```

Future approved command example:

```bash
sudo test -f /opt/crm-modern/env/production.env && echo "runtime env file exists" || echo "runtime env file missing"
```

Do not run:

```text
cat /opt/crm-modern/env/production.env
env
printenv
docker compose config
```

Sanitized output to paste back:

```text
Runtime env file exists: yes/no
```

Do not paste env file contents.

## 10. Safe Docker Network and Volume Discovery

Goal:

```text
Identify whether the API container uses custom Docker networks or volumes.
```

Future approved command examples:

```bash
docker inspect <api-container-name> --format '{{json .NetworkSettings.Networks}}'
docker inspect <api-container-name> --format '{{json .Mounts}}'
```

Before pasting output, redact private IPs, host paths that reveal sensitive locations, and any secret-looking values.

Safer summary to paste back:

```text
Uses default bridge network: yes/no/unclear
Uses custom network: yes/no/unclear
Uses mounts/volumes: yes/no/unclear
Sensitive paths redacted: yes/no
```

## 11. Safe Command Availability Checks

Goal:

```text
Confirm EC2 has required commands for the future deployment script.
```

Future approved command examples:

```bash
command -v aws >/dev/null && echo "aws available" || echo "aws missing"
command -v docker >/dev/null && echo "docker available" || echo "docker missing"
command -v curl >/dev/null && echo "curl available" || echo "curl missing"
```

Optional version checks, if approved:

```bash
aws --version
docker --version
curl --version
```

Do not run commands that print credentials or environment variables.

## 12. Safe ECR Pull-Permission Check Planning

Goal:

```text
Plan how to verify EC2 ECR pull permissions later without pulling an image yet.
```

Phase 10C should not perform an ECR login or image pull.

A later approved phase may use an AWS CLI read-only check such as repository or image metadata inspection, but outputs must be sanitized and must not include account IDs, full ECR URIs, or role ARNs.

Do not run yet:

```text
aws ecr get-login-password
docker login
docker pull
```

## 13. Safe Health Checks

Goal:

```text
Decide whether public health, local health, or both should be used.
```

Known public endpoint:

```text
https://aucrm.duckdns.org/api/health
```

Future approved public health check:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://aucrm.duckdns.org/api/health
```

Future approved local health check, after Nginx/container port is known:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:<port>/api/health
```

Sanitized output to paste back:

```text
Public health status: <status-code>/failed/not checked
Local health status: <status-code>/failed/not checked
```

Do not paste response bodies if they include sensitive values.

## 14. What to Paste Back to ChatGPT Architect

Paste only sanitized findings:

```text
API container name: <sanitized-name>
Runtime mode: compose/direct/unclear
Image reference shape: sha-tagged ECR/local/other, full registry redacted
Port binding shape: 127.0.0.1:<host-port>-><container-port>/tcp
Nginx /api upstream shape: sanitized target and port
Runtime env file exists: yes/no
Custom Docker network needed: yes/no/unclear
Volumes needed: yes/no/unclear
aws available: yes/no
docker available: yes/no
curl available: yes/no
Public health status: <status-code>/failed/not checked
Local health status: <status-code>/failed/not checked
```

If unsure whether a value is sensitive, redact it.

## 15. What to Redact or Never Paste

Never paste:

* AWS account ID,
* full ECR URI,
* IAM role ARN,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL` value,
* env file contents,
* DuckDNS token,
* Certbot email,
* private keys,
* GitHub secrets,
* SSH key material.

Also avoid screenshots that contain account metadata or infrastructure identifiers.

## 16. Expected Discovery Checklist

Expected discovery checklist:

* actual production API container name identified,
* Docker Compose vs direct Docker run status known,
* current image reference shape known with full registry redacted,
* port binding shape known,
* Nginx `/api` upstream/proxy target known and sanitized,
* runtime env file existence checked without reading contents,
* Docker network requirements known or marked unclear,
* volume requirements known or marked unclear,
* `aws` availability checked,
* `docker` availability checked,
* `curl` availability checked,
* public health check result known or marked not checked,
* local health check feasibility known or marked unclear,
* no secrets pasted,
* no deployment performed,
* no container restarted,
* no ECR image pulled,
* no SSM command run.

## 17. Recommended Next Phase

Recommended next phase:

```text
Phase 10D: User-Executed EC2 Runtime Assumption Discovery
```

Phase 10D should have the user manually run approved safe commands and report sanitized findings to ChatGPT Architect.

After that:

```text
Phase 10E: Backend Deployment Script Revision
```

For Phase 10E:

* Codex should provide exact patch/instructions first,
* the user applies operational/deployment changes manually,
* no deployment execution should occur unless separately approved.

## 18. Final Recommendation

Do not revise or execute `scripts/deploy-backend-ecr.sh` until EC2 runtime assumptions are discovered safely.

The most important facts to verify before script revision are:

* real API container name,
* Docker Compose vs direct Docker run,
* Nginx upstream port,
* env file path existence,
* required Docker network/volume settings,
* command availability,
* public/local health check behavior.

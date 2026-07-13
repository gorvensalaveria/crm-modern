# CODEX Phase 10D: Batch 3 User-Executed EC2 Runtime Discovery

## 1. Purpose

Phase 10D Batch 3 prepares the third small set of safe manual EC2 discovery commands for the user to run personally later.

Codex is a technical guide, not an autonomous production operator.

The user runs approved commands manually. Codex must not run these commands.

## 2. Batch 1 Findings Already Discovered

Batch 1 sanitized findings:

```text
aws available: no
docker available: yes
curl available: yes
running API container name appears to be app-api-1
image shape: local image crm-modern-api:prod
status: Up 9 days
port shape: 0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp
```

## 3. Batch 2 Findings Already Discovered

Batch 2 sanitized findings:

```text
Compose project label: present
Compose service label: present
likely runtime mode: compose
compose project: app
compose service: api
restart policy: unless-stopped
Docker network: app_default
mount count: 0
mount destinations: none
```

## 4. Batch 3 Scope

Batch 3 verifies only:

1. Nginx `/api` upstream or `proxy_pass` target,
2. runtime env file existence only, never contents,
3. public health status,
4. local health status against localhost port `4000`,
5. no env values,
6. no deployment, restart, or mutation.

## 5. Safety Rules

The commands in this guide are intended to be read-only.

Do not inspect or print environment variables.

Do not read production env file contents.

Do not restart or modify containers.

Do not run:

```text
docker compose config
```

Do not run the deployment script.

Do not run Prisma commands or migrations.

Do not paste raw output if it contains sensitive values.

## 6. User-Run Command for Nginx API Upstream Discovery

When approved by ChatGPT Architect, the user may run this command manually on EC2:

```bash
sudo nginx -T 2>/dev/null | grep -E 'location /api|proxy_pass'
```

This is intended to show only Nginx lines relevant to `/api` and proxy targets.

Nginx output may include unrelated `proxy_pass` lines. Paste back only `/api`-related sanitized lines.

Do not paste full Nginx config dumps.

## 7. User-Run Command for Runtime Env File Existence

When approved by ChatGPT Architect, the user may run:

```bash
sudo test -f /opt/crm-modern/env/production.env && echo "runtime env file exists" || echo "runtime env file missing"
```

This checks file existence only.

It must not print env file contents.

Do not run:

```text
cat /opt/crm-modern/env/production.env
```

## 8. User-Run Command for Public Health Check

When approved by ChatGPT Architect, the user may run:

```bash
curl -fsS -o /dev/null -w 'public.health.status=%{http_code}\n' https://aucrm.duckdns.org/api/health
```

This checks the public backend health endpoint and prints only an HTTP status code.

Do not paste response bodies.

## 9. User-Run Command for Local Health Check

When approved by ChatGPT Architect, the user may run:

```bash
curl -fsS -o /dev/null -w 'local.health.status=%{http_code}\n' http://127.0.0.1:4000/api/health
```

This checks local backend health through localhost port `4000` and prints only an HTTP status code.

Do not paste response bodies.

## 10. Exact Sanitized Result Format

Paste back to ChatGPT Architect only in this format:

```text
Nginx /api upstream shape:
- proxy target: http://127.0.0.1:<port> / other sanitized target
- backend port expected by Nginx:

Runtime env file exists: yes/no

Public health status: <status-code>/failed
Local health status: <status-code>/failed

Sensitive values redacted: yes/no
```

Do not paste raw output if it contains sensitive values.

## 11. Redaction Instructions

Do not paste:

* private IPs,
* public IPs,
* EC2 public DNS,
* RDS endpoint,
* credentials,
* env contents,
* secrets,
* full config dumps,
* Certbot email if it appears,
* private key paths or materials.

If unsure whether a value is sensitive, redact it.

## 12. What Not to Do in Batch 3

Do not run:

```text
docker compose config
cat /opt/crm-modern/env/production.env
env
printenv
docker restart
docker run
docker pull
aws ecr get-login-password
docker login
scripts/deploy-backend-ecr.sh
prisma migrate deploy
prisma db push
prisma migrate dev
```

Do not:

* inspect env variables,
* inspect env files,
* restart containers,
* modify containers,
* pull images,
* push images,
* deploy,
* run SSM,
* expose secrets.

## 13. Expected Next Step

After the user runs the approved Batch 3 commands manually, ChatGPT Architect should review the sanitized findings.

Expected next step:

```text
ChatGPT Architect reviews Batch 3 findings and then decides whether Batch 4 is needed or whether Phase 10E script revision can be planned.
```

Batch 4 or Phase 10E should only proceed after Architect approval.

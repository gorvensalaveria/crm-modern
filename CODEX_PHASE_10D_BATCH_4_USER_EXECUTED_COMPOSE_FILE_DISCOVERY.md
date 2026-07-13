# CODEX Phase 10D: Batch 4 User-Executed Compose File Discovery

## 1. Purpose

Phase 10D Batch 4 prepares the fourth small set of safe manual EC2 discovery commands for the user to run personally later.

Codex is a technical guide, not an autonomous production operator.

The user runs approved commands manually. Codex must not access EC2 or production resources.

## 2. Batch 1 Findings Already Discovered

Batch 1 sanitized findings:

```text
aws available: no
docker available: yes
curl available: yes
running API container name: app-api-1
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

## 4. Batch 3 Findings Already Discovered

Batch 3 sanitized findings:

```text
Nginx proxy target: http://localhost:4000/api/
backend port expected by Nginx: 4000
runtime env file exists: yes
public health status: 200
local health status: 200
```

## 5. Batch 4 Scope

Batch 4 verifies only:

1. Docker Compose working directory label,
2. Docker Compose config files label,
3. Compose container number label if useful,
4. Compose file path if available from labels,
5. selected non-secret Compose file lines only:
   * service name,
   * image line,
   * ports line,
   * `env_file` line only if it shows file path and no values,
   * restart line,
   * networks line,
6. no env values,
7. no production env file contents,
8. no `docker compose config`.

## 6. Safety Rules

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

If output includes secret-looking values, stop and redact before sharing.

## 7. User-Run Commands for Compose Labels

When approved by ChatGPT Architect, the user may run these commands manually on EC2:

```bash
sudo docker inspect app-api-1 --format 'compose.working_dir={{ index .Config.Labels "com.docker.compose.project.working_dir" }}'
```

```bash
sudo docker inspect app-api-1 --format 'compose.config_files={{ index .Config.Labels "com.docker.compose.project.config_files" }}'
```

```bash
sudo docker inspect app-api-1 --format 'compose.container_number={{ index .Config.Labels "com.docker.compose.container-number" }}'
```

These commands inspect Compose labels only.

They must not print env values.

## 8. Optional User-Run Command for Selected Compose File Lines

If the Compose file path is identified and does not expose secrets by path alone, the user may inspect selected safe keys only using this cautious pattern:

```bash
sudo grep -nE '^[[:space:]]*(api:|image:|ports:|-[[:space:]]*"?[0-9.:]+:[0-9]+|env_file:|restart:|networks:)' <compose-file-path>
```

Use the real Compose file path only after ChatGPT Architect approves it.

Important:

* do not use `docker compose config`,
* do not print `environment` blocks,
* do not print env file contents,
* do not paste full Compose file output,
* if grep output includes secret-looking values, stop and redact,
* paste only a sanitized summary, not raw full file contents.

## 9. Exact Sanitized Result Format

Paste back to ChatGPT Architect only in this format:

```text
Compose working directory: present/redacted/empty
Compose config file path: present/redacted/empty
Compose container number: present/empty
Compose file inspected: yes/no

Compose service summary:
- service name:
- image shape:
- ports shape:
- env_file path shape: present/absent/redacted
- restart policy:
- networks:

Sensitive values redacted: yes/no
```

Do not paste raw output if it contains sensitive values.

## 10. Redaction Instructions

Do not paste:

* AWS account ID,
* full ECR URI,
* EC2 public IP or DNS,
* EC2 instance ID,
* private IPs,
* public IPs,
* RDS endpoint,
* credentials,
* env contents,
* Certbot email,
* private key paths or materials,
* secrets.

If a path itself appears sensitive, redact it and report only whether it was present.

## 11. What Not to Do in Batch 4

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

## 12. Expected Next Step

After the user runs the approved Batch 4 commands manually, ChatGPT Architect should review the sanitized findings.

Expected next step:

```text
ChatGPT Architect reviews Batch 4 findings and then decides whether Phase 10E script revision can be planned.
```

Phase 10E should only proceed after Architect approval.

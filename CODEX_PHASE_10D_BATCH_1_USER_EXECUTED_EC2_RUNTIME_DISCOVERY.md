# CODEX Phase 10D: Batch 1 User-Executed EC2 Runtime Discovery

## 1. Purpose

Phase 10D Batch 1 prepares the first small set of safe manual EC2 discovery commands for the user to run personally later.

Codex is a technical guide, not an autonomous production operator.

The user runs the approved commands manually. Codex must not run these commands.

Batch 1 verifies only:

* command availability on EC2:
  * `aws`
  * `docker`
  * `curl`
* current running Docker containers in a sanitized way.

## 2. Safety Scope

These commands are intended to be read-only.

They should not:

* restart containers,
* pull images,
* push images,
* log in to ECR,
* deploy anything,
* run Prisma,
* run migrations,
* print env values,
* inspect env file contents,
* run `docker compose config`.

The user should run these commands only after ChatGPT Architect approves the manual execution step.

## 3. Commands Codex Must Not Run

Codex must not run:

* EC2 commands,
* SSH,
* SSM,
* Docker,
* AWS CLI,
* curl against production,
* deployment script,
* env inspection,
* `docker compose config`,
* Prisma commands,
* migrations,
* deployment commands.

Codex must not stage, commit, or push.

## 4. User-Run Command Availability Checks

When approved by ChatGPT Architect, the user may run these commands manually on EC2:

```bash
command -v aws >/dev/null && echo "aws available" || echo "aws missing"
command -v docker >/dev/null && echo "docker available" || echo "docker missing"
command -v curl >/dev/null && echo "curl available" || echo "curl missing"
```

These commands only check whether the command names are available.

They should not print credentials or env values.

## 5. User-Run Docker Container Discovery

When approved by ChatGPT Architect, the user may run this command manually on EC2:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
```

This command lists running Docker containers with:

* container name,
* image reference,
* status,
* port mapping.

It must be treated as potentially sensitive if image references include a full ECR URI or ports include sensitive network details.

## 6. Redaction Rules

Do not paste sensitive raw output.

If Docker image output contains a full ECR URI, redact the account/registry portion before sharing.

Do not paste:

* AWS account ID,
* full ECR URI,
* EC2 public IP/DNS,
* EC2 instance ID,
* private IPs,
* RDS endpoint,
* credentials,
* env contents,
* secrets.

If unsure whether a value is sensitive, redact it.

## 7. Exact Sanitized Result Format

Paste back to ChatGPT Architect only in this format:

```text
aws available: yes/no
docker available: yes/no
curl available: yes/no

Docker containers:
- name:
- image shape: local image / ECR image with registry redacted / other
- status:
- port shape:
```

For multiple containers, repeat the Docker container block once per relevant container.

Do not paste full raw command output if it contains sensitive values.

## 8. Examples of Sanitized Docker Findings

Example for local image:

```text
Docker containers:
- name: crm-modern-api
- image shape: local image
- status: running
- port shape: 127.0.0.1:<host-port>-><container-port>/tcp
```

Example for ECR image:

```text
Docker containers:
- name: crm-modern-api
- image shape: ECR image with registry redacted, tag sha-<short-git-sha>
- status: running
- port shape: 127.0.0.1:<host-port>-><container-port>/tcp
```

Do not include the full registry value.

## 9. What Not to Do in Batch 1

Do not run:

```text
docker compose config
cat /opt/crm-modern/env/production.env
env
printenv
aws ecr get-login-password
docker login
docker pull
docker run
docker restart
prisma migrate deploy
prisma db push
prisma migrate dev
```

Do not:

* inspect env files,
* restart containers,
* pull images,
* push images,
* deploy,
* run SSM,
* expose secrets.

## 10. Expected Next Step

After the user runs the approved Batch 1 commands manually, ChatGPT Architect should review the sanitized findings.

Expected next step:

```text
ChatGPT Architect reviews Batch 1 findings and then approves Batch 2.
```

Batch 2 should only proceed after Architect approval.

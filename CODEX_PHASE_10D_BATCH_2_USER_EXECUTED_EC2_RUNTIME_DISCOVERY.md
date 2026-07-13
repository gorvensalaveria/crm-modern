# CODEX Phase 10D: Batch 2 User-Executed EC2 Runtime Discovery

## 1. Purpose

Phase 10D Batch 2 prepares the second small set of safe manual EC2 discovery commands for the user to run personally later.

Codex is a technical guide, not an autonomous production operator.

The user runs approved commands manually. Codex must not run these commands.

## 2. Batch 1 Findings Already Discovered

Batch 1 sanitized findings:

```text
aws available: no
docker available: yes
curl available: yes
running API container name: apps-api-1
image shape: local image crm-modern-api:prod
status: Up 9 days
port shape: 0.0.0.0:4000->4000/tcp, [::]:4000->4000/tcp
```

## 3. Batch 2 Scope

Batch 2 verifies only:

1. whether `apps-api-1` is Docker Compose-managed,
2. whether it uses a custom Docker network,
3. whether it uses mounts/volumes,
4. restart policy and basic runtime metadata,
5. no env values,
6. no env files.

Batch 2 must not restart or modify containers.

Batch 2 must not run:

```text
docker compose config
```

## 4. Safety Rules

The commands in this guide are intended to be read-only.

Do not inspect or print environment variables.

Do not inspect or print env files.

Do not paste raw output if it contains sensitive values.

If sensitive values appear, redact before sharing.

## 5. User-Run Commands for Compose Label Discovery

When approved by ChatGPT Architect, the user may run these commands manually on EC2:

```bash
sudo docker inspect apps-api-1 --format 'compose.project={{ index .Config.Labels "com.docker.compose.project" }}'
sudo docker inspect apps-api-1 --format 'compose.service={{ index .Config.Labels "com.docker.compose.service" }}'
```

Interpretation:

* if Compose labels are present, the container is likely Docker Compose-managed,
* if Compose labels are empty, runtime mode may be direct Docker run or unclear.

## 6. User-Run Command for Restart Policy

When approved by ChatGPT Architect, the user may run:

```bash
sudo docker inspect apps-api-1 --format 'restart.policy={{ .HostConfig.RestartPolicy.Name }}'
```

This checks restart policy only.

It should not print env values.

## 7. User-Run Command for Docker Networks

When approved by ChatGPT Architect, the user may run:

```bash
sudo docker inspect apps-api-1 --format 'networks={{ range $name, $_ := .NetworkSettings.Networks }}{{ $name }} {{ end }}'
```

This prints network names only.

Do not paste private IPs.

If any network name appears sensitive, redact it.

## 8. User-Run Commands for Mounts and Volumes

When approved by ChatGPT Architect, the user may run:

```bash
sudo docker inspect apps-api-1 --format 'mount.count={{ len .Mounts }}'
sudo docker inspect apps-api-1 --format 'mounts={{ range .Mounts }}type={{ .Type }},destination={{ .Destination }}; {{ end }}'
```

The mounts command is intentionally limited to:

* mount type,
* container destination.

It should not print host source paths.

If host source paths appear anyway, do not paste them.

## 9. Exact Sanitized Result Format

Paste back to ChatGPT Architect only in this format:

```text
Compose project label: present/empty
Compose service label: present/empty
Likely runtime mode: compose/direct/unclear
Restart policy:
Docker networks:
- default bridge/custom/other:
Mount count:
Mount destinations:
- destination:
- destination:
Sensitive values redacted: yes/no
```

Do not paste raw output if it contains sensitive values.

## 10. Redaction Instructions

Do not paste:

* host source paths if they appear,
* private IPs,
* env values,
* AWS account ID,
* full ECR URI,
* RDS endpoint,
* credentials,
* secrets.

If unsure whether a value is sensitive, redact it.

## 11. What Not to Do in Batch 2

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

* inspect env variables,
* inspect env files,
* restart containers,
* pull images,
* push images,
* deploy,
* run SSM,
* expose secrets.

## 12. Expected Next Step

After the user runs the approved Batch 2 commands manually, ChatGPT Architect should review the sanitized findings.

Expected next step:

```text
ChatGPT Architect reviews Batch 2 findings and then approves Batch 3.
```

Batch 3 should only proceed after Architect approval.

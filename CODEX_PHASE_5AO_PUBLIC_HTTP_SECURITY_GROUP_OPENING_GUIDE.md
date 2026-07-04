# Codex Phase 5AO: Public HTTP Security Group Opening Guide

## 1. Phase Name And Purpose

Phase 5AO: Public HTTP Security Group Opening Guide

Purpose:

Prepare the exact safe guide for opening only HTTP port `80` on the EC2 security group so the Nginx reverse proxy can be tested publicly.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. AWS resources and security groups were not modified. HTTP/HTTPS ports were not opened. App port `4000` was not opened. RDS port `5432` was not opened. RDS security group was not modified. SSH access was not broadened. Cloudflare, DNS, Elastic IPs, Nginx, Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, HTTPS/Certbot, deployments, databases, and `.env` files were not created or modified.

## 2. Current Private API And Nginx State

Current server state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
EC2 security group: crm-modern-prod-ec2-sg
RDS security group: crm-modern-prod-rds-sg
```

API container state:

```text
Container name: app-api-1
Image: crm-modern-api:prod
Local API port: 4000
Local health endpoint: /api/health
```

Nginx state:

```text
Nginx version: nginx/1.28.3 (Ubuntu)
Local reverse proxy endpoint: http://localhost/api/health
Local reverse proxy health check: HTTP 200 OK
```

Nginx proxy route:

```text
/api/ -> http://localhost:4000/api/
```

Current public exposure state:

- No public HTTP/HTTPS security group ports have been opened yet.
- No Cloudflare/DNS has been configured yet.
- No HTTPS/Certbot has been configured yet.
- Frontend has not been deployed yet.

## 3. Required Pre-Checks

Before opening HTTP `80` in a future execution phase, verify:

- API container is running.
- Nginx is active/running.
- Local Nginx health check succeeds:
  ```text
  http://localhost/api/health -> HTTP 200 OK
  ```
- Correct EC2 security group is selected:
  ```text
  crm-modern-prod-ec2-sg
  ```
- RDS security group is not being edited:
  ```text
  crm-modern-prod-rds-sg
  ```
- SSH remains restricted.
- App port `4000` remains private/local-only.
- RDS port `5432` remains private/not public.

Stop if any pre-check is uncertain.

## 4. Approved AWS Console Change For Opening Only HTTP 80

Approved future AWS Console path:

```text
EC2 -> Security Groups -> crm-modern-prod-ec2-sg -> Edit inbound rules
```

Approved inbound rule to add:

```text
Type: HTTP
Protocol: TCP
Port: 80
Source: 0.0.0.0/0
Description: Allow public HTTP to Nginx
```

Optional IPv6 rule:

```text
Source: ::/0
```

Only add the IPv6 rule if the instance and network are intentionally using IPv6.

Otherwise, skip IPv6.

Important:

- This guide does not approve opening HTTP now.
- This guide only documents the future approved shape.
- The actual AWS Console change belongs to a later approved execution step.

## 5. Explicitly Forbidden Security Group Changes

Do not:

- Open app port `4000`.
- Open RDS port `5432`.
- Broaden SSH port `22`.
- Modify `crm-modern-prod-rds-sg`.
- Add `0.0.0.0/0` to SSH.
- Add `0.0.0.0/0` to RDS/PostgreSQL.
- Open HTTPS port `443` yet.
- Add unrelated inbound rules.
- Change outbound rules without a separate approved reason.

Security posture to preserve:

```text
HTTP 80: future public access to Nginx only
App 4000: private/local-only
RDS 5432: private/not public
SSH 22: restricted
HTTPS 443: later phase
```

## 6. Verification Plan After Opening HTTP 80

Future verification order after the approved HTTP `80` rule is added:

1. Confirm local Nginx still works:
   ```text
   http://localhost/api/health -> HTTP 200 OK
   ```
2. Test public HTTP to Nginx using EC2 public DNS/IP only after the rule is added.
3. Verify public `/api/health` returns `HTTP 200 OK`.
4. Do not expose the EC2 public DNS/IP in reports or chat if avoidable.
5. Keep app port `4000` closed publicly.
6. Keep HTTPS `443` closed until the HTTPS/Certbot phase.

Safe result to document later:

```text
Public HTTP /api/health through Nginx returned HTTP 200 OK.
```

Do not document the EC2 public DNS/IP unless intentionally redacted.

## 7. Stop Conditions

Stop immediately if:

- Wrong security group is selected.
- Local Nginx health check fails.
- API container is not running.
- A rule would expose app port `4000`.
- A rule would expose RDS port `5432`.
- A rule would broaden SSH access.
- A rule would open HTTPS `443` too early.
- RDS security group is being edited.
- AWS shows an unexpected warning.
- User is unsure what to click.
- Any step would expose secrets, IPs, private key material, or env values.

## 8. Evidence/Security Notes

Safe to document:

- EC2 security group name:
  ```text
  crm-modern-prod-ec2-sg
  ```
- HTTP port:
  ```text
  80
  ```
- App port as private/local-only:
  ```text
  4000
  ```
- RDS port as private/not public:
  ```text
  5432
  ```
- SSH port as restricted:
  ```text
  22
  ```
- Local health endpoint:
  ```text
  /api/health
  ```
- Nginx proxy status.
- Public HTTP `/api/health` result after a later approved execution phase.

Do not document:

- EC2 public IP/DNS.
- User public IP.
- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- Private key path or contents.
- Secret values.

## 9. What Must Not Be Done In This Phase

Do not:

- SSH.
- Run commands.
- Modify AWS resources.
- Modify security groups.
- Open HTTP port yet.
- Open HTTPS port.
- Open app port `4000`.
- Open RDS port `5432`.
- Modify RDS security group.
- Broaden SSH access.
- Configure Cloudflare.
- Configure DNS.
- Allocate Elastic IPs.
- Install/configure/edit Nginx.
- Run Docker Compose.
- Start or stop containers.
- Run Docker build.
- Run Prisma commands.
- Print env file contents.
- Run `env`.
- Run `docker compose config` using the real env file.
- Create or edit real secrets.
- Ask for database password.
- Ask for private key contents.
- Ask for GitHub tokens.
- Expose secrets.
- Expose user public IP.
- Expose EC2 public IP/DNS.
- Expose private key material.
- Expose full RDS endpoint.
- Expose full `DATABASE_URL`.
- Modify `.env`.
- Modify Dockerfile or Compose files.
- Modify frontend files.
- Modify GitHub Actions.
- Deploy frontend.
- Configure HTTPS/Certbot.
- Reset or delete any database.
- Stage, commit, or push.
- Run `npm audit fix --force`.

## 10. Next Phase Recommendation

Recommended next phase:

Execute the controlled EC2 security group update to open only HTTP `80` for Nginx public testing.

Suggested next-ticket focus:

- User manually edits `crm-modern-prod-ec2-sg` in AWS Console.
- Add only HTTP TCP `80` from `0.0.0.0/0`.
- Do not touch SSH, app port `4000`, RDS `5432`, RDS SG, HTTPS `443`, Cloudflare, DNS, or Certbot.
- Verify public HTTP `/api/health` through Nginx.
- Capture redacted evidence without EC2 public IP/DNS if possible.

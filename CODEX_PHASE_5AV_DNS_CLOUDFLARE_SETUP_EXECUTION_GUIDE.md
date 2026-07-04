# Codex Phase 5AV: DNS/Cloudflare Setup Execution Guide

## 1. Phase Name And Purpose

Phase 5AV: DNS/Cloudflare Setup Execution Guide

Purpose:

Prepare the exact safe execution guide for creating the Cloudflare DNS record for the API subdomain without Elastic IP.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. AWS resources were not modified. Elastic IP was not allocated or associated. Security groups were not modified. Cloudflare/DNS was not configured. Nginx files were not edited. HTTPS/Certbot was not configured. Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Selected API Subdomain

Selected API subdomain:

```text
api.aucrm.com
```

Cloudflare zone:

```text
aucrm.com
```

User confirmed:

- They own/control the domain in Cloudflare.
- They want the API subdomain to be `api.aucrm.com`.

## 3. Current Public HTTP State

Current live state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
API container: running
Nginx: running
Public HTTP port 80: open
Public /api/health: verified successfully over HTTP
```

Pending public deployment pieces:

```text
Elastic IP: intentionally skipped
DNS/Cloudflare: not configured
HTTPS/Certbot: not configured
Frontend: not deployed
```

## 4. Elastic IP Caveat

Elastic IP was intentionally skipped for cost-control.

Accepted caveat:

- The DNS record will point to the current EC2 public IPv4.
- The current EC2 public IPv4 can change if the instance stops and starts.
- If it changes, the Cloudflare A record for `api.aucrm.com` must be manually updated.
- This is acceptable for the current portfolio/demo deployment.

Do not include the actual EC2 public IPv4 in this guide or public reports.

## 5. Required Pre-Checks

Before creating the future DNS record, verify:

- Public HTTP `/api/health` currently works using the EC2 public endpoint.
- Cloudflare zone `aucrm.com` is accessible.
- Current EC2 public IPv4 is copied from the AWS EC2 Console.
- Elastic IP is intentionally skipped.
- HTTPS/Certbot is not being configured yet.
- Frontend is not being deployed yet.

Stop if any pre-check is uncertain.

## 6. Cloudflare DNS Record Plan

Cloudflare DNS record:

```text
Type: A
Name: api
Content: current EC2 public IPv4
Proxy status: DNS only
TTL: Auto
```

Resulting hostname:

```text
api.aucrm.com
```

Important:

- Do not document the actual EC2 public IPv4.
- Use DNS-only mode for initial validation.
- Cloudflare proxy mode can be evaluated later after HTTPS planning is clear.
- Do not configure HTTPS/Certbot in this phase.

## 7. Verification Plan

After the DNS record is eventually created:

1. Wait for DNS propagation if needed.
2. Test:
   ```text
   http://api.aucrm.com/api/health
   ```
3. Expected result:
   ```text
   HTTP 200 OK
   ```
4. Expected non-secret health response body:
   ```json
   {"data":{"status":"ok","service":"asun-migrations-api"}}
   ```
5. Confirm Nginx serves the response.
6. Do not use HTTPS until the Certbot phase is completed.

Safe evidence wording:

```text
http://api.aucrm.com/api/health returned HTTP 200 OK.
```

## 8. Security Boundaries

Security boundaries to preserve:

- Do not open app port `4000`.
- Do not open RDS port `5432`.
- Do not broaden SSH port `22`.
- Do not open HTTPS port `443` yet.
- Do not modify RDS security group.
- Do not configure Certbot yet.
- RDS remains private.

Allowed current public exposure:

```text
HTTP port 80 to Nginx
```

Private/local-only:

```text
App port 4000
```

Future/not yet open:

```text
HTTPS port 443
```

## 9. Stop Conditions

Stop immediately if:

- Wrong Cloudflare zone is selected.
- Wrong DNS record name is entered.
- DNS target would be copied incorrectly.
- DNS points to an old EC2 public IPv4.
- Cloudflare proxy is enabled and causes unexpected behavior.
- Public EC2 `/api/health` fails before DNS setup.
- A step proposes opening app port `4000`.
- A step proposes opening RDS port `5432`.
- A step proposes broadening SSH access.
- A step proposes opening HTTPS `443` before the TLS phase.
- User is unsure what to do.
- Any step would expose secrets, IPs, private key material, or env values.

## 10. Evidence/Security Notes

Safe to document:

- Selected subdomain:
  ```text
  api.aucrm.com
  ```
- Cloudflare zone:
  ```text
  aucrm.com
  ```
- DNS record type:
  ```text
  A
  ```
- Record name:
  ```text
  api
  ```
- DNS-only mode.
- TTL:
  ```text
  Auto
  ```
- Public path:
  ```text
  /api/health
  ```
- Expected result:
  ```text
  HTTP 200 OK
  ```
- Expected non-secret health response body:
  ```json
  {"data":{"status":"ok","service":"asun-migrations-api"}}
  ```
- Elastic IP intentionally skipped with stability caveat.

Do not document:

- EC2 public IP/DNS.
- User public IP.
- Elastic IP value.
- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- Private key path or contents.
- Secret values.

## 11. What Must Not Be Done In This Phase

Do not:

- SSH.
- Run commands.
- Modify AWS resources.
- Allocate Elastic IP.
- Associate Elastic IP.
- Modify security groups.
- Open HTTPS port.
- Open app port `4000`.
- Open RDS port `5432`.
- Modify RDS security group.
- Broaden SSH access.
- Configure Cloudflare.
- Configure DNS.
- Edit Nginx files.
- Configure HTTPS/Certbot.
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
- Expose Elastic IP value.
- Expose private key material.
- Expose full RDS endpoint.
- Expose full `DATABASE_URL`.
- Modify `.env`.
- Modify Dockerfile or Compose files.
- Modify frontend files.
- Modify GitHub Actions.
- Deploy frontend.
- Reset or delete any database.
- Stage, commit, or push.
- Run `npm audit fix --force`.

## 12. Next Phase Recommendation

Recommended next phase:

Execute the Cloudflare DNS record creation for `api.aucrm.com`.

Suggested next-ticket focus:

- Create one Cloudflare A record.
- Use record name `api`.
- Point it to the current EC2 public IPv4 without documenting the IP.
- Keep proxy status DNS-only for initial validation.
- Verify `http://api.aucrm.com/api/health` returns `HTTP 200 OK`.
- Keep HTTPS/Certbot and frontend deployment for later approved phases.

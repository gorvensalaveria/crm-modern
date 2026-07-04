# Codex Phase 5AR: DNS + Domain Planning Guide

## 1. Phase Name And Purpose

Phase 5AR: DNS + Domain Planning Guide

Purpose:

Prepare the safe planning guide for DNS/domain setup before HTTPS/Certbot.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. AWS resources were not modified. Elastic IP was not allocated or associated. Security groups were not modified. Cloudflare/DNS was not configured. Nginx files were not edited. HTTPS/Certbot was not configured. Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Current Public HTTP State

Current live state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
EC2 security group: crm-modern-prod-ec2-sg
```

API container state:

```text
Container name: app-api-1
Image: crm-modern-api:prod
Local/private app port: 4000
```

Nginx state:

```text
Nginx proxies /api/ to http://localhost:4000/api/
```

Public access state:

```text
HTTP port 80 is open on the EC2 security group
Public /api/health verification succeeded over HTTP
HTTPS port 443 is not open/configured yet
Cloudflare/DNS is not configured yet
Elastic IP has not been allocated yet
Frontend has not been deployed yet
```

## 3. Why Elastic IP Should Be Considered Before DNS

Current EC2 public IPv4 behavior:

- The current EC2 public IPv4 can change if the instance is stopped and started.
- DNS should point to a stable public target.
- An Elastic IP provides a stable public IPv4 for the EC2 instance.

Why this matters:

- Without a stable IP, a DNS record may break after EC2 stop/start.
- Updating DNS repeatedly is avoidable operational friction.
- A stable IP makes later DNS and Certbot work more predictable.

Cost caution:

- Elastic IP cost behavior can vary based on AWS usage and attachment state.
- An Elastic IP may cost money if allocated but not attached.
- Allocation and association should happen only in a later approved execution phase.

## 4. Recommended Elastic IP To DNS To HTTPS Sequence

Recommended sequence:

1. Allocate Elastic IP.
2. Associate Elastic IP with:
   ```text
   crm-modern-prod-ec2
   ```
3. Verify public HTTP `/api/health` still works using the new stable endpoint.
4. Create DNS record in Cloudflare after stable IP is confirmed.
5. Update Nginx `server_name` later when the domain is known.
6. Open/configure HTTPS `443` only later during the Certbot phase.
7. Run Certbot/HTTPS only after DNS and HTTP validation are working.

Important:

- Do not point DNS to a temporary EC2 public IP if a stable IP is required.
- Do not configure HTTPS before DNS is ready.
- Do not open HTTPS `443` in this guide phase.

## 5. DNS/Subdomain Planning

Possible hostname choices:

```text
<domain>
api.<domain>
app.<domain>
```

For the current API-only public test, an API subdomain may be appropriate:

```text
api.<domain>
```

DNS record type:

```text
A
```

Future DNS target:

```text
Elastic IP, once allocated and associated
```

Planning notes:

- Choose one clear hostname for the current milestone.
- Avoid configuring many hostnames at once.
- Document the selected hostname only if the user approves sharing it.
- Keep frontend hostname planning separate if needed.

## 6. Cloudflare Proxy Mode Planning

Initial DNS/Certbot consideration:

- For initial Certbot HTTP validation, DNS-only mode may be simpler.
- Cloudflare proxy mode can affect HTTP validation depending on configuration.
- DNS-only mode can make early troubleshooting clearer.

Later Cloudflare proxy consideration:

- Cloudflare proxy mode can be evaluated after HTTP, DNS, and HTTPS are stable.
- If proxy mode is enabled later, Cloudflare SSL/TLS mode must be reviewed carefully.

Do not configure Cloudflare in this guide phase.

Do not create DNS records in this guide phase.

## 7. Security Boundaries

Security boundaries to preserve:

- App port `4000` remains private/local-only.
- RDS port `5432` remains private/not public.
- SSH port `22` remains restricted.
- HTTPS port `443` remains unopened until the TLS phase.
- RDS remains private.
- RDS security group is not modified.

Allowed current public exposure:

```text
HTTP port 80 to Nginx
```

Not allowed:

```text
Public app port 4000
Public RDS port 5432
Broad SSH access
Premature HTTPS 443
```

## 8. Future Verification Plan

After Elastic IP is eventually allocated and associated:

- Verify public HTTP `/api/health` still returns `HTTP 200 OK`.
- Avoid documenting the public IP in reports.

After DNS is eventually configured:

- Verify DNS resolves to the stable public IP.
- Verify:
  ```text
  http://<domain>/api/health
  ```
  returns:
  ```text
  HTTP 200 OK
  ```

Do not include the public IP in reports.

Use a redacted endpoint if needed.

## 9. Stop Conditions

Stop immediately if:

- User has no domain ready.
- Wrong EC2 instance is selected for Elastic IP.
- Elastic IP would be allocated but not associated.
- DNS would point to a temporary EC2 public IP.
- Cloudflare proxy breaks HTTP validation.
- User is unsure about domain/subdomain.
- A step proposes opening app port `4000`.
- A step proposes opening RDS port `5432`.
- A step proposes broadening SSH access.
- A step proposes opening HTTPS `443` before the TLS phase.
- Any step would expose secrets, IPs, private key material, or env values.

## 10. Evidence/Security Notes

Safe to document:

- EC2 instance name:
  ```text
  crm-modern-prod-ec2
  ```
- EC2 security group name:
  ```text
  crm-modern-prod-ec2-sg
  ```
- HTTP port:
  ```text
  80
  ```
- HTTPS port as future/not yet open:
  ```text
  443
  ```
- App port as private/local-only:
  ```text
  4000
  ```
- DNS record type:
  ```text
  A
  ```
- Example subdomain shapes:
  ```text
  api.<domain>
  app.<domain>
  ```
- Selected domain/subdomain only if the user approves it.
- Elastic IP allocation/association status in a later execution report, without publishing the actual IP in public reports.

Do not document:

- EC2 public IP/DNS.
- User public IP.
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

Plan Elastic IP allocation and association for the EC2 instance.

Suggested next-ticket focus:

- Confirm Elastic IP cost guardrails.
- Allocate one Elastic IP.
- Associate it with `crm-modern-prod-ec2`.
- Verify public HTTP `/api/health` still works through Nginx.
- Avoid documenting the public IP unless redacted.
- Keep DNS, HTTPS/Certbot, frontend deployment, and security group changes for later approved phases.

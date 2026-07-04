# Codex Phase 5AU: DNS/Cloudflare Setup Guide Without Elastic IP

## 1. Phase Name And Purpose

Phase 5AU: DNS/Cloudflare Setup Guide Without Elastic IP

Purpose:

Prepare the exact safe guide for configuring DNS/Cloudflare to point a domain or subdomain to the current EC2 public IPv4, while documenting that Elastic IP was intentionally skipped and the IP is not stable after EC2 stop/start.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. AWS resources were not modified. Elastic IP was not allocated or associated. Security groups were not modified. Cloudflare/DNS was not configured. Nginx files were not edited. HTTPS/Certbot was not configured. Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Current Public HTTP State

Current live state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
```

Runtime state:

```text
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

## 3. Required User Decision: Domain/Subdomain

The user must choose the domain/subdomain before DNS is configured.

Recommended for current API-only deployment:

```text
api.<domain>
```

Future frontend options can be planned separately:

```text
app.<domain>
<domain>
```

Guidance:

- Use one hostname for the current API milestone.
- Avoid configuring multiple hostnames at once.
- Document the selected domain/subdomain only if the user approves it.

## 4. Recommended DNS Record Plan

Cloudflare DNS record type:

```text
A
```

Name:

```text
api
```

Example resulting hostname:

```text
api.<domain>
```

Content/target:

```text
Current EC2 public IPv4
```

Important:

- Do not include the actual EC2 public IPv4 in this guide or public reports.
- The current EC2 public IPv4 is not stable without Elastic IP.

Proxy status recommendation:

```text
DNS-only initially
```

Reason:

- DNS-only is simpler for initial HTTP validation.
- DNS-only can make later Certbot HTTP validation easier to reason about.
- Cloudflare proxy mode can be evaluated later after HTTPS planning is clear.

TTL:

```text
Auto
```

or a short TTL if available and appropriate.

## 5. Elastic IP Caveat

Elastic IP was intentionally skipped for cost-control.

Accepted caveat:

- Current EC2 public IPv4 can change if the instance stops and starts.
- If the public IPv4 changes, the Cloudflare DNS A record must be manually updated.
- This is acceptable for the current portfolio/demo deployment.

This is an intentional cost-control tradeoff, not an accidental omission.

## 6. Future Verification Plan

After DNS is eventually configured:

1. Confirm DNS resolves to the expected current EC2 public IPv4.
2. Do not document the public IP in reports.
3. Verify:
   ```text
   http://<selected-domain>/api/health
   ```
4. Expected result:
   ```text
   HTTP 200 OK
   ```
5. Confirm Nginx serves the response.
6. Do not use HTTPS yet unless Certbot phase has been completed.

Safe evidence wording:

```text
HTTP /api/health succeeded through the selected DNS hostname.
```

## 7. Security Boundaries

Security boundaries to preserve:

- Do not open app port `4000`.
- Do not open RDS port `5432`.
- Do not broaden SSH port `22`.
- Do not open HTTPS port `443` until Certbot/TLS phase.
- Do not modify RDS security group.
- RDS remains private.

Allowed current public exposure:

```text
HTTP port 80 to Nginx
```

Future/not yet open:

```text
HTTPS port 443
```

Private/local-only:

```text
App port 4000
```

## 8. Stop Conditions

Stop immediately if:

- User does not have a domain ready.
- User is unsure which subdomain to use.
- DNS target would be copied incorrectly.
- DNS points to an old EC2 public IPv4.
- Cloudflare proxy causes unexpected behavior.
- Public `/api/health` fails before DNS setup.
- A step proposes opening app port `4000`.
- A step proposes opening RDS port `5432`.
- A step proposes broadening SSH access.
- A step proposes opening HTTPS `443` before the TLS phase.
- Any step would expose secrets, IPs, private key material, or env values.

## 9. Evidence/Security Notes

Safe to document:

- Cloudflare DNS record type:
  ```text
  A
  ```
- Example subdomain:
  ```text
  api.<domain>
  ```
- DNS-only recommendation for initial validation.
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
- Public path:
  ```text
  /api/health
  ```
- Expected result:
  ```text
  HTTP 200 OK
  ```
- Elastic IP intentionally skipped with stability caveat.
- Selected domain/subdomain only if the user approves it.

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

## 10. What Must Not Be Done In This Phase

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

## 11. Next Phase Recommendation

Recommended next phase:

Select the domain/subdomain and prepare a Cloudflare DNS execution guide.

Suggested next-ticket focus:

- Confirm the chosen hostname.
- Create one Cloudflare A record in a later approved execution phase.
- Point the record to the current EC2 public IPv4 without documenting the IP.
- Use DNS-only initially.
- Verify `http://<selected-domain>/api/health` returns `HTTP 200 OK`.
- Keep HTTPS/Certbot and frontend deployment for later approved phases.

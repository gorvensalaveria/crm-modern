# Codex Phase 5AW: DuckDNS Setup Guide

## 1. Phase Name And Purpose

Phase 5AW: DuckDNS Setup Guide

Purpose:

Prepare the exact safe guide for setting up a free DuckDNS hostname for the public API demo.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. DuckDNS was not configured. DuckDNS records were not created. DuckDNS token was not requested or exposed. AWS resources were not modified. Elastic IP was not allocated or associated. Security groups were not modified. Cloudflare/DNS was not configured. Nginx files were not edited. HTTPS/Certbot was not configured. Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Why DuckDNS Is Being Used

DuckDNS is being used because:

- It provides a free dynamic DNS option.
- No paid custom domain is required.
- It is acceptable for a portfolio/demo deployment.
- It supports the current cost-conscious deployment approach.
- It can point a free hostname to the current EC2 public IPv4.

DuckDNS hostname format:

```text
<chosen-subdomain>.duckdns.org
```

## 3. Cloudflare api.aucrm.com Path Abandoned

The previous Cloudflare custom-domain path for:

```text
api.aucrm.com
```

is abandoned for now because:

- The user does not own `aucrm.com`.
- The user wants a free domain/hostname option.
- DuckDNS better fits the current development/portfolio deployment.

No Cloudflare DNS record should be created for `api.aucrm.com`.

## 4. User Decision Needed: Available DuckDNS Subdomain

The user must choose an available DuckDNS subdomain.

Example choices:

```text
aucrm
crm-modern
gorven-crm
```

Example resulting hostnames:

```text
aucrm.duckdns.org
crm-modern.duckdns.org
gorven-crm.duckdns.org
```

The exact DuckDNS subdomain must be chosen by the user based on availability.

## 5. DuckDNS Account/Setup Plan

Future DuckDNS setup plan:

1. Go to DuckDNS.
2. Sign in using a supported login method.
3. Create the selected subdomain.
4. Set or update the subdomain to the current EC2 public IPv4.
5. Do not paste the DuckDNS token into chat or reports.
6. Do not screenshot the DuckDNS token.
7. Do not commit the DuckDNS token.

Important:

- Do not configure DuckDNS in this guide phase.
- Do not document the actual EC2 public IPv4.
- Do not expose the DuckDNS token.

## 6. Elastic IP Caveat

Elastic IP was intentionally skipped for cost-control.

Accepted caveat:

- EC2 public IPv4 can change after instance stop/start.
- DuckDNS can be manually updated if the IP changes.
- Optional future automation can update DuckDNS, but the DuckDNS token must be protected.
- This is acceptable for the current portfolio/demo deployment.

This is an intentional cost-control tradeoff, not an accidental omission.

## 7. Verification Plan

After DuckDNS is eventually configured:

1. Wait for DNS propagation if needed.
2. Test:
   ```text
   http://<chosen-subdomain>.duckdns.org/api/health
   ```
3. Expected result:
   ```text
   HTTP 200 OK
   ```
4. Expected non-secret response body:
   ```json
   {"data":{"status":"ok","service":"asun-migrations-api"}}
   ```
5. Confirm Nginx serves the response.
6. Do not use HTTPS yet unless the Certbot phase has been completed.

Safe evidence wording:

```text
DuckDNS HTTP /api/health returned HTTP 200 OK.
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

- Chosen DuckDNS subdomain is unavailable.
- DuckDNS token would be pasted or exposed.
- DNS points to the wrong EC2 public IPv4.
- Public EC2 `/api/health` fails before DuckDNS setup.
- A step proposes opening app port `4000`.
- A step proposes opening RDS port `5432`.
- A step proposes broadening SSH access.
- A step proposes opening HTTPS `443` before the TLS phase.
- User is unsure what to do.
- Any step would expose secrets, IPs, private key material, tokens, or env values.

## 10. Evidence/Security Notes

Safe to document:

- DuckDNS hostname format:
  ```text
  <chosen-subdomain>.duckdns.org
  ```
- Example subdomain choices:
  ```text
  aucrm
  crm-modern
  gorven-crm
  ```
- Public path:
  ```text
  /api/health
  ```
- Expected result:
  ```text
  HTTP 200 OK
  ```
- Expected non-secret response body:
  ```json
  {"data":{"status":"ok","service":"asun-migrations-api"}}
  ```
- Elastic IP intentionally skipped with stability caveat.
- Selected DuckDNS hostname only if the user approves it.

Do not document:

- EC2 public IP/DNS.
- User public IP.
- Elastic IP value.
- DuckDNS token.
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
- Configure DuckDNS.
- Create DuckDNS records.
- Ask for or expose DuckDNS token.
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
- Configure DNS in Cloudflare.
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
- Expose DuckDNS token.
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

Choose an available DuckDNS subdomain and execute DuckDNS setup.

Suggested next-ticket focus:

- User selects an available `<chosen-subdomain>.duckdns.org`.
- Create the DuckDNS hostname manually.
- Point it to the current EC2 public IPv4 without documenting the IP.
- Protect the DuckDNS token.
- Verify `http://<chosen-subdomain>.duckdns.org/api/health` returns `HTTP 200 OK`.
- Keep HTTPS/Certbot and frontend deployment for later approved phases.

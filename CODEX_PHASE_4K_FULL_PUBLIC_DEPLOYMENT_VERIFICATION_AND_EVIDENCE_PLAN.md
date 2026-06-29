# Codex Phase 4K: Full Public Deployment Verification And Evidence Plan

## 1. Phase Name And Purpose

Phase 4K: Full Public Deployment Verification And Evidence Plan

Purpose:

Plan how the final public deployment will eventually be verified and how portfolio-safe evidence will be captured after EC2, RDS, API, frontend, Nginx, Cloudflare DNS, and SSL/Certbot are working.

This is a planning-only phase.

No deployment, real infrastructure verification, AWS/EC2/RDS check, AWS resource creation, Cloudflare record change, Nginx installation/configuration, Certbot installation, certificate request, frontend build, real env file creation, real secret creation, Docker/Compose command, Nginx command, Prisma migration command, security group change, database change, or `.env` modification was performed.

## 2. Final Deployment Verification Goal

The final deployment verification goal is to confirm that the full public deployment milestone works end to end and that portfolio-safe evidence can be captured without exposing secrets.

The completed milestone should prove:

- Public HTTPS frontend works.
- Client-side SPA routes work.
- API is reachable through Nginx at same-origin `/api`.
- API can connect to RDS PostgreSQL.
- DNS points the selected hostname to the deployed EC2 app.
- SSL certificate is valid.
- Evidence is safe to share in a portfolio.

## 3. Expected Final Public User Flows

HTTPS frontend loads:

```text
https://<domain>/
```

Expected result:

- Browser loads the React frontend over HTTPS.
- No certificate warning.
- No mixed-content warning.

SPA routes load:

```text
https://<domain>/dashboard
https://<domain>/matters/123
```

Expected result:

- Nginx serves `index.html`.
- React router handles the route.
- Route does not 404 at Nginx.

`/api/health` works over HTTPS:

```text
https://<domain>/api/health
```

Expected result:

- Nginx proxies the request to the API container.
- API returns a healthy response.
- Response does not expose secrets.

Frontend can call API through same-origin `/api`:

Expected result:

- Browser network requests go to:
  ```text
  https://<domain>/api/...
  ```
- No CORS issue.
- No hardcoded temporary IP remains in the frontend build.

API can connect to RDS:

Expected result:

- API starts successfully.
- DB-backed behavior works if tested.
- Logs/health checks indicate connectivity without printing credentials.

## 4. Infrastructure Checks

Final deployment should verify:

EC2 running:

- EC2 instance is running.
- Intended public IP or Elastic IP is attached.
- Security groups are scoped as planned.

RDS running:

- RDS PostgreSQL is available.
- RDS is the production database target.
- RDS is not publicly exposed unless separately approved.
- RDS security group allows access from EC2 only.

API container running:

- API container is up.
- API service responds through Nginx.
- API container does not run migrations on startup.

Nginx active:

- Nginx is active.
- Nginx config test passes.
- Nginx serves frontend and proxies `/api`.

DNS resolves to EC2:

- Selected hostname resolves to the EC2 public IP or Elastic IP.
- DNS points to the intended server.

HTTPS certificate valid:

- Browser shows valid HTTPS.
- Certificate hostname matches the chosen domain/subdomain.
- HTTPS routes work for frontend and API.

## 5. Safe Command/Check Shapes Without Running Them

Future DNS check:

```bash
dig +short <domain>
```

Future HTTP-to-HTTPS check:

```bash
curl -I http://<domain>/
```

Future HTTPS frontend check:

```bash
curl -I https://<domain>/
```

Future HTTPS API health check:

```bash
curl https://<domain>/api/health
```

Future SPA route check:

```bash
curl -I https://<domain>/dashboard
```

Future Nginx config test:

```bash
sudo nginx -t
```

Future Nginx status check:

```bash
sudo systemctl status nginx
```

Future Docker container status check:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml ps
```

Future RDS/app connectivity check:

- Prefer API health or approved DB-backed endpoint.
- Avoid printing `DATABASE_URL`.

Important:

These are future check shapes only. They are not approved to run during Phase 4K.

## 6. Redacted Evidence Categories

Architecture diagram / flow:

```text
Browser -> Cloudflare DNS -> EC2/Nginx -> frontend static files
Browser -> Cloudflare DNS -> EC2/Nginx /api -> API container
API container -> RDS PostgreSQL
```

Screenshots of deployed frontend:

- Public homepage/dashboard.
- Useful app screens with demo-safe data only.
- No secrets visible.

HTTPS certificate/browser lock:

- Browser lock icon.
- Certificate validity for selected hostname.
- Redact account/browser details if needed.

API health result:

- `/api/health` response over HTTPS.
- Ensure response does not contain secrets.

Docker container status:

- API container running.
- Avoid outputs that include env values.

Nginx status/config test:

- `nginx -t` success.
- Nginx active status.
- No secrets in output.

RDS metadata without secrets:

- Engine: PostgreSQL.
- Status: available.
- Backup posture if useful.
- Redact endpoints/account details if desired.
- Never show password or full connection string.

Cloudflare DNS record with sensitive info redacted:

- Hostname.
- Record type.
- Target IP if acceptable, or partially redacted.
- DNS-only/proxy status.
- Redact account IDs/tokens.

## 7. What Must Never Be Captured

Never capture or publish:

- `.env`
- `/opt/crm-modern/env/production.env`
- `DATABASE_URL`
- Passwords
- API keys
- Private keys
- Certificate private key files
- Cloudflare API tokens
- Secret shell history
- Plain `docker compose config` output with real env values
- AWS account IDs if the user wants them redacted
- Any screenshot or terminal output containing secrets

## 8. Troubleshooting Decision Tree

Frontend fails:

- Check DNS resolution.
- Check HTTPS certificate validity.
- Check Nginx status.
- Check Nginx web root/static files.
- Check SPA fallback.
- Check browser console and network tab.
- Confirm frontend build used the intended `VITE_API_BASE_URL`.

`/api` fails:

- Check Nginx `/api` location routing.
- Check API container status.
- Check API health locally from EC2 if approved.
- Check temporary/public API port is not being relied on after Nginx.
- Check proxy target and headers.
- Check API logs carefully without exposing secrets.

Database connectivity fails:

- Confirm RDS is available.
- Confirm RDS security group allows EC2.
- Confirm env file has `DATABASE_URL` present without printing it.
- Confirm API was restarted after env changes if needed.
- Do not run `prisma db push`.
- Do not reset or delete RDS.
- Review logs carefully for connection errors without exposing credentials.

DNS fails:

- Confirm Cloudflare record points to intended EC2 IP/Elastic IP.
- Confirm DNS-only/proxy status matches the current phase.
- Wait for propagation/cache if needed.
- Use DNS lookup checks.
- Confirm EC2 public IP did not change.

HTTPS fails:

- Confirm DNS resolves correctly.
- Confirm port `80` and `443` posture.
- Confirm Nginx config is valid.
- Confirm Certbot succeeded for the exact hostname.
- Check Cloudflare SSL/TLS mode if proxied.
- Watch for redirect loops.
- Confirm browser is not using stale cache.

## 9. Final Portfolio Story

What was deployed:

- Full-stack app deployed publicly over HTTPS.
- API container running on EC2.
- Frontend built as static assets and served by Nginx.
- API routed through Nginx at `/api`.
- PostgreSQL hosted on Amazon RDS.
- DNS managed through Cloudflare.
- SSL managed through Certbot.

AWS services used:

- EC2
- RDS PostgreSQL
- Security Groups
- Elastic IP if used later
- EBS/root volume as part of EC2

DevOps practices demonstrated:

- Dockerized API runtime
- Docker Compose production-style service management
- RDS-backed production database
- Prisma migration deployment planning
- Runtime env/secrets handling
- Nginx reverse proxy/static hosting
- DNS setup
- HTTPS/SSL setup
- Health checks and troubleshooting
- Evidence capture and documentation

Safety/security practices used:

- Secrets outside repo
- No real secrets in screenshots/reports
- RDS isolated from public internet
- SSH restricted to approved IP
- Nginx public front door
- API not directly public in final setup
- Migration deploy separated from app startup
- Redacted evidence

## 10. Cleanup/Cost-Control Notes

Cost-control reminders:

- Stop or delete resources when done if no longer needed.
- Understand that stopped EC2 may still have EBS costs.
- RDS can continue billing while running.
- RDS snapshots/backups may have storage costs.
- Elastic IPs may cost money if unattached.
- Cloudflare settings should be reviewed before deleting DNS targets.
- Do not delete resources that contain useful evidence until screenshots/notes are captured.
- Do not delete RDS until backups/snapshots and data needs are reviewed.
- Cleanup cloud resources only through a separate approved cleanup ticket.

## 11. Boundaries Respected

Boundaries respected during Phase 4K:

- No deployment was performed.
- No real infrastructure verification was performed.
- No real AWS/EC2/RDS checks were run.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- Cloudflare records were not created or modified.
- Nginx was not installed or configured.
- Certbot was not installed.
- Certificates were not requested.
- Frontend was not built.
- No real env files were created.
- No real secrets were created or edited.
- `.env` was not modified.
- No secrets were exposed.
- No secret values were requested.
- Dockerfile was not modified.
- Compose files were not modified.
- Frontend files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No Nginx commands were run.
- No Prisma migration commands were run.
- No security groups were changed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
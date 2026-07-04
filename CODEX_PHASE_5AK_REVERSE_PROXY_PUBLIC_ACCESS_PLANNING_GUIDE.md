# Codex Phase 5AK: Reverse Proxy + Public Access Planning Guide

## 1. Phase Name And Purpose

Phase 5AK: Reverse Proxy + Public Access Planning Guide

Purpose:

Prepare the safe planning guide for putting Nginx in front of the running API container and planning controlled public HTTP/HTTPS exposure.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. Nginx was not installed or configured. Nginx files were not edited. HTTP/HTTPS/security group ports were not opened. AWS resources, security groups, Cloudflare, DNS, Elastic IPs, Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Current Private API State

Current approved private API state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
App path: /opt/crm-modern/app
Current verified commit: 051458d
```

Production RDS migration completed successfully:

```text
Migration applied: 20260626135938_init
```

Production API image built successfully:

```text
Image name/tag: crm-modern-api:prod
```

Production API container is running locally:

```text
Container name: app-api-1
Local API port: 4000
Health endpoint: /api/health
Local health check: HTTP 200 OK
```

Current exposure state:

- No public HTTP/HTTPS security group ports have been opened yet.
- No Nginx has been configured yet.
- No Cloudflare/DNS has been configured yet.
- Frontend has not been deployed yet.

## 3. Recommended Nginx Reverse Proxy Architecture

Recommended initial architecture:

```text
Browser or local client -> Nginx on host port 80 -> API container on http://localhost:4000
```

Recommended proxy target:

```text
http://localhost:4000
```

Recommended API route model:

```text
/api/ -> http://localhost:4000/api/
```

Recommended health endpoint:

```text
/api/health
```

Architecture rules:

- Nginx listens on host port `80` initially.
- Nginx proxies API traffic to `http://localhost:4000`.
- API container remains behind Nginx.
- App port `4000` remains private/local-only.
- HTTPS/Certbot is added later after DNS is ready.
- Frontend static hosting can be added later as a separate approved step.

## 4. Safe Public Access Sequence

Recommended sequence:

1. Confirm the API container is running locally.
2. Install/configure Nginx in a later approved execution phase.
3. Configure Nginx reverse proxy locally.
4. Test Nginx locally on EC2.
5. Verify local Nginx route:
   ```text
   http://localhost/api/health
   ```
6. Only after local Nginx success, open EC2 security group HTTP `80`.
7. Verify public HTTP through Nginx.
8. Configure DNS/Cloudflare later.
9. Add HTTPS/Certbot on port `443` later.
10. Verify HTTPS after DNS and Certbot are configured.

Do not:

- Open app port `4000` publicly.
- Configure DNS before local Nginx works.
- Configure HTTPS before HTTP and DNS readiness.
- Deploy frontend in this phase.

## 5. Security Group Planning

Current security posture:

- SSH remains restricted to user-approved `/32`.
- RDS remains private and accessible only from the EC2 security group.
- Public HTTP/HTTPS are not open yet.
- App port `4000` is private/local-only.

Future security group direction:

- HTTP `80` may later be opened publicly for web validation/access.
- HTTPS `443` may later be opened publicly after TLS setup.
- App port `4000` should remain closed publicly.
- SSH must not be opened broadly.
- RDS must not be opened publicly.

Stop if any plan proposes:

- Opening SSH to `0.0.0.0/0`.
- Opening RDS/PostgreSQL publicly.
- Opening app port `4000` publicly.
- Changing security groups before an approved execution phase.

## 6. Nginx Config Planning

Future Nginx reverse proxy concept:

```nginx
location /api/ {
    proxy_pass http://localhost:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Planning notes:

- This is a future config shape only.
- Do not create or edit Nginx files in this phase.
- Do not include secrets in Nginx config.
- Keep `/api/` proxying separate from future frontend static hosting.
- Frontend static hosting can later serve `/`.
- API proxy should not fall through to frontend SPA fallback.

Optional later frontend model:

```text
/ -> frontend static files
/api/ -> API container through Nginx reverse proxy
```

## 7. Verification Plan

Future Nginx syntax test:

```bash
sudo nginx -t
```

Future local API-through-Nginx check:

```bash
curl http://localhost/api/health
```

Expected future result:

```text
HTTP 200 OK
```

Verification order:

1. Confirm API container local health is still `HTTP 200 OK`.
2. Test Nginx config syntax.
3. Reload Nginx only after config test passes.
4. Test local Nginx proxy with `http://localhost/api/health`.
5. Only after local success, consider public HTTP access.

Do not run these commands in this guide phase.

## 8. Stop Conditions

Stop immediately if:

- API container is not running.
- Local `/api/health` does not return `HTTP 200 OK`.
- Nginx config test fails.
- Public port `4000` exposure is proposed.
- Security group change would expose SSH broadly.
- Security group change would expose RDS broadly.
- DNS is attempted before local Nginx works.
- HTTPS/Certbot is attempted before DNS readiness.
- Secrets appear in Nginx config.
- Secrets appear in logs.
- User is unsure what to do.
- Any command would modify AWS/security groups before approval.

## 9. Evidence/Security Notes

Safe to document:

- Nginx config path, once known.
- Non-secret proxy target:
  ```text
  http://localhost:4000
  ```
- Local health endpoint:
  ```text
  /api/health
  ```
- HTTP port:
  ```text
  80
  ```
- HTTPS port:
  ```text
  443
  ```
- App port as private/local-only:
  ```text
  4000
  ```
- Local Nginx test result.
- Public HTTP result only after a later approved public access phase.

Do not include:

- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- EC2 public IP/DNS.
- User public IP.
- Private key path or contents.
- Secret values.

## 10. What Must Not Be Done In This Phase

Do not:

- SSH.
- Run commands.
- Install Nginx.
- Configure Nginx.
- Edit Nginx files.
- Open HTTP/HTTPS/security group ports.
- Modify AWS resources.
- Modify security groups.
- Configure Cloudflare.
- Configure DNS.
- Allocate Elastic IPs.
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

## 11. Next Phase Recommendation

Recommended next phase:

Create an Nginx installation and local reverse proxy execution guide.

Suggested next-ticket focus:

- Install Nginx on EC2.
- Create a minimal API reverse proxy config.
- Test Nginx locally only.
- Verify `http://localhost/api/health`.
- Keep public security group HTTP `80` closed until local Nginx verification succeeds.
- Keep DNS, HTTPS/Certbot, and frontend deployment for later approved phases.

# Codex Phase 5AL: Nginx Local Reverse Proxy Guide

## 1. Phase Name And Purpose

Phase 5AL: Nginx Local Reverse Proxy Guide

Purpose:

Prepare the exact safe guide for installing and configuring Nginx locally on EC2 to proxy API traffic to the already-running API container.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. Nginx was not installed or configured. Nginx files were not edited. HTTP/HTTPS/security group ports were not opened. AWS resources, security groups, Cloudflare, DNS, Elastic IPs, Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, HTTPS/Certbot, deployments, databases, and `.env` files were not created or modified.

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

Current public exposure state:

- Nginx is not configured yet.
- No public HTTP/HTTPS security group ports have been opened yet.
- No Cloudflare/DNS has been configured yet.
- Frontend has not been deployed yet.

## 3. Safe Pre-Checks

Before future Nginx installation/configuration execution, verify:

- API container is running.
- Local API health check on app port `4000` returns `HTTP 200 OK`.
- Nginx installed status can be checked.
- No public ports have been opened yet.

Future local API check shape:

```bash
curl -i http://localhost:4000/api/health
```

Expected future result:

```text
HTTP 200 OK
```

Future Nginx installed-status check shape:

```bash
nginx -v
```

Important:

- These are future command shapes only.
- Do not run commands in this guide phase.
- Stop if the API is not healthy locally before configuring Nginx.

## 4. Nginx Installation Plan

Future installation direction:

- Install Nginx using Ubuntu `apt` only if Nginx is missing.
- Do not install Certbot in this phase.
- Do not configure HTTPS in this phase.
- Keep the phase focused on local HTTP reverse proxy only.

Future command shape if Nginx is missing:

```bash
sudo apt update
sudo apt install -y nginx
```

Important:

- These are future command shapes only.
- Do not run commands in this guide phase.
- If install fails, stop and review before continuing.

## 5. Nginx Local Reverse Proxy Config Plan

Future config direction:

- Create a project-specific Nginx site config.
- Proxy `/api/` traffic to:
  ```text
  http://localhost:4000/api/
  ```
- Include standard proxy headers:
  ```text
  Host
  X-Real-IP
  X-Forwarded-For
  X-Forwarded-Proto
  ```
- Avoid secrets in Nginx config.
- Disable or replace the default site only after the project config is ready.

Future config concept:

```nginx
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Notes:

- This is a future config shape only.
- Do not edit Nginx files in this guide phase.
- App port `4000` stays local/private-only.
- Frontend static hosting is not part of this phase.

## 6. Local Verification Plan

Future Nginx config test:

```bash
sudo nginx -t
```

Expected future result:

```text
syntax is ok
test is successful
```

Future reload only after config test passes:

```bash
sudo systemctl reload nginx
```

Future local Nginx proxy verification:

```bash
curl -i http://localhost/api/health
```

Expected future result:

```text
HTTP 200 OK
```

Verification sequence:

1. Confirm API direct local health on `http://localhost:4000/api/health`.
2. Install Nginx only if missing.
3. Create project Nginx config.
4. Test with `sudo nginx -t`.
5. Reload Nginx only if the config test passes.
6. Verify `http://localhost/api/health` locally on EC2.
7. Keep public security group ports closed until local Nginx verification succeeds.

## 7. Public Access Boundary

Public access must remain closed in this phase.

Do not open:

```text
HTTP 80
HTTPS 443
App port 4000
```

Boundary rules:

- Do not open security group HTTP `80` yet.
- Do not open HTTPS `443` yet.
- Do not open app port `4000`.
- Keep public access closed until local Nginx verification succeeds.
- Do not configure DNS yet.
- Do not configure Cloudflare yet.
- Do not configure HTTPS/Certbot yet.

## 8. Stop Conditions

Stop immediately if:

- API container is not running.
- Local API health check on port `4000` fails.
- Nginx install fails.
- Nginx config test fails.
- Proxy returns non-`200` for `/api/health`.
- App port `4000` is proposed for public access.
- Security group HTTP/HTTPS opening is proposed before local Nginx success.
- Secrets are added to Nginx config.
- Secrets appear in logs.
- User is unsure what to do.
- Any command would modify AWS/security groups before approval.
- Any command would configure DNS before approval.
- Any command would configure HTTPS/Certbot before approval.

## 9. Evidence/Security Notes

Safe to document:

- Nginx config path, once known.
- Proxy target:
  ```text
  http://localhost:4000
  ```
- Local API endpoint:
  ```text
  /api/health
  ```
- Local Nginx test endpoint:
  ```text
  http://localhost/api/health
  ```
- HTTP port:
  ```text
  80
  ```
- App port as local/private-only:
  ```text
  4000
  ```
- Local `HTTP 200 OK` result.

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
- Configure HTTPS/Certbot.
- Reset or delete any database.
- Stage, commit, or push.
- Run `npm audit fix --force`.

## 11. Next Phase Recommendation

Recommended next phase:

Plan or execute the controlled Nginx local reverse proxy setup.

Suggested next-ticket focus:

- Install Nginx only if missing.
- Create the project Nginx reverse proxy config.
- Test Nginx config locally.
- Reload Nginx only after config test passes.
- Verify `http://localhost/api/health` locally.
- Keep public HTTP `80`, HTTPS `443`, Cloudflare/DNS, Certbot, and frontend deployment for later approved phases.

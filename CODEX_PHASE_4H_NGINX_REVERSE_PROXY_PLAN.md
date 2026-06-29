# Codex Phase 4H: Nginx Reverse Proxy Plan

## 1. Phase Name And Purpose

Phase 4H: Nginx Reverse Proxy Plan

Purpose:

Plan how Nginx will eventually serve the frontend static assets and reverse-proxy API traffic to the API container on EC2.

This is a planning-only phase.

No Nginx installation, Nginx configuration, frontend build, frontend file change, deployment, AWS resource, EC2 resource, RDS resource, security group change, Docker/Compose command, Prisma migration command, real env file, real secret, database change, or `.env` modification was performed.

## 2. Future Nginx Role

The future Nginx role is to act as the public HTTP/HTTPS front door for the deployed app on EC2.

Nginx should eventually:

- Serve the frontend production static assets.
- Reverse-proxy API requests to the API container.
- Support SPA client-side routes.
- Handle HTTP verification before SSL.
- Later support HTTPS after Certbot configuration.
- Keep browser traffic flowing through a single public entry point.

Final intended public entry point:

```text
Browser -> Nginx -> frontend static files
Browser -> Nginx /api -> API container
API container -> RDS PostgreSQL
```

## 3. What Reverse Proxy Means In This Project

A reverse proxy means Nginx receives public browser requests first, then forwards selected requests to an internal backend service.

In this project:

- Browser requests for `/` and frontend routes should be served from static files.
- Browser requests for `/api/...` should be forwarded by Nginx to the API container/host port.
- The API container should not need to be directly exposed to the public internet in the final setup.
- RDS remains private behind the API container and security groups.

This allows the public app to use a clean same-origin route:

```text
https://<domain>/api
```

instead of exposing a separate API port publicly.

## 4. Frontend Static Serving Plan

Likely future web root:

```text
/var/www/crm-modern
```

This directory should contain the production frontend build output.

Nginx should serve:

- `index.html`
- JavaScript bundles
- CSS files
- Static image/font assets
- Other frontend build assets

The web root should not contain:

- `.env`
- Production env files
- Source secrets
- Private keys
- Backend-only config
- Database credentials

Expected static serving behavior:

```text
/                 -> /var/www/crm-modern/index.html
/assets/...       -> /var/www/crm-modern/assets/...
/other-static...  -> matching static file if present
```

## 5. API Reverse Proxy Route

Future API route:

```text
/api
```

Expected behavior:

```text
/api/... -> API container/host port
```

The exact upstream target should be decided during implementation based on how the API container is reachable from Nginx.

Possible future target shape:

```text
http://127.0.0.1:<host-api-port>
```

or another approved internal target.

Important:

- `/api` should forward to the API container.
- The API container should not be directly public in the final setup.
- Any temporary public API/app port should be closed after Nginx reverse proxy is verified.
- API secrets remain server-side and must never be served by Nginx.

## 6. SPA Fallback

Because the frontend is a React SPA, frontend routes should fall back to `index.html`.

Expected behavior:

```text
/             -> index.html
/dashboard    -> index.html
/matters/123  -> index.html
```

But `/api` must not fall back to frontend.

Expected API behavior:

```text
/api/health -> API container
/api/...    -> API container
```

Ordering matters:

- `/api` location should be handled separately.
- SPA fallback should apply only to frontend routes.
- Nginx should not return `index.html` for API requests.

Future SPA fallback pattern may use:

```text
try_files $uri $uri/ /index.html;
```

but only in the frontend location block, not the API proxy block.

## 7. Future HTTP-First Verification Before SSL

Before SSL/Certbot, Nginx should first be verified over HTTP.

Future HTTP checks may include:

- Nginx config syntax test.
- Nginx service reload/restart.
- Browser or `curl` check for the frontend over:
  ```text
  http://<ec2-public-ip>/
  ```
- API health check through Nginx:
  ```text
  http://<ec2-public-ip>/api/health
  ```
- SPA route check:
  ```text
  http://<ec2-public-ip>/dashboard
  ```

Reason:

- HTTP-first verification reduces variables before adding DNS and SSL.
- It confirms Nginx routing works before Certbot changes the config.
- It confirms `/api` proxying works before HTTPS is introduced.

## 8. Later HTTPS/SSL Handoff To Certbot Phase

SSL/Certbot should be handled in a later dedicated phase.

Before Certbot:

- Nginx HTTP config should work.
- DNS should point to the EC2 public IP.
- Port `80` should be open.
- Domain should resolve correctly.
- `/` and `/api/health` should work over HTTP.

After Certbot:

- Port `443` should be open.
- HTTPS should serve the frontend.
- HTTPS `/api` should proxy to the API container.
- HTTP-to-HTTPS redirect may be enabled if approved.

SSL configuration should not be improvised inside Phase 4H.

## 9. Nginx Config Risks

Wrong proxy target:

- `/api` may point to the wrong port or host.
- API health checks may fail even if the API container is running.

Missing headers:

- API may not receive expected `Host`, `X-Forwarded-For`, or `X-Forwarded-Proto` headers.
- Logs or app behavior may be harder to debug.

`/api` route swallowed by SPA fallback:

- API requests may return `index.html` instead of API JSON.
- Frontend may show confusing errors.

Serving secret files:

- Misconfigured web root could expose `.env`, production env files, source files, or private keys.
- Web root should contain only built frontend static assets.

Exposing API port publicly:

- Temporary API ports may remain open after Nginx is working.
- Final setup should use Nginx as the public entry point.

## 10. Security Group Implications

Port `80`:

- Open later when HTTP/Nginx verification begins.
- Required for HTTP access and likely Certbot HTTP challenge.

Port `443`:

- Open later when HTTPS/SSL verification begins.
- Intended final public app entry point.

Temporary API/app port:

- Should be opened only if explicitly approved.
- Should be used only for early testing if needed.
- Should be closed after Nginx reverse proxy is verified.

General rule:

- Open only the ports required for the current approved phase.
- Do not change security groups during Phase 4H planning.
- Review all security group changes before applying them.

## 11. Safe Validation Command Shapes Without Running Them

Future Nginx config test command shape:

```bash
sudo nginx -t
```

Future Nginx reload command shape:

```bash
sudo systemctl reload nginx
```

Future Nginx restart command shape, only if reload is insufficient:

```bash
sudo systemctl restart nginx
```

Future frontend HTTP check:

```bash
curl -I http://<ec2-public-ip>/
```

Future API through Nginx check:

```bash
curl http://<ec2-public-ip>/api/health
```

Future SPA route check:

```bash
curl -I http://<ec2-public-ip>/dashboard
```

Important:

These are future command shapes only. They are not approved to run during Phase 4H.

## 12. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- Nginx config file path, without secrets.
- `sudo nginx -t` success output.
- Nginx service active status.
- Frontend loads over HTTP.
- `/api/health` works through Nginx.
- SPA route returns frontend app.
- Security group shows only intended HTTP/HTTPS ports.
- Browser network tab shows `/api` calls using same origin.
- Later HTTPS verification after Certbot phase.

Do not capture:

- Private keys
- Real secrets
- Production env file contents
- Full `DATABASE_URL`
- API keys
- Sensitive AWS account details unless redacted
- Any terminal output containing secrets

## 13. Boundaries Respected

Boundaries respected during Phase 4H:

- Nginx was not installed.
- Nginx config was not created or modified.
- No Nginx commands were run.
- Frontend was not built.
- Frontend files were not modified.
- `.env` was not modified.
- No real env files were created.
- No real secrets were created or edited.
- No secrets were exposed.
- No secret values were requested.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No Prisma migration commands were run.
- No deployment was performed.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No security groups were changed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
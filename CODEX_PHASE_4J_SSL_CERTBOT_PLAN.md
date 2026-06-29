# Codex Phase 4J: SSL / Certbot Plan

## 1. Phase Name And Purpose

Phase 4J: SSL / Certbot Plan

Purpose:

Plan how HTTPS/SSL will eventually be enabled for the public domain using Certbot after DNS and Nginx HTTP routing are working.

This is a planning-only phase.

No Certbot installation, certificate request, Nginx config change, Nginx command, DNS change, Cloudflare record change, AWS resource, EC2 resource, RDS resource, Elastic IP allocation, security group change, frontend build, frontend file change, real env file, real secret, Docker/Compose command, Prisma migration command, deployment, database change, or `.env` modification was performed.

## 2. Future SSL/Certbot Goal

The future SSL/Certbot goal is to enable HTTPS for the public domain or subdomain after EC2, Nginx HTTP routing, and Cloudflare DNS are already working.

Certbot should eventually:

- Request a valid TLS certificate for the chosen hostname.
- Configure Nginx to serve the app over HTTPS.
- Allow the frontend to load securely over `https://`.
- Allow `/api` routes to work securely over HTTPS.
- Support safe certificate renewal.

This phase does not install Certbot, request certificates, or modify Nginx.

## 3. Why HTTP/Nginx And DNS Should Work Before Certbot

HTTP/Nginx and DNS should work before Certbot because Certbot needs to prove control of the domain.

Before SSL:

- DNS should resolve the hostname to the EC2 public IP or Elastic IP.
- Port `80` should be reachable.
- Nginx should serve HTTP traffic for the hostname.
- The frontend should be reachable over HTTP.
- `/api/health` should work through Nginx over HTTP.

This reduces troubleshooting complexity.

If HTTP does not work first, Certbot failures could be caused by DNS, security groups, Nginx config, Cloudflare proxy behavior, or app routing, making the problem harder to isolate.

## 4. Preconditions Before Running Certbot

Before running Certbot later, confirm:

- EC2 exists.
- Domain/subdomain has been chosen.
- DNS resolves to the EC2 public IP or Elastic IP.
- Nginx HTTP works for the chosen hostname.
- Frontend works over HTTP through the domain.
- `/api/health` works through the domain over HTTP.
- Port `80` security group posture has been reviewed and allows HTTP.
- Port `443` security group posture has been reviewed for HTTPS.
- Cloudflare proxy mode has been reviewed.
- Initial Cloudflare mode is likely DNS-only for simpler validation unless Architect approves otherwise.
- Nginx config has been tested successfully.
- No secrets are present in Nginx web root.
- ChatGPT Architect approves Certbot execution.

## 5. Future Certbot Command Shape Without Running It

Future command shape may look like:

```bash
sudo certbot --nginx -d <subdomain>.<domain>
```

If covering both root and `www`, future shape may look like:

```bash
sudo certbot --nginx -d <domain> -d www.<domain>
```

Important:

These are future command shapes only.

They are not approved to run during Phase 4J.

The exact hostname and command must be reviewed before execution.

## 6. HTTP-01 Challenge Concept At A High Level

The HTTP-01 challenge is a domain validation method.

High-level flow:

1. Certbot asks Let’s Encrypt for a certificate.
2. Let’s Encrypt provides a challenge token.
3. Certbot makes the challenge available under the domain over HTTP.
4. Let’s Encrypt requests:
   ```text
   http://<domain>/.well-known/acme-challenge/<token>
   ```
5. If Let’s Encrypt can reach the token successfully, it confirms control of the domain.
6. Certificate issuance can proceed.

This is why DNS must point to EC2 and port `80` must work before Certbot.

## 7. Nginx Config Changes Certbot May Make

When using the Nginx plugin, Certbot may:

- Add SSL certificate directives.
- Add HTTPS `server` block configuration.
- Update `listen 443 ssl`.
- Add certificate/key file paths.
- Optionally add HTTP-to-HTTPS redirect.
- Modify existing Nginx site config.

Because Certbot may edit Nginx config:

- Nginx HTTP config should be clean before running Certbot.
- Existing Nginx config should be reviewed first.
- Any Certbot changes should be inspected after execution.
- Nginx should be tested after Certbot changes.

## 8. HTTPS Verification

After Certbot later succeeds, verify:

Frontend over HTTPS:

```text
https://<subdomain>.<domain>/
```

API health over HTTPS:

```text
https://<subdomain>.<domain>/api/health
```

SPA route over HTTPS:

```text
https://<subdomain>.<domain>/dashboard
```

Optional HTTP-to-HTTPS redirect if approved:

```text
http://<subdomain>.<domain>/
```

Expected result:

- HTTPS loads frontend.
- HTTPS `/api/health` reaches API through Nginx.
- SPA routes still fall back to `index.html`.
- Browser shows a valid certificate.
- No mixed-content warnings.
- No redirect loop.

## 9. Renewal Considerations

Certbot typically configures automatic renewal.

Future checks may include:

- Confirm renewal timer/service exists.
- Confirm renewal does not require manual intervention.
- Confirm port `80` remains available for HTTP-01 renewal if that challenge method is used.
- Confirm Nginx config remains valid after renewal.

Future renewal dry-run command shape:

```bash
sudo certbot renew --dry-run
```

Important:

This is a future command shape only.

It is not approved to run during Phase 4J.

## 10. Cloudflare SSL/TLS Mode Considerations If Proxied Later

If Cloudflare proxied mode is enabled later, Cloudflare SSL/TLS mode must be reviewed carefully.

Considerations:

- DNS-only mode is simpler for initial Certbot validation.
- Proxied mode can hide direct origin behavior.
- Cloudflare SSL/TLS mode can affect HTTPS behavior.
- Incorrect modes can create redirect loops or insecure origin connections.
- After origin Certbot SSL works, Cloudflare proxied mode may be considered later.

Recommendation:

- Start with DNS-only for initial Certbot/HTTP validation unless Architect approves otherwise.
- Enable proxied mode only after HTTPS is working and the app is stable.
- Review Cloudflare SSL/TLS mode before enabling proxy.

## 11. Risks

DNS points wrong:

- Certbot may validate the wrong server.
- Users may reach the wrong app.
- Certificate may fail to issue.

Port `80` blocked:

- HTTP-01 challenge may fail.
- Certbot may not prove domain control.

Cloudflare proxy interferes:

- Proxied mode may complicate ACME validation.
- Cloudflare SSL/TLS mode may cause unexpected redirects or certificate errors.

Nginx config invalid:

- Certbot may fail.
- Nginx may not reload.
- Existing app routing may break.

Certificate issued for wrong hostname:

- HTTPS may work for one hostname but fail for another.
- Browser certificate mismatch errors may occur.

Redirect loop:

- HTTP-to-HTTPS redirect plus Cloudflare settings can create loops.
- Misconfigured proxy headers can also contribute.

## 12. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- DNS resolves to EC2 before Certbot.
- HTTP frontend works through domain.
- HTTP `/api/health` works through domain.
- Certbot success output, without private key contents.
- Nginx config test success after Certbot.
- HTTPS frontend loads.
- HTTPS `/api/health` works.
- Browser shows valid certificate.
- Renewal dry-run success, if later approved.
- Cloudflare DNS/proxy status, with account details redacted.

Do not capture:

- Private key contents
- Certificate private key files
- Secret env file contents
- Full `DATABASE_URL`
- API keys
- Cloudflare API tokens
- Sensitive AWS or Cloudflare account details unless redacted

## 13. Boundaries Respected

Boundaries respected during Phase 4J:

- Certbot was not installed.
- Certificates were not requested.
- Nginx config was not modified.
- No Nginx commands were run.
- DNS was not changed.
- Cloudflare records were not created or modified.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No Elastic IPs were allocated.
- No security groups were changed.
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
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
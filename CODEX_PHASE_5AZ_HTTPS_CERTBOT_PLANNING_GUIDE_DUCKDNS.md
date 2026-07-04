# CODEX Phase 5AZ: HTTPS/Certbot Planning Guide for DuckDNS

## 1. Phase Name and Purpose

Phase 5AZ prepares the safe plan for enabling HTTPS on the DuckDNS API demo hostname using Let's Encrypt Certbot with Nginx.

This phase is guide-only. It does not install Certbot, request certificates, configure HTTPS, edit Nginx files, open HTTPS port 443, or modify any AWS, DuckDNS, Cloudflare, Docker, Prisma, frontend, or secret configuration.

## 2. Current DuckDNS and Nginx HTTP State

Current approved state:

* EC2 instance: `crm-modern-prod-ec2`
* Region: `ap-southeast-1`
* DuckDNS hostname: `aucrm.duckdns.org`
* Public HTTP port `80` is open.
* Public HTTP health endpoint works:
  * `http://aucrm.duckdns.org/api/health`
  * expected result: `HTTP 200 OK`
* Nginx is running and serves the public response.
* Nginx proxies API traffic to the private/local API container port.
* API app port `4000` remains private/local-only.
* HTTPS port `443` is not open or configured yet.
* HTTPS/Certbot is not configured yet.
* Frontend is not deployed yet.
* Elastic IP was intentionally skipped for cost-control.

## 3. HTTPS Approach

Recommended HTTPS approach:

* Use a Let's Encrypt certificate.
* Use Certbot with the Nginx plugin.
* Use HTTP-01 validation through the existing public HTTP port `80`.
* Use domain: `aucrm.duckdns.org`.
* Do not use, request, paste, or document the DuckDNS token for this phase.

HTTP-01 validation is appropriate because `aucrm.duckdns.org` already resolves publicly and the server already responds successfully over HTTP through Nginx.

## 4. Required Pre-Checks

Before any later HTTPS execution phase, verify:

* `http://aucrm.duckdns.org/api/health` returns `HTTP 200 OK`.
* Nginx is active/running.
* Nginx configuration test passes.
* DuckDNS resolves to the current EC2 public IPv4.
* EC2 security group has HTTP `80` open.
* HTTPS `443` is not open yet unless explicitly approved in a later phase.
* API app port `4000` remains private/local-only.
* RDS port `5432` remains private.
* SSH `22` remains restricted.

Do not print or document EC2 public IP/DNS while performing or reporting these checks.

## 5. Security Group Planning for Future HTTPS 443

Future HTTPS execution should plan a single additional inbound rule on `crm-modern-prod-ec2-sg`:

* Type: HTTPS
* Protocol: TCP
* Port: `443`
* Source: public web access, if approved for the demo
* Purpose: allow HTTPS traffic to Nginx

Security boundaries to preserve:

* Keep HTTP `80` open for Let's Encrypt validation and optional HTTP-to-HTTPS redirect.
* Do not open app port `4000` publicly.
* Do not open RDS port `5432` publicly.
* Do not broaden SSH `22`.
* Do not modify the RDS security group.

## 6. Certbot Installation Planning

In a later approved execution phase, install Certbot and the Nginx plugin using the recommended Ubuntu method for the server OS.

Planning notes:

* Do not install Certbot in this planning phase.
* Do not run Certbot in this planning phase.
* Do not paste account email, private account details, or certificate registration details into reports unless explicitly approved.
* Do not add secrets to Nginx configuration.
* Do not use DuckDNS token-based validation for this phase.

## 7. Certificate Request Planning for aucrm.duckdns.org

The future certificate request should target:

* Domain: `aucrm.duckdns.org`
* Web server: Nginx
* Validation method: Let's Encrypt HTTP-01 through port `80`
* Expected tool path: Certbot with Nginx plugin

Expected result after a later approved execution:

* Certificate is issued for `aucrm.duckdns.org`.
* Nginx is updated for HTTPS.
* HTTPS endpoint becomes available on port `443`.
* Optional HTTP-to-HTTPS redirect may be selected during execution if approved.
* API route continues to proxy to the private/local API service.

## 8. Verification Plan After HTTPS Is Configured

After HTTPS is eventually configured in a later approved phase, verify:

* `https://aucrm.duckdns.org/api/health` returns `HTTP 200 OK`.
* The browser or curl reports a valid certificate.
* Nginx continues serving the response.
* Nginx continues proxying `/api/` to the private/local API target.
* API app port `4000` remains closed publicly.
* RDS port `5432` remains closed publicly.
* SSH remains restricted.

Expected non-secret health response body:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

## 9. Renewal Planning and Elastic IP Caveat

Certbot should create or rely on a renewal timer after installation in a later phase.

Renewal caveat:

* Elastic IP was intentionally skipped for cost-control.
* The EC2 public IPv4 may change after an instance stop/start.
* If the EC2 public IPv4 changes, DuckDNS must be updated before domain access and certificate renewal can work reliably.
* Renewal depends on `aucrm.duckdns.org` still resolving to the current EC2 public IPv4 and HTTP validation still reaching Nginx on port `80`.

This is an accepted demo/portfolio tradeoff, not an accidental omission.

## 10. Stop Conditions

Stop before any future execution if:

* `http://aucrm.duckdns.org/api/health` fails.
* Nginx config test fails.
* Nginx is not active/running.
* DuckDNS points to the wrong host.
* Wrong hostname is selected.
* HTTPS `443` cannot be opened safely.
* Certbot proposes unexpected or destructive Nginx changes.
* DuckDNS token would be requested, pasted, exposed, or stored unsafely.
* App port `4000` exposure is proposed.
* RDS port `5432` exposure is proposed.
* Broad SSH exposure is proposed.
* Secrets appear in config, logs, screenshots, or reports.
* User is unsure what to click or run.

## 11. Evidence and Security Notes

Safe to document:

* Hostname `aucrm.duckdns.org`
* HTTP/HTTPS status codes
* Path `/api/health`
* Certbot with Nginx plugin method
* HTTP port `80`
* Future HTTPS port `443`
* App port `4000` as private/local-only
* Elastic IP skipped caveat

Do not document:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Elastic IP value
* Full RDS endpoint
* Full `DATABASE_URL`
* Database password
* Env file contents
* Private key path or contents
* Any other secret material

## 12. What Must Not Be Done in This Phase

Do not:

* SSH to the server.
* Run commands.
* Install Certbot.
* Request certificates.
* Configure HTTPS.
* Modify Nginx files.
* Modify AWS resources.
* Modify security groups.
* Open HTTPS port `443`.
* Open app port `4000`.
* Open RDS port `5432`.
* Modify the RDS security group.
* Broaden SSH access.
* Configure DuckDNS or update DuckDNS records.
* Ask for or expose DuckDNS token.
* Configure Cloudflare or Cloudflare DNS.
* Allocate or associate Elastic IP.
* Run Docker Compose.
* Start or stop containers.
* Run Docker build.
* Run Prisma commands.
* Print env file contents.
* Run `env`.
* Run `docker compose config` using the real env file.
* Create or edit real secrets.
* Ask for database password, private key contents, or GitHub tokens.
* Modify `.env`, Dockerfile, Compose files, frontend files, or GitHub Actions.
* Deploy frontend.
* Reset or delete any database.
* Stage, commit, or push.
* Run `npm audit fix --force`.

## 13. Next Phase Recommendation

Proceed to an Architect-approved HTTPS/Certbot execution guide for DuckDNS.

That next guide should define the exact safe steps for:

* confirming HTTP validation readiness,
* opening HTTPS `443` only when approved,
* installing Certbot and the Nginx plugin,
* requesting the certificate for `aucrm.duckdns.org`,
* verifying HTTPS `/api/health`,
* confirming renewal behavior,
* preserving all existing security boundaries.

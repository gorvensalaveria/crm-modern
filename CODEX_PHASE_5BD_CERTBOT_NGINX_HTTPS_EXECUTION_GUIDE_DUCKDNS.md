# CODEX Phase 5BD: Certbot/Nginx HTTPS Execution Guide for DuckDNS

## 1. Phase Name and Purpose

Phase 5BD prepares the exact safe manual execution guide for enabling HTTPS on `aucrm.duckdns.org` using Certbot with Nginx.

This phase is guide-only. It does not SSH, run commands, install Certbot, request certificates, configure HTTPS, edit Nginx files, or modify infrastructure.

## 2. Current Validated Prerequisites

Current approved state:

* DuckDNS hostname: `aucrm.duckdns.org`
* HTTP endpoint works:
  * `http://aucrm.duckdns.org/api/health`
  * result: `HTTP 200 OK`
* Nginx is running and serving HTTP.
* API container is running behind Nginx.
* Nginx proxies `/api/` to `http://localhost:4000/api/`.
* EC2 security group: `crm-modern-prod-ec2-sg`
* Public inbound HTTP `80` is open.
* Public inbound HTTPS `443` is open.
* SSH `22` remains restricted.
* App port `4000` remains private.
* RDS port `5432` remains private.
* RDS security group was not modified.
* Elastic IP remains intentionally skipped.
* Certbot is not installed yet.
* HTTPS certificate is not issued yet.
* HTTPS/Nginx is not configured yet.

## 3. Safety Notes

During the future execution phase:

* Do not expose secrets.
* Do not print the runtime env file.
* Do not run `env`.
* Do not run `docker compose config` with the real env file.
* DuckDNS token is not needed for this HTTP-01 validation path.
* Do not paste the DuckDNS token into chat or reports.
* Do not paste Certbot account email into chat or reports unless explicitly approved.
* Do not change the Nginx proxy target.
* Do not open app port `4000`.
* Do not open RDS port `5432`.
* Do not broaden SSH.
* Do not modify the RDS security group.

## 4. Pre-Check Commands

Before SSH, verify the public HTTP path from the user machine:

```bash
curl -i http://aucrm.duckdns.org/api/health
```

Purpose:

* Confirms DuckDNS resolves publicly.
* Confirms public HTTP `80` reaches Nginx.
* Confirms `/api/health` is reachable before any HTTPS work.

Success looks like:

* `HTTP 200 OK`
* Non-secret health response body.

After SSH to EC2 in the later execution phase, run these checks:

```bash
hostname
```

Confirms the user is on the expected server.

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```

Confirms the API container is running without printing secrets.

```bash
curl -i http://localhost/api/health
```

Confirms local Nginx proxying still works on the server.

```bash
sudo nginx -t
```

Confirms Nginx configuration is valid before changes.

```bash
systemctl is-active nginx
```

Confirms Nginx is running.

```bash
systemctl is-enabled nginx
```

Confirms Nginx is enabled for boot.

## 5. Nginx server_name Update Plan

The current Nginx server block likely uses:

```nginx
server_name _;
```

In the future execution phase, update only this project site file:

```text
/etc/nginx/sites-available/crm-modern-api
```

Replace:

```nginx
server_name _;
```

With:

```nginx
server_name aucrm.duckdns.org;
```

Do not change the existing `/api/` proxy behavior.

Keep the proxy target:

```text
http://localhost:4000/api/
```

After editing, validate and reload Nginx:

```bash
sudo nginx -t
```

Success looks like:

* syntax is OK
* test is successful

Then reload:

```bash
sudo systemctl reload nginx
```

Verify local and public HTTP still work:

```bash
curl -i http://localhost/api/health
```

```bash
curl -i http://aucrm.duckdns.org/api/health
```

Expected result:

* `HTTP 200 OK`

## 6. Certbot Installation Plan

Use the recommended Ubuntu method for Certbot with Nginx where appropriate.

Likely command sequence for the later execution phase:

```bash
sudo apt update
```

Ensures package metadata is current.

```bash
sudo snap install core
```

Ensures Snap core is installed if Snap is available and supported.

```bash
sudo snap refresh core
```

Refreshes Snap core.

```bash
sudo apt remove -y certbot
```

Removes any conflicting apt-installed Certbot package if present.

```bash
sudo snap install --classic certbot
```

Installs Certbot using Snap.

```bash
sudo ln -sf /snap/bin/certbot /usr/bin/certbot
```

Makes `certbot` available from the standard command path.

Stop if Snap is unavailable, unsupported, or behaves unexpectedly on the server. Do not improvise a different installation path without Architect approval.

## 7. Certificate Request Plan

Use the Nginx plugin:

```bash
sudo certbot --nginx -d aucrm.duckdns.org
```

Expected Certbot interaction:

* User may enter an email manually on the server.
* Do not paste the email into chat or reports unless explicitly approved.
* Accept Let's Encrypt Terms of Service only if the user agrees.
* Email sharing with EFF can be declined.
* If Certbot offers HTTP-to-HTTPS redirect, redirect is acceptable for this API hostname, but if the prompt is unclear, stop and report the prompt before choosing.

Stop if Certbot:

* cannot find the matching Nginx server block,
* asks for a DuckDNS token,
* asks to expose secrets,
* proposes unexpected or destructive Nginx changes,
* reports rate-limit or validation errors that are not understood.

## 8. Post-Certbot HTTPS Verification

After Certbot completes in the future execution phase, verify:

```bash
sudo nginx -t
```

Expected:

* syntax is OK
* test is successful

```bash
systemctl is-active nginx
```

Expected:

* `active`

```bash
curl -i https://aucrm.duckdns.org/api/health
```

Expected:

* `HTTP 200 OK`
* Non-secret health response body.

Optional HTTP check:

```bash
curl -I http://aucrm.duckdns.org/api/health
```

Expected:

* either `HTTP 200 OK`, or
* redirect to HTTPS, depending on the Certbot redirect choice.

## 9. Renewal Verification

Check whether a Certbot renewal timer exists:

```bash
systemctl list-timers | grep -i certbot || true
```

Then run a safe renewal dry run:

```bash
sudo certbot renew --dry-run
```

Expected:

* dry run completes successfully.

Renewal caveat:

* Elastic IP remains intentionally skipped.
* Renewal depends on DuckDNS still pointing to the current EC2 public IPv4.
* If the EC2 public IPv4 changes after stop/start, update DuckDNS before relying on renewal or domain access.

## 10. Stop Conditions

Stop if:

* HTTP endpoint fails before Certbot.
* Nginx config test fails.
* API container is not running.
* Wrong Nginx file is being edited.
* Proxy target would be changed unexpectedly.
* Certbot cannot find the matching server block.
* Certbot asks for DuckDNS token.
* Certbot asks to expose secrets.
* Certbot asks for unexpected or destructive changes.
* HTTPS verification fails after certificate issuance.
* App port `4000` exposure is proposed.
* RDS port `5432` exposure is proposed.
* Broad SSH exposure is proposed.
* RDS security group modification is proposed.
* User is unsure.

## 11. Evidence and Security Notes

Safe to document:

* Hostname `aucrm.duckdns.org`
* Path `/api/health`
* HTTP/HTTPS status codes
* Nginx version
* Certbot with Nginx plugin method
* Certificate success or failure summary
* Renewal dry-run result

Do not document:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Full RDS endpoint
* Full `DATABASE_URL`
* Database password
* Env contents
* Private key path or contents
* Certbot account email unless explicitly approved

## 12. What Not To Do

Do not:

* Open app port `4000`.
* Open RDS port `5432`.
* Broaden SSH.
* Modify RDS security group.
* Modify Docker Compose.
* Modify app code.
* Deploy frontend.
* Reset or delete the database.
* Print env file contents.
* Run `env`.
* Run `docker compose config` with the real env file.
* Ask for or expose DuckDNS token.
* Ask for or expose database password.
* Ask for or expose private key contents.
* Ask for or expose GitHub tokens.
* Stage, commit, or push.
* Run `npm audit fix --force`.

## 13. Next Phase Recommendation

Proceed to:

* Phase 5BE: Certbot/Nginx HTTPS Execution

That phase should be performed manually by the user using this guide, then documented in a separate execution report with secret-safe evidence only.

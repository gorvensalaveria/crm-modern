# CODEX Phase 5BC: HTTPS Port 443 Security Group Opening Execution Report

## 1. Phase Name and Purpose

Phase 5BC documents the completed AWS security group change that opened HTTPS TCP `443` for future HTTPS access to the DuckDNS/Nginx API endpoint.

This report is documentation-only. It does not modify AWS resources, security groups, Nginx, DuckDNS, Certbot, Docker, Prisma, frontend files, secrets, or deployment state.

## 2. What Changed

The EC2 security group `crm-modern-prod-ec2-sg` was updated to include public HTTPS access:

* HTTPS TCP `443` was added.
* Inbound rules count after the change: `3`.

This prepares the server for a later Certbot/Nginx HTTPS configuration phase.

## 3. Final Inbound Rule Summary

Final approved inbound posture:

* HTTP TCP `80` remains open.
* HTTPS TCP `443` is now open.
* SSH TCP `22` remains present and was not intentionally broadened.

No IPv6 rule was added.

## 4. What Stayed Unchanged

The following boundaries stayed unchanged:

* App port `4000` was not opened publicly.
* RDS port `5432` was not opened publicly.
* RDS security group was not modified.
* DuckDNS was not modified.
* Elastic IP remains intentionally skipped.
* Cloudflare is not used for this path.

## 5. Verification Result

After opening HTTPS TCP `443`, the existing HTTP verification still succeeded:

* URL: `http://aucrm.duckdns.org/api/health`
* Result: `HTTP 200 OK`
* Served through: `nginx/1.28.3 (Ubuntu)`
* Response body:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

## 6. HTTPS Caveat

HTTPS is not expected to work yet.

Opening port `443` only prepares the security group for HTTPS traffic. HTTPS still requires a later approved Certbot/Nginx phase to install Certbot, request the certificate, and configure Nginx for TLS.

## 7. Security Boundaries Preserved

Security boundaries preserved:

* HTTP `80` remains available for public HTTP and Let's Encrypt HTTP-01 readiness.
* HTTPS `443` is open for future Nginx HTTPS.
* SSH `22` was not intentionally broadened.
* App port `4000` remains private and not publicly exposed.
* RDS port `5432` remains private and not publicly exposed.
* RDS security group was not modified.
* No DuckDNS token was requested or exposed.
* No secrets were accessed, printed, or documented.

## 8. Evidence and Security Notes

Safe evidence included in this report:

* Security group name: `crm-modern-prod-ec2-sg`
* Hostname: `aucrm.duckdns.org`
* Ports: `80`, `443`, `22`, `4000`, `5432`
* HTTP result: `HTTP 200 OK`
* Nginx version: `nginx/1.28.3 (Ubuntu)`
* Non-secret health response body

Excluded from this report:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* RDS endpoint
* Full `DATABASE_URL`
* Passwords
* Env file contents
* Private key path or contents
* Unnecessary security group rule IDs

## 9. What Was Not Done

The following were not done in this phase:

* No SSH session was opened.
* No commands were run.
* No additional AWS resources were modified.
* No ports were opened or closed beyond the completed HTTPS TCP `443` change being documented.
* No Certbot installation was performed.
* No certificate was requested.
* No HTTPS configuration was applied.
* No Nginx files were edited.
* No DuckDNS changes were made.
* No Cloudflare configuration was made.
* No Elastic IP was allocated or associated.
* No app port `4000` was opened.
* No RDS port `5432` was opened.
* No RDS security group changes were made.
* No Docker Compose commands were run.
* No containers were started or stopped.
* No Docker build was run.
* No Prisma commands were run.
* No env file contents were printed.
* No real secrets were created or edited.
* No `.env`, Dockerfile, Compose, frontend, or GitHub Actions files were modified.
* No frontend deployment was performed.
* No database reset or deletion was performed.
* No staging, commit, or push was performed.

## 10. Next Phase Recommendation

Proceed to:

* Phase 5BD: Certbot/Nginx HTTPS Execution Guide for DuckDNS

That guide should define the exact safe steps for installing Certbot, requesting the Let's Encrypt certificate for `aucrm.duckdns.org`, configuring Nginx HTTPS, verifying `https://aucrm.duckdns.org/api/health`, and preserving all current security boundaries.

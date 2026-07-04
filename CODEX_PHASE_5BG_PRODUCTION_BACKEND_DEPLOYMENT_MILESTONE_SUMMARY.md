# CODEX Phase 5BG: Production Backend Deployment Milestone Summary

## 1. Phase Name and Purpose

Phase 5BG documents the completed production backend deployment milestone for the CRM Modern AWS deployment.

This summary is documentation-only. It does not run commands, modify infrastructure, change security groups, deploy frontend, edit secrets, or alter application files.

## 2. Executive Summary

The production backend is now deployed and reachable over HTTPS using the DuckDNS hostname `aucrm.duckdns.org`.

Completed backend milestone:

* RDS PostgreSQL was created and migrated.
* EC2 server was created and configured.
* Docker and Docker Compose are installed.
* Production runtime env file exists on EC2 with restricted permissions.
* Repository was cloned to the server.
* Production Prisma migration was deployed to RDS using `prisma migrate deploy`.
* API Docker image was built.
* API container is running.
* Nginx reverse proxy is installed and running.
* DuckDNS hostname is configured.
* HTTPS is enabled with Certbot/Nginx.
* Public API health check succeeds over HTTPS.

## 3. Final Backend Production Architecture

High-level production backend architecture:

```text
User Browser / HTTP Client
        |
        | HTTPS
        v
aucrm.duckdns.org
        |
        v
AWS EC2: crm-modern-prod-ec2
        |
        v
Nginx reverse proxy
        |
        | /api/ -> http://localhost:4000/api/
        v
Docker API container
        |
        v
Private Amazon RDS PostgreSQL
```

The API container remains behind Nginx. The app port `4000` is local/private-only and is not publicly opened.

## 4. AWS Resources Used

Approved AWS resource names:

* Region: `ap-southeast-1`
* EC2 instance: `crm-modern-prod-ec2`
* RDS PostgreSQL instance: `crm-modern-prod-rds-postgres`
* EC2 security group: `crm-modern-prod-ec2-sg`
* RDS security group: `crm-modern-prod-rds-sg`

No EC2 public IP/DNS or RDS endpoint is documented in this summary.

## 5. Database Deployment Summary

Database milestone:

* RDS PostgreSQL was created.
* RDS remains private.
* Production Prisma migration was deployed to RDS using `prisma migrate deploy`.
* RDS port `5432` is not publicly opened.
* RDS security group was not modified during later web exposure phases.

Database secrets, endpoint details, and connection strings are not documented.

## 6. Server and Runtime Setup Summary

Server/runtime milestone:

* EC2 server was created and configured.
* Docker and Docker Compose are installed.
* Production runtime env file exists on EC2 with restricted permissions.
* Repository was cloned to the server.
* Runtime env contents were not printed or documented.
* SSH remains restricted.

## 7. API Container Deployment Summary

API deployment milestone:

* API Docker image was built.
* API container is running.
* API container is reached through Nginx.
* App port `4000` remains private and not publicly opened.
* Public access goes through Nginx over HTTP/HTTPS ports only.

## 8. Nginx Reverse Proxy Summary

Nginx milestone:

* Nginx reverse proxy is installed and running.
* Nginx version: `nginx/1.28.3 (Ubuntu)`
* Nginx proxies `/api/` to the API container on local port `4000`.
* Nginx serves the public API response.
* HTTPS certificate deployment was completed through Certbot/Nginx.

## 9. DuckDNS and HTTPS Summary

DuckDNS/HTTPS milestone:

* DuckDNS was selected as the free hostname option.
* Cloudflare/custom domain path was abandoned because the user does not own `aucrm.com`.
* DuckDNS hostname: `aucrm.duckdns.org`
* HTTPS endpoint is live:
  * `https://aucrm.duckdns.org/api/health`
* HTTPS health check returns:
  * `HTTP 200 OK`
  * response body:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

HTTP behavior:

* HTTP redirects to HTTPS.
* HTTP result: `HTTP 301 Moved Permanently`

Certbot:

* Certbot was installed with Snap.
* Certbot version: `5.6.0`
* Certbot renewal timer exists:
  * `snap.certbot.renew.timer`
* Certbot renewal dry-run succeeded.

No DuckDNS token or Certbot account email is documented.

## 10. Security Posture Summary

Security posture:

* RDS is private.
* RDS port `5432` is not publicly opened.
* App port `4000` is not publicly opened.
* SSH remains restricted.
* Public HTTP `80` is open for redirect and validation.
* Public HTTPS `443` is open for TLS traffic.
* API traffic is served through Nginx.
* Runtime env contents are not documented.
* Database credentials and connection strings are not documented.
* DuckDNS token is not documented.

## 11. Verification Evidence Summary

Safe verification evidence:

* HTTPS endpoint: `https://aucrm.duckdns.org/api/health`
* HTTPS result: `HTTP 200 OK`
* HTTP result: `HTTP 301 Moved Permanently`
* Nginx version: `nginx/1.28.3 (Ubuntu)`
* Certbot version: `5.6.0`
* Renewal timer: `snap.certbot.renew.timer`
* Renewal dry-run: succeeded
* Non-secret health response body:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

Excluded evidence:

* EC2 public IP/DNS
* User public IP
* Full RDS endpoint
* Full `DATABASE_URL`
* Database password
* Env file contents
* DuckDNS token
* Certbot account email
* Private key path or contents
* Screenshots containing IPs or secrets

## 12. Cost-Control Decisions

Cost-control decisions:

* Elastic IP was intentionally skipped for cost control.
* DuckDNS was selected as a free hostname option.
* Cloudflare/custom domain path was abandoned because the user does not own `aucrm.com`.
* Existing low-cost AWS posture remains the basis of the deployment.

Elastic IP caveat:

* EC2 public IPv4 may change after stop/start.
* DuckDNS must be updated if EC2 public IPv4 changes.
* HTTPS access and renewal depend on DuckDNS pointing to the current EC2 public IPv4.

## 13. Known Limitations and Caveats

Known limitations:

* No Elastic IP is attached.
* DuckDNS may need manual update if EC2 public IPv4 changes.
* HTTPS renewal depends on DuckDNS resolving to the current EC2 public IPv4.
* Frontend is not deployed yet.
* CI/CD deployment automation is not configured yet.
* Monitoring and logging hardening are not completed yet.
* Custom paid domain is not configured.

## 14. What Is Not Deployed Yet

Not deployed or configured yet:

* Frontend production deployment
* GitHub Actions deployment automation
* Monitoring/logging hardening
* Elastic IP
* Custom domain
* Cloudflare path for this deployment

## 15. Portfolio Value and Skills Demonstrated

This milestone demonstrates practical Cloud and DevOps skills:

* AWS EC2 provisioning and server setup
* AWS RDS PostgreSQL setup
* Private database networking posture
* Security group management
* Linux/SSH operations
* Docker and Docker Compose runtime setup
* Production env file handling
* Prisma production migration deployment
* API container build and runtime verification
* Nginx reverse proxy configuration
* Public HTTP and HTTPS exposure planning
* DuckDNS dynamic hostname setup
* Certbot/Let's Encrypt TLS enablement
* Renewal verification
* Cost-control tradeoff documentation
* Secret-safe operational evidence

## 16. Recommended Next Phases

Recommended next phases:

* Frontend deployment planning
* Optional CI/CD deployment automation
* Optional monitoring/logging hardening
* Optional Elastic IP/custom domain if budget allows later

The next phase should preserve the current production backend security posture while extending the deployment toward a complete fullstack portfolio demo.

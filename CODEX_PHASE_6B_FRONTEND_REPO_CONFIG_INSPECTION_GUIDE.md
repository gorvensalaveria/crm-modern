# CODEX Phase 6B: Frontend Repo/Config Inspection Guide

## 1. Phase Name and Purpose

Phase 6B prepares a safe frontend repo/config inspection guide for the revised frontend deployment direction: React/Vite static hosting with S3 and CloudFront.

This phase is documentation revision only. It does not inspect source files, run commands, deploy frontend, create S3 buckets, create CloudFront distributions, modify AWS resources, or change application/runtime configuration.

## 2. Reason for Revision

The original Phase 6B direction focused on serving the frontend from the same EC2/Nginx server as the backend.

The direction has changed:

* Same-EC2 frontend hosting was simpler.
* S3 + CloudFront is more AWS/cloud/DevOps portfolio-aligned.
* The project decision changed to learn more in-demand AWS deployment patterns.

The backend remains on EC2/Nginx/RDS. The frontend target is now S3 + CloudFront.

## 3. Current Backend State

Current approved backend state:

* Backend API is live at:
  * `https://aucrm.duckdns.org/api/health`
* HTTPS returns `HTTP 200 OK`.
* Backend remains on EC2/Nginx.
* Nginx continues serving the backend API.
* RDS remains private.
* App port `4000` remains private.
* RDS port `5432` remains private.
* SSH remains restricted.
* Frontend is not deployed yet.

## 4. New Frontend Target Architecture

Target frontend architecture:

```text
Browser
  |
  | HTTPS
  v
CloudFront distribution URL
  |
  v
S3 bucket static asset origin
  |
  v
React/Vite static frontend

Browser
  |
  | API calls
  v
https://aucrm.duckdns.org/api/...
  |
  v
EC2/Nginx backend API
  |
  v
Private RDS PostgreSQL
```

Planned split:

* Frontend: React/Vite static build hosted from S3 through CloudFront.
* Backend API: existing HTTPS API at `https://aucrm.duckdns.org/api/...`.
* Browser loads frontend from the CloudFront distribution URL.
* Browser calls API at `https://aucrm.duckdns.org/api/...`.

## 5. Required Frontend Repo/Config Inspection

The later inspection execution phase should review:

* `client/package.json`
* `client/vite.config.*`
* `client/src`
* Frontend API client/service files
* Frontend env files/examples if present
* Root package scripts if frontend build is run from root
* Docs mentioning frontend env/config

The inspection should be read-only and secret-safe.

## 6. What To Inspect Later

The future inspection should determine:

* Frontend build command
* Build output directory, likely `client/dist`
* Vite env variables, especially `VITE_*`
* API base URL setting
* Hardcoded `localhost`
* Hardcoded `http://`
* Hardcoded backend ports like `3001` or `4000`
* Whether frontend can call the full HTTPS API URL
* Whether CORS support is needed on the backend for the CloudFront frontend origin
* Whether frontend routing requires CloudFront/S3 SPA fallback behavior
* Whether the build requires secrets
* Whether frontend imports server-only code

## 7. Recommended API Strategy for S3 + CloudFront Frontend

Recommended production API strategy:

* Frontend production API base URL should point to:
  * `https://aucrm.duckdns.org`
* API calls should resolve to:
  * `https://aucrm.duckdns.org/api/...`
* Do not embed EC2 public IP/DNS in the frontend.
* Do not embed RDS endpoint in the frontend.
* Do not embed database URLs or secrets in the frontend.
* Do not use `localhost` in the production frontend.

Frontend env values are public after build, so only non-secret public configuration belongs in Vite env variables.

## 8. CORS Planning

S3 + CloudFront changes the browser origin model:

* Frontend origin will be the CloudFront distribution URL.
* Backend origin remains `https://aucrm.duckdns.org`.
* Because these are different origins, the backend may need a future CORS allowlist update.
* The allowed origin may be the CloudFront distribution URL.

Do not change CORS in this phase.

The later inspection should determine:

* whether the backend already supports CORS safely,
* where CORS is configured,
* whether a CloudFront origin allowlist entry will be needed,
* whether credentials/cookies are involved.

## 9. S3 and CloudFront Planning

Future S3 + CloudFront deployment should plan:

* S3 bucket for static frontend files.
* S3 Block Public Access should remain enabled if using CloudFront Origin Access Control.
* CloudFront distribution in front of S3.
* CloudFront should serve static frontend files from S3.
* React SPA routes need fallback behavior to `index.html`.
* Cache invalidation will be needed after new frontend deployments.
* Frontend build artifact will likely come from `client/dist`.

Do not create S3 buckets or CloudFront distributions in this phase.

## 10. Security Boundaries

Frontend security boundaries:

* Frontend env variables are public after build.
* Never put secrets in Vite env.
* Do not expose RDS endpoint.
* Do not expose `DATABASE_URL`.
* Do not expose passwords.
* Do not expose API keys.
* Do not expose private tokens.
* Do not expose private keys.
* Do not expose EC2 public IP/DNS.
* Do not expose DuckDNS token.
* Do not expose Certbot account email.

Infrastructure boundaries:

* Backend remains on EC2/Nginx/RDS.
* RDS remains private.
* App port `4000` remains private.
* RDS port `5432` remains private.
* SSH remains restricted.
* No AWS resources are modified in this phase.

## 11. Future Execution Phases

Recommended future phases:

* Phase 6C: Frontend Repo/Config Inspection Execution
* Phase 6D: S3 + CloudFront Frontend Deployment Guide
* Phase 6E: S3 + CloudFront Frontend Deployment Execution
* Phase 6F: Frontend Deployment Report

Each phase should remain small, reviewable, and secret-safe.

## 12. Stop Conditions

Stop if:

* Frontend requires secrets.
* API base URL strategy is unclear.
* CORS behavior is unclear.
* Hardcoded `localhost` appears in a production path.
* Hardcoded `http://` appears in a production path.
* Hardcoded backend port `3001` or `4000` appears in a production path.
* Build command is unclear.
* Output directory is unclear.
* SPA fallback requirements are unclear.
* Inspection would expose secrets.
* Env values would be printed.
* User is unsure.

## 13. Evidence and Security Notes

Safe to document:

* CloudFront/S3 architecture
* Non-secret file paths
* Non-secret env variable names
* Public API hostname/path:
  * `https://aucrm.duckdns.org/api/...`
* Backend health path:
  * `https://aucrm.duckdns.org/api/health`
* Public HTTP/HTTPS status codes
* Build script names
* Output directory names
* API path patterns

Do not document:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* RDS endpoint
* Full `DATABASE_URL`
* Env values
* Passwords
* Tokens
* Secrets
* Private key path or material

## 14. What Not To Do in This Phase

Do not:

* Inspect files.
* Run commands, except local documentation editing/status if needed.
* Deploy frontend.
* Build frontend.
* Install packages.
* Run npm commands.
* Modify source code except revising this documentation file.
* Modify Nginx files.
* Modify Docker Compose.
* Modify backend runtime.
* Modify AWS resources.
* Create S3 buckets.
* Create CloudFront distributions.
* Modify security groups.
* Open or close ports.
* Modify DuckDNS.
* Modify Certbot config.
* Request certificates.
* Modify RDS.
* Run Prisma commands.
* Print env file contents.
* Run `env`.
* Run `docker compose config` using the real env file.
* Create or edit secrets.
* Ask for database password.
* Ask for private key contents.
* Expose secrets.
* Stage, commit, or push.
* Run `npm audit fix --force`.

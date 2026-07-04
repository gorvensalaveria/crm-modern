# CODEX Phase 6D: S3 + CloudFront Frontend Deployment Guide

## 1. Phase Name and Purpose

Phase 6D prepares a safe manual deployment guide for deploying the React/Vite frontend to S3 + CloudFront.

This phase is guide-only. It does not create AWS resources, build the frontend, upload files, invalidate CloudFront, modify source files, or deploy anything.

## 2. Current Backend and Frontend Readiness State

Current backend state:

* Backend API is live on EC2/Nginx/RDS.
* HTTPS API base:
  * `https://aucrm.duckdns.org`
* Health endpoint:
  * `https://aucrm.duckdns.org/api/health`
* HTTPS `/api/health` returns `HTTP 200 OK`.
* HTTP redirects to HTTPS.
* RDS remains private.
* App port `4000` remains private.
* SSH remains restricted.
* Certbot renewal dry-run succeeded.
* Elastic IP was intentionally skipped for cost control.

Frontend inspection findings from Phase 6C:

* Frontend build command:
  * `npm run build --workspace client`
* Client build script:
  * `tsc -b && vite build`
* Build output directory:
  * `client/dist`
* Frontend API env variable:
  * `VITE_API_BASE_URL`
* API calls use:
  * `/api/...`
* Production frontend build should use:
  * `VITE_API_BASE_URL=https://aucrm.duckdns.org`
* No frontend build secrets were found.
* SPA fallback is needed because the app uses React Router.
* Backend CORS may need a future allowlist update after the CloudFront distribution URL is known.

## 3. Target Architecture

Target frontend architecture:

```text
Browser
  |
  | HTTPS
  v
CloudFront distribution default domain
  |
  v
Private S3 bucket origin
  |
  v
React/Vite static build files

Browser API calls
  |
  v
https://aucrm.duckdns.org/api/...
  |
  v
EC2/Nginx backend
  |
  v
Private RDS PostgreSQL
```

Deployment target:

* S3 bucket stores static frontend build files.
* CloudFront serves frontend over HTTPS.
* Backend remains EC2/Nginx/RDS.
* Frontend calls API at `https://aucrm.duckdns.org/api/...`.

## 4. AWS Resource Naming Plan

Suggested S3 bucket name pattern:

```text
crm-modern-frontend-<unique-suffix>
```

Suggested CloudFront distribution comment/name:

```text
crm-modern-frontend-cloudfront
```

Recommended tags:

* `Project=crm-modern`
* `Environment=prod`
* `Owner=gorven`
* `Purpose=frontend-static-hosting`
* `ManagedBy=manual-learning`

Use a unique, non-sensitive bucket suffix. Do not put secrets, IP addresses, or private values in resource names.

## 5. S3 Bucket Planning

S3 planning:

* Create one S3 bucket for the frontend static build.
* Use `ap-southeast-1` if possible.
* Keep Block Public Access enabled.
* Do not use public S3 website hosting for this path.
* Prefer a private S3 bucket accessed through CloudFront Origin Access Control.
* Upload the contents of `client/dist` to the S3 bucket root.
* Do not upload the `dist` folder itself as a nested folder.
* Do not upload `.env` files.
* Do not upload source files unless they are part of the built frontend assets.

## 6. CloudFront Planning

CloudFront planning:

* Create a CloudFront distribution with the S3 bucket as origin.
* Use Origin Access Control if available.
* Use viewer protocol policy:
  * Redirect HTTP to HTTPS
* Set default root object:
  * `index.html`
* Allowed methods:
  * `GET`, `HEAD`
* Enable compression.
* Use a low-cost/default reasonable price class.
* Do not configure a custom domain yet.
* Use the CloudFront default domain for now.
* Do not add WAF for now.

After CloudFront is created, the CloudFront distribution URL becomes the public frontend URL for this milestone.

## 7. SPA Fallback Planning

React Router requires unknown frontend routes to return `index.html`.

Plan CloudFront custom error responses:

* `403` -> `/index.html` with response code `200`
* `404` -> `/index.html` with response code `200`

This allows direct refreshes and deep links for client-side routes to work.

## 8. Frontend Build Planning

Build should run from repo root in a later approved execution phase.

Planned build command:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

Expected output:

```text
client/dist
```

Build safety notes:

* `VITE_API_BASE_URL` is public frontend configuration.
* Do not include secrets in Vite env variables.
* Do not use database URLs, tokens, passwords, private keys, or private backend values in the frontend build.
* Do not run the build in this guide phase.

## 9. Upload Planning

Future upload plan:

* Upload all files inside `client/dist` to the S3 bucket root.
* Preserve content types if AWS Console handles them automatically.
* Do not upload `.env` files.
* Do not upload source files unless part of built assets.
* Do not upload local private files, credentials, keys, or secrets.

After later uploads, CloudFront invalidation may be needed so users receive the newest frontend assets.

## 10. CORS Planning

CloudFront frontend origin will differ from backend API origin.

Implications:

* Browser loads frontend from the CloudFront distribution URL.
* Browser API calls go to `https://aucrm.duckdns.org/api/...`.
* Backend may block browser API calls if CORS allowlist does not include the CloudFront frontend origin.
* After the CloudFront URL is known, test browser network calls.
* If CORS fails, create a separate backend CORS update phase.

Do not change backend CORS in this phase.

## 11. Verification Plan

After deployment in a later approved execution phase, verify:

* CloudFront URL loads the frontend.
* Direct route refresh works because SPA fallback is configured.
* Browser network calls target:
  * `https://aucrm.duckdns.org/api/...`
* API health still works:
  * `https://aucrm.duckdns.org/api/health`
* No mixed-content errors occur.
* No secrets are exposed in built frontend assets.
* S3 bucket remains private if using CloudFront Origin Access Control.
* CloudFront serves over HTTPS.

## 12. Cost-Control Notes

Cost-control plan:

* Use one S3 bucket.
* Use one CloudFront distribution.
* No WAF for now.
* No Route 53/custom domain for now.
* Avoid excessive invalidations.
* Set or confirm AWS Budget separately if desired.
* Keep Elastic IP skipped unless a future budget decision changes.

## 13. Stop Conditions

Stop if:

* Bucket name is unavailable or confusing.
* User is unsure about bucket region or name.
* CloudFront asks for public bucket access instead of Origin Access Control and user is unsure.
* Build requires secrets.
* Build fails.
* `client/dist` is missing after build.
* CORS failure occurs after frontend load.
* CloudFront distribution cannot access S3 origin.
* SPA fallback setup is unclear.
* User is unsure.

## 14. Evidence and Security Notes

Safe to document:

* S3 bucket name if no sensitive suffix is used.
* CloudFront distribution domain.
* Public frontend URL.
* Public backend hostname/path:
  * `https://aucrm.duckdns.org/api/...`
* Build command:
  * `npm run build --workspace client`
* Public env variable name:
  * `VITE_API_BASE_URL`
* Public env value:
  * `VITE_API_BASE_URL=https://aucrm.duckdns.org`
* Build output:
  * `client/dist`

Do not document:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* RDS endpoint
* Full `DATABASE_URL`
* Env contents
* Passwords
* Tokens
* Secrets
* Private key material

## 15. What Not To Do in This Phase

Do not:

* Create S3 buckets.
* Create CloudFront distributions.
* Modify AWS resources.
* Modify security groups.
* Build frontend.
* Deploy frontend.
* Upload files to S3.
* Invalidate CloudFront.
* Run commands.
* Run npm commands.
* Install packages.
* Modify frontend files.
* Modify backend files.
* Modify shared files.
* Modify Nginx files.
* Modify Docker Compose.
* Modify Dockerfile.
* Modify DuckDNS.
* Modify Certbot config.
* Request certificates.
* Modify RDS.
* Run Prisma commands.
* Reset or delete database.
* Print env file contents.
* Run `env`.
* Run `docker compose config` using the real env file.
* Create or edit secrets.
* Ask for database password.
* Ask for private key contents.
* Expose secrets.
* Stage, commit, or push.
* Run `npm audit fix --force`.

## 16. Next Phase Recommendation

Recommended next phases:

* Phase 6E: S3 + CloudFront Frontend Deployment Execution
* Phase 6F: Backend CORS Update Guide if browser CORS fails
* Phase 6G: Frontend Deployment Report

The execution phase should remain manual, evidence-safe, and scoped to frontend static hosting only.

# CODEX Phase 6C: Frontend Repo/Config Inspection Execution Report

## 1. Phase Name and Purpose

Phase 6C documents the completed read-only frontend repo/config inspection for S3 + CloudFront deployment readiness.

This report uses only the already-approved Phase 6C inspection findings. It does not run commands, inspect files again, modify source files, build or deploy frontend, create AWS resources, or expose secrets.

## 2. Inspection Scope

Approved inspection scope:

* `package.json`
* `client/package.json`
* `client/vite.config.ts`
* `client/src` TypeScript/TSX source file list
* Source grep across:
  * `client/src`
  * `client/package.json`
  * `client/vite.config.ts`
  * `package.json`
* Env-like files were excluded from grep.

## 3. Build Command Findings

Root build command:

```bash
npm run build
```

Frontend-only build command:

```bash
npm run build --workspace client
```

Client build script:

```bash
tsc -b && vite build
```

## 4. Build Output Findings

Frontend build output directory:

```text
client/dist
```

## 5. Vite Config Findings

Vite config file:

```text
client/vite.config.ts
```

Dev proxy only:

```text
/api -> http://localhost:4000
```

This is a local Vite development proxy finding, not a production deployment target.

## 6. API Base URL Strategy

Frontend API base URL env variable name:

```text
VITE_API_BASE_URL
```

Approved finding:

* fallback is an empty string.
* API calls use `/api/...`.

For S3 + CloudFront production build, use the approved public build setting:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org
```

Resulting API calls:

```text
https://aucrm.duckdns.org/api/...
```

## 7. Hardcoded Localhost, HTTP, and Port Findings

Approved findings:

* `http://localhost:4000` appears only in the Vite development proxy.
* No app API calls were found hardcoding `3001`.
* No app API calls were found hardcoding `4000`.

## 8. Vite Env Variable Names Found

Env variable name found:

```text
VITE_API_BASE_URL
```

Only the variable name is documented here. No private env values were printed or documented.

## 9. CORS Implications

For S3 + CloudFront:

* CloudFront frontend origin will differ from the backend API origin.
* Backend may need a CORS allowlist update after the CloudFront distribution URL is known.
* If browser CORS fails after CloudFront deployment, handle it in a separate backend CORS update phase.

## 10. SPA Fallback Needs

SPA fallback is needed.

Approved finding:

* frontend uses React Router / BrowserRouter / Routes.

S3 + CloudFront deployment should plan fallback behavior so client-side routes return `index.html`.

## 11. Frontend Build Secret Assessment

Approved assessment:

* No frontend build secrets were found from inspected files.
* `VITE_API_BASE_URL` is public-style and safe.
* Frontend env variables are public after build, so no private values should be placed in Vite env.

## 12. Readiness Decision

Decision:

* Ready for S3 + CloudFront deployment guide.

Expected configuration requirement:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org
```

Additional plan:

* Plan backend CORS update later if browser CORS fails after the CloudFront distribution URL is known.

## 13. Recommended Next Phase

Recommended next phase:

* Phase 6D: S3 + CloudFront Frontend Deployment Guide

## 14. Evidence and Security Notes

Safe evidence included:

* File paths
* Build commands
* Non-secret env variable name `VITE_API_BASE_URL`
* Approved public API base `https://aucrm.duckdns.org`
* Approved public production build setting `VITE_API_BASE_URL=https://aucrm.duckdns.org`
* API path pattern `/api/...`

Excluded from this report:

* Env values other than the approved public `VITE_API_BASE_URL=https://aucrm.duckdns.org`
* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* RDS endpoint
* Full `DATABASE_URL`
* Database password
* Env file contents
* Private key path or contents
* Private key material

## 15. What Was Not Done

The following were not done:

* No commands were run for this report.
* No files were inspected again.
* No source files were modified.
* No frontend build was run.
* No frontend deployment was performed.
* No packages were installed.
* No npm commands were run.
* No S3 buckets were created.
* No CloudFront distributions were created.
* No AWS resources were modified.
* No Nginx, backend, RDS, DuckDNS, or Certbot configuration was modified.
* No security groups were modified.
* No ports were opened or closed.
* No env file contents were printed.
* No `env` command was run.
* No `docker compose config` command was run.
* No secrets were created, edited, or exposed.
* No staging, commit, or push was performed.
* `npm audit fix --force` was not run.

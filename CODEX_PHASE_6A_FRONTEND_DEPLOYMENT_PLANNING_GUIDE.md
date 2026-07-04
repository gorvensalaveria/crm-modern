# CODEX Phase 6A: Frontend Deployment Planning Guide

## 1. Phase Name and Purpose

Phase 6A plans the frontend deployment path for the React/Vite client and its connection to the live HTTPS backend API.

This phase is guide-only. It does not deploy the frontend, modify files, build assets, run commands, change Nginx, or modify infrastructure.

## 2. Current Backend Production State

Current approved backend state:

* Backend production deployment milestone is complete.
* API is running on EC2 behind Nginx.
* Public HTTPS API health endpoint:
  * `https://aucrm.duckdns.org/api/health`
* HTTPS `/api/health` returns:

```json
{"data":{"status":"ok","service":"asun-migrations-api"}}
```

* HTTP redirects to HTTPS.
* Nginx proxies `/api/` to local API container port `4000`.
* App port `4000` is not publicly opened.
* RDS port `5432` is not publicly opened.
* RDS remains private.
* SSH remains restricted.
* Certbot is installed and renewal dry-run succeeded.
* Elastic IP was intentionally skipped for cost-control.
* DuckDNS hostname: `aucrm.duckdns.org`
* Frontend is not deployed yet.

## 3. Frontend Deployment Options Comparison

### Option 1: Same EC2/Nginx Static Hosting

Serve the Vite production build from the same EC2 instance and Nginx server.

Pros:

* Simple architecture for the current portfolio milestone.
* Low cost because it reuses the existing EC2/Nginx setup.
* Same-origin frontend and API avoids most CORS complexity.
* Uses the already-working HTTPS hostname.

Tradeoffs:

* Frontend deployment depends on the EC2 server.
* Manual deployment steps are needed until CI/CD is added.
* Nginx config must be changed carefully to avoid breaking Certbot-managed HTTPS blocks.

### Option 2: Vercel, Netlify, or Cloudflare Pages

Deploy the frontend to a managed static host.

Pros:

* Easy static hosting and previews.
* Good developer experience.
* Built-in CDN behavior.

Tradeoffs:

* Separate origin from the API may require CORS configuration.
* Adds another platform and deployment path.
* May be more than needed for the current milestone.

### Option 3: S3 Static Website Hosting plus CloudFront Later

Deploy static assets to S3 and serve through CloudFront.

Pros:

* Strong AWS portfolio value.
* Scales well and matches common production patterns.

Tradeoffs:

* More setup complexity.
* More AWS resources to manage.
* Better suited for a later phase after the current fullstack demo is stable.

### Option 4: Keep Frontend Local Temporarily

Run the frontend locally and point it to the HTTPS API.

Pros:

* Fastest for development testing.
* No production frontend changes yet.

Tradeoffs:

* Not a complete public portfolio deployment.
* Local origin may require CORS considerations.
* Does not demonstrate production frontend hosting.

## 4. Recommended Approach

Recommended current path:

* Serve the Vite production build from the same EC2/Nginx server.
* Frontend served from:
  * `https://aucrm.duckdns.org/`
* API stays under:
  * `https://aucrm.duckdns.org/api/...`
* Use same-origin frontend and API traffic to avoid CORS complexity.
* Keep the deployment simple and low-cost for the current portfolio milestone.
* Do not introduce S3, CloudFront, Vercel, Netlify, or Cloudflare Pages yet unless a later phase approves that change.

## 5. Proposed Same-Origin Architecture

Proposed architecture:

```text
Browser
  |
  | GET https://aucrm.duckdns.org/
  v
Nginx serves React/Vite static frontend

Browser
  |
  | API calls to https://aucrm.duckdns.org/api/...
  v
Nginx proxies /api/ to http://localhost:4000/api/
  |
  v
API container on local/private port 4000
```

The browser should use relative API paths where possible, such as `/api/...`, so frontend and API share the same origin.

## 6. Required Repo/Config Investigation for the Next Phase

The next phase should inspect the repository and confirm:

* Frontend environment variable pattern.
* Vite API base URL setting.
* Frontend build command.
* Build output directory, likely `client/dist`.
* Whether frontend currently hardcodes `localhost` or old API URLs.
* Whether frontend can use relative `/api/...` paths.
* Whether React routing requires SPA fallback to `index.html`.
* Whether frontend build requires any secrets.
* Whether Node/npm is available on EC2 for a simple server-side build, or whether local build plus copy is safer.

## 7. Proposed Nginx Frontend Serving Plan

Future Nginx plan:

* Keep existing `/api/` proxy block unchanged.
* Keep proxy target unchanged:
  * `http://localhost:4000/api/`
* Add static frontend serving for the Vite build output.
* Use a safe web directory, likely:
  * `/var/www/crm-modern-client`
* Add SPA fallback:

```nginx
try_files $uri $uri/ /index.html;
```

Important Nginx cautions:

* Avoid damaging Certbot-managed HTTPS config.
* Do not remove the `/api/` proxy.
* Do not change the API proxy target.
* Do not expose app port `4000` publicly.
* Always test Nginx config before reload in a later approved execution phase.

## 8. Proposed Frontend Build/Deploy Plan

Future deployment plan:

* Build frontend on EC2 or locally.
* Prefer simple EC2 build first if Node/npm is already installed and dependency install is reasonable.
* If EC2 build is not suitable, build locally and copy static output in a later approved phase.
* Build output likely comes from:
  * `client/dist`
* Copy or place built static files into:
  * `/var/www/crm-modern-client`
* Ensure Nginx can read the files.
* Test the static frontend through HTTPS.

No frontend build or file copy occurs in this planning phase.

## 9. Security and Secret Boundaries for Frontend Env Variables

Frontend environment variables are public after build.

Do not put these in Vite/frontend env:

* Database URLs
* API keys
* Passwords
* Tokens
* Private certificates
* Server-only secrets
* Any sensitive value from the backend runtime env file

Acceptable frontend config:

* Public API base path, preferably same-origin `/api`
* Non-secret public app labels or feature flags if needed

The frontend should not need direct RDS access or any database credentials.

## 10. Verification Plan

Future verification after deployment:

* `https://aucrm.duckdns.org/` loads the frontend.
* Browser network calls go to `/api/...` over HTTPS.
* `https://aucrm.duckdns.org/api/health` still returns `HTTP 200 OK`.
* Nginx config test succeeds before reload.
* HTTPS certificate remains valid.
* App port `4000` remains private.
* RDS port `5432` remains private.
* SSH remains restricted.

## 11. Stop Conditions

Stop if:

* Frontend build requires secrets.
* Frontend has hardcoded `localhost` URLs.
* Frontend has hardcoded non-production API URLs.
* Nginx config would remove or damage Certbot-managed HTTPS blocks.
* `/api/` proxy would be changed incorrectly.
* API health check fails.
* Build fails due dependency, Vite, TypeScript, or npm errors.
* The frontend needs private backend-only values.
* App port `4000` exposure is proposed.
* RDS port `5432` exposure is proposed.
* SSH broadening is proposed.
* User is unsure.

## 12. Evidence and Security Notes

Safe to document:

* Hostname `aucrm.duckdns.org`
* Frontend path `https://aucrm.duckdns.org/`
* API path `https://aucrm.duckdns.org/api/...`
* Health path `/api/health`
* Frontend build command once verified
* Frontend output directory once verified
* Nginx/static hosting plan
* Non-secret HTTP/HTTPS status codes

Do not document:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* RDS endpoint
* Full `DATABASE_URL`
* Env file contents
* Passwords
* Tokens
* Secrets
* Private key material

## 13. What Not To Do in This Phase

Do not:

* Deploy frontend.
* Modify frontend files.
* Modify Nginx files.
* Modify Docker Compose.
* Modify backend files.
* SSH.
* Run commands.
* Build frontend.
* Install packages.
* Run npm commands.
* Modify AWS resources.
* Modify security groups.
* Open or close ports.
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

## 14. Next Phase Recommendation

Recommended next phase:

* Phase 6B: Frontend Repo/Config Inspection Guide

If the frontend build and API config are already known with enough confidence, the next phase may instead be:

* Phase 6B: Frontend Deployment Execution Guide

The safer default is to inspect repo/config first, then prepare an execution guide based on the actual frontend build and API configuration.

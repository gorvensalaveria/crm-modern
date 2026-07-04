# CODEX Phase 6F: Backend CORS Update Guide for CloudFront Frontend

## 1. Phase Name and Purpose

Phase 6F prepares a safe manual execution guide for updating backend CORS so the CloudFront-hosted frontend can call the HTTPS backend API.

This phase is guide-only. It does not SSH, run commands, inspect files, edit env files, restart containers, modify infrastructure, or expose secrets.

## 2. Current Frontend and Backend State

Current frontend state:

* S3 bucket created: `crm-modern-frontend-aucrm`
* CloudFront distribution created: `crm-modern-frontend-cloudfront`
* CloudFront frontend URL:
  * `https://d3k197cbnbmhh7.cloudfront.net`
* Frontend build succeeded using:
  * `VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client`
* Frontend files uploaded to S3:
  * `index.html`
  * `assets/`
* CloudFront root loads frontend:
  * `https://d3k197cbnbmhh7.cloudfront.net/`
  * `HTTP 200`
* SPA fallback works:
  * `https://d3k197cbnbmhh7.cloudfront.net/dashboard`
  * `HTTP 200`
* Frontend app loads in browser, but role/API loading appears stuck.

Current backend state:

* Backend API is live:
  * `https://aucrm.duckdns.org/api/health`
* Backend health returns `HTTP 200 OK`.
* Backend runs in Docker behind Nginx on EC2.
* API container remains behind Nginx.
* App port `4000` remains private.
* RDS port `5432` remains private.
* RDS remains private.
* SSH remains restricted.
* HTTPS/Certbot is configured.
* DuckDNS hostname:
  * `aucrm.duckdns.org`

## 3. CORS Problem Explanation

The CloudFront frontend and the backend API are different browser origins:

* Frontend origin:
  * `https://d3k197cbnbmhh7.cloudfront.net`
* Backend origin:
  * `https://aucrm.duckdns.org`

The backend API can be healthy and still be blocked by the browser if CORS headers do not allow the CloudFront frontend origin.

In this case, the browser is expected to enforce CORS before letting frontend JavaScript read API responses. That means a successful backend health check alone is not enough; the response also needs the correct CORS headers for browser calls from CloudFront.

## 4. Evidence From curl

Approved CORS evidence:

* Test request with CloudFront `Origin` returned backend `HTTP 200 OK`.
* Response did not include:
  * `Access-Control-Allow-Origin: https://d3k197cbnbmhh7.cloudfront.net`
* `OPTIONS` preflight also did not include expected CORS allow headers.

Interpretation:

* The API is reachable.
* The browser is likely blocking frontend requests because CORS does not yet allow the CloudFront frontend origin.

## 5. Code-Aware Learning Section

Before editing the production env file in the future execution phase, inspect how the backend reads and applies CORS configuration.

### Where To Inspect

Likely code/config areas:

* `server/src`
* Backend app/server entry file
* CORS middleware setup
* Config/env loading code
* Any usage of `CLIENT_ORIGIN`

### What To Look For

Look for patterns such as:

```ts
cors(...)
```

```ts
origin
```

```ts
CLIENT_ORIGIN
```

```ts
allowedOrigins
```

Also inspect Express middleware order:

* CORS middleware should be registered before routes that need CORS headers.
* If CORS is added after routes, requests may not receive expected headers.

### Safe Read-Only Search Ideas for the Execution Phase

Use these only in the approved execution phase, and only if safe:

```bash
grep -RIn "CLIENT_ORIGIN" server/src
```

Purpose:

* Finds where the backend reads the frontend origin setting.

Success looks like:

* A non-secret code reference showing `CLIENT_ORIGIN`.

```bash
grep -RIn "cors(" server/src
```

Purpose:

* Finds CORS middleware setup.

Success looks like:

* A backend Express setup file using `cors(...)`.

```bash
grep -RIn "origin" server/src
```

Purpose:

* Finds how allowed request origins are configured.

Success looks like:

* A CORS config block or env-driven origin setting.

Do not print runtime env files or secret values while inspecting.

### How CLIENT_ORIGIN Connects to Runtime Behavior

The backend likely reads `CLIENT_ORIGIN` from the server runtime environment.

In production, that runtime value is expected to live in:

```text
/opt/crm-modern/env/production.env
```

The Docker Compose production startup loads the server-local env file into the running container environment. If backend CORS code uses `CLIENT_ORIGIN`, then changing the value in the server-local env file and restarting the API should cause the API to return CORS headers for the new frontend origin.

For the CloudFront frontend, the target public value is:

```text
CLIENT_ORIGIN=https://d3k197cbnbmhh7.cloudfront.net
```

That should allow browser requests from the CloudFront-hosted frontend origin.

## 6. Proposed Safe Fix

Update only `CLIENT_ORIGIN` in:

```text
/opt/crm-modern/env/production.env
```

Set it to:

```text
CLIENT_ORIGIN=https://d3k197cbnbmhh7.cloudfront.net
```

Do not change:

* `DATABASE_URL`
* database password
* RDS settings
* other secrets
* Docker Compose files
* Nginx files
* frontend files

## 7. Manual Edit Method

In the future execution phase, use a manual editor:

```bash
sudo nano /opt/crm-modern/env/production.env
```

Purpose:

* Opens the server-local runtime env file for manual editing.

What to change:

* Edit only the `CLIENT_ORIGIN` line.
* Set it to:

```text
CLIENT_ORIGIN=https://d3k197cbnbmhh7.cloudfront.net
```

What not to do:

* Do not paste the full env file into chat.
* Do not screenshot secrets.
* Do not change `DATABASE_URL`.
* Do not change passwords or tokens.

After saving, verify only the safe line:

```bash
grep -n '^CLIENT_ORIGIN=' /opt/crm-modern/env/production.env
```

Purpose:

* Confirms only the public CORS origin value.

Safe expected output:

```text
CLIENT_ORIGIN=https://d3k197cbnbmhh7.cloudfront.net
```

Stop if the command would show unrelated env values.

## 8. API Restart Plan

From the app directory:

```bash
cd /opt/crm-modern/app
```

Safely load the runtime env for Compose interpolation:

```bash
set -a
source /opt/crm-modern/env/production.env
set +a
```

Purpose:

* Loads env values into the shell for the Compose command without printing them.

Restart/update the API:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Purpose:

* Recreates or updates the API container with the updated runtime env if needed.

Afterward, unset the database URL:

```bash
unset DATABASE_URL
```

Purpose:

* Reduces risk of leaving sensitive database connection data in the shell session.

Do not run:

```bash
docker compose config
```

Do not print:

```bash
env
```

## 9. Verification Plan

After restart, verify in small gates.

### Gate 1: Container Running

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```

Purpose:

* Confirms the API container is running.

Success looks like:

* API container is up.
* App port remains private behind Nginx.

### Gate 2: Local Backend Health

```bash
curl -i http://localhost/api/health
```

Purpose:

* Confirms Nginx can still reach the local API.

Success looks like:

* `HTTP 200 OK`.

### Gate 3: Public HTTPS Health

```bash
curl -i https://aucrm.duckdns.org/api/health
```

Purpose:

* Confirms public HTTPS API remains healthy.

Success looks like:

* `HTTP 200 OK`.

### Gate 4: CORS GET Test

```bash
curl -i https://aucrm.duckdns.org/api/health -H "Origin: https://d3k197cbnbmhh7.cloudfront.net"
```

Purpose:

* Confirms backend includes CORS headers for CloudFront origin on a GET request.

Success looks like:

```text
Access-Control-Allow-Origin: https://d3k197cbnbmhh7.cloudfront.net
```

### Gate 5: CORS OPTIONS Test

```bash
curl -i -X OPTIONS https://aucrm.duckdns.org/api/health -H "Origin: https://d3k197cbnbmhh7.cloudfront.net" -H "Access-Control-Request-Method: GET"
```

Purpose:

* Confirms browser preflight can succeed if needed.

Success looks like:

* CORS allow headers are present.
* Origin is allowed.

### Gate 6: Browser Test

In the browser:

* Refresh `https://d3k197cbnbmhh7.cloudfront.net`.
* Confirm roles/API data load.
* Confirm browser console/network does not show CORS errors.

## 10. Expected Result

Expected CORS response header:

```text
Access-Control-Allow-Origin: https://d3k197cbnbmhh7.cloudfront.net
```

Expected user-visible result:

* CloudFront frontend browser requests succeed.
* Role/API loading no longer appears stuck due to CORS.

## 11. Stop Conditions

Stop if:

* CORS code path is unclear.
* Env file path is missing.
* `CLIENT_ORIGIN` line is missing or unclear.
* User sees secrets and is unsure what to edit.
* Docker Compose restart fails.
* API container stops.
* Local health fails.
* Public health fails.
* CORS headers are still missing after restart.
* Frontend is still stuck after CORS fix.
* Any command would print secrets.
* User is unsure.

## 12. Evidence and Security Notes

Safe to document:

* CloudFront URL:
  * `https://d3k197cbnbmhh7.cloudfront.net`
* Backend API base:
  * `https://aucrm.duckdns.org`
* `CLIENT_ORIGIN` name
* Approved public value:
  * `CLIENT_ORIGIN=https://d3k197cbnbmhh7.cloudfront.net`
* API health status
* CORS response header presence or absence
* Non-secret code paths and variable names
* Safe code patterns:
  * `cors(...)`
  * `origin`
  * `CLIENT_ORIGIN`

Do not document:

* Full env file
* `DATABASE_URL`
* Database password
* RDS endpoint
* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* Private key path or material
* Any other secret value

## 13. What Not To Do

Do not:

* Open app port `4000`.
* Open RDS port `5432`.
* Broaden SSH.
* Modify RDS security group.
* Modify Nginx.
* Modify frontend files.
* Rebuild frontend.
* Upload files to S3.
* Invalidate CloudFront.
* Recreate CloudFront or S3.
* Reset database.
* Print env file contents.
* Run `env`.
* Run `docker compose config`.
* Expose secrets.
* Stage, commit, or push.
* Run `npm audit fix --force`.

## 14. Future Working Style Note

For future technical phases:

* Prefer code-aware manual learning guides.
* Show relevant file paths and what to inspect.
* Explain the purpose before commands.
* Prefer manual edits where appropriate.
* Use small gates and pause points.
* Avoid silent scripted edits unless explicitly approved.
* Do not ask the user to paste secrets.
* Do not ask the user to paste full env files.
* Use safe targeted output only.

## 15. Next Phase Recommendation

Recommended next phase:

* Phase 6G: Backend CORS Update Execution

Possible follow-up documentation phases:

* Phase 6H: Frontend S3 + CloudFront Deployment Execution Report
* Phase 6I: Backend CORS Update Execution Report, if separated

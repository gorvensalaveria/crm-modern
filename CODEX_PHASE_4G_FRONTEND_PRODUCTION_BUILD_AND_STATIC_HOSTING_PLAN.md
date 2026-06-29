# Codex Phase 4G: Frontend Production Build And Static Hosting Plan

## 1. Phase Name And Purpose

Phase 4G: Frontend Production Build And Static Hosting Plan

Purpose:

Plan how the frontend production build will be created and served as static assets on EC2 for the full public deployment milestone.

This is a planning-only phase.

No frontend build was run. No frontend files, `.env` files, real env files, real secrets, Docker files, Compose files, Nginx config, GitHub Actions, Prisma migrations, databases, AWS resources, EC2 resources, or RDS resources were created or modified.

## 2. Frontend Production Build Goal

The frontend production build goal is to create optimized static assets from the Vite/React frontend and serve them from EC2 through Nginx.

The frontend should eventually:

- Build into static files.
- Be served by Nginx.
- Use safe public frontend configuration only.
- Call the deployed API through the intended public route.
- Work over EC2 public IP during testing.
- Work over the final HTTPS domain after DNS/SSL.
- Support client-side routing through an SPA fallback.

This phase does not build the frontend or modify files. It only plans the future workflow.

## 3. Frontend Env/Build Variables

The main frontend build variable is:

```text
VITE_API_BASE_URL
```

Purpose:

- Tells the frontend where API requests should be sent.
- Must be set before building if the frontend embeds the value at build time.
- Must not contain secrets.

Potential values vary by deployment stage:

- Local development
- EC2 public IP testing
- Final DNS/HTTPS deployment

Other `VITE_*` variables may exist later, but all must be treated as browser-visible public configuration.

## 4. Why `VITE_*` Values Are Public

Vite exposes `VITE_*` environment variables to the frontend bundle.

That means:

- They are visible in browser JavaScript.
- They may be inspectable in built assets.
- They can appear in browser DevTools.
- They can influence browser network behavior.
- They must never contain secrets.

Do not put these in `VITE_*` variables:

- Database URLs
- API keys
- Passwords
- Private tokens
- RDS credentials
- Backend-only secrets

Frontend env values should be limited to public routing/config values.

## 5. How `VITE_API_BASE_URL` Should Be Set

Local development:

Recommended local shape:

```text
VITE_API_BASE_URL=http://localhost:<api-port>
```

or, if the frontend dev server proxies `/api`:

```text
VITE_API_BASE_URL=/api
```

The exact local value depends on the existing frontend API client and proxy behavior.

EC2 public IP testing:

Preferred once Nginx is in place:

```text
VITE_API_BASE_URL=/api
```

Why:

- Frontend and API share the same public origin.
- Browser requests can go through Nginx.
- CORS complexity is reduced.

Temporary direct API host/port shape, only if explicitly approved:

```text
VITE_API_BASE_URL=http://<ec2-public-ip>:<temporary-api-port>
```

This should only be used if the temporary API port is explicitly approved and opened.

Final DNS/HTTPS deployment:

Preferred final shape:

```text
VITE_API_BASE_URL=/api
```

Why:

- Keeps browser calls same-origin.
- Avoids hardcoding temporary IPs.
- Works cleanly with Nginx reverse proxy.
- Reduces CORS complexity.

Alternative final shape, if needed:

```text
VITE_API_BASE_URL=https://<public-domain>/api
```

Use only if the frontend API client requires an absolute URL.

## 6. Future Build Command Shape Without Running It

Future build command shape may be:

```bash
npm run build
```

If the repo uses workspace-specific frontend scripts, the future command may be workspace-specific, such as:

```bash
npm run build --workspace <frontend-workspace>
```

If a build-time env value is needed, the future command shape may be:

```bash
VITE_API_BASE_URL=/api npm run build
```

Important:

These are future command shapes only. They are not approved to run during Phase 4G.

Before execution, the actual package scripts and frontend workspace structure should be verified.

## 7. Expected Build Output Location

For a Vite frontend, the expected production build output is typically:

```text
dist/
```

Depending on project structure, it may be under the frontend app directory, for example:

```text
client/dist/
```

or:

```text
apps/web/dist/
```

The exact path should be verified before implementation.

The build output should contain static assets such as:

- `index.html`
- JavaScript bundles
- CSS assets
- Image/font assets

## 8. Recommended EC2 Static Asset Location

Recommended future EC2 static asset location:

```text
/var/www/crm-modern
```

This is a clean future serving path because it is easy for Nginx to serve and keeps static hosting separate from app source if desired.

Alternative possible location:

```text
/opt/crm-modern/app/<frontend-build-output>
```

Preferred deployment pattern:

- Build frontend assets from the repo/deployment copy.
- Copy or point Nginx to the final static build directory.
- Keep runtime secrets outside the static asset directory.
- Do not place `.env` files in the Nginx web root.

## 9. How Nginx Should Eventually Serve The Frontend

Nginx should eventually:

- Listen on HTTP `80`.
- Later listen on HTTPS `443`.
- Serve frontend static assets.
- Serve `index.html` for SPA routes.
- Reverse proxy `/api` requests to the API container.
- Avoid exposing backend secrets.
- Avoid serving env files or source files.

High-level Nginx behavior:

```text
/        -> frontend static assets
/api     -> API container
```

Nginx should not need frontend secrets because frontend assets are public.

## 10. API Routing Relationship

Frontend static app:

- Served by Nginx.
- Browser loads static HTML/CSS/JS.
- Browser makes API requests using `VITE_API_BASE_URL`.

`/api` reverse proxy to API container:

- Nginx receives browser requests at `/api`.
- Nginx proxies those requests to the API container/host port.
- API container talks to RDS using server-side `DATABASE_URL`.
- `DATABASE_URL` never reaches the browser.

Recommended final relationship:

```text
Browser -> https://<domain>/        -> Nginx -> frontend static files
Browser -> https://<domain>/api/... -> Nginx -> API container
API     -> RDS PostgreSQL
```

## 11. SPA Fallback Needs

Because the frontend is a React SPA, Nginx should support client-side routes.

Expected behavior:

- `/` serves `index.html`.
- `/dashboard` should also serve `index.html`.
- `/matters/123` should also serve `index.html`.
- Static assets should still resolve normally.
- `/api` should not fall back to `index.html`; it should proxy to the API.

Future Nginx config should include an SPA fallback pattern similar to:

```text
try_files $uri $uri/ /index.html;
```

But `/api` should be handled separately before SPA fallback.

## 12. Risks

Wrong API base URL:

- Frontend may call localhost from the user’s browser.
- Frontend may call a temporary EC2 IP after DNS is live.
- Frontend may fail due to CORS if API is not same-origin.
- Frontend may need rebuild if `VITE_API_BASE_URL` is embedded at build time.

Secrets in frontend env:

- Any `VITE_*` value can be exposed to users.
- Never put `DATABASE_URL`, API keys, passwords, private tokens, RDS credentials, or backend-only secrets in frontend env.

Stale build artifacts:

- Nginx may serve an old frontend build.
- Browser cache may show old JavaScript.
- Build output may not reflect the latest `VITE_API_BASE_URL`.

Hardcoded temporary IP/domain:

- Temporary EC2 public IP can change.
- Hardcoded IPs make DNS/HTTPS transition harder.
- Prefer `/api` same-origin routing for final deployment.

## 13. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- Frontend build command success.
- Build output directory exists.
- `index.html` exists in build output.
- Static assets exist in build output.
- Nginx web root contains expected build files.
- Browser loads frontend over EC2 public IP.
- Browser loads frontend over final HTTPS domain.
- Network tab shows `/api` requests going to the expected public route.
- Nginx config test succeeds.
- API route works through Nginx.

Do not capture:

- `.env` contents.
- Secret env values.
- Backend `DATABASE_URL`.
- API keys.
- Private keys.
- Any browser or terminal view containing secrets.

## 14. Boundaries Respected

Boundaries respected during Phase 4G:

- No frontend build was run.
- Frontend files were not modified.
- `.env` was not modified.
- No real env files were created.
- No real secrets were created or edited.
- No secrets were exposed.
- No secret values were requested.
- Dockerfile was not modified.
- Compose files were not modified.
- Nginx config was not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No Prisma migration commands were run.
- No deployment was performed.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
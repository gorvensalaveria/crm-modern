# Codex Phase 1 Local Baseline

## Scope

Phase 1 only was approved and completed. No AWS, RDS, production Docker, CI/CD deployment, Terraform, DNS, or SSL implementation was started.

## Architecture Confirmation

- Local development database remains Docker Compose PostgreSQL.
- AWS production database remains planned for Amazon RDS PostgreSQL.
- Production PostgreSQL must not run in Docker on EC2.
- Phase 2 Docker review is still the next architecture/planning step after this local baseline.

## Local Checks Performed

- Confirmed `.env` and `.env.example` exist.
- Confirmed Docker Compose PostgreSQL is running and healthy.
- Ran `npm install`.
- Ran `npm run db:generate`.
- Ran `npm run db:push`.
- Ran `npm run db:seed`.
- Started `npm run dev`.
- Verified API health endpoint.
- Verified frontend dev server response.
- Ran `npm run typecheck`.
- Ran `npm run test`.
- Ran `npm run build`.

## Results

| Check | Result | Notes |
| --- | --- | --- |
| `.env` present | Passed | Existing `.env` was not overwritten. |
| Docker PostgreSQL | Passed | `asun-migrations-postgres` is healthy. |
| `npm install` | Passed | Dependencies were already up to date. |
| Prisma generate | Passed | Prisma Client generated successfully. |
| Prisma db push | Passed | Database is in sync with Prisma schema. |
| Prisma seed | Passed after fix | Seed had an idempotency issue with fixed invoice IDs from older local demo data. |
| Dev server | Passed | API started on `4000`; Vite started on `5174` because `5173` was already in use. |
| API health | Passed | `GET /api/health` returned `200 OK`. |
| Frontend response | Passed | `http://localhost:5174` returned `200 OK`; existing `5173` also responded. |
| Typecheck | Passed | Shared, server, and client typechecks passed. |
| Tests | Passed | Server: 8 passed. Client: 4 passed. |
| Build | Passed | Shared, server, and client production builds passed. |

## Issue Found And Fixed

The seed script failed when older local demo data already contained deterministic invoice IDs:

- `invoice-priya-186`
- `invoice-john-482`

The script cleaned invoices only by the current tenant ID, so rows from older demo tenants could still conflict with the fixed IDs.

Fix applied in `prisma/seed.ts`:

- added a small `invoices` constant for deterministic seed invoice IDs
- deletes payments for those invoice IDs before recreating seed invoices
- deletes invoices with those IDs before recreating seed invoices

This keeps the seed script repeatable without requiring destructive database reset commands.

## Security Finding

The local `.env` file contains a real-looking OpenAI API key. It was not committed by this Phase 1 work, but it should be treated as exposed in the local workspace and rotated before any public sharing, commit, screenshot, or deployment.

Production secrets must be stored through environment variables, GitHub Secrets, or GitHub Environments, never committed to the repository.

## Remaining Notes

- `npm install` reported 4 vulnerabilities: 2 high and 2 critical.
- I did not run `npm audit fix --force` because that can introduce breaking dependency changes and is outside the approved Phase 1 baseline scope.
- Port `5173` was already occupied before this dev server run, so Vite used `5174` for the started session.
- The dev server session started for verification was stopped after the checks.

## Next Step

Proceed to Phase 2 only after approval: review the current Docker setup and produce findings before adding production Docker files.

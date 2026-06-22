# Operations Runbook

## Purpose

This runbook defines how CRM Modern / Modern Fullstack will be verified, troubleshot, and maintained during future Docker and AWS deployment phases.

It is planning/documentation only. It does not perform operations, create deployment configuration, modify `.env`, or expose secrets.

## Roles And Workflow

ChatGPT is the Architect / product planner / DevOps mentor / reviewer / project manager.

Codex is the coding assistant / guided implementer. Codex proposes small, scoped, testable steps and explains commands before the user runs them.

The user is the hands-on builder/operator/learner/final reviewer.

Operations work should follow this pattern:

1. ChatGPT Architect approves the ticket or phase.
2. Codex explains the operation, command, expected result, and risk.
3. The user runs commands manually.
4. Codex helps interpret the result.
5. Findings are documented without secrets.
6. ChatGPT Architect reviews completion summaries before the next phase.

## Local Verification Checks

Before future Docker or deployment work, use safe local checks.

Recommended checks:

- Inspect package scripts.
- Confirm required documentation exists.
- Run `npm run typecheck`.
- Run `npm run lint`, if available.
- Run `npm run test`.
- Run `npm run build`.
- Confirm `.dockerignore` exists before Docker work.
- Confirm the production server start script exists.
- Confirm required environment variable names without printing values.

Any failure should be understood before moving to infrastructure work.

## Future Production Smoke Checks

After future deployment phases, basic smoke checks should verify that the app is usable.

Expected checks:

- Public site loads.
- Frontend routes render.
- `GET /api/health` returns a healthy response.
- Role selection works.
- A database-backed page loads.
- A simple API-backed workflow works.
- No obvious browser console or network errors appear.
- Nginx is proxying `/api` correctly.

These checks should be performed only after deployment phases are approved.

## Health Endpoint Checks

The API health endpoint should be used for basic service verification.

Expected endpoint:

```text
GET /api/health
```

Expected purpose:

- Confirm the API process is reachable.
- Confirm reverse proxy routing works later.
- Support smoke tests after Docker/Nginx/deployment changes.

The health endpoint may not prove database connectivity unless a deeper readiness endpoint is added later.

## Docker Log Checks

Future Docker troubleshooting should start with container status and logs.

Expected future checks:

- List running containers.
- Check API container logs.
- Check Nginx container logs if Nginx runs in Docker.
- Confirm containers are not restarting repeatedly.
- Look for startup errors, missing environment variables, port conflicts, or database connection failures.

Do not paste logs that contain secrets.

## Nginx Log Checks

Future Nginx troubleshooting should use access and error logs.

Expected future checks:

- Confirm frontend requests return expected status codes.
- Confirm `/api` requests are proxied correctly.
- Investigate `404`, `413`, `502`, `503`, and redirect issues.
- Check request body size issues for uploads.
- Confirm SPA fallback behavior.

Nginx configuration is not created in this runbook ticket.

## Linux / System Log Checks

Future EC2 troubleshooting should include basic Linux checks.

Expected future checks:

- Disk usage
- Memory usage
- CPU load
- Open ports
- Service status
- System logs
- Docker service status
- File permissions for deployment directories

The user should run commands manually and avoid destructive changes without approval.

## RDS Connectivity Checks

Future database troubleshooting should verify that the API can reach Amazon RDS PostgreSQL.

Expected future checks:

- Confirm the API receives a `DATABASE_URL` at runtime without printing it.
- Confirm RDS security groups allow access from the app path.
- Confirm RDS is running and reachable.
- Confirm Prisma can connect when using approved safe commands.
- Confirm migrations or schema state only through approved workflows.

Do not expose database credentials during troubleshooting.

## Environment Variable And Secret Safety

Environment variables should be inspected safely.

Safe practices:

- Check whether variable names exist without printing full values.
- Use redacted examples such as `DATABASE_URL=postgresql://***`.
- Use placeholders in documentation.
- Keep `.env` out of commits and Docker images.
- Store production secrets only in approved locations.
- Do not modify `.env` unless the ticket explicitly allows it.

## Do Not Paste Secrets Rule

When troubleshooting, never paste full secrets into chat, logs, screenshots, or documentation.

Do not paste:

- Full `DATABASE_URL` values
- API keys
- Tokens
- Passwords
- Private keys
- Cookies
- Real production credentials
- Private certificates

Use variable names, redacted values, or placeholders instead.

Examples:

```text
DATABASE_URL=<redacted>
OPENAI_API_KEY=<redacted>
AWS_ACCESS_KEY_ID=<redacted>
```

## Backup Checks

Future backup checks should focus on recoverability.

Expected future checks:

- Confirm RDS automated backups are enabled.
- Confirm backup retention period.
- Understand restore options.
- Document what data is included in database backups.
- Document what data is not included, such as local uploaded files unless separately handled.
- Practice a restore walkthrough only when approved.

Backup operations are not performed in this ticket.

## Rollback Notes

Rollback planning should be simple and cautious.

Expected future rollback considerations:

- Keep track of the previous deployed version.
- Keep deployment configuration backed up.
- Avoid automatic schema changes on every app startup.
- Treat database migrations carefully because rollbacks may require data decisions.
- Prefer small, reversible changes.
- Document what changed before each deployment.

Rollback commands are not run in this ticket.

## Common Failure Scenarios

Common future failure scenarios include:

- App container will not start.
- API health endpoint fails.
- Nginx returns `502 Bad Gateway`.
- Frontend loads but API calls fail.
- Database connection fails.
- Required environment variable is missing.
- CORS blocks browser requests.
- Uploads fail due to request body limits.
- Disk space is low.
- SSL certificate renewal fails later.
- DNS points to the wrong target later.
- CI/CD deploy fails later.

Each failure should be investigated step by step, starting with the smallest observable symptom.

## Manual Troubleshooting Steps

Use this general troubleshooting order:

1. Reproduce the issue.
2. Identify what changed recently.
3. Check the public symptom.
4. Check the health endpoint.
5. Check browser network errors if frontend-related.
6. Check container status.
7. Check app logs.
8. Check Nginx logs if proxy-related.
9. Check environment variable names without exposing values.
10. Check database connectivity if data-related.
11. Check Linux resources such as disk, memory, and ports.
12. Document the finding and fix without secrets.
13. Re-run the relevant verification check.

## Safe Command Rules

Commands must be safe, explained, and approved for the current ticket.

Codex should explain:

- What the command does
- Why it matters
- What success looks like
- What failure might indicate

The user runs commands manually.

Do not run destructive commands unless explicitly approved.

Do not run:

```bash
npm audit fix --force
```

Do not print secrets while troubleshooting.

## Portfolio / Resume Evidence

Useful portfolio evidence should be safe and redacted.

Collect examples such as:

- Architecture diagrams
- Deployment phase summaries
- Screenshots of healthy app pages
- Health check output without secrets
- CI results without secrets
- Redacted log snippets
- Troubleshooting notes
- Backup/restore plan notes
- Monitoring screenshots
- Before/after verification summaries
- Resume bullet points based on completed work

Do not include secrets, private keys, real credentials, or sensitive customer data.

## Out Of Scope

This runbook ticket does not:

- Perform production operations
- Create Dockerfiles
- Create production Docker Compose
- Create AWS resources
- Configure RDS
- Configure IAM
- Configure CI/CD
- Configure DNS
- Configure SSL / Certbot
- Configure Nginx
- Deploy the app
- Modify `.env`
- Expose secrets
- Run destructive commands

## Acceptance Criteria

This ticket is complete when:

- The operations runbook purpose is documented.
- Roles and workflow are documented.
- Local verification checks are documented.
- Future production smoke checks are documented.
- Health endpoint checks are documented.
- Docker, Nginx, Linux/system, and RDS troubleshooting areas are documented.
- Environment variable and secret safety is documented.
- The Do Not Paste Secrets rule is documented.
- Backup and rollback notes are documented.
- Common failure scenarios are listed.
- Manual troubleshooting steps are documented.
- Safe command rules are documented.
- Portfolio/resume evidence guidance is documented.
- Out-of-scope boundaries are clear.
- No operations, deployment config, `.env` changes, destructive commands, or secrets are introduced.
# Portfolio Evidence Plan

## Purpose

This document defines what portfolio and resume evidence should be collected while building the CRM Modern / Modern Fullstack Cloud + DevOps project.

The goal is to prepare clear job-hunt material later without exposing secrets, private credentials, or sensitive data.

## Roles And Workflow

ChatGPT is the Architect / product planner / DevOps mentor / reviewer / project manager.

Codex is the coding assistant / guided implementer. Codex proposes small, scoped, testable steps and helps review evidence for safety and clarity.

The user is the hands-on builder/operator/learner/final reviewer.

Evidence should be collected only from approved phases and reviewed before being shared publicly.

## Why Portfolio Evidence Matters

Portfolio evidence shows practical ability.

Instead of only saying "I know Docker and AWS," the project should show:

- What was built
- How it was deployed
- How it was secured
- How it was verified
- How problems were investigated
- What tradeoffs were made

Good evidence makes resume claims easier to trust and easier to discuss in interviews.

## Evidence Quality Rules

Portfolio evidence must be:

- Truthful
- Redacted
- Easy to understand
- Connected to a real project outcome
- Not exaggerated
- Not exposing client or private data

Do not claim work that was not completed. It is better to show a clear beginner-to-practical learning path than to overstate the architecture.

## Architecture Evidence To Collect

Collect evidence that explains the system clearly:

- Final architecture diagram
- Docker/AWS deployment diagram
- Request flow diagram: browser -> Cloudflare -> Nginx -> API -> RDS
- Repository structure summary
- Short explanation of frontend, API, database, and infrastructure responsibilities
- Before/after notes for major DevOps phases
- Links to planning docs in the repository

## Local Baseline Evidence

Collect evidence from local readiness work:

- Local setup notes
- Root script summary
- `npm run typecheck` result
- `npm run lint`, if available, result
- `npm run test` result
- `npm run build` result
- Local browser QA notes
- Health endpoint notes when local API is running

Do not include local `.env` values.

## Docker Evidence

Collect evidence from future Docker phases:

- Dockerfile design notes
- `.dockerignore` explanation
- Docker build result
- Docker image list with sensitive details removed if needed
- Container startup result
- Container health or smoke test
- Docker logs with secrets redacted
- Explanation of why PostgreSQL is not containerized for production

Do not collect this evidence until Docker implementation is approved.

## AWS EC2 Evidence

Collect evidence from future EC2 phases:

- EC2 architecture notes
- Instance configuration summary
- Security group reasoning
- SSH/Linux setup notes
- Docker runtime setup notes
- Nginx/app runtime notes
- Redacted screenshots of AWS setup if safe
- Troubleshooting notes from EC2 setup

Do not expose public IPs if ChatGPT Architect decides they should be hidden.

## Amazon RDS PostgreSQL Evidence

Collect evidence from future RDS phases:

- RDS role explanation
- Database configuration summary without credentials
- Security group access explanation
- Backup configuration notes
- Migration approach notes
- Redacted connection verification
- Restore-plan or restore-practice notes when approved

Never expose `DATABASE_URL`, database passwords, hostnames if considered sensitive, or raw production data.

## Nginx Evidence

Collect evidence from future Nginx phases:

- Nginx role explanation
- Static frontend serving proof
- `/api` reverse proxy proof
- SPA fallback notes
- Redacted access log examples
- Redacted error log examples
- Notes about request body limits and upload behavior

Do not publish logs with tokens, cookies, private paths, or sensitive request bodies.

## Cloudflare DNS Evidence

Collect evidence from future DNS phases:

- Domain/subdomain routing summary
- DNS record explanation
- Propagation check results
- Cloudflare proxy mode decision
- Browser proof that the domain reaches the app

Redact account IDs, sensitive domain details if needed, and private account information.

## SSL / Certbot Evidence

Collect evidence from future SSL phases:

- HTTPS browser screenshot
- Certificate status check
- Certbot renewal notes
- HTTP-to-HTTPS redirect proof
- Explanation of why DNS must work before SSL

Do not expose private keys, certificate secrets, or server-sensitive paths.

## GitHub Actions CI/CD Evidence

Collect evidence from future CI/CD phases:

- Workflow summary
- Passing CI run screenshot
- Build/test/deploy stage explanation
- Redacted deployment logs
- GitHub secrets usage explanation without values
- Rollback or failed-deploy troubleshooting notes if they happen

Never expose GitHub secrets, deploy keys, tokens, or private SSH keys.

## Logs, Backups, Monitoring, And Troubleshooting Evidence

Collect operational evidence from future operations phases:

- Redacted Docker log snippets
- Redacted Nginx log snippets
- Health check outputs
- Backup retention notes
- Restore-plan notes
- Monitoring screenshots
- Uptime check notes
- Troubleshooting timeline for real issues
- Before/after verification summaries

Good troubleshooting evidence should show how the issue was identified, what was checked, what fixed it, and how success was verified.

## Screenshots To Collect

Useful screenshots may include:

- App running locally
- App running from deployed domain
- Browser HTTPS lock
- Health endpoint response
- GitHub Actions passing run
- AWS EC2 summary with sensitive details hidden
- RDS summary with sensitive details hidden
- Cloudflare DNS page with sensitive details hidden
- Nginx or Docker status output with secrets removed
- Monitoring or log views with secrets removed

Crop or blur anything sensitive before sharing.

## Safe Command Outputs To Collect

Safe command outputs may include:

- Successful typecheck output
- Successful test output
- Successful build output
- Docker build success output
- Docker container status without secrets
- Health check response
- DNS lookup result if safe
- SSL certificate check result
- Redacted logs
- Backup status summary

Do not collect command output that prints full environment variables, tokens, passwords, private keys, cookies, or credentials.

## Resume Bullet Ideas

Possible resume bullet themes:

- Containerized a full-stack TypeScript CRM application with Docker.
- Deployed a React/Express/PostgreSQL application on AWS EC2 with Amazon RDS.
- Configured Nginx reverse proxy for frontend serving and API routing.
- Secured a custom domain with Cloudflare DNS and Certbot HTTPS.
- Built GitHub Actions CI/CD checks for typecheck, tests, build, and deployment.
- Implemented operational runbooks for logs, backups, monitoring, and troubleshooting.
- Practiced secret-safe environment variable handling across local and production workflows.

Only use bullets that match work actually completed.

## LinkedIn / Project Summary Ideas

A future project summary can explain:

- What the CRM app does
- Why the project was built
- What DevOps skills were practiced
- What architecture was used
- What was deployed
- What was learned from troubleshooting
- What evidence is available in the repository

Keep the summary honest, concise, and focused on practical learning.

## GitHub README Evidence Ideas

The final README can include:

- Project overview
- Tech stack
- Architecture diagram
- DevOps roadmap link
- Deployment summary
- Screenshots
- Local setup instructions
- Safe environment variable documentation
- CI/CD status
- Operations runbook link
- Portfolio evidence summary

Do not put secrets or private infrastructure details in the README.

## What Must Not Be Exposed Publicly

Never expose:

- `.env` files
- Full `DATABASE_URL`
- API keys
- AWS credentials
- GitHub tokens
- SSH private keys
- Private certificates
- Passwords
- Cookies
- Session tokens
- Real production credentials
- Sensitive client data
- Private customer documents
- Raw database dumps
- Screenshots containing secrets

## Redaction Rules

Use redaction before sharing evidence publicly.

Good redaction examples:

```text
DATABASE_URL=<redacted>
OPENAI_API_KEY=<redacted>
AWS_ACCESS_KEY_ID=<redacted>
example-production-host=<redacted>
```

Rules:

- Use placeholders instead of real values.
- Crop screenshots to the relevant area.
- Blur account IDs, credentials, tokens, and private identifiers.
- Review logs before sharing.
- Ask ChatGPT Architect before publishing anything uncertain.

## Out Of Scope

This planning ticket does not:

- Perform deployment work
- Create Dockerfiles
- Create production Docker Compose
- Create AWS resources
- Configure RDS
- Configure IAM
- Configure CI/CD
- Configure DNS
- Configure SSL / Certbot
- Configure Nginx
- Modify `.env`
- Expose secrets
- Run commands

## Acceptance Criteria

This ticket is complete when:

- The purpose of the evidence plan is documented.
- Roles and workflow are documented.
- Evidence quality rules are documented.
- Evidence categories are documented for architecture, local baseline, Docker, AWS EC2, RDS, Nginx, Cloudflare, SSL, CI/CD, logs, backups, monitoring, and troubleshooting.
- Screenshot and safe command output guidance is documented.
- Resume, LinkedIn, and GitHub README evidence ideas are documented.
- Public exposure risks are documented.
- Redaction rules are documented.
- Out-of-scope boundaries are clear.
- No deployment work, Dockerfiles, production Compose, AWS/RDS/CI/CD/DNS/SSL configuration, `.env` changes, secrets, or commands are introduced.
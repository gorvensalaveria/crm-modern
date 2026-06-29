# Codex Phase 3Z: Deployment Shape Decision

## 1. Phase Name And Purpose

Phase 3Z: Deployment Shape Decision

Purpose:

Decide the first practical deployment shape before starting AWS EC2/RDS implementation.

This was a planning/decision-only phase. No AWS resources, EC2 resources, RDS resources, deployment files, Docker files, Compose files, GitHub Actions, secrets, or `.env` files were created or modified.

## 2. Deployment Options Compared

### Option A: API-Only First Deployment On EC2 With RDS

Description:

- Deploy only the API container first.
- Use Amazon RDS PostgreSQL.
- Verify API health, DB connectivity, and migrations.
- Add frontend, Nginx, DNS, and SSL later.

Strengths:

- Safest path.
- Lowest complexity.
- Easiest to debug.
- Fastest backend/cloud foundation validation.
- Best rollback/safety profile.

Weakness:

- Slower path to the user’s desired full public deployment outcome.
- Portfolio result is initially backend/API-focused rather than full public app-focused.

### Option B: API + Frontend + Nginx First Deployment On EC2 With RDS

Description:

- Deploy API container.
- Build and serve frontend production assets.
- Configure Nginx reverse proxy.
- Use Amazon RDS PostgreSQL.
- DNS/SSL may follow soon after or as part of the same track.

Strengths:

- Balanced approach.
- Stronger app-level portfolio result than API-only.
- Introduces Nginx/frontend integration earlier.

Weakness:

- More complex than Option A.
- Still delays the full public deployment outcome if DNS/SSL are not included immediately.
- Debugging includes more moving parts.

### Option C: Full Public Deployment First

Description:

- EC2 host.
- RDS PostgreSQL.
- API container.
- Frontend production build/static hosting.
- Nginx reverse proxy.
- Cloudflare DNS.
- SSL/Certbot.

Strengths:

- Strongest learning acceleration.
- Strongest portfolio milestone.
- Produces the full public deployment outcome the user wants.
- Exercises the most relevant DevOps skills together.

Weakness:

- Highest complexity.
- Highest risk.
- Hardest to debug if attempted as one giant step.
- Requires strict sequencing, review gates, and careful evidence redaction.

## 3. Evaluation By Category

| Category | Option A: API-only | Option B: API + frontend + Nginx | Option C: Full public deployment |
|---|---|---|---|
| Learning value | High and focused | Very high | Highest |
| Risk | Lowest | Medium | Highest |
| Complexity | Lowest | Medium-high | Highest |
| Debugging difficulty | Lowest | Medium-high | Highest |
| Portfolio value | Good technical evidence | Strong app evidence | Strongest public milestone |
| Time-to-first-success | Fastest for backend cloud success | Moderate | Slower but full outcome |
| Rollback/safety | Best | Good but more complex | Hardest, must be controlled |

## 4. User Decision

User decision:

Proceed with:

```text
Option C: Full public deployment first
```

Reason:

The user wants to accelerate learning and development for this project.

## 5. Architect Decision

Architect decision:

Option C is approved as the target deployment shape.

Important nuance:

This does not mean doing everything recklessly in one giant step.

Option C is the first deployment milestone, but implementation must be broken into safe, reviewable sub-phases.

## 6. Why Option C Is Acceptable For This Project

Option C has the highest complexity and risk, but it is acceptable because this project is intentionally hands-on and learning-focused.

Option C gives the strongest learning acceleration across:

- EC2
- RDS PostgreSQL
- Docker
- Docker Compose
- runtime secrets
- Prisma migrations
- frontend production build
- Nginx reverse proxy
- DNS/Cloudflare
- SSL/Certbot
- deployment troubleshooting
- portfolio evidence capture

Risk will be managed by breaking the work into sequential implementation tickets with review gates.

## 7. Chosen Deployment Shape

Chosen shape:

```text
Full public deployment first, executed through controlled sub-phases
```

This includes:

- EC2 host
- RDS PostgreSQL
- production runtime env file
- Prisma migration deploy workflow
- API container deployment
- frontend production build
- Nginx serving frontend and reverse proxying API
- Cloudflare DNS
- SSL/Certbot
- redacted evidence capture

## 8. Intentionally Excluded For Now

Option C still excludes for now:

- GitHub Actions deployment automation
- Kubernetes
- Terraform
- EKS
- blue/green deployments
- advanced monitoring dashboards
- full production hardening beyond what is needed for a safe portfolio deployment

These may be added later after the first public deployment milestone is complete.

## 9. Risk Management Rules

Risk management rules for Option C:

- Do not implement everything in one command sequence.
- Break work into small Architect-approved tickets.
- Verify each layer before adding the next.
- Keep PostgreSQL out of Docker on EC2; production database remains RDS.
- Do not commit or expose secrets.
- Do not paste or screenshot resolved secret values.
- Do not run migrations automatically on API startup.
- Run migration deploy only as a controlled deployment step.
- Capture portfolio evidence with redaction.
- Pause after failures and diagnose before continuing.

## 10. Immediate Next Tickets

Recommended immediate next tickets:

1. **Phase 4A: Full Public AWS Deployment Runbook Planning**
   - Convert Option C into a full step-by-step runbook.
   - Keep it planning-only first.
   - Include checkpoints and rollback/safety notes.

2. **Phase 4B: RDS PostgreSQL Provisioning Plan**
   - Plan database name, username, security groups, backup/snapshot expectations, SSL requirement, and migration target handling.

3. **Phase 4C: EC2 Host Setup Plan**
   - Plan AMI, instance size, SSH, Linux user, Docker/Compose installation, app directory, firewall/security group needs.

4. **Phase 4D: Nginx + Frontend Hosting Plan**
   - Plan frontend production build, static serving, API reverse proxy, and Nginx routing.

5. **Phase 4E: DNS + SSL Plan**
   - Plan Cloudflare DNS, domain records, Certbot, HTTPS, and renewal verification.

## 11. Decision

Final decision:

Proceed toward Option C as the first deployment milestone:

```text
EC2 + RDS + API + frontend + Nginx + DNS + SSL
```

Execution approach:

```text
Controlled sub-phases with review gates
```

## 12. Boundaries Respected

Boundaries respected during Phase 3Z:

- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No deployment was performed.
- `.env` was not modified.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions were not modified.
- No Docker/Compose commands that print secrets were run.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged.
- No commit was made.
- No push was performed.
- `npm audit fix --force` was not run.

## 13. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Next recommended ticket:

```text
Phase 4A: Full Public AWS Deployment Runbook Planning
# Codex Phase 4B: RDS PostgreSQL Provisioning Plan

## 1. Phase Name And Purpose

Phase 4B: RDS PostgreSQL Provisioning Plan

Purpose:

Plan the future Amazon RDS PostgreSQL setup for the full public AWS deployment milestone.

This is a planning-only phase.

No AWS resources, RDS resources, deployment resources, secrets, Docker files, Compose files, GitHub Actions, Prisma migrations, databases, or `.env` files were created or modified.

## 2. Practical RDS PostgreSQL Configuration

Recommended practical RDS setup for this portfolio project:

- Engine: Amazon RDS PostgreSQL
- Deployment type: single-AZ for the first portfolio deployment
- Instance class: small/low-cost class suitable for portfolio/demo traffic
- Storage: modest general-purpose SSD storage
- Production database target: RDS only
- Production PostgreSQL should not run in Docker on EC2
- Migration approach: committed Prisma migrations applied with the future production-style migration deploy command shape

This keeps the deployment realistic for cloud/devops learning while avoiding unnecessary complexity for the first public portfolio milestone.

## 3. AWS Region Choice Considerations

Region should be chosen later based on:

- User’s target audience location
- EC2 and RDS availability in the same region
- Cost
- Latency
- Free tier or low-cost eligibility
- Simplicity of keeping all resources in one region

Recommendation:

- Use one AWS region for both EC2 and RDS.
- Do not split EC2 and RDS across regions.
- Avoid account-specific values in documentation.
- Decide the actual AWS region in the approved AWS execution ticket.

## 4. DB Instance Class Considerations

Recommended first deployment posture:

- Use a small, low-cost RDS PostgreSQL instance class suitable for portfolio/demo traffic.
- Prefer a burstable/small instance class if available and cost-appropriate.
- Avoid oversized instances for the first deployment.
- Avoid production-scale sizing until real usage requires it.

Selection criteria:

- Low monthly cost
- PostgreSQL support
- Enough memory for Prisma/API demo traffic
- Fits free-tier or budget expectations, if applicable
- Easy to resize later if needed

## 5. Storage Considerations

Recommended storage posture:

- Use modest allocated storage suitable for a portfolio app.
- Use general-purpose SSD storage unless there is a specific reason to choose otherwise.
- Avoid very large initial allocation.
- Enable storage autoscaling only if cost boundaries are understood.

Before provisioning, confirm:

- Initial storage size
- Autoscaling setting
- Backup retention
- Estimated monthly cost

## 6. Database Name/User Naming Strategy Using Placeholders Only

Use placeholders in planning docs only.

Recommended naming pattern:

```text
Database identifier: <project>-<env>-postgres
Initial database name: <app_database_name>
Master username: <app_db_admin_user>
Application database user: <app_db_user>
```

Example placeholder style:

```text
<project>-prod-postgres
<app_database_name>
<app_db_user>
```

Do not document:

- Real database password
- Full real `DATABASE_URL`
- Production endpoint combined with credentials
- Any secret value

If a separate non-master application user is created later, it should have only the privileges the app needs.

## 7. Public Vs Private Accessibility Recommendation

Recommended first safe direction:

- Prefer RDS not publicly accessible.
- Allow database access only from the EC2 instance/security group.
- Keep the API container on EC2 as the application path to the database.
- Do not expose PostgreSQL directly to the public internet.

Default recommendation:

```text
RDS public accessibility: No
Access path: EC2 security group to RDS security group
```

If public accessibility is temporarily considered for troubleshooting, it should require separate ChatGPT Architect approval and strict IP allowlisting.

## 8. Security Group Relationship Between EC2 And RDS

Recommended security group model:

EC2 security group:

- Allows SSH from the user’s approved IP only.
- Allows HTTP/HTTPS when the Nginx/DNS/SSL phase is reached.
- Allows an app/API port only if explicitly needed during testing.

RDS security group:

- Allows inbound PostgreSQL port `5432` only from the EC2 security group.
- Does not allow public `0.0.0.0/0` access.
- Does not allow broad internet access.

Important:

The RDS inbound rule should reference the EC2 security group, not a public CIDR range, when possible.

## 9. Backup/Snapshot Expectations Before Migration/Deployment

Before running production migration deploy against RDS:

- Confirm automated backups are enabled or intentionally configured.
- Confirm backup retention period.
- Confirm whether a manual snapshot should be created before first migration.
- Confirm the database is new/empty or intentionally prepared.
- Confirm no production data would be lost.
- Confirm the migration target is the RDS production database, not local development.

Recommended first migration safety gate:

- RDS exists.
- App database exists.
- Future production `DATABASE_URL` is stored safely.
- Migration history is committed.
- Future production-style migration deploy command has been reviewed.
- Backup/snapshot posture has been reviewed.
- ChatGPT Architect approves before execution.

## 10. SSL Requirement Considerations For The DB Connection

RDS supports encrypted database connections.

Future considerations:

- Decide whether Prisma/RDS connection should require SSL.
- Confirm what RDS PostgreSQL expects for SSL mode.
- Confirm how SSL mode should be represented in the production `DATABASE_URL` or Prisma connection settings.
- Avoid documenting the full real connection string.
- Test DB connectivity safely after env setup.

Recommendation:

- Plan for SSL-compatible RDS connection handling.
- Confirm exact SSL query parameter or configuration during implementation.
- Document only placeholders, not real connection strings.

## 11. Future RDS DATABASE_URL Creation And Safe Storage

The future production `DATABASE_URL` should be created only during the approved runtime/secrets execution phase.

Safe storage recommendation:

- Store it in the EC2 server-local env file outside the repo, such as:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Do not commit it.
- Do not paste it into chat.
- Do not screenshot it.
- Do not include it in reports.
- Do not print it with `docker compose config`.

Placeholder format only:

```text
DATABASE_URL=postgresql://<user>:<password>@<rds-endpoint>:5432/<database>?<ssl-options>
```

The final value should be created manually and verified with redacted checks only.

## 12. Migration Deployment Readiness And Safety Gates

Before running migrations against RDS later:

- Confirm Prisma baseline migration is committed.
- Confirm `db:migrate:deploy` exists.
- Confirm RDS database target is correct.
- Confirm production `DATABASE_URL` points to RDS, not local development.
- Confirm backup/snapshot plan.
- Confirm no `prisma db push` will be used for production.
- Confirm no `prisma migrate dev` will be used for production.
- Confirm no migration command runs automatically on API startup.
- Obtain ChatGPT Architect approval before running migration deploy.

Approved future production-style command shape:

```bash
npm run db:migrate:deploy
```

Important:

This command is not approved to run during Phase 4B.

It must only be run later after RDS exists, the EC2 env file is safely configured, the target database is verified, backup/snapshot posture is reviewed, and ChatGPT Architect approves execution.

## 13. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- RDS instance status available.
- RDS engine/version visible.
- RDS public accessibility setting, with sensitive account details redacted.
- Security group inbound rule showing EC2-to-RDS relationship.
- Backup retention setting.
- Manual snapshot, if created.
- Migration deploy success output, with secrets absent.
- API health check after RDS connectivity.
- Redacted env validation showing required variables are present without values.

Do not capture:

- Full RDS endpoint if the user wants it private.
- Full `DATABASE_URL`
- Passwords
- API keys
- Secret env file contents
- AWS account identifiers, unless intentionally allowed and redacted appropriately

## 14. Risks And Rollback/Safety Notes

Risks:

- Making RDS publicly accessible accidentally.
- Opening PostgreSQL to `0.0.0.0/0`.
- Using local development database settings for production.
- Running `prisma db push` against RDS.
- Running `prisma migrate dev` against RDS.
- Running migrations before backup/snapshot review.
- Exposing the RDS password or full `DATABASE_URL`.
- Choosing an instance/storage configuration that creates unexpected cost.
- Splitting EC2 and RDS across regions.
- Forgetting SSL requirements for RDS connections.

Rollback/safety notes:

- For a new empty RDS database, rollback may mean dropping/recreating the app database only after explicit review.
- For any database with real data, rollback must rely on snapshots/backups.
- Stop immediately if the target database is unclear.
- Do not reset or delete RDS without explicit approval.
- Do not treat seed scripts as production migration tools.
- Keep migrations manual and reviewed for the first deployment.
- Keep RDS isolated behind security groups.

## 15. Boundaries Respected

Boundaries respected during Phase 4B:

- No AWS resources were created.
- No RDS resources were created.
- `.env` was not modified.
- No real secrets were created or edited.
- No secrets were exposed.
- No full real `DATABASE_URL` was requested or documented.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands that print resolved secrets were run.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

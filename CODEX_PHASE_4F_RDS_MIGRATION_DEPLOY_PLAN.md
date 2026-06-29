# Codex Phase 4F: RDS Migration Deploy Plan

## 1. Phase Name And Purpose

Phase 4F: RDS Migration Deploy Plan

Purpose:

Plan the future safe Prisma migration deployment workflow against Amazon RDS PostgreSQL.

This is a planning-only phase.

No migration commands were run. No deployment was performed. No AWS resources, EC2 resources, RDS resources, real env files, real secrets, Docker files, Compose files, GitHub Actions, databases, or `.env` files were created or modified.

## 2. Future RDS Migration Deploy Goal

The future RDS migration deploy goal is to apply the project’s committed Prisma migration history to the production Amazon RDS PostgreSQL database in a controlled, reviewable, non-destructive way.

Production migration deployment should:

- Use committed migration files only.
- Target only the intended RDS PostgreSQL database.
- Use the production `DATABASE_URL` from:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Use the existing production-style script:
  ```bash
  npm run db:migrate:deploy
  ```
- Run only after RDS, backup/snapshot posture, env file, and target database have been reviewed.
- Never run automatically on API container startup.

This phase does not run migrations. It only plans the future workflow.

## 3. Prerequisites Before Running Migration Deploy

Before running migration deploy later, confirm:

- RDS PostgreSQL exists.
- RDS database target is the intended production database.
- Backup/snapshot posture has been reviewed.
- Automated backup settings are known.
- Manual snapshot decision has been reviewed.
- EC2 host exists and is accessible.
- EC2 has the app repo or deployment copy.
- Production env file exists at:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Env file has been validated without printing secrets.
- `DATABASE_URL` points to the intended RDS database.
- `DATABASE_URL` is not printed, pasted, or screenshotted.
- Prisma baseline migration is committed.
- Migration files are present in the deployment copy.
- `db:migrate:deploy` script exists.
- The exact command has been reviewed.
- ChatGPT Architect approves execution.

## 4. Approved Future Production-Style Command Shape

Approved future production-style command shape:

```bash
npm run db:migrate:deploy
```

Important:

This command is not approved to run during Phase 4F.

It must only be run later after RDS exists, the EC2 env file is safely configured, the target database is verified, backup/snapshot posture is reviewed, and ChatGPT Architect approves execution.

## 5. How The Command Should Be Run Later With Production Env Loaded Safely

The future migration command must run with the production env loaded in a way that does not print secrets.

Accepted possible future env-loading pattern:

```bash
set -a
. /opt/crm-modern/env/production.env
set +a
npm run db:migrate:deploy
```

Caution:

This env-loading pattern must be reviewed before execution because sourcing env files can expose secrets if combined with unsafe shell settings, debugging flags, command echoing, logs, or screenshots.

The chosen approach should ensure:

- `DATABASE_URL` is available to Prisma.
- Secret values are not printed.
- Shell history does not contain secret values.
- The command runs from the correct app directory.
- The target database has been verified before execution.

Do not use:

```bash
echo $DATABASE_URL
```

Do not print the env file.

## 6. How To Verify Migration Status/Success Safely

Safe future verification should confirm that migrations applied successfully without exposing secrets.

Possible safe checks:

- Confirm `npm run db:migrate:deploy` exits successfully.
- Review Prisma output for applied migration names, ensuring no secrets appear.
- Use a migration status command only if approved and loaded with env safely.
- Check the application API health endpoint after deploy.
- Confirm the API can connect to the database without printing connection details.
- Optionally verify the `_prisma_migrations` table only with safe, minimal output if approved.

Potential future status command shape:

```bash
npx prisma migrate status --schema prisma/schema.prisma
```

Important:

This is only a future verification command shape.

It should not be run during Phase 4F and should require review before production use.

## 7. Commands That Must Not Be Used

Do not use against production RDS:

```bash
prisma db push
```

Reason:

- It syncs schema directly and does not use committed migration history.

Do not use against production RDS:

```bash
prisma migrate dev
```

Reason:

- It is development-oriented and can create/apply migrations interactively.

Do not use destructive reset commands, including:

```bash
prisma migrate reset
```

```bash
dropdb
```

```sql
DROP DATABASE
```

```sql
TRUNCATE
```

```sql
DELETE FROM
```

Unless a future destructive cleanup/recovery ticket explicitly approves a carefully scoped operation.

Also do not use:

```bash
docker compose config
```

with real env files, because it can print resolved secrets.

## 8. What Must Not Happen On API Startup

Migration deploy must not run automatically on API startup.

Do not add migration commands to:

- Dockerfile `CMD`
- Dockerfile `ENTRYPOINT`
- `docker-compose.prod.yml` service command
- API startup script
- Nginx startup
- Any automatic container lifecycle hook

Reason:

- Production migrations should be deliberate.
- Failed migrations should not block unrelated restarts unexpectedly.
- Automatic startup migrations can be risky when multiple containers or restarts happen.
- Migration execution should happen once, reviewed, and with backup/snapshot posture confirmed.

## 9. Rollback/Safety Notes If Migration Fails

If migration deploy fails:

1. Stop immediately.
2. Do not retry blindly.
3. Do not run `prisma db push`.
4. Do not run `prisma migrate dev`.
5. Do not reset or delete the RDS database.
6. Preserve logs/output for review, redacting any sensitive details.
7. Confirm the target database was correct.
8. Confirm `DATABASE_URL` points to the intended RDS database without printing it.
9. Confirm migration files match the committed repo state.
10. Review Prisma error output.
11. Check backup/snapshot availability before any corrective action.
12. Decide on a fix through a new Architect-approved recovery ticket.

Rollback depends on the state of the database:

- For a new empty database, recovery may involve a reviewed database recreation or restore.
- For any database with real data, recovery should rely on snapshots/backups and careful repair.
- Never improvise destructive database commands during troubleshooting.

## 10. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- Git commit showing Prisma migration files exist.
- `package.json` script showing `db:migrate:deploy`.
- RDS backup/snapshot posture screenshot, with sensitive details redacted.
- Env file existence check without contents.
- Safe target verification output without full `DATABASE_URL`.
- Migration deploy success output, if no secrets are visible.
- Migration status output, if approved and secret-safe.
- API health check after migration.
- Container/app logs showing DB connection success without credentials.

Do not capture:

- Full `DATABASE_URL`
- RDS password
- Secret env file contents
- `OPENAI_API_KEY`
- Private keys
- Plain `docker compose config` output with real env values
- Any screenshot containing secrets

## 11. Boundaries Respected

Boundaries respected during Phase 4F:

- No migration commands were run.
- No deployment was performed.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No real env files were created.
- No real secrets were created or edited.
- `.env` was not modified.
- No secrets were exposed.
- No secret values were requested.
- No full real `DATABASE_URL` was requested or documented.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
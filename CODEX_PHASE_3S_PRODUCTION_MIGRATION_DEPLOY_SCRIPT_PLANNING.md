# Codex Phase 3S: Production Migration Deploy Script Planning

## 1. Phase Name And Purpose

Phase 3S: Production Migration Deploy Script Planning

Purpose:

Plan whether this project should add a future-safe production migration deploy script, such as `db:migrate:deploy`, for later RDS/production deployment.

This was a planning-only phase. No package scripts were modified and no Prisma migration commands were run.

## 2. Current Migration-Related Scripts

Current root `package.json` migration-related scripts:

```json
{
  "db:generate": "prisma generate --schema prisma/schema.prisma",
  "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
  "db:push": "prisma db push --schema prisma/schema.prisma",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio --schema prisma/schema.prisma"
}
```

Current state:

- `db:migrate` exists and uses `prisma migrate dev`.
- `db:push` exists and uses `prisma db push`.
- `db:seed` exists for seed data.
- `db:migrate:deploy` does not currently exist.

## 3. Difference Between `migrate dev`, `db push`, And `migrate deploy`

### `prisma migrate dev`

`prisma migrate dev` is a development workflow command.

It can:

- create migration files,
- apply migrations to a development database,
- perform development drift checks,
- regenerate Prisma Client.

It is useful during local development but is not the right command for production startup or production deployment automation.

### `prisma db push`

`prisma db push` syncs the Prisma schema directly to a database.

It can:

- update the database schema without creating committed migration history,
- help with quick local prototyping,
- be useful for early development database sync.

It is not ideal for production because it bypasses reviewed migration files.

### `prisma migrate deploy`

`prisma migrate deploy` applies existing committed migration files.

It does not create new migration files.

It is the production-style command for applying reviewed migration history to a target database.

## 4. Why `migrate deploy` Is Safer For Future RDS / Production

`prisma migrate deploy` is safer for future RDS/production use because it applies known, committed migration files instead of generating schema changes during deployment.

Benefits:

- Uses committed migration history.
- Is repeatable.
- Is reviewable.
- Is more auditable.
- Avoids development prompts and local-only workflows.
- Reduces risk of accidental schema drift.
- Fits controlled deployment steps.
- Supports future RDS migration workflow better than `migrate dev` or `db push`.

## 5. Recommended Future Script Name And Command

Recommended future script name:

```text
db:migrate:deploy
```

Recommended future command:

```json
"db:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma"
```

Decision:

This script should be added later in a separate approved implementation ticket.

It should not be added during Phase 3S.

## 6. When The Script Should Be Run Later

The future `db:migrate:deploy` script should be run only as a deliberate database/deployment step.

Appropriate future situations:

- Against a reviewed local test database.
- Against a staging database if one exists later.
- Against Amazon RDS PostgreSQL only after RDS setup is approved.
- After confirming the target `DATABASE_URL`.
- After backup or snapshot planning for production.
- Before starting or restarting the production API, if that is the approved deployment flow.
- Manually or through approved CI/CD later.

## 7. When The Script Should Not Be Run

The future script should not be run:

- during Phase 3S,
- automatically on every API container startup,
- without confirming the target database,
- without a safe runtime `DATABASE_URL`,
- without production backup/snapshot planning,
- as a replacement for seed scripts,
- as part of casual local development unless specifically approved,
- against RDS before AWS/RDS deployment work is approved.

## 8. Why It Must Not Be Added To API Container Startup

Migration deploy must not be added to API container startup.

Reasons:

- App startup should start the app, not change database schema.
- Multiple API containers could try to run migrations at the same time later.
- Auto-restarting containers could repeatedly attempt migration commands.
- Migration failures should be handled as deployment/database events, not hidden inside app startup.
- Production schema changes need deliberate review, backup planning, and rollback planning.
- Keeping migrations separate makes troubleshooting clearer.

Do not add migration commands to:

- Dockerfile `CMD`
- Docker Compose `command`
- server start scripts
- API runtime startup hooks

## 9. Risks And Safety Rules

Risks:

- Running migration deploy against the wrong database.
- Running without a backup or snapshot.
- Confusing migration deploy with seed data.
- Exposing a full `DATABASE_URL`.
- Running migration deploy before RDS is ready.
- Running migration deploy automatically from container startup.
- Assuming local success means production is automatically safe.

Safety rules:

- Confirm target database before running.
- Never paste or document full real `DATABASE_URL` values.
- Use committed migration files only.
- Keep seed data separate from migration history.
- Run only after Architect approval.
- Do not add migration deploy to app startup.
- Do not run against RDS until RDS work is approved.
- Document migration execution in a later operations runbook or deployment checklist.

## 10. Recommendation

Recommendation:

Add the following script later in a separate approved implementation ticket:

```json
"db:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma"
```

Do not add it during Phase 3S.

Do not run it yet.

Recommended future flow:

1. Add `db:migrate:deploy` in a small approved implementation ticket.
2. Verify the script exists without running it.
3. Later, test it against a safe local or staging database if approved.
4. Use it for RDS only in a controlled production deployment workflow.

## 11. Boundaries Respected

Boundaries respected during Phase 3S:

- `package.json` was not modified.
- No Prisma migration commands were run.
- `prisma migrate dev` was not run.
- `prisma migrate deploy` was not run.
- `prisma db push` was not run.
- No database was reset.
- No database was deleted.
- `.env` was not modified.
- No full real `DATABASE_URL` was requested or documented.
- No secrets were exposed.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL work was started.
- No deployment work was started.
- No commit was made.
- `npm audit fix --force` was not run.

## 12. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Add `db:migrate:deploy` script in a separate implementation ticket.
- Runtime secrets handling planning.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.
- API-only production Compose hardening review.
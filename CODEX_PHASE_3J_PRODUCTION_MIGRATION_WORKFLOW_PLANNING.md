# Codex Phase 3J: Production Migration Workflow Planning

## 1. Phase Name And Purpose

Phase 3J: Production Migration Workflow Planning

Purpose:

Plan how database schema migrations should be handled safely for future production deployment.

This was a planning-only phase. No package scripts were modified and no migrations were run.

Important rule:

Migrations must not run automatically on every API container startup.

## 2. Files Inspected

Files inspected:

- `package.json`
- `prisma/schema.prisma`
- `prisma/` directory structure

No `.env` file was inspected or modified.

## 3. Current Local / Dev Prisma Workflow

Current root Prisma-related scripts:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

Current script behavior:

- `db:generate` runs Prisma Client generation.
- `db:migrate` runs `prisma migrate dev --schema prisma/schema.prisma`.
- `db:push` runs `prisma db push --schema prisma/schema.prisma`.
- `db:seed` runs local seed data.
- `db:studio` opens Prisma Studio.

Current local/dev workflow appears to rely on `db:push` and `db:seed` for local database setup, with `db:migrate` available for development migration workflows.

## 4. Current Migration Status

Current migration status:

- Prisma datasource uses PostgreSQL.
- Prisma reads the database connection from `DATABASE_URL`.
- `prisma/migrations/` does not currently exist.
- No committed Prisma migration history was found.

Important clarification:

Because `prisma/migrations/` does not currently exist, the project is not yet production-migration-ready.

A later dedicated ticket should plan how to create a safe baseline migration history before production deployment.

## 5. Why `prisma migrate dev` Is Not A Production Startup Command

`prisma migrate dev` is designed for development workflows.

It is not appropriate as an automatic production startup command because:

- It can create or modify migration files.
- It can perform development-oriented drift checks.
- It may prompt or behave in ways meant for local development.
- App startup should not change database schema.
- Multiple app containers could attempt migration at the same time later.
- Migration failure would mix application startup failure with database administration failure.
- Production schema changes need review, backup awareness, and rollback planning.

Decision:

`prisma migrate dev` must not run automatically on API container startup.

## 6. Why `prisma db push` Is Not A Production Startup Command

`prisma db push` directly syncs the Prisma schema to the database.

It is not appropriate as an automatic production startup command because:

- It bypasses committed migration history.
- It is harder to audit.
- It can make rollback planning harder.
- It may apply unexpected schema changes.
- It is better suited to local prototyping, demos, or development database sync.
- Production schema changes should be explicit, reviewed, and traceable.

Decision:

`prisma db push` must not run automatically on API container startup.

## 7. Future Production Migration Direction

Future production migration direction should be:

- Create a safe baseline migration history in a later approved ticket.
- Commit Prisma migration files to the repository.
- Review migration impact before applying changes.
- Apply production migrations as a separate deployment step.
- Keep API container startup focused on starting the app only.
- Never run schema-changing commands automatically on every container startup.
- Use an approved production migration command later, likely based on `prisma migrate deploy`.

Potential future production flow:

1. Confirm backup or snapshot exists.
2. Deploy or prepare the new application version.
3. Run the approved migration command as a separate step.
4. Start or restart the API service.
5. Verify health and database-backed behavior.
6. Document the result.

This flow must be refined in a later implementation ticket before production use.

## 8. Future `db:migrate:deploy` Script Consideration

A future production-safe migration script may be useful later, such as:

```json
"db:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma"
```

This script should not be added during Phase 3J.

It should be considered only in a later approved implementation ticket after:

- baseline migration strategy is decided,
- production migration workflow is documented,
- RDS deployment path is clearer,
- backup expectations are understood,
- secret-safe `DATABASE_URL` handling is planned.

## 9. RDS Relationship

Future production PostgreSQL target:

```text
Amazon RDS PostgreSQL
```

Migration relationship to RDS:

- Future production `DATABASE_URL` will point to RDS.
- Production migrations should target RDS only during an approved migration/deployment step.
- The API container should not automatically migrate RDS on startup.
- RDS backups or snapshots should be considered before migration.
- RDS access should be controlled by security groups and secret-safe runtime configuration.
- Production migration commands must not expose the full `DATABASE_URL`.

## 10. Backup And Rollback Considerations

Beginner-friendly safety considerations:

- Confirm a backup or RDS snapshot before applying production migrations.
- Know how to restore before applying risky schema changes.
- Prefer small, reviewable migrations.
- Avoid mixing unrelated schema changes.
- Avoid bundling risky database changes with unrelated application changes.
- Understand that rollback may require both:
  - code rollback,
  - database restore or manual corrective migration.
- Treat seed scripts separately from schema migrations.
- Do not run seed scripts against production unless explicitly approved.

Important note:

Database rollback is often harder than code rollback. Production migration planning should be cautious and documented.

## 11. Open Questions Before Implementation

Open questions before implementing production migration workflow:

- How should the current schema be converted into a committed baseline migration history?
- Should the project create a baseline migration before AWS/RDS work begins?
- Should a future `db:migrate:deploy` script be added to `package.json`?
- Should migrations be run manually over SSH, through CI/CD, or through a one-off container command?
- What backup or snapshot step is required before production migration?
- How will migration failure be detected and handled?
- How will rollback be practiced or documented?
- Should seed data ever run against production? Expected answer: no, unless explicitly approved.
- How will `DATABASE_URL` be passed safely to migration commands?
- Should migration execution be documented in the operations runbook later?

## 12. Decision

Decision:

No migration implementation changes in Phase 3J.

Accepted planning decisions:

- Do not modify package scripts yet.
- Do not run migrations.
- Do not run `prisma migrate dev`.
- Do not run `prisma db push`.
- Do not run `prisma migrate deploy`.
- Do not add migrations to API container startup.
- Do not treat the project as production-migration-ready yet.
- Plan a later dedicated baseline migration/history ticket.
- Consider `db:migrate:deploy` only in a later approved implementation phase.

## 13. Boundaries Respected

Boundaries respected during Phase 3J:

- No package scripts were modified.
- No migrations were run.
- `prisma migrate dev` was not run.
- `prisma db push` was not run.
- `prisma migrate deploy` was not run.
- No migrations were added to container startup.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL / Certbot work was started.
- No deployment work was started.
- No `.env` changes were made.
- No full `DATABASE_URL` was requested or documented.
- No secrets were exposed.
- No destructive commands were run.
- `npm audit fix --force` was not run.

## 14. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Prisma baseline migration planning.
- Production migration command planning.
- Runtime secrets handling planning.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.

Recommended immediate next migration-related ticket:

Plan how to create a safe baseline migration history for the existing Prisma schema before production deployment.
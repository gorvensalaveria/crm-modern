# Codex Phase 3K: Prisma Baseline Migration Planning

## 1. Phase Name And Purpose

Phase 3K: Prisma Baseline Migration Planning

Purpose:

Plan how to create a proper Prisma migration history from the current schema so the project can become production-migration-ready later.

This was a planning-only phase. No migrations were created and no database changes were made.

## 2. Files / Status Inspected

Files and status inspected:

- `package.json`
- `prisma/schema.prisma`
- `prisma/migrations/` directory status
- `CODEX_PHASE_3J_PRODUCTION_MIGRATION_WORKFLOW_PLANNING.md`

No `.env` file was inspected or modified.

## 3. Current Migration State

Current state:

- Prisma uses PostgreSQL through `DATABASE_URL`.
- `db:migrate` currently runs `prisma migrate dev --schema prisma/schema.prisma`.
- `db:push` currently runs `prisma db push --schema prisma/schema.prisma`.
- `prisma/migrations/` does not currently exist.
- No committed Prisma migration history currently exists.

Conclusion:

The project is not yet production-migration-ready.

Reason:

Production migration workflows should rely on committed migration files, but this project does not yet have a committed Prisma migration history.

## 4. What A Baseline Migration Means

A baseline migration is the first committed migration history that represents the current database schema as a starting point.

In plain terms:

A baseline migration tells Prisma, “this is the official starting schema history for the app from here forward.”

A baseline migration is useful when a project already has a schema and local database workflow, but has not yet committed migration files.

## 5. Why Migration History Matters Before RDS / Production

Migration history matters before RDS/production because committed migration files are:

- reviewable
- repeatable
- auditable
- safer than ad hoc schema syncing
- usable by `prisma migrate deploy` later
- better for deployment planning
- better for rollback planning

Without `prisma/migrations/`, there is no stable production migration trail yet.

Future Amazon RDS PostgreSQL deployment should rely on reviewed and committed migration files, not automatic startup schema changes.

## 6. Baseline Migration Vs Seed Data

A baseline migration is not the same as seeding data.

Migration means:

- database schema
- tables
- columns
- indexes
- constraints
- migration history

Seed data means:

- sample data
- demo records
- initial test records
- local development content

Important distinction:

- A migration changes or records database structure.
- A seed script inserts or updates data.

Seed scripts should stay separate from schema migrations.

Production should not run seed data unless explicitly approved in a later phase.

## 7. Safe Future Options For Creating The Initial Baseline

Safe future options for creating the initial baseline include:

### Option A: Clean Local Baseline

Use a clean local database to generate the first migration from the current Prisma schema.

Benefits:

- Simple mental model.
- Easier to verify.
- Avoids mixing old local database drift into the baseline.

Risk:

- Requires care if the existing local data needs to be preserved.

### Option B: Throwaway Database Test

Use a temporary or throwaway local PostgreSQL database to test baseline migration generation before touching the main local development database.

Benefits:

- Safer for learning.
- Protects existing local data.
- Allows the migration flow to be practiced.

Risk:

- Requires a little extra setup in a later approved ticket.

### Option C: Baseline Existing Database Carefully

If the existing local database must be preserved, a later ticket could plan how to baseline the current schema without resetting important local data.

Benefits:

- May avoid local data loss.

Risk:

- Requires extra care to avoid drift, incorrect migration history, or accidental data changes.

Recommended future direction:

Start with a safe local or throwaway database workflow before touching any important local data.

## 8. Whether Local Database Reset May Be Needed Or Avoidable

A local database reset may be useful if the goal is to create a clean migration history from scratch.

A reset may be avoidable if the baseline is created carefully against an existing database and migration state is handled intentionally.

Important:

No reset decision should be assumed.

Before any reset is considered, confirm:

- Whether existing local data matters.
- Whether the data can be recreated from `prisma/seed.ts`.
- Whether a backup/export is needed.
- Whether a throwaway database can be used instead.

Decision for Phase 3K:

No database reset was performed.

## 9. Risks Around Local Data And Seed Data

Risks around local data:

- Resetting the local database would delete local records.
- Some manually created test records may not exist in seed data.
- Existing local data may not perfectly match the current Prisma schema.
- Existing local data may hide schema drift or assumptions.
- Baseline generation should be tested before relying on it.

Risks around seed data:

- `prisma/seed.ts` may recreate only expected demo/test data.
- Seed data is not a backup.
- Seed data is not migration history.
- Seed scripts should not be treated as production migration tools.
- Seed scripts should not run against production unless explicitly approved.

## 10. Separation From Production / RDS

Baseline migration planning should remain separate from production and RDS.

Phase 3K does not:

- create RDS
- connect to RDS
- configure AWS
- configure deployment
- run production migrations
- create migration files

Future production direction:

- Create and review baseline migration files locally first.
- Commit migration files to the repository.
- Only later, after approval, apply production migrations to Amazon RDS PostgreSQL through a controlled deployment step.
- Never run migrations automatically on every API container startup.

## 11. Commands That May Be Used Later But Were Not Run

The following commands may be relevant in a later approved implementation ticket.

They were not run during Phase 3K.

Potential later commands:

```bash
npx prisma migrate dev --name init --schema prisma/schema.prisma
```

```bash
npx prisma migrate diff
```

```bash
npx prisma migrate resolve
```

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

```bash
npm run db:seed
```

Important:

These commands are listed for future planning only.

They must not be run until a later Architect-approved implementation ticket defines the exact workflow.

## 12. Recommendation

Recommended Phase 3K decision:

- Keep Phase 3K planning-only.
- Do not create migrations yet.
- Do not reset the database.
- Do not delete data.
- Do not modify package scripts.
- Do not add migrations to API container startup.
- Create migrations later in a dedicated implementation ticket.
- Prefer testing the baseline flow against a safe local or throwaway database before touching important local data.

Recommended future implementation direction:

1. Decide whether to preserve current local data.
2. Decide whether to use a throwaway database for the first baseline test.
3. Generate an initial baseline migration in a controlled local workflow.
4. Review the generated migration SQL.
5. Verify migration behavior locally.
6. Commit migration files only after review.
7. Plan production/RDS migration deployment separately.

## 13. Boundaries Respected

Boundaries respected during Phase 3K:

- No migrations were created.
- `prisma migrate dev` was not run.
- `prisma migrate deploy` was not run.
- `prisma db push` was not run.
- The database was not reset.
- Data was not deleted.
- Package scripts were not modified.
- `.env` was not modified.
- No full `DATABASE_URL` was requested or documented.
- No secrets were exposed.
- No AWS work was started.
- No RDS configuration was started.
- No Terraform work was started.
- No CI/CD work was started.
- No DNS work was started.
- No SSL / Certbot work was started.
- No deployment work was started.
- No destructive commands were run.
- `npm audit fix --force` was not run.
- Migrations were not added to API container startup.

## 14. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Prisma baseline migration implementation planning.
- Safe throwaway database baseline test planning.
- Runtime secrets handling planning.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.

Recommended immediate next migration-related ticket:

Plan the exact safe workflow for generating and reviewing the first baseline migration using a local or throwaway PostgreSQL database.
# Codex Phase 3L: Throwaway DB Baseline Test Planning

## 1. Phase Name And Purpose

Phase 3L: Safe Throwaway Database Baseline Test Planning

Purpose:

Plan the exact safe workflow for testing Prisma baseline migration creation using a throwaway local PostgreSQL database.

This was a planning-only phase. No throwaway database was created, no migrations were created, and no database changes were made.

## 2. Why A Throwaway Database Is Safer

A throwaway local PostgreSQL database is safer than using the main local development database first because it protects existing local data.

Benefits:

- Protects the main local development database.
- Avoids accidental reset of useful local data.
- Avoids accidental schema changes to the main local database.
- Allows baseline migration generation to be practiced safely.
- Makes mistakes easier to recover from.
- Keeps the workflow local-only and controlled.

The main local database should remain untouched until the baseline workflow is understood, reviewed, and approved.

## 3. How A Throwaway Local PostgreSQL Database Could Be Created Later

In a later approved implementation ticket, a throwaway local PostgreSQL database could be created using the existing local PostgreSQL container.

Potential future approach:

1. Confirm the existing local PostgreSQL container is running and healthy.
2. Choose a clearly named throwaway database, such as `asun_migrations_baseline_test`.
3. Create that database inside the existing local PostgreSQL container.
4. Create a temporary env file outside the repo that points Prisma to the throwaway database.
5. Use that temporary env file only for baseline testing.
6. Keep `.env` unchanged.
7. Keep the main local development database untouched.

Important:

The throwaway database should be clearly named so it cannot be confused with the main local development database.

## 4. How Baseline Migration Generation Could Be Tested Later

In a later approved implementation ticket, baseline migration generation could be tested against the throwaway database.

Potential future workflow:

1. Confirm `prisma/migrations/` does not exist or confirm the intended migration directory state.
2. Point Prisma to the throwaway database using a temporary env file outside the repo.
3. Generate an initial baseline migration from the current Prisma schema.
4. Inspect the generated migration files.
5. Review the generated SQL before committing anything.
6. Apply or verify the migration only against the throwaway database.
7. Confirm the main local development database was not changed.

No baseline migration generation was performed during Phase 3L.

## 5. How Generated Migration SQL Should Be Reviewed Before Commit

Generated migration SQL should be reviewed before committing migration files.

Review checklist:

- Table names match the intended Prisma schema.
- Column names and types look correct.
- Required and optional fields match expectations.
- Indexes look reasonable.
- Unique constraints look reasonable.
- Foreign keys and relations look correct.
- Enum values look correct.
- No unexpected destructive operations appear.
- No secret values appear.
- Migration folder name is clear and intentional, such as `init` or `baseline`.

A generated migration should not be committed until it has been reviewed and accepted.

## 6. How To Verify The Migration Against A Clean Database Later

In a later implementation ticket, the migration should be verified against a clean throwaway database.

Potential verification approach:

1. Use a clean throwaway database.
2. Apply the generated migration to that clean database.
3. Confirm migration completes successfully.
4. Generate Prisma Client if needed.
5. Start the API against the throwaway database if approved.
6. Verify `GET /api/health`.
7. Optionally test one safe database-backed endpoint after seed data is handled separately.
8. Confirm no migration command was added to API startup.
9. Confirm the main local development database remains untouched.

The purpose is to prove that the committed migration history can build the schema from a clean database.

## 7. How Seed Data Should Be Tested Separately

Seed data should be tested separately from migration creation.

Migration test means:

- Create or verify database schema.
- Confirm tables, columns, relations, indexes, and constraints.

Seed test means:

- Insert sample or demo data.
- Confirm the app has expected local test records.

Recommended separation:

1. First verify the baseline migration against a clean throwaway database.
2. Only after migration verification, run seed testing if approved.
3. Confirm seeded data appears as expected.
4. Keep seed behavior separate from migration history.

Important:

Seed data is not migration history.

Seed scripts should not be used as production migration tools.

## 8. Commands That May Be Used Later But Were Not Run

The following commands may be relevant in a later approved implementation ticket.

They were not run during Phase 3L.

Potential later commands:

```bash
docker compose ps
```

```bash
docker compose exec postgres createdb -U asun asun_migrations_baseline_test
```

```bash
docker compose exec postgres dropdb -U asun asun_migrations_baseline_test
```

```bash
npx prisma migrate dev --name init --schema prisma/schema.prisma
```

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

```bash
npx prisma generate --schema prisma/schema.prisma
```

```bash
npm run db:seed
```

Important safety note:

Commands like `createdb` and `dropdb` can be destructive if pointed at the wrong database.

They must only be used later with:

- explicit database names,
- clear command review,
- Architect approval,
- user confirmation before execution.

No commands in this section were run during Phase 3L.

## 9. Risks And Rollback Considerations

Risks:

- Accidentally pointing Prisma at the main local database.
- Accidentally modifying `.env`.
- Accidentally creating migration files against the wrong database.
- Accidentally committing an unreviewed migration.
- Confusing seed data with migration history.
- Using `dropdb` against the wrong database.
- Resetting or deleting useful local data.

Rollback and safety considerations:

- Use a clearly named throwaway database.
- Use a temporary env file outside the repo.
- Do not modify `.env`.
- Review the database name before every future command.
- Avoid reset/delete commands unless explicitly approved.
- Commit migration files only after review.
- Clean up only throwaway resources in a later approved cleanup step.
- Keep the main local development database untouched.

## 10. Recommended Approach

Recommended approach for a later implementation ticket:

1. Use a throwaway local PostgreSQL database first.
2. Keep the main local development database untouched.
3. Use a temporary env file outside the repo.
4. Generate the initial baseline migration only after approval.
5. Review generated migration SQL before commit.
6. Verify the migration against a clean throwaway database.
7. Test seed data separately from migration creation.
8. Do not add migrations to API container startup.
9. Do not involve RDS or production infrastructure yet.

## 11. Boundaries Respected

Boundaries respected during Phase 3L:

- No throwaway database was created.
- No migrations were created.
- `prisma migrate dev` was not run.
- `prisma migrate deploy` was not run.
- `prisma db push` was not run.
- No database was reset.
- No data was deleted.
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

## 12. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Throwaway database baseline migration implementation.
- Runtime secrets handling planning.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.
- Production migration deployment planning.

Recommended immediate next migration-related ticket:

Create the throwaway local PostgreSQL database and test initial Prisma baseline migration generation in a controlled local workflow.
**Phase 3P Cleanup Planning Summary**

1. **Cleanup Resources In Scope**

Resources planned for possible cleanup later:

- Throwaway database: `asun_migrations_baseline_test`
- Temporary env file: `/tmp/crm-modern-baseline-test.env`

Resources that must remain untouched:

- Main local database: `asun_migrations`
- Project `.env`
- Project `.env.local`
- Committed Prisma migration files
- Local PostgreSQL container and volume

2. **Why Cleanup Needs Care**

Cleanup needs care because database cleanup commands can be destructive.

The main risk is accidentally targeting the wrong database. A command like `dropdb` is safe only when the database name is explicit and correct. If pointed at `asun_migrations` instead of `asun_migrations_baseline_test`, it could delete the main local development database.

The temp env file also needs care because it may contain a local database connection string. It should not be printed or committed.

3. **How To Verify The Throwaway Database Exists Before Cleanup**

Future read-only verification command:

```bash
docker compose exec postgres psql -U asun -d postgres -tAc "SELECT datname FROM pg_database WHERE datname = 'asun_migrations_baseline_test';"
```

Success looks like:

```text
asun_migrations_baseline_test
```

This confirms the throwaway database exists before attempting cleanup.

4. **How To Verify The Main Database Exists Before And After Cleanup**

Future read-only verification command:

```bash
docker compose exec postgres psql -U asun -d postgres -tAc "SELECT datname FROM pg_database WHERE datname = 'asun_migrations';"
```

Success looks like:

```text
asun_migrations
```

This should be run before and after any cleanup to confirm the main local database remains present.

5. **Safe Future Command To Drop Only `asun_migrations_baseline_test`**

Future cleanup command, only after explicit approval:

```bash
docker compose exec postgres dropdb -U asun asun_migrations_baseline_test
```

Safety conditions before running:

- Confirm the command uses `dropdb`, not any broader deletion command.
- Confirm the database name is exactly `asun_migrations_baseline_test`.
- Confirm it does not mention `asun_migrations`.
- Confirm the main database exists before cleanup.
- Confirm Architect approval.

6. **Safe Future Command To Delete `/tmp/crm-modern-baseline-test.env`**

Future cleanup command, only after explicit approval:

```bash
rm /tmp/crm-modern-baseline-test.env
```

Safety conditions before running:

- Confirm the path is exactly `/tmp/crm-modern-baseline-test.env`.
- Confirm it is outside the repo.
- Confirm it is not `.env`.
- Confirm it is not `.env.local`.
- Confirm Architect approval.

7. **What Should Not Be Deleted**

Do not delete:

- `asun_migrations`
- PostgreSQL container
- PostgreSQL Docker volume
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.env`
- `.env.local`
- committed migration files:
  - `prisma/migrations/20260626135938_init/migration.sql`
  - `prisma/migrations/migration_lock.toml`
- phase reports
- package files

8. **Risks And Rollback Considerations**

Risks:

- Dropping the main database by mistake.
- Deleting the wrong env file.
- Removing useful throwaway data before optional seed testing.
- Confusing committed migration files with temporary test resources.

Rollback considerations:

- If the throwaway database is dropped, it can be recreated later.
- If the temp env file is deleted, it can be recreated later.
- If the main database were accidentally dropped, recovery would require backup/volume restore, which is exactly why cleanup must be explicit and careful.
- There is no need to clean committed migration files; they are now part of the accepted project history.

9. **Whether Cleanup Should Happen Now Or Wait Until Optional Seed Testing**

Recommendation: wait until ChatGPT Architect decides whether optional seed testing should happen against the throwaway database.

Reason:

- The throwaway database is already migrated and useful for seed testing.
- Keeping it temporarily avoids recreating it.
- Cleanup can happen after seed testing is either completed or explicitly skipped.

10. **Recommendation**

Recommended cleanup approach:

- Do not clean up immediately unless Architect confirms seed testing is skipped.
- If seed testing is planned, keep both:
  - `asun_migrations_baseline_test`
  - `/tmp/crm-modern-baseline-test.env`
- If seed testing is skipped, proceed later with a dedicated cleanup execution ticket.
- Cleanup execution should verify:
  - throwaway database exists,
  - main database exists before cleanup,
  - drop only `asun_migrations_baseline_test`,
  - main database still exists after cleanup,
  - delete only `/tmp/crm-modern-baseline-test.env`.

11. **Report Filename**

Use:

```text
CODEX_PHASE_3P_THROWAWAY_DB_TEMP_ENV_CLEANUP_PLANNING.md
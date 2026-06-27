# Codex Phase 3T: Add Production Migration Deploy Script

## 1. Phase Name And Purpose

Phase 3T: Add Production Migration Deploy Script

Purpose:

Add a future-safe production migration deploy script to the root `package.json`.

This script is intended for later controlled migration deployment workflows. It was not run during this phase.

## 2. Context

Phase 3S planning was completed and accepted.

The project now has a committed Prisma baseline migration.

Future production/RDS deployment should apply committed migration files with a controlled command.

Approved script:

```json
"db:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma"
```

## 3. File Modified

File modified:

- `package.json`

No other project files were modified for this implementation.

## 4. Script Added

Added root script:

```json
"db:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma"
```

The script was added near the existing Prisma database scripts.

## 5. Updated Scripts Snippet

Updated root `package.json` scripts:

```json
{
  "db:generate": "prisma generate --schema prisma/schema.prisma",
  "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
  "db:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma",
  "db:push": "prisma db push --schema prisma/schema.prisma",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio --schema prisma/schema.prisma"
}
```

## 6. Verification

Verification performed by inspecting `package.json`.

Confirmed:

- `db:migrate:deploy` exists.
- Existing scripts were preserved.
- `package-lock.json` was not modified.
- No Prisma migration command was run.
- No database was reset, deleted, or modified.

## 7. Current Git Status

Current git status after the change:

```text
 M package.json
?? CODEX_PHASE_3P_THROWAWAY_DB_TEMP_ENV_CLEANUP_PLANNING.md
?? CODEX_PHASE_3Q_THROWAWAY_DB_SEED_TEST.md
?? CODEX_PHASE_3R_THROWAWAY_DB_TEMP_ENV_CLEANUP_EXECUTION.md
?? CODEX_PHASE_3S_PRODUCTION_MIGRATION_DEPLOY_SCRIPT_PLANNING.md
```

## 8. Boundaries Respected

Boundaries respected during Phase 3T:

- Modified only root `package.json`.
- Added only `db:migrate:deploy`.
- Did not modify `package-lock.json`.
- Did not run `npm install`.
- Did not run `npm audit fix`.
- Did not run `npm audit fix --force`.
- Did not run `prisma migrate dev`.
- Did not run `prisma migrate deploy`.
- Did not run `prisma db push`.
- Did not run any Prisma migration commands.
- Did not reset or delete any database.
- Did not modify `.env`.
- Did not expose secrets.
- Did not ask for a full real `DATABASE_URL`.
- Did not add migration commands to API container startup.
- Did not modify Dockerfile or Compose files.
- Did not create AWS/RDS/CI/CD/DNS/SSL/deployment work.
- Did not commit anything.

## 9. Recommendation

Recommendation:

Keep the new script for future controlled migration deployment workflows.

Do not run it until a later Architect-approved ticket defines the target database, runtime environment handling, and verification steps.

## 10. Recommended Next Phase

Recommended next phase:

Proceed only after ChatGPT Architect approval.

Likely next options:

- Phase 3T report acceptance.
- Runtime secrets handling planning.
- Local safe test planning for `db:migrate:deploy`.
- Multi-stage Dockerfile planning.
- Nginx/static frontend planning.
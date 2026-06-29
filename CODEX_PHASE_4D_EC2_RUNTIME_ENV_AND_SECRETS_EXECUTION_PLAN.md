# Codex Phase 4D: EC2 Runtime Env And Secrets Execution Plan

## 1. Phase Name And Purpose

Phase 4D: EC2 Runtime Env And Secrets Execution Plan

Purpose:

Plan exactly how the future EC2 server-local production env file and runtime secrets should be created, protected, validated, and used during deployment.

This is a planning-only phase.

No real env files, real secrets, Docker files, Compose files, GitHub Actions, Prisma migrations, databases, or `.env` files were created or modified.

## 2. Future EC2 Env File Purpose

The future EC2 production env file will provide runtime configuration to the deployed app without committing secrets to the repository.

Its purpose is to hold production-only values needed by `docker-compose.prod.yml`, including the RDS database connection string, app runtime settings, frontend/API origin config, and optional OpenAI configuration.

The env file should be:

- Stored only on the EC2 host.
- Kept outside the repo working tree.
- Protected with restrictive permissions.
- Used by Docker Compose at runtime.
- Validated without printing secret values.

## 3. Accepted Env File Path

Accepted future EC2 env file path:

```text
/opt/crm-modern/env/production.env
```

This path keeps the production env file outside the application repo, such as:

```text
/opt/crm-modern/app
```

The env file must not be committed or copied into the repo.

## 4. Variables To Include

Future `production.env` should include:

```text
DATABASE_URL=<production-rds-database-url>
CLIENT_ORIGIN=<public-frontend-origin>
AI_PROVIDER=<local-or-openai>
OPENAI_MODEL=<model-name>
OPENAI_API_KEY=<openai-api-key-if-needed>
PORT=<container-api-port>
HOST_API_PORT=<host-api-port-if-needed>
```

Notes:

- Use placeholders in documentation only.
- Do not paste or document real values.
- `OPENAI_API_KEY` may be blank only if the approved production AI configuration allows local/mock AI behavior.
- `DATABASE_URL` must point to RDS, not local development PostgreSQL.

## 5. Secret Vs Non-Secret Config Classification

Secrets:

- `DATABASE_URL`
- `OPENAI_API_KEY`

Non-secret or lower-sensitivity config:

- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_MODEL`
- `PORT`
- `HOST_API_PORT`

Important:

Even lower-sensitivity config should not be carelessly printed in screenshots if it reveals infrastructure details the user does not want public.

## 6. How The Env Directory/File Should Be Created Later

Future creation should happen only during an approved execution ticket.

Expected directory path:

```text
/opt/crm-modern/env
```

Expected file path:

```text
/opt/crm-modern/env/production.env
```

Future creation should:

- Create the env directory outside the repo.
- Create the `production.env` file only on EC2.
- Avoid echoing secret values into terminal history if possible.
- Avoid printing the file after creation.
- Verify file existence without displaying contents.

Potential future safe check:

```bash
test -f /opt/crm-modern/env/production.env && echo 'PRODUCTION_ENV_EXISTS=yes'
```

Important:

This command is only a future safe check pattern. It should not be run during Phase 4D.

## 7. File Ownership And Permission Expectations

Expected permission posture:

- File should be readable only by the deployment user and/or root.
- File should not be world-readable.
- Directory should not be broadly writable.
- The deployment user should be able to use the file with Docker Compose.
- Env directory/file should be restricted to deployment/admin users.

Future permission pattern may use:

```bash
chmod 700 /opt/crm-modern/env
chmod 600 /opt/crm-modern/env/production.env
```

Important:

Exact commands still require review during execution.

## 8. How Values Should Be Entered Without Exposing Them

Safe value-entry principles:

- Do not paste real secrets into chat.
- Do not include real secrets in reports.
- Do not commit real secrets.
- Do not screenshot real secrets.
- Do not print the env file contents after entry.
- Prefer editing the file directly over commands that expose values in shell history.
- If using terminal editing, close the editor without showing contents in logs/screenshots.
- If using copy/paste on EC2, paste only into the protected file, not into chat.

For `DATABASE_URL`:

- Build it from RDS details only during the approved secrets execution phase.
- Use the correct RDS endpoint, port, database name, username, password, and SSL options.
- Verify only with redacted checks.

## 9. How To Validate The Env File Without Printing Secrets

Safe validation patterns:

- Check that the file exists without printing contents.
- Check that required variable names exist without printing values.
- Use `docker compose config --quiet` instead of plain `docker compose config` when real env files are involved.
- Use redacted scripts/checks that output only `KEY_PRESENT=yes` style results.
- Confirm `DATABASE_URL` points to RDS using non-secret markers only, if possible.

Potential later validation examples:

```bash
test -f /opt/crm-modern/env/production.env && echo 'PRODUCTION_ENV_EXISTS=yes'
```

```bash
grep -q '^DATABASE_URL=' /opt/crm-modern/env/production.env && echo 'DATABASE_URL_PRESENT=yes'
```

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config --quiet
```

Do not use commands that print resolved env values.

## 10. How docker-compose.prod.yml Should Use The Env File Later

Future usage pattern:

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml up -d
```

This usage pattern is not approved to run during Phase 4D.

It is only approved as the future command shape for a later deployment execution phase.

Important:

- The env file provides values for `docker-compose.prod.yml`.
- The Compose file should continue referencing variables rather than hardcoding secrets.
- The env file should remain outside the repo.
- The command should be reviewed before execution.
- Do not use plain config output with real secrets.

## 11. Commands That Are Dangerous Because They Print Secrets

Dangerous command patterns include:

```bash
cat /opt/crm-modern/env/production.env
```

```bash
printenv
```

```bash
env
```

```bash
docker compose --env-file /opt/crm-modern/env/production.env -f docker-compose.prod.yml config
```

```bash
grep DATABASE_URL /opt/crm-modern/env/production.env
```

```bash
echo $DATABASE_URL
```

Why dangerous:

- They may print `DATABASE_URL`.
- They may print `OPENAI_API_KEY`.
- They may expose secrets in terminal logs, screenshots, shell history, or chat.

Safer alternatives:

- Check variable presence without printing values.
- Use `docker compose config --quiet`.
- Use redacted validation output.

## 12. Redacted Evidence Rules

Allowed evidence later:

- `production.env` exists check.
- Required variable presence checks that do not print values.
- File permission output, if it does not reveal secrets.
- `docker compose config --quiet` success.
- API health check after runtime starts.
- Container status output that does not include env values.

Do not capture:

- File contents.
- Full `DATABASE_URL`.
- API keys.
- Passwords.
- Private keys.
- Shell history containing secret commands.
- Plain `docker compose config` output with real env values.
- Any screenshot where secrets are visible.

Evidence should show that the process is safe, not reveal the secret material itself.

## 13. Rollback/Safety Notes If Env Values Are Wrong

If env values are wrong:

- Stop and inspect safely.
- Do not print the env file.
- Do not run migration deploy until `DATABASE_URL` target is verified.
- Do not run `prisma db push`.
- Do not run `prisma migrate dev` against RDS.
- Correct values inside the protected env file only after review.
- Restart only the affected app container if needed.
- Re-run safe validation checks.
- Keep RDS data safe; do not reset or delete the database.
- If `OPENAI_API_KEY` is missing and `AI_PROVIDER=openai`, decide whether to fail fast or switch to approved local/mock behavior.
- If `DATABASE_URL` points to the wrong target, do not continue until corrected.

Critical safety rule:

Before any future migration deploy, confirm the env file points to the intended RDS database without exposing the full connection string.

## 14. Boundaries Respected

Boundaries respected during Phase 4D:

- No real env files were created.
- No real secrets were created or edited.
- `.env` was not modified.
- No secrets were exposed.
- No secret values were requested.
- No full real `DATABASE_URL` was requested or documented.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands that print resolved secrets were run.
- No Prisma migration commands were run.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
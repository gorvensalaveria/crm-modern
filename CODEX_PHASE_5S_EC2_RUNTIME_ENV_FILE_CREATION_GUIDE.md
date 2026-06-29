# Codex Phase 5S: EC2 Runtime Env File Creation Guide

## 1. Phase Name And Purpose

Phase 5S: EC2 Runtime Env File Creation Guide

Purpose:

Prepare the exact safe steps for creating the production server-local runtime env file on EC2.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. No env file was created. No AWS resources, security groups, Cloudflare records, Elastic IPs, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployments, databases, or `.env` files were created or modified.

## 2. Target Env File Path

Target future EC2 runtime env file:

```text
/opt/crm-modern/env/production.env
```

Purpose:

- Store production runtime configuration on the EC2 server.
- Keep secrets outside the repository.
- Provide runtime values for future Docker Compose and application execution phases.
- Avoid committing or exposing production secrets.

This file must not be created until an approved execution phase.

## 3. Required Ownership And Permissions

Parent directory:

```text
/opt/crm-modern/env
```

Required parent directory permission:

```text
700
```

Target file owner:

```text
ubuntu:ubuntu
```

Target file permission:

```text
600
```

Reason:

- `700` on the parent env directory restricts directory access.
- `600` on the env file restricts file reads/writes to the owner.
- `ubuntu:ubuntu` matches the current deployment operator user on the EC2 host.

## 4. Safe Creation/Editing Over SSH

Safe future editing approach:

- SSH to EC2 using the approved SSH process.
- Open `/opt/crm-modern/env/production.env` with a terminal editor.
- Enter values locally on the EC2 terminal.
- Save the file without copying values into chat, screenshots, reports, or the repository.

Acceptable future local-only editor shapes:

```bash
nano /opt/crm-modern/env/production.env
```

or:

```bash
vim /opt/crm-modern/env/production.env
```

Safe handling rules:

- Avoid pasting secrets into chat.
- Avoid screenshots showing secrets.
- Avoid terminal scrollback screenshots that reveal secrets.
- Use local-only input for secret values.
- Do not store the env file inside `/opt/crm-modern/app`.
- Do not place env files in any future Nginx web root.

If a heredoc is considered later, it must remain local-only and must not be copied into chat or reports if it contains real values.

## 5. Required Env Keys Using Placeholders Only

Required production runtime keys:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://crmadmin:<DB_PASSWORD>@<RDS_ENDPOINT>:5432/crm_modern_prod?schema=public
```

Additional app/runtime config keys from prior planning, using placeholders only:

```env
CLIENT_ORIGIN=<PUBLIC_CLIENT_ORIGIN>
AI_PROVIDER=<AI_PROVIDER>
OPENAI_MODEL=<OPENAI_MODEL>
OPENAI_API_KEY=<OPENAI_API_KEY_IF_NEEDED>
HOST_API_PORT=<HOST_API_PORT>
```

Notes:

- `DATABASE_URL` is secret.
- `OPENAI_API_KEY`, if used, is secret.
- `CLIENT_ORIGIN`, `AI_PROVIDER`, `OPENAI_MODEL`, `PORT`, and `HOST_API_PORT` are lower-sensitivity config, but still should not be casually exposed in screenshots.
- Do not include real values in this guide.
- Do not paste the real env file into chat.

## 6. Safe RDS Endpoint Retrieval

Future RDS endpoint retrieval:

1. Open AWS Console.
2. Go to RDS.
3. Select:
   ```text
   crm-modern-prod-rds-postgres
   ```
4. Find the endpoint in the RDS connectivity/details section.
5. Use the endpoint locally while editing `/opt/crm-modern/env/production.env`.

Safety rules:

- Do not paste a full connection string into chat.
- Do not include full `DATABASE_URL` in reports.
- Handle the endpoint carefully.
- Redact the endpoint in reports if needed.
- Do not screenshot any panel that also shows secrets or credentials.

Documentation placeholder:

```text
<RDS_ENDPOINT>
```

## 7. Database Password Handling

Database password rules:

- Database password is local-only.
- Never paste the password into chat.
- Never screenshot the password.
- Never store the password in the repo.
- Never include the password in Markdown reports.
- Never include the password in `.env`.
- Enter the password only locally on EC2 while editing:
  ```text
  /opt/crm-modern/env/production.env
  ```

The final future value will be part of `DATABASE_URL`, which must remain secret.

Do not ask Codex or ChatGPT to reconstruct the full real `DATABASE_URL`.

## 8. Safe Verification Commands

Future file listing check:

```bash
ls -l /opt/crm-modern/env/production.env
```

Purpose:

- Confirms the env file exists.
- Shows ownership and basic permissions.
- Does not print env values.

Future permission/ownership check:

```bash
stat -c "%a %U:%G %n" /opt/crm-modern/env/production.env
```

Expected future result shape:

```text
600 ubuntu:ubuntu /opt/crm-modern/env/production.env
```

Future key-name-only check shape:

```bash
grep -E '^[A-Z0-9_]+=' /opt/crm-modern/env/production.env | cut -d= -f1
```

Purpose:

- Shows only env key names.
- Does not print values.

Expected future key names may include:

```text
NODE_ENV
PORT
DATABASE_URL
CLIENT_ORIGIN
AI_PROVIDER
OPENAI_MODEL
OPENAI_API_KEY
HOST_API_PORT
```

Use key-name-only checks, not value printing.

## 9. Commands To Avoid

Avoid commands that print secrets, including:

```bash
cat /opt/crm-modern/env/production.env
```

```bash
grep DATABASE_URL /opt/crm-modern/env/production.env
```

```bash
printenv
```

```bash
env
```

```bash
echo $DATABASE_URL
```

Also avoid:

- Pasting env contents into chat.
- Copying env contents into reports.
- Committing the env file.
- Moving the env file into the repo.
- Placing the env file in a web-served directory.
- Running plain Docker Compose config commands that print resolved secrets.

## 10. Stop Conditions

Stop immediately if:

- Password appears in chat.
- Password appears in a screenshot.
- `DATABASE_URL` appears in chat.
- `DATABASE_URL` appears in a screenshot.
- Env file contents are pasted into chat.
- Env file has wrong permissions.
- Env file owner is not `ubuntu:ubuntu`.
- User is unsure about the RDS endpoint.
- User is unsure about the database password.
- Any command would expose secrets.
- Any command would print env values.
- Any command would commit or copy the env file into the repo.
- Any command would run migrations.
- Any command would deploy the app.

## 11. Evidence Rules

Safe to document:

- Env file path:
  ```text
  /opt/crm-modern/env/production.env
  ```
- Parent directory permission:
  ```text
  700
  ```
- File permission:
  ```text
  600
  ```
- File owner:
  ```text
  ubuntu:ubuntu
  ```
- Key names only.

Do not document:

- Secret values.
- Database password.
- Full `DATABASE_URL`.
- Full RDS endpoint unless redacted.
- EC2 public IP/DNS.
- User public IP.
- Private key material.
- Env file contents.
- Screenshots showing real env values.

## 12. Boundaries Respected

Boundaries respected during Phase 5S:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
- The env file was not created.
- AWS resources were not created or modified.
- Security groups were not modified.
- Cloudflare records were not created or modified.
- Elastic IPs were not allocated.
- Real secrets were not created or edited.
- Database password was not requested.
- Private key contents were not requested.
- Secrets were not exposed.
- The user’s public IP was not exposed.
- EC2 public IP/DNS was not exposed.
- Private key material was not exposed.
- Full RDS endpoint was not exposed.
- Full `DATABASE_URL` was not exposed.
- `.env` was not modified.
- Dockerfile was not modified.
- Compose files were not modified.
- Frontend files were not modified.
- Nginx config was not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No Nginx commands were run.
- No Prisma migration commands were run.
- No deployment was performed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.

# Codex Phase 5G: RDS PostgreSQL Creation Execution Guide

## 1. Phase Name And Purpose

Phase 5G: RDS PostgreSQL Creation Execution Guide

Purpose:

Prepare the exact guided AWS Console steps for creating the production Amazon RDS PostgreSQL database safely in `ap-southeast-1`.

This is an execution guide only.

No RDS database, AWS resources, security groups, Cloudflare records, Elastic IPs, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployment resources, databases, or `.env` files were created or modified.

## 2. Low-Cost RDS PostgreSQL Settings

Future RDS settings should use a low-cost portfolio deployment posture.

Accepted settings:

```text
Engine: PostgreSQL
Deployment: Single-AZ
DB instance class: small/low-cost class suitable for demo traffic
Storage: modest general-purpose SSD storage
Public access: No
VPC: vpc-0ac320d3ccf43ae09
Security group: crm-modern-prod-rds-sg
Production PostgreSQL location: Amazon RDS only, not Docker on EC2
```

Recommended posture:

- Keep the database simple for the first portfolio deployment.
- Avoid Multi-AZ for the first portfolio deployment unless cost/risk needs change.
- Avoid oversized instance classes.
- Avoid excessive storage allocation.
- Confirm pricing before final creation.
- Do not run migrations during RDS creation.

## 3. Database Identifier/Name Direction

Accepted RDS identifier:

```text
crm-modern-prod-rds-postgres
```

Accepted initial database name:

```text
crm_modern_prod
```

Accepted non-secret master username:

```text
crmadmin
```

Notes:

- The database name is not a password.
- The username is not a password, but should still be documented carefully.
- Do not ask for or document the database password.
- The final password should be generated or entered only in AWS Console by the user.

## 4. Credential Handling

Credential rules:

- Database password must be generated or entered only in AWS Console by the user.
- Do not paste the password into chat.
- Do not screenshot the password.
- Do not store the password in the repo.
- Do not put the password in any Markdown report.
- Do not put the password in `.env`.
- The password will later be used only to construct the EC2 server-local env file:
  ```text
  /opt/crm-modern/env/production.env
  ```

The production `DATABASE_URL` will be created later in a separate approved runtime/secrets execution phase.

## 5. Networking/Security Choices

Accepted networking/security choices:

```text
Region: ap-southeast-1
VPC: vpc-0ac320d3ccf43ae09
Public access: No
Security group: crm-modern-prod-rds-sg
```

Security expectations:

- RDS must not be publicly accessible.
- RDS PostgreSQL must not allow `0.0.0.0/0`.
- RDS PostgreSQL must not allow the user’s public IP.
- RDS PostgreSQL should accept traffic only from:
  ```text
  crm-modern-prod-ec2-sg
  ```

This security group relationship has already been created in the security group phase.

## 6. Backup/Snapshot/Deletion-Protection Posture

Recommended portfolio posture:

- Enable automated backups if cost is acceptable.
- Use a modest backup retention period.
- Consider creating a manual snapshot before any future migration deploy.
- Deletion protection may be enabled if the user wants extra safety, but it can make cleanup more deliberate.
- If deletion protection is disabled for easier cleanup, deletion must still happen only through an approved cleanup ticket.

Recommended decision posture:

- Use simple backup settings with cost awareness.
- Review backup retention and snapshot cost before final create.
- Do not run migrations during RDS creation.
- Do not run seed during RDS creation.

## 7. Review Checkpoints Before Final `Create Database`

Before clicking final `Create database`, verify:

- Region is `ap-southeast-1`.
- Engine is PostgreSQL.
- Deployment is Single-AZ.
- Instance class is small/low-cost and cost-acceptable.
- Storage is modest and cost-acceptable.
- DB identifier is exactly:
  ```text
  crm-modern-prod-rds-postgres
  ```
- Initial database name is:
  ```text
  crm_modern_prod
  ```
- Master username is:
  ```text
  crmadmin
  ```
- Password is not visible in screenshots/chat.
- VPC is exactly:
  ```text
  vpc-0ac320d3ccf43ae09
  ```
- Public access is:
  ```text
  No
  ```
- Security group is:
  ```text
  crm-modern-prod-rds-sg
  ```
- No public PostgreSQL access is configured.
- No migration option is selected or attempted.
- No seed option is selected or attempted.
- Backup/snapshot/deletion-protection choices are understood.
- No unexpected AWS cost/security warning is shown.

## 8. Stop Conditions

Stop immediately if:

- Public access is enabled.
- Region is not `ap-southeast-1`.
- VPC is not `vpc-0ac320d3ccf43ae09`.
- Security group is not `crm-modern-prod-rds-sg`.
- Instance class or storage looks unexpectedly expensive.
- AWS shows an unexpected pricing, cost, or security warning.
- Password appears in a screenshot, chat, or report.
- Any migration option is attempted.
- Any seed option is attempted.
- PostgreSQL appears to be open to public access.
- User is unsure what to click.

## 9. Safe Evidence Checklist After Creation

Safe evidence after creation may include:

- RDS identifier:
  ```text
  crm-modern-prod-rds-postgres
  ```
- Region:
  ```text
  ap-southeast-1
  ```
- Engine: PostgreSQL
- DB status, such as creating or available
- VPC ID:
  ```text
  vpc-0ac320d3ccf43ae09
  ```
- Public access: No
- Security group:
  ```text
  crm-modern-prod-rds-sg
  ```
- Backup retention setting, if visible and safe
- Tags, if applied

Do not capture:

- Database password
- Full RDS connection string
- Full `DATABASE_URL`
- Secret values
- Screenshots showing credentials
- AWS account-sensitive details unless redacted
- User public IP

## 10. Boundaries Respected

Boundaries respected during Phase 5G:

- RDS was not created.
- AWS resources were not created or modified.
- Security groups were not modified.
- Cloudflare records were not created or modified.
- No Elastic IPs were allocated.
- No real env files were created.
- No real secrets were created or edited.
- Database password was not requested.
- No secrets were exposed.
- The user’s public IP was not exposed.
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
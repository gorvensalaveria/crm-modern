# Codex Phase 5D: Security Group Creation Execution Guide

## 1. Phase Name And Purpose

Phase 5D: Security Group Creation Execution Guide

Purpose:

Prepare the exact guided AWS Console steps for creating the EC2 and RDS security groups safely in `ap-southeast-1`.

This is an execution guide only.

No AWS security groups, AWS resources, Cloudflare records, Elastic IPs, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployment resources, databases, or `.env` files were created or modified.

## 2. Guide For Creating `crm-modern-prod-ec2-sg`

Future AWS Console steps:

1. Open AWS Console.
2. Confirm the selected region is:
   ```text
   ap-southeast-1
   ```
3. Go to:
   ```text
   VPC -> Security Groups
   ```
4. Choose:
   ```text
   Create security group
   ```
5. Set security group name:
   ```text
   crm-modern-prod-ec2-sg
   ```
6. Set description:
   ```text
   Security group for CRM Modern production EC2 host
   ```
7. Select the intended VPC.
8. Add inbound rules only as approved.
9. Keep outbound as allow outbound.
10. Add tags.
11. Review all rules before clicking create.

Important later execution note:

For the first actual security group creation step, it may be safer to create the EC2 security group with only SSH first, then add HTTP/HTTPS later when the Nginx/SSL phases need them. This keeps exposure minimal.

Future EC2 security group inbound rules:

SSH:

```text
Type: SSH
Protocol: TCP
Port: 22
Source: <user-approved-public-ip>/32
```

Important:

`<user-approved-public-ip>/32` is a future execution-time value.

Do not ask for it in this execution guide.

HTTP rule, only when Nginx/HTTP validation is needed:

```text
Type: HTTP
Protocol: TCP
Port: 80
Source: 0.0.0.0/0
```

HTTPS rule, only when SSL/HTTPS validation is needed:

```text
Type: HTTPS
Protocol: TCP
Port: 443
Source: 0.0.0.0/0
```

Temporary API/app port:

```text
Do not add unless separately approved.
```

## 3. Guide For Creating `crm-modern-prod-rds-sg`

Future AWS Console steps:

1. Open AWS Console.
2. Confirm the selected region is:
   ```text
   ap-southeast-1
   ```
3. Go to:
   ```text
   VPC -> Security Groups
   ```
4. Choose:
   ```text
   Create security group
   ```
5. Set security group name:
   ```text
   crm-modern-prod-rds-sg
   ```
6. Set description:
   ```text
   Security group for CRM Modern production RDS PostgreSQL
   ```
7. Select the same intended VPC as the EC2 security group.
8. Add inbound PostgreSQL rule with EC2 security group as source.
9. Keep outbound default/no broad custom outbound unless AWS requires otherwise.
10. Add tags.
11. Review all rules before clicking create.

Future RDS security group inbound rule:

```text
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: crm-modern-prod-ec2-sg
```

Important:

The source must be the EC2 security group, not `0.0.0.0/0`, not a public CIDR, and not the user’s public IP.

## 4. Exact Intended Inbound Rules

EC2 security group:

```text
Name: crm-modern-prod-ec2-sg

Inbound:
- SSH, TCP 22, Source <user-approved-public-ip>/32
- HTTP, TCP 80, Source 0.0.0.0/0, only when needed
- HTTPS, TCP 443, Source 0.0.0.0/0, only when needed
- No temporary API/app port unless separately approved
```

RDS security group:

```text
Name: crm-modern-prod-rds-sg

Inbound:
- PostgreSQL, TCP 5432, Source crm-modern-prod-ec2-sg
```

## 5. Outbound Rules

EC2 security group:

```text
Outbound: allow outbound traffic
```

RDS security group:

```text
Outbound: keep default/no broad custom outbound unless AWS requires it
```

Do not add custom broad outbound rules without a reason.

## 6. Tags To Apply

Tags for `crm-modern-prod-ec2-sg`:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=ec2-security-group
ManagedBy=manual-learning
```

Tags for `crm-modern-prod-rds-sg`:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=rds-security-group
ManagedBy=manual-learning
```

## 7. Review Checkpoints Before Final Create/Save

Before creating `crm-modern-prod-ec2-sg`, verify:

- Region is `ap-southeast-1`.
- Name is exactly `crm-modern-prod-ec2-sg`.
- VPC is the intended VPC.
- SSH source is `<user-approved-public-ip>/32`.
- SSH source is not `0.0.0.0/0`.
- HTTP `80` is included only when needed.
- HTTPS `443` is included only when needed.
- No temporary API port is included unless separately approved.
- Tags are present and correct.

Before creating `crm-modern-prod-rds-sg`, verify:

- Region is `ap-southeast-1`.
- Name is exactly `crm-modern-prod-rds-sg`.
- VPC matches the EC2 security group VPC.
- PostgreSQL port is `5432`.
- PostgreSQL source is `crm-modern-prod-ec2-sg`.
- PostgreSQL source is not `0.0.0.0/0`.
- PostgreSQL source is not a public CIDR.
- Tags are present and correct.

## 8. Stop Conditions

Stop immediately if:

- Region is not `ap-southeast-1`.
- SSH source is `0.0.0.0/0`.
- RDS source is a public CIDR.
- PostgreSQL `5432` source is `0.0.0.0/0`.
- Wrong security group is selected as RDS source.
- EC2 and RDS security groups are in different VPCs.
- AWS shows an unexpected warning.
- AWS shows an unexpected cost/security prompt.
- Temporary API port is being added without separate approval.
- Security group name does not match the approved name.
- Tags are missing or unclear.

## 9. Safe Evidence Checklist After Creation

Safe evidence later may include screenshots showing:

- AWS region `ap-southeast-1`.
- Security group names.
- Tags.
- EC2 security group inbound summary.
- RDS security group inbound summary.
- RDS PostgreSQL source showing `crm-modern-prod-ec2-sg`.
- HTTP/HTTPS rules only if approved and present.

Redact if desired:

- User public IP in SSH rule.
- AWS account ID.
- Any unrelated resource identifiers.

Never capture:

- Secret values.
- Private keys.
- Credentials.
- Full env file contents.
- Full `DATABASE_URL`.

## 10. Boundaries Respected

Boundaries respected during Phase 5D:

- AWS security groups were not created.
- AWS security groups were not modified.
- No AWS resources were created.
- Cloudflare records were not created or modified.
- No Elastic IPs were allocated.
- No real env files were created.
- No real secrets were created or edited.
- No secret values were requested.
- The user’s current public IP was not requested.
- No secrets were exposed.
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
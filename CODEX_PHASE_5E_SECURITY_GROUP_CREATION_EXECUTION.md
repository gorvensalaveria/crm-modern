# Codex Phase 5E: Security Group Creation Execution

## 1. Phase Name And Purpose

Phase 5E: Security Group Creation Execution

Purpose:

Document the completed manual AWS Console execution for creating the approved EC2 and RDS security groups.

This was an AWS Console execution phase performed manually by the user.

No secrets, public IP values, screenshots, env files, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Prisma migrations, deployments, databases, or `.env` files were created or modified by Codex.

## 2. Region And VPC

Execution region:

```text
ap-southeast-1
```

VPC used:

```text
vpc-0ac320d3ccf43ae09
```

Both security groups were created in the same VPC.

## 3. EC2 Security Group Created

Created security group:

```text
crm-modern-prod-ec2-sg
```

Purpose:

```text
EC2/Nginx/API host security group
```

Inbound rules:

```text
SSH TCP 22 from user-approved /32 public IP only
```

Not added:

- No HTTP `80`
- No HTTPS `443`
- No temporary API port

Outbound:

```text
Allow outbound traffic
```

Tags verified:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=ec2-security-group
ManagedBy=manual-learning
```

## 4. RDS Security Group Created

Created security group:

```text
crm-modern-prod-rds-sg
```

Purpose:

```text
RDS PostgreSQL security group
```

Inbound rules:

```text
PostgreSQL TCP 5432
Source: crm-modern-prod-ec2-sg
```

The PostgreSQL rule is:

- Not public
- Not `0.0.0.0/0`
- Not the user public IP

Outbound:

```text
Default/allow outbound as AWS created
```

Tags verified:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=rds-security-group
ManagedBy=manual-learning
```

## 5. Manual AWS Console Execution Flow

The user manually created the security groups through the AWS Console.

Execution followed the approved order:

1. Confirmed region `ap-southeast-1`.
2. Created the EC2 security group first.
3. Added only the approved SSH inbound rule.
4. Verified no HTTP, HTTPS, or temporary API port was added.
5. Added approved EC2 security group tags.
6. Created the RDS security group second.
7. Added PostgreSQL inbound access from the EC2 security group.
8. Verified PostgreSQL access was not public.
9. Added approved RDS security group tags.

## 6. Review Gates Followed

Review gates followed:

- Region confirmed before creation.
- VPC confirmed before creation.
- EC2 security group name matched the approved value.
- RDS security group name matched the approved value.
- SSH was restricted to the user-approved `/32` public IP.
- HTTP `80` was not added.
- HTTPS `443` was not added.
- Temporary API port was not added.
- RDS PostgreSQL source was the EC2 security group.
- RDS PostgreSQL source was not public.
- Tags were verified.

## 7. Final Verified Security Group State

Final EC2 security group state:

- `crm-modern-prod-ec2-sg` exists.
- Allows SSH TCP `22` only from user-approved `/32` public IP.
- Does not allow HTTP `80`.
- Does not allow HTTPS `443`.
- Does not allow a temporary API port.
- Allows outbound traffic.
- Approved tags are present.

Final RDS security group state:

- `crm-modern-prod-rds-sg` exists.
- Allows PostgreSQL TCP `5432` from `crm-modern-prod-ec2-sg`.
- Does not allow PostgreSQL from `0.0.0.0/0`.
- Does not allow PostgreSQL from a public CIDR.
- Does not allow PostgreSQL from the user public IP.
- Uses AWS-created default/allow outbound posture.
- Approved tags are present.

## 8. Stop Conditions Avoided

The following stop conditions were avoided:

- Region was not outside `ap-southeast-1`.
- SSH was not opened to `0.0.0.0/0`.
- RDS was not made public.
- PostgreSQL `5432` was not opened to `0.0.0.0/0`.
- PostgreSQL source was not a public CIDR.
- Wrong security group was not selected as the RDS source.
- EC2 and RDS security groups were not created in different VPCs.
- Temporary API port was not added.
- Tags were not missing or unclear.

## 9. Security Outcome

Security outcome:

- EC2 access is limited to SSH from the user-approved `/32` public IP.
- Public HTTP/HTTPS exposure has not started yet.
- Direct public API exposure has not started.
- RDS PostgreSQL is reachable only from the EC2 security group.
- RDS PostgreSQL is not publicly exposed.
- Security group names and tags support future cleanup and evidence capture.

## 10. Boundaries Respected

Boundaries respected during Phase 5E:

- Codex did not create AWS resources.
- Codex did not modify AWS resources.
- No Cloudflare records were created or modified.
- No Elastic IPs were allocated.
- No real env files were created.
- No real secrets were created or edited.
- No secret values were requested.
- The user’s actual public IP was not documented.
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

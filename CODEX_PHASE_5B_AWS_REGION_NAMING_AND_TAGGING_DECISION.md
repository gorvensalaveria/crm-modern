# Codex Phase 5B: AWS Region, Naming, And Tagging Decision

## 1. Phase Name And Purpose

Phase 5B: AWS Region, Naming, And Tagging Decision

Purpose:

Decide the AWS region, resource naming pattern, and tagging values before creating any AWS resources.

This is a decision/planning gate only.

No AWS resources, Cloudflare records, Elastic IPs, security groups, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployment resources, databases, or `.env` files were created or modified.

## 2. Candidate AWS Regions

Accepted candidate regions:

- `ap-southeast-1` Asia Pacific Singapore
- `ap-northeast-1` Asia Pacific Tokyo
- `us-east-1` US East N. Virginia

Practical comparison:

- `ap-southeast-1` is a strong default for a Philippines-based user because it is geographically close, commonly supports EC2 and RDS PostgreSQL, and keeps latency reasonable.
- `ap-northeast-1` is also viable in Asia, but may not be as geographically close as Singapore for this user.
- `us-east-1` is broadly available and often cost-effective, but likely has higher latency from the Philippines.

## 3. Recommended Region And Rationale

Accepted default region:

```text
ap-southeast-1
```

Rationale:

- Best practical default for a Philippines-based user.
- Reasonable latency.
- Common AWS region for Southeast Asia deployments.
- Suitable for keeping EC2 and RDS in the same region.
- Avoids unnecessary cross-region complexity.

Important:

Before creating resources, the user must still verify in the AWS console that the desired EC2 and RDS PostgreSQL instance classes are available and cost-acceptable in `ap-southeast-1`.

## 4. Final Naming Convention

Accepted resource names:

```text
EC2 instance: crm-modern-prod-ec2
RDS instance: crm-modern-prod-rds-postgres
EC2 security group: crm-modern-prod-ec2-sg
RDS security group: crm-modern-prod-rds-sg
Optional Elastic IP: crm-modern-prod-eip
Snapshot/backup pattern: crm-modern-prod-rds-snapshot-YYYYMMDD
```

Recommended snapshot date format:

```text
YYYYMMDD
```

Example placeholder:

```text
crm-modern-prod-rds-snapshot-20260629
```

## 5. Final Tag Values

Accepted tag values:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=<resource-purpose>
ManagedBy=manual-learning
```

Accepted purpose examples:

```text
Purpose=api-host
Purpose=postgres
Purpose=ec2-security-group
Purpose=rds-security-group
Purpose=elastic-ip
Purpose=rds-snapshot
```

## 6. Why Naming/Tagging Matters

Consistent naming and tagging matters because it helps:

- Identify resources quickly in the AWS console.
- Avoid confusing portfolio resources with unrelated AWS resources.
- Capture cleaner portfolio evidence.
- Track cost by project/environment.
- Clean up resources safely later.
- Reduce the risk of deleting or modifying the wrong resource.

## 7. Stop Conditions Before AWS Creation

Stop before creating AWS resources if:

- Region choice is uncertain.
- Resource names are unclear.
- Owner/tag value is unclear.
- AWS shows unexpected pricing or cost warnings.
- Desired EC2 or RDS class is unavailable.
- Security group purpose is unclear.
- Any setting would create resources outside `ap-southeast-1`.
- Any step exceeds the approved ticket scope.

## 8. Boundaries Respected

Boundaries respected during Phase 5B:

- No AWS resources were created.
- Cloudflare records were not created or modified.
- No Elastic IPs were allocated.
- No security groups were changed.
- No real env files were created.
- No real secrets were created or edited.
- No secret values were requested.
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
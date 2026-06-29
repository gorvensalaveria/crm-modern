# Codex Phase 5J: EC2 Instance Creation Execution Guide

## 1. Phase Name And Purpose

Phase 5J: EC2 Instance Creation Execution Guide

Purpose:

Prepare the exact guided AWS Console steps for creating the production EC2 instance safely in `ap-southeast-1`.

This is an execution guide only.

No EC2 instance, AWS resources, security groups, Cloudflare records, Elastic IPs, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployment resources, databases, or `.env` files were created or modified.

## 2. Final Preferred EC2 Launch Settings

Accepted target EC2:

```text
Instance name: crm-modern-prod-ec2
Region: ap-southeast-1
AMI: Ubuntu Server LTS
Instance type: t3.micro
Root storage: gp3, 30 GiB
VPC: vpc-0ac320d3ccf43ae09
Security group: crm-modern-prod-ec2-sg
```

Purpose:

```text
Production host for Docker API container, Nginx reverse proxy, frontend static files, and deployment operations
```

Reason for preferred choices:

- Ubuntu Server LTS is straightforward for Docker, Nginx, Certbot, and common DevOps tutorials.
- `t3.micro` is x86_64 and simpler for Docker builds than ARM-based `t4g.micro`.
- `gp3` 30 GiB root storage gives modest room for OS packages, Docker images, Docker build cache, app files, frontend build output, and logs.

## 3. Network/VPC/Subnet/Public IP Choices

Network choices:

```text
Region: ap-southeast-1
VPC: vpc-0ac320d3ccf43ae09
Security group: crm-modern-prod-ec2-sg
```

Subnet:

- Select a subnet in `vpc-0ac320d3ccf43ae09`.
- Use a public subnet if the instance needs direct SSH access and later HTTP/HTTPS access.
- Ensure the EC2 instance and RDS database are in the same VPC.

Public IP behavior:

- EC2 may use auto-assigned public IPv4 for initial SSH access.
- Do not allocate an Elastic IP during this phase.
- Elastic IP can be planned later if stable DNS/IP behavior is required.

## 4. Security Group And SSH Posture

Use existing security group:

```text
crm-modern-prod-ec2-sg
```

Do not create a new broad/default security group during EC2 launch.

SSH posture:

```text
SSH TCP 22 from user-approved /32 public IP only
```

Do not allow:

```text
SSH TCP 22 from 0.0.0.0/0
```

The user’s public IP should not be pasted into chat or documented in reports.

## 5. Public Web Access Posture

At EC2 creation time:

- Do not add HTTP `80` yet.
- Do not add HTTPS `443` yet.
- Do not add a temporary API port.

Reason:

- This keeps exposure minimal.
- HTTP/HTTPS will be added later only when Nginx/SSL phases explicitly approve them.
- Temporary API port should remain closed unless separately approved.

## 6. Storage Settings

Accepted root storage:

```text
Type: gp3
Size: 30 GiB
```

Reason:

- Provides modest room for Ubuntu, Docker, app files, build output, and logs.
- Avoids very small root volume issues during Docker builds.
- Stays within a cost-conscious portfolio posture.

Stop if AWS shows unexpected storage pricing or a larger-than-approved storage configuration.

## 7. Key Pair Safety

Key pair safety rules:

- User may create or select an AWS key pair in the EC2 launch flow.
- If creating a new key pair, user downloads and stores the private key locally.
- Private key must never be pasted into chat.
- Private key must never be committed.
- Private key must never be screenshotted.
- Private key must never be included in reports.
- Private key material must not be exposed.

If the key is lost, access recovery may require a separate approved recovery path.

## 8. Tags

Apply these tags to the EC2 instance:

```text
Name=crm-modern-prod-ec2
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=ec2-host
ManagedBy=manual-learning
```

Tags help with identification, portfolio evidence, billing awareness, and safe cleanup later.

## 9. Review Checkpoints Before Final Launch Instance

Before clicking final `Launch instance`, verify:

- Region is `ap-southeast-1`.
- Instance name is:
  ```text
  crm-modern-prod-ec2
  ```
- AMI is Ubuntu Server LTS.
- Instance type is:
  ```text
  t3.micro
  ```
- Root storage is:
  ```text
  gp3, 30 GiB
  ```
- VPC is:
  ```text
  vpc-0ac320d3ccf43ae09
  ```
- Subnet is in that VPC.
- Public IP behavior is understood.
- Security group selected is:
  ```text
  crm-modern-prod-ec2-sg
  ```
- No new broad/default security group is being used accidentally.
- SSH is not open to `0.0.0.0/0`.
- HTTP `80` is not being added now.
- HTTPS `443` is not being added now.
- Temporary API port is not being added now.
- Tags are present:
  ```text
  Name=crm-modern-prod-ec2
  Project=crm-modern
  Environment=prod
  Owner=gorven
  Purpose=ec2-host
  ManagedBy=manual-learning
  ```
- Private key material is not shown in chat or screenshots.
- No unexpected AWS cost/security warning is shown.

## 10. Stop Conditions

Stop immediately if:

- Region is not `ap-southeast-1`.
- VPC is not `vpc-0ac320d3ccf43ae09`.
- Security group is not `crm-modern-prod-ec2-sg`.
- SSH is open to `0.0.0.0/0`.
- HTTP/HTTPS is being added without explicit later approval.
- Temporary API port is being added.
- Instance type is not `t3.micro` unless separately approved.
- Storage differs from `gp3, 30 GiB` unless separately approved.
- Instance type appears unexpectedly expensive.
- Storage appears unexpectedly expensive.
- A private key is exposed.
- AWS shows an unexpected warning.
- User is unsure what to click.
- Any value differs from the approved plan.

## 11. Safe Evidence Checklist After EC2 Creation

Safe evidence after EC2 creation may include:

- EC2 instance name:
  ```text
  crm-modern-prod-ec2
  ```
- Region:
  ```text
  ap-southeast-1
  ```
- Instance state, such as pending or running.
- AMI family/name, if no sensitive data is shown.
- Instance type:
  ```text
  t3.micro
  ```
- Storage size/type:
  ```text
  gp3, 30 GiB
  ```
- VPC ID:
  ```text
  vpc-0ac320d3ccf43ae09
  ```
- Security group:
  ```text
  crm-modern-prod-ec2-sg
  ```
- Tags.
- Public IPv4, only if the user is comfortable showing it or it is redacted.

Do not capture:

- Private key contents.
- SSH private key filename/location if sensitive.
- User public IP if the user wants it redacted.
- AWS account-sensitive details unless redacted.
- Secret values.
- Env file contents.
- Database password.
- Full `DATABASE_URL`.

## 12. Boundaries Respected

Boundaries respected during Phase 5J:

- EC2 was not created.
- AWS resources were not created or modified.
- Security groups were not modified.
- Cloudflare records were not created or modified.
- Elastic IPs were not allocated.
- Real env files were not created.
- Real secrets were not created or edited.
- Database password was not requested.
- Private key contents were not requested.
- Secrets were not exposed.
- The user’s public IP was not exposed.
- Private key material was not exposed.
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

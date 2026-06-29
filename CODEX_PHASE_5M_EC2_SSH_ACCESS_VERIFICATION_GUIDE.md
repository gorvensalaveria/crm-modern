# Codex Phase 5M: EC2 SSH Access Verification Guide

## 1. Phase Name And Purpose

Phase 5M: EC2 SSH Access Verification Guide

Purpose:

Prepare the exact safe steps for verifying SSH access to the newly created EC2 instance.

This is a guide-only phase.

No SSH connection was attempted. No AWS resources, security groups, Cloudflare records, Elastic IPs, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployments, databases, or `.env` files were created or modified.

## 2. Safely Find The EC2 Public IPv4 DNS Or Address

In AWS Console:

1. Open the EC2 service.
2. Confirm the region is:
   ```text
   ap-southeast-1
   ```
3. Open `Instances`.
4. Select:
   ```text
   crm-modern-prod-ec2
   ```
5. In the instance details panel, locate either:
   ```text
   Public IPv4 DNS
   Public IPv4 address
   ```

Safety rules:

- Use the public IPv4 DNS or address locally for SSH only.
- Do not paste the real public DNS/IP into chat unless explicitly approved.
- Do not include the real public DNS/IP in reports unless intentionally redacted.
- For documentation, use placeholders such as:
  ```text
  <ec2-public-dns>
  <ec2-public-ip>
  ```

## 3. Safely Use The Downloaded Private Key

The selected key pair is:

```text
crm-modern-prod-key
```

Private key safety rules:

- Keep the downloaded private key only on the local machine.
- Do not paste private key contents into chat.
- Do not screenshot private key contents.
- Do not commit the private key.
- Do not store the private key inside the project repository.
- Do not include the real private key file path in reports if the path is sensitive.
- Use a placeholder in documentation:
  ```text
  /path/to/private-key.pem
  ```

## 4. Ubuntu AMI SSH Username

For Ubuntu Server LTS AMIs, the expected SSH username is:

```text
ubuntu
```

Use `ubuntu`, not `ec2-user`, for this instance.

## 5. Local Private Key Permission Guidance

Before SSH, the private key file should have restrictive permissions.

Future command shape:

```bash
chmod 400 /path/to/private-key.pem
```

What it does:

- Restricts the private key so only the local user can read it.
- Prevents SSH from rejecting the key because it is too open.

What success looks like:

- The command exits without output.
- SSH no longer complains that the key file permissions are too open.

What failure might indicate:

- The file path is wrong.
- The local user does not have permission to modify the file.
- The private key file is not where expected.

Do not paste the real key path into chat if it reveals sensitive local details.

## 6. SSH Command Template Using Placeholders Only

Future SSH command shape:

```bash
ssh -i /path/to/private-key.pem ubuntu@<ec2-public-dns>
```

Alternative placeholder shape:

```bash
ssh -i /path/to/private-key.pem ubuntu@<ec2-public-ip>
```

Do not document the real public DNS/IP unless intentionally redacted.

Do not document the real private key path if it is sensitive.

## 7. First-Login Verification Commands

After a successful SSH login, safe first-login checks may include:

```bash
whoami
```

Expected result:

```text
ubuntu
```

```bash
hostname
```

Expected result:

- The EC2 host name or assigned Linux hostname prints.
- It should not expose secrets.

```bash
lsb_release -a
```

Expected result:

- Ubuntu distribution details print.
- If `lsb_release` is unavailable, use the equivalent:
  ```bash
  cat /etc/os-release
  ```

```bash
uname -a
```

Expected result:

- Linux kernel and architecture details print.

```bash
df -h
```

Expected result:

- Mounted filesystem usage prints.
- Root volume should reflect the expected EC2 root storage posture.

Do not run Docker, Nginx, deployment, env, or Prisma commands during this SSH verification phase.

## 8. SSH Troubleshooting Checklist

If SSH does not work, check:

- EC2 instance state is `Running`.
- EC2 status checks are passed.
- Region is `ap-southeast-1`.
- Correct instance is selected:
  ```text
  crm-modern-prod-ec2
  ```
- Correct SSH username is used:
  ```text
  ubuntu
  ```
- Correct private key is used:
  ```text
  crm-modern-prod-key
  ```
- Private key file permissions are restrictive, such as `chmod 400`.
- Local network/public IP still matches the `/32` source allowed in `crm-modern-prod-ec2-sg`.
- EC2 security group allows SSH `22` from user-approved `/32` public IP.
- SSH is not being attempted with a password.
- The real EC2 public DNS/IP was copied correctly from AWS Console.

Do not broaden SSH access to `0.0.0.0/0` to troubleshoot without separate approval.

## 9. Stop Conditions

Stop immediately if:

- Private key content is exposed.
- User public IP is exposed in a report.
- EC2 public IP/DNS is exposed in a report without intentional redaction.
- SSH prompts for an unexpected password.
- `Permission denied` repeats after checking username, key, permissions, and host.
- Host authenticity warning is misunderstood.
- Troubleshooting appears to require broad SSH access.
- SSH would require opening port `22` to `0.0.0.0/0`.
- User is unsure what to do.
- Any command would modify AWS resources, install software, deploy code, or run migrations.

## 10. Evidence Rules

Safe evidence may include:

- A redacted note that SSH succeeded:
  ```text
  SSH access to crm-modern-prod-ec2 succeeded using ubuntu@<redacted-host>.
  ```
- Output showing:
  ```text
  whoami -> ubuntu
  ```
- Redacted OS/version evidence.
- Redacted filesystem summary if it contains no secrets.

Do not include:

- Public IP/DNS unless intentionally redacted.
- User public IP.
- Private key path if sensitive.
- Private key contents.
- Secrets.
- Env values.
- Database password.
- Full `DATABASE_URL`.
- Full connection strings.
- `.env` contents.
- `/opt/crm-modern/env/production.env` contents.

## 11. Boundaries Respected

Boundaries respected during Phase 5M:

- SSH was not attempted.
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
- EC2 public IP/DNS was not exposed in this report.
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

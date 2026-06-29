# Codex Phase 5P: EC2 Base Server Setup Guide

## 1. Phase Name And Purpose

Phase 5P: EC2 Base Server Setup Guide

Purpose:

Prepare the exact safe steps for the initial EC2 base server setup after SSH access has been verified.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. No AWS resources, security groups, Cloudflare records, Elastic IPs, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployments, databases, or `.env` files were created or modified.

## 2. Safe SSH Session Preparation

Before starting the future EC2 setup session:

- Confirm the EC2 instance is:
  ```text
  crm-modern-prod-ec2
  ```
- Confirm the region is:
  ```text
  ap-southeast-1
  ```
- Confirm SSH access uses the Ubuntu username:
  ```text
  ubuntu
  ```
- Confirm the private key remains local and is not pasted, screenshotted, committed, or documented.
- Confirm the SSH host is taken from AWS Console and is not added to reports unless redacted.
- Confirm no secrets, database passwords, `DATABASE_URL`, or env values are needed for this phase.

Future SSH command shape:

```bash
ssh -i /path/to/private-key.pem ubuntu@<ec2-public-dns>
```

Use placeholders in documentation. Do not document the real public DNS/IP or sensitive private key path.

## 3. Initial OS Verification Commands

Future verification command:

```bash
whoami
```

Purpose:

- Confirms the logged-in Linux user.

Expected result:

```text
ubuntu
```

Future verification command:

```bash
hostname
```

Purpose:

- Confirms the host responds and provides the Linux hostname.

Future verification command:

```bash
lsb_release -a
```

Purpose:

- Confirms Ubuntu distribution details.

Equivalent fallback if `lsb_release` is unavailable:

```bash
cat /etc/os-release
```

Future verification command:

```bash
uname -a
```

Purpose:

- Confirms Linux kernel and architecture details.

Future verification command:

```bash
df -h
```

Purpose:

- Confirms mounted filesystem usage and available disk space.

Stop if disk space is unexpectedly low before installing packages.

## 4. Ubuntu Package Update Steps

Future command:

```bash
sudo apt update
```

What it does:

- Refreshes Ubuntu package metadata.
- Helps ensure package installs use current repository information.

What success looks like:

- Package lists finish reading without fatal errors.

What failure might indicate:

- Temporary network issue.
- Ubuntu repository access issue.
- DNS or outbound connectivity issue from EC2.

Safe upgrade recommendation:

```bash
sudo apt upgrade
```

Use caution:

- Review prompts before accepting.
- Do not approve unexpected removals of critical packages.
- If a reboot is requested, note it and pause for review before rebooting.

## 5. Base Tool Installation

Future command shape:

```bash
sudo apt install -y git curl ca-certificates gnupg
```

Purpose:

- `git`: needed later to clone or update the app repository.
- `curl`: needed for safe HTTP checks and installation steps.
- `ca-certificates`: needed for TLS trust.
- `gnupg`: needed for package signing keys.

Optional future command if firewall management is approved:

```bash
sudo apt install -y ufw
```

Note:

- `ufw` is optional.
- AWS security groups remain the primary network boundary.
- Do not enable or change firewall rules without a later approved phase.

## 6. Docker Engine Installation Plan For Ubuntu

Future Docker installation should use Docker's official Ubuntu repository process.

High-level future steps:

1. Install prerequisite packages.
2. Add Docker's official GPG key.
3. Add Docker's official apt repository.
4. Install Docker Engine packages.
5. Verify Docker service is available.

Future package install shape after Docker repository is configured:

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Stop if:

- The install source is unclear.
- Package signing key setup fails.
- Docker repository setup fails.
- AWS/Ubuntu prompts ask for unexpected secrets.
- Disk space is too low.

## 7. Docker Compose Plugin Installation And Verification

Docker Compose should be installed as the Docker Compose plugin:

```text
docker compose
```

Not the legacy standalone command:

```text
docker-compose
```

Future verification command:

```bash
docker compose version
```

What success looks like:

- A Docker Compose version is printed.

What failure might indicate:

- Docker Compose plugin was not installed.
- Docker installation is incomplete.
- Current shell session needs permissions refresh.

## 8. Add Ubuntu User To Docker Group

Future command:

```bash
sudo usermod -aG docker ubuntu
```

What it does:

- Adds the `ubuntu` user to the `docker` group.
- Allows Docker commands without `sudo` after a fresh login.

Important note:

- The user must log out and log back in for the group membership to apply.
- Until then, Docker may still require `sudo`.

Future group check:

```bash
groups
```

Expected after re-login:

```text
docker
```

## 9. Verification Commands

Future Docker version check:

```bash
docker --version
```

Purpose:

- Confirms Docker CLI is installed.

Future Docker Compose version check:

```bash
docker compose version
```

Purpose:

- Confirms Docker Compose plugin is installed.

Future Docker runtime test:

```bash
docker run hello-world
```

Purpose:

- Confirms Docker can pull and run a test container.

What success looks like:

- Docker prints the hello-world success message.

What failure might indicate:

- Docker daemon is not running.
- User permissions are not refreshed.
- Outbound network access is blocked.
- Docker installation failed.

## 10. Directory Layout Plan

Future app directory layout:

```text
/opt/crm-modern
/opt/crm-modern/app
/opt/crm-modern/env
/opt/crm-modern/logs
```

Purpose:

- `/opt/crm-modern`: top-level deployment directory.
- `/opt/crm-modern/app`: future app repository or deployment copy.
- `/opt/crm-modern/env`: future server-local env files.
- `/opt/crm-modern/logs`: future app or operational logs if needed.

Do not create the production env file in this phase.

## 11. Permissions/Ownership Plan

Future directory creation command shape:

```bash
sudo mkdir -p /opt/crm-modern/app /opt/crm-modern/env /opt/crm-modern/logs
```

Future ownership command shape:

```bash
sudo chown -R ubuntu:ubuntu /opt/crm-modern
```

Future restrictive env directory permission shape:

```bash
chmod 700 /opt/crm-modern/env
```

Notes:

- The `ubuntu` user should be able to manage the app deployment directory.
- The env directory should be restricted because it will later hold production runtime configuration.
- Do not create `/opt/crm-modern/env/production.env` in this phase.
- Do not place secrets in `/opt/crm-modern/app` or any web-served directory.

## 12. What Should Not Be Installed Or Done Yet

Do not do the following in Phase 5P:

- No Nginx config.
- No Certbot.
- No app deployment.
- No production env file.
- No database migration.
- No Docker Compose app startup.
- No RDS connection attempts.
- No Prisma commands.
- No Cloudflare changes.
- No HTTP/HTTPS security group changes.
- No temporary API port.

These belong to later approved phases.

## 13. Stop Conditions

Stop immediately if:

- A command asks for secrets.
- A command would expose secrets.
- Any private key material appears in terminal, screenshots, chat, or reports.
- Any public IP/DNS must be documented without redaction.
- Package update shows unexpected errors.
- Package upgrade proposes surprising removals.
- Docker install fails.
- Docker service does not start.
- Disk space is unexpectedly low.
- The user is unsure what to do.
- Any command would modify AWS resources or security groups.
- Any command would deploy the app.
- Any command would create a production env file.
- Any command would run migrations.

## 14. Evidence Rules

Safe to document:

- Ubuntu version output with no host/IP secrets.
- Docker version.
- Docker Compose version.
- `hello-world` success summary.
- Directory creation summary.
- Redacted confirmation that `/opt/crm-modern` layout exists.

Do not include:

- EC2 public IP/DNS.
- User public IP.
- Private key details.
- Private key path if sensitive.
- Secret values.
- Env values.
- Database password.
- Full `DATABASE_URL`.
- Full connection strings.
- `.env` contents.
- `/opt/crm-modern/env/production.env` contents.

## 15. Boundaries Respected

Boundaries respected during Phase 5P:

- This was guide only.
- SSH was not attempted.
- Commands were not run.
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

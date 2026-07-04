# Codex Phase 5AS: Elastic IP Allocation + Association Guide

## 1. Phase Name And Purpose

Phase 5AS: Elastic IP Allocation + Association Guide

Purpose:

Prepare the exact safe guide for allocating an Elastic IP and associating it with `crm-modern-prod-ec2`, then verifying public HTTP still works through the stable IP before DNS.

This is a guide-only phase.

No SSH connection was attempted. No commands were run. AWS resources were not modified. Elastic IP was not allocated or associated. Security groups were not modified. Cloudflare/DNS was not configured. Nginx files were not edited. HTTPS/Certbot was not configured. Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Current Public HTTP State

Current live state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
EC2 security group: crm-modern-prod-ec2-sg
```

API container state:

```text
Container name: app-api-1
Image: crm-modern-api:prod
Local/private app port: 4000
```

Nginx state:

```text
Nginx proxies /api/ to http://localhost:4000/api/
```

Public access state:

```text
HTTP port 80 is open
Public /api/health verification succeeded over HTTP
HTTPS port 443 is not open/configured yet
Cloudflare/DNS is not configured yet
Elastic IP has not been allocated yet
Frontend has not been deployed yet
```

## 3. Why Elastic IP Is Needed Before DNS

Reason:

- The current EC2 public IPv4 can change if the instance stops and starts.
- DNS should point to a stable public IP.
- An Elastic IP provides a stable public IPv4 for the instance.

Why this matters:

- A DNS record pointed at a temporary EC2 public IP can break unexpectedly.
- A stable IP reduces DNS churn.
- A stable IP makes later Cloudflare DNS and HTTPS/Certbot work more predictable.

## 4. Cost And Safety Notes

Elastic IP cost/safety notes:

- Elastic IP can incur charges depending on AWS allocation, association, and usage rules.
- Avoid leaving an Elastic IP allocated but unattached.
- Release unused Elastic IPs later if no longer needed.
- Do not allocate more than one Elastic IP unless separately approved.
- Do not associate the Elastic IP with the wrong instance or network interface.

Cost and cleanup should be reviewed before allocation and again during future cleanup planning.

## 5. Required Pre-Checks

Before future Elastic IP allocation/association, verify:

- Region is:
  ```text
  ap-southeast-1
  ```
- Correct EC2 instance is selected:
  ```text
  crm-modern-prod-ec2
  ```
- Instance is running.
- Public HTTP `/api/health` currently works.
- EC2 security group has HTTP port `80` open.
- No DNS record is being created yet.
- HTTPS port `443` remains unopened.
- App port `4000` remains private/local-only.
- RDS port `5432` remains private/not public.

Stop if any pre-check is uncertain.

## 6. Approved AWS Console Allocation Steps

Approved future AWS Console allocation path:

```text
EC2 -> Elastic IPs -> Allocate Elastic IP address
```

Allocation planning:

- Network border group should match the region:
  ```text
  ap-southeast-1
  ```
- Allocate one Elastic IP only.
- Do not document the Elastic IP value in public reports/chat.

Apply tags:

```text
Name=crm-modern-prod-eip
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=stable-public-ip
ManagedBy=manual-learning
```

Important:

- This guide does not allocate the Elastic IP.
- Allocation belongs to a later approved execution phase.

## 7. Approved AWS Console Association Steps

Approved future AWS Console association target:

```text
Instance: crm-modern-prod-ec2
```

Association planning:

- Associate the Elastic IP with `crm-modern-prod-ec2`.
- Do not associate with the wrong instance.
- Do not associate with an unintended network interface.
- Do not leave the Elastic IP allocated but unattached.

After association:

- EC2 public endpoint changes to the Elastic IP.
- Public HTTP `/api/health` should still work through Nginx.

## 8. Verification Plan After Association

Future verification after association:

- Confirm EC2 has the Elastic IP associated.
- Confirm public HTTP path works:
  ```text
  /api/health
  ```
- Expected result:
  ```text
  HTTP 200 OK
  ```
- Confirm Nginx still serves the response.
- Confirm API container remains running.

Do not document:

- Actual Elastic IP value.
- EC2 public IP/DNS.
- User public IP.

Use wording such as:

```text
Public HTTP /api/health succeeded through the associated Elastic IP endpoint.
```

## 9. Stop Conditions

Stop immediately if:

- Wrong AWS region is selected.
- Wrong EC2 instance is selected.
- Instance is not running.
- Local/public HTTP health check is failing before association.
- Elastic IP would be allocated but not associated.
- Unexpected security group change is required.
- User is unsure what to click.
- Any step would expose the Elastic IP value in a public report/chat.
- Any step would expose secrets, IPs, private key material, or env values.

## 10. Explicitly Forbidden Changes

Do not:

- Modify security groups.
- Open HTTPS port `443`.
- Open app port `4000`.
- Open RDS port `5432`.
- Modify RDS security group.
- Broaden SSH access.
- Configure Cloudflare.
- Configure DNS.
- Edit Nginx files.
- Configure HTTPS/Certbot.
- Run Docker Compose.
- Start or stop containers.
- Run Docker build.
- Run Prisma commands.

## 11. Evidence/Security Notes

Safe to document:

- EC2 instance name:
  ```text
  crm-modern-prod-ec2
  ```
- Elastic IP resource name/tag:
  ```text
  crm-modern-prod-eip
  ```
- Region:
  ```text
  ap-southeast-1
  ```
- HTTP port:
  ```text
  80
  ```
- App port as private/local-only:
  ```text
  4000
  ```
- RDS port as private/not public:
  ```text
  5432
  ```
- HTTPS port as future/not yet open:
  ```text
  443
  ```
- Public path:
  ```text
  /api/health
  ```
- Expected result:
  ```text
  HTTP 200 OK
  ```
- Elastic IP allocation/association status in a later execution report, without publishing the actual IP value.

Do not document:

- EC2 public IP/DNS.
- User public IP.
- Elastic IP value.
- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- Private key path or contents.
- Secret values.

## 12. What Must Not Be Done In This Phase

Do not:

- SSH.
- Run commands.
- Modify AWS resources.
- Allocate Elastic IP.
- Associate Elastic IP.
- Modify security groups.
- Open HTTPS port.
- Open app port `4000`.
- Open RDS port `5432`.
- Modify RDS security group.
- Broaden SSH access.
- Configure Cloudflare.
- Configure DNS.
- Edit Nginx files.
- Configure HTTPS/Certbot.
- Run Docker Compose.
- Start or stop containers.
- Run Docker build.
- Run Prisma commands.
- Print env file contents.
- Run `env`.
- Run `docker compose config` using the real env file.
- Create or edit real secrets.
- Ask for database password.
- Ask for private key contents.
- Ask for GitHub tokens.
- Expose secrets.
- Expose user public IP.
- Expose EC2 public IP/DNS.
- Expose Elastic IP value.
- Expose private key material.
- Expose full RDS endpoint.
- Expose full `DATABASE_URL`.
- Modify `.env`.
- Modify Dockerfile or Compose files.
- Modify frontend files.
- Modify GitHub Actions.
- Deploy frontend.
- Reset or delete any database.
- Stage, commit, or push.
- Run `npm audit fix --force`.

## 13. Next Phase Recommendation

Recommended next phase:

Execute Elastic IP allocation and association for `crm-modern-prod-ec2`.

Suggested next-ticket focus:

- Allocate one Elastic IP in `ap-southeast-1`.
- Tag it as `crm-modern-prod-eip`.
- Associate it with `crm-modern-prod-ec2`.
- Verify public HTTP `/api/health` still returns `HTTP 200 OK`.
- Avoid documenting the actual Elastic IP value.
- Keep DNS, HTTPS/Certbot, frontend deployment, and additional security group changes for later approved phases.

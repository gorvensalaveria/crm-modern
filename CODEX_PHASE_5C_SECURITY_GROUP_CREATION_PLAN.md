# Codex Phase 5C: Security Group Creation Plan

## 1. Phase Name And Purpose

Phase 5C: Security Group Creation Plan

Purpose:

Plan the exact AWS security group design before creating any real security groups.

This is a planning gate only.

No AWS security groups, AWS resources, Cloudflare records, Elastic IPs, real env files, real secrets, Docker files, Compose files, frontend files, Nginx config, GitHub Actions, Docker/Compose commands, Nginx commands, Prisma migration commands, deployment resources, databases, or `.env` files were created or modified.

## 2. Future Security Group Architecture

Future security group architecture should use two separate security groups:

```text
crm-modern-prod-ec2-sg
crm-modern-prod-rds-sg
```

EC2 security group:

- Attached to the EC2 instance.
- Controls public access to SSH, HTTP, HTTPS, and any explicitly approved temporary API/app port.
- Acts as the allowed source for RDS PostgreSQL access.

RDS security group:

- Attached to the RDS PostgreSQL instance.
- Allows PostgreSQL traffic only from the EC2 security group.
- Must not allow public database access.

Accepted relationship:

```text
Internet -> EC2 security group -> EC2/Nginx/API
EC2 security group -> RDS security group -> RDS PostgreSQL
```

## 3. EC2 Security Group Inbound Rules

SSH:

```text
Type: SSH
Protocol: TCP
Port: 22
Source: <user-approved-public-ip>/32
```

Notes:

- The user’s public IP is a future execution-time value.
- It should be confirmed safely during the security group execution ticket.
- Do not ask for it during this planning ticket.
- Do not use `0.0.0.0/0` for SSH.

HTTP:

```text
Type: HTTP
Protocol: TCP
Port: 80
Source: 0.0.0.0/0
```

When to use:

- Open when Nginx/HTTP validation is needed.
- Needed later for Cloudflare DNS HTTP checks and Certbot HTTP-01 challenge.

HTTPS:

```text
Type: HTTPS
Protocol: TCP
Port: 443
Source: 0.0.0.0/0
```

When to use:

- Open when SSL/HTTPS validation is needed.
- Intended final public app entry point.

Optional temporary API/app port:

```text
Type: Custom TCP
Protocol: TCP
Port: <temporary-api-port>
Source: <restricted-source-if-approved>
```

Rules:

- Only if explicitly approved.
- Restrict where possible.
- Prefer not to expose the API directly once Nginx is ready.
- Close this rule after Nginx reverse proxy is verified.

## 4. EC2 Outbound Rule Posture

Recommended first deployment posture:

```text
Allow outbound traffic
```

Reason:

- EC2 may need outbound access for OS package updates.
- Docker installation may need outbound access.
- App deployment may need repo/package/image access.
- API may need outbound calls to approved external services.
- EC2 needs to initiate connection to RDS.

If outbound restrictions are added later, they should be planned separately after the deployment is working.

## 5. RDS Security Group Inbound Rules

PostgreSQL:

```text
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: crm-modern-prod-ec2-sg
```

Important:

- Source must be the EC2 security group.
- Source must not be `0.0.0.0/0`.
- Source should not be broad public IP ranges.
- RDS should not accept direct public database traffic.

This allows only the EC2 instance/API path to reach RDS.

## 6. RDS Outbound Posture

RDS generally does not need broad custom outbound access for this app.

Recommended posture:

- Keep default outbound behavior unless AWS requires otherwise.
- Do not add broad custom rules without a reason.
- Focus on inbound restriction from EC2 security group.

The main security control for RDS is inbound access.

## 7. Why RDS Must Not Be Public

RDS must not be public because:

- PostgreSQL should not be directly exposed to the internet.
- Public database access increases attack surface.
- The app architecture expects the API container to be the only application path to the database.
- Secrets and database credentials should not compensate for an overly broad network exposure.
- RDS should be isolated behind security groups.

Correct model:

```text
Browser -> Nginx/API -> RDS
```

Incorrect model:

```text
Internet -> RDS
```

## 8. Why SSH Must Not Be `0.0.0.0/0`

SSH must not be open to `0.0.0.0/0` because:

- It exposes the server login surface to the entire internet.
- It invites automated scanning and brute-force attempts.
- It is unnecessary when the user can restrict access to their current public IP.
- It weakens the security posture of the deployment.

Correct model:

```text
SSH 22 -> <user-approved-public-ip>/32
```

Incorrect model:

```text
SSH 22 -> 0.0.0.0/0
```

## 9. Temporary API Port Risks And Closure Rule

Temporary API port risks:

- Direct public API exposure bypasses Nginx.
- It may create CORS or routing differences from final production behavior.
- It may remain open accidentally after testing.
- It increases public attack surface.

Closure rule:

- Temporary API port may be opened only if explicitly approved.
- It should be restricted where possible.
- It must be closed after Nginx reverse proxy is verified.
- Final public traffic should go through Nginx on `80`/`443`.

## 10. Naming And Tags For Both Security Groups

Accepted region:

```text
ap-southeast-1
```

Accepted EC2 security group name:

```text
crm-modern-prod-ec2-sg
```

Tags for EC2 security group:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=ec2-security-group
ManagedBy=manual-learning
```

Accepted RDS security group name:

```text
crm-modern-prod-rds-sg
```

Tags for RDS security group:

```text
Project=crm-modern
Environment=prod
Owner=gorven
Purpose=rds-security-group
ManagedBy=manual-learning
```

## 11. Stop Conditions

Stop before creating or applying security group rules if:

- SSH is about to be opened to `0.0.0.0/0`.
- RDS is about to be public.
- PostgreSQL `5432` is about to be opened to `0.0.0.0/0`.
- PostgreSQL source is a public IP range instead of the EC2 security group.
- The wrong source security group is selected.
- AWS shows an unexpected warning.
- Region is not `ap-southeast-1`.
- Security group name does not match the approved name.
- Tags are missing or unclear.
- Temporary API port is being opened without explicit approval.

## 12. Evidence Rules For Screenshots

Safe evidence may include:

- Security group names.
- Region.
- Inbound rule summaries.
- Tags.
- RDS inbound source showing the EC2 security group.
- SSH source showing a restricted `/32` IP, with the actual IP redacted if desired.
- HTTP/HTTPS public rules when approved.

Do not capture:

- Secret values.
- Private keys.
- Credentials.
- Full env file contents.
- Full `DATABASE_URL`.
- Sensitive AWS account details unless redacted.
- User public IP if the user prefers it redacted.

Evidence should prove the security model without exposing sensitive information.

## 13. Boundaries Respected

Boundaries respected during Phase 5C:

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
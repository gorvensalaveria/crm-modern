# Codex Phase 5AT: Elastic IP Decision Record

## 1. Phase Name And Purpose

Phase 5AT: Elastic IP Decision Record

Purpose:

Document the decision to intentionally skip Elastic IP allocation for this portfolio/demo deployment.

This is a documentation-only phase.

No SSH connection was attempted. No commands were run. AWS resources were not modified. Elastic IP was not allocated or associated. Security groups were not modified. Cloudflare/DNS was not configured. Nginx files were not edited. HTTPS/Certbot was not configured. Docker Compose, containers, Docker build, Prisma, real secrets, Docker files, Compose files, frontend files, GitHub Actions, deployments, databases, and `.env` files were not created or modified.

## 2. Decision Summary

Decision:

```text
Elastic IP skipped intentionally for this portfolio/demo deployment.
```

Elastic IP was evaluated before DNS/HTTPS planning.

The user decided not to proceed with Elastic IP allocation.

This is an intentional cost-control tradeoff, not an accidental omission.

Current live state:

```text
EC2 instance: crm-modern-prod-ec2
Region: ap-southeast-1
API container: running
Nginx: running
Public HTTP 80: open
Public /api/health: verified successfully over HTTP
Elastic IP: not allocated
DNS/Cloudflare: not configured
HTTPS/Certbot: not configured
Frontend: not deployed
```

## 3. Reason For Skipping Elastic IP

Reasons:

- Avoid unnecessary ongoing public IPv4 cost for a portfolio/demo deployment.
- Current EC2 public IPv4 is acceptable for manual demo/testing.
- If the EC2 public IPv4 changes after stop/start, the demo URL or DNS record can be manually updated.

This keeps the deployment cost-conscious while still supporting the current public HTTP demo path.

## 4. Tradeoff Accepted

Accepted tradeoff:

- EC2 public IPv4 may change after instance stop/start.
- DNS/demo URL may need manual update if the EC2 public IPv4 changes.
- This is acceptable for the current portfolio/demo deployment.

Operational implication:

- The deployment remains useful for manual testing and demo.
- Stability can be improved later by adding Elastic IP if the project requires it.

## 5. What Remains Valid

The following remains valid:

- EC2 + Nginx + API container deployment works.
- Public HTTP health check works.
- Future DNS can point to the current EC2 public IPv4 if desired, with the caveat that it may change after stop/start.

Safe current public validation:

```text
Public HTTP /api/health succeeded.
```

Do not include the actual EC2 public IP/DNS in reports.

## 6. What Was Not Done

The following were not done:

- No Elastic IP allocated.
- No Elastic IP associated.
- No AWS resources modified.
- No DNS/Cloudflare configured.
- No HTTPS/Certbot configured.
- No security groups modified.
- No frontend deployed.
- No database reset or deletion.
- No staging, commit, or push.

## 7. Evidence/Security Notes

Safe to include:

- EC2 instance name:
  ```text
  crm-modern-prod-ec2
  ```
- Region:
  ```text
  ap-southeast-1
  ```
- Public HTTP port:
  ```text
  80
  ```
- Public `/api/health` success.
- Elastic IP skipped intentionally.
- DNS can use the current EC2 public IPv4 later with the caveat that it may change.

Do not include:

- EC2 public IP/DNS.
- User public IP.
- Elastic IP value.
- Full RDS endpoint.
- Full `DATABASE_URL`.
- Database password.
- Env file contents.
- Private key path or contents.
- Secret values.

## 8. Next Phase Recommendation

Recommended next phase:

Proceed to DNS/Cloudflare planning using the current EC2 public IPv4 as a demo endpoint, with a clear note that it is not stable unless Elastic IP is added later.

Suggested next-ticket focus:

- Choose the domain/subdomain.
- Decide Cloudflare DNS-only versus proxied mode for initial HTTP/Certbot path.
- Create an A record pointing to the current EC2 public IPv4 only after approval.
- Document that the record may need manual update if EC2 public IPv4 changes.
- Keep HTTPS/Certbot, frontend deployment, and additional hardening for later approved phases.

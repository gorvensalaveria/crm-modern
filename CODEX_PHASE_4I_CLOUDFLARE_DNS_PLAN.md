# Codex Phase 4I: Cloudflare DNS Plan

## 1. Phase Name And Purpose

Phase 4I: Cloudflare DNS Plan

Purpose:

Plan how Cloudflare DNS will eventually point the public domain/subdomain to the EC2 instance for the full public deployment milestone.

This is a planning-only phase.

No DNS records, Cloudflare records, AWS resources, EC2 resources, RDS resources, Elastic IPs, security groups, Nginx config, frontend files, real env files, real secrets, Docker files, Compose files, GitHub Actions, Prisma migrations, databases, deployment resources, or `.env` files were created or modified.

## 2. Future Cloudflare DNS Role

The future Cloudflare DNS role is to point the chosen public domain or subdomain to the EC2 instance that hosts the app.

Cloudflare DNS will eventually connect public browser traffic to the EC2-hosted Nginx front door.

Expected final flow:

```text
Browser -> Cloudflare DNS -> EC2 public IP -> Nginx -> frontend static files
Browser -> Cloudflare DNS -> EC2 public IP -> Nginx /api -> API container
API container -> RDS PostgreSQL
```

Cloudflare should manage DNS only at first.

Advanced Cloudflare proxy/security features can be considered later after the basic public deployment is stable.

## 3. How Domain/Subdomain Traffic Will Reach EC2

Future traffic flow:

1. User enters a domain or subdomain in the browser.
2. DNS resolves the hostname to the EC2 public IPv4 address or Elastic IP.
3. Browser sends HTTP/HTTPS traffic to EC2.
4. EC2 security group allows port `80` and later `443`.
5. Nginx receives the request.
6. Nginx serves frontend files or proxies `/api` to the API container.

The DNS record should point to the public IP that is actually attached to the EC2 instance intended to host the app.

## 4. DNS Record Type Direction

Likely primary record:

```text
A record -> EC2 public IPv4 / Elastic IP
```

Example placeholder:

```text
<subdomain>.<domain>  A  <ec2-public-ip-or-elastic-ip>
```

Optional `www` or additional subdomain considerations:

- If deploying on a subdomain:
  ```text
  app.<domain>
  ```
  create an `A` record for that subdomain.
- If using root domain:
  ```text
  <domain>
  ```
  create an `A` record for the apex/root if Cloudflare supports it normally.
- If using `www`:
  ```text
  www.<domain>
  ```
  either create a separate `A` record or later plan a redirect between `www` and non-`www`.

Recommendation:

- Use one clear hostname for the first deployment.
- Avoid configuring many hostnames at once.
- Decide later whether the canonical host is root, `www`, or an app subdomain.

## 5. EC2 Public IP Stability Concern

EC2 public IPs can change if the instance is stopped and started, unless an Elastic IP is attached.

Risk:

- If DNS points to a non-stable EC2 public IP and the instance IP changes, the domain will point to the wrong or dead target.

Recommendation:

- Use an Elastic IP before final DNS if stable IP behavior is needed.
- Associate the Elastic IP with the EC2 instance before creating final DNS records.
- Avoid pointing production DNS to an IP that may change unexpectedly.
- Treat Elastic IP allocation/association as a separate approved AWS execution step.

Important:

Do not allocate an Elastic IP in Phase 4I. This is planning only.

## 6. Cloudflare Proxy Mode Considerations

Cloudflare DNS-only mode:

- Cloudflare resolves the hostname to EC2.
- Browser connects directly to EC2.
- Simpler for initial HTTP validation.
- Simpler for Certbot HTTP challenge troubleshooting.
- Usually preferred for first DNS/SSL setup.

Cloudflare proxied mode:

- Browser traffic goes through Cloudflare proxy first.
- Can provide caching/security features.
- Can complicate Certbot, TLS mode, headers, and troubleshooting.
- May be useful later after basic DNS/SSL works.

Recommendation:

- Start with DNS-only mode for initial HTTP and Certbot validation unless Architect approves otherwise.
- Consider proxied mode later after HTTPS is working and the app is stable.
- If proxied mode is enabled later, review Cloudflare SSL/TLS mode carefully.

## 7. Required Preconditions Before DNS Change

Before changing DNS later, confirm:

- EC2 exists.
- EC2 public IP or Elastic IP is known.
- If stable DNS is desired, Elastic IP is allocated and associated.
- Nginx HTTP works by IP:
  ```text
  http://<ec2-public-ip>/
  ```
- API through Nginx works by IP:
  ```text
  http://<ec2-public-ip>/api/health
  ```
- EC2 security group allows inbound port `80`.
- Domain/subdomain choice has been reviewed.
- The target hostname is clear.
- No secrets are included in DNS records.
- ChatGPT Architect approves the DNS change.

## 8. Future DNS Verification Command Shapes Without Running Them

Future DNS lookup command shape:

```bash
dig <subdomain>.<domain>
```

Future short DNS answer shape:

```bash
dig +short <subdomain>.<domain>
```

Future alternative lookup shape:

```bash
nslookup <subdomain>.<domain>
```

Future HTTP verification after DNS:

```bash
curl -I http://<subdomain>.<domain>/
```

Future API verification after DNS:

```bash
curl http://<subdomain>.<domain>/api/health
```

Important:

These are future command shapes only. They are not approved to run during Phase 4I.

## 9. How DNS Ties Into SSL/Certbot Phase

DNS should point to EC2 before Certbot runs.

Certbot typically needs:

- Domain resolves to the EC2 public IP.
- Port `80` is open.
- Nginx HTTP site works.
- The ACME HTTP challenge can reach the EC2/Nginx server.

Recommended sequence:

1. Verify Nginx over EC2 public IP.
2. Create DNS record in Cloudflare.
3. Verify DNS resolves to EC2.
4. Verify HTTP works through the domain.
5. Proceed to SSL/Certbot phase.
6. Verify HTTPS works.
7. Consider HTTP-to-HTTPS redirect.
8. Consider Cloudflare proxied mode later if desired.

## 10. Risks

Wrong IP:

- DNS may point to the wrong EC2 instance.
- DNS may point to an old IP.
- Users may reach the wrong server or no app.

Changing EC2 public IP:

- Stopping/starting EC2 can change its public IP.
- DNS may silently become stale.
- Elastic IP helps avoid this risk.

Cloudflare proxy interfering with validation:

- Proxied mode can complicate Certbot HTTP validation.
- Cloudflare SSL/TLS mode can cause redirect or certificate confusion.
- DNS-only mode is simpler for initial validation.

Stale DNS/cache:

- DNS propagation may take time.
- Local resolver or browser cache may show old results.
- Verification may differ across networks.

Exposing wrong app/server:

- A record may point to an instance that is not ready.
- HTTP may expose an unfinished Nginx default page.
- Domain may go public before the app is verified.

## 11. Evidence That Can Be Captured Later With Redaction

Potential evidence:

- Cloudflare DNS record showing hostname and target, with account details redacted.
- DNS-only/proxy status, if visible and appropriate.
- `dig +short` output showing expected IP.
- HTTP response from the domain.
- API health response through the domain.
- Nginx serving the frontend through the domain.
- Later HTTPS verification in the SSL phase.

Do not capture:

- Cloudflare API tokens
- Account-sensitive Cloudflare dashboard details
- Secret values
- Private keys
- Full production env file contents
- Full `DATABASE_URL`
- Any screenshots with secrets visible

## 12. Boundaries Respected

Boundaries respected during Phase 4I:

- DNS was not changed.
- Cloudflare records were not created or modified.
- No AWS resources were created.
- No EC2 resources were created.
- No RDS resources were created.
- No Elastic IPs were allocated.
- No security groups were changed.
- Nginx was not installed or configured.
- No Nginx commands were run.
- Frontend was not built.
- Frontend files were not modified.
- `.env` was not modified.
- No real env files were created.
- No real secrets were created or edited.
- No secrets were exposed.
- No secret values were requested.
- Dockerfile was not modified.
- Compose files were not modified.
- GitHub Actions files were not modified.
- No Docker/Compose commands were run.
- No Prisma migration commands were run.
- No deployment was performed.
- No database was reset or deleted.
- No files were staged, committed, or pushed.
- `npm audit fix --force` was not run.
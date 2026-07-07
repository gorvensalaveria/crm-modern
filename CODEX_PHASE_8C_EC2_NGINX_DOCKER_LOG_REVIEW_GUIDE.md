# CODEX Phase 8C: EC2/Nginx/Docker Log Review Guide

## 1. Phase Name and Purpose

Phase 8C prepares a safe manual guide for reviewing backend runtime logs for the CRM Modern production deployment.

This phase is documentation/guide-only. It does not run commands, SSH, inspect files, modify infrastructure, restart services, enable centralized logging, or expose logs/secrets.

The purpose is to explain which logs matter, where logs are expected to be found, what each log source helps diagnose, how to review logs safely, and how log review connects to metrics and future alarms.

## 2. Why Logs Matter After Metrics

Metrics answer whether something looks abnormal.

Logs help explain why.

Examples:

* CloudFront 5xx rises, then Nginx error logs may show upstream failures.
* EC2 looks healthy, but Docker logs may show API/database errors.
* API health checks fail, then Nginx access logs can confirm whether requests reached EC2.
* Browser requests fail, then access logs can show status categories and path patterns.

Metrics should guide where to look. Logs should provide the incident narrative.

## 3. Current Backend Request Path

Current request path:

```text
Browser/frontend
-> CloudFront frontend
-> frontend calls https://aucrm.duckdns.org/api/...
-> Nginx on EC2 receives HTTPS request
-> Nginx proxies /api/ traffic to local Docker API container
-> API container talks to private RDS PostgreSQL
```

This means backend issues can appear in several layers:

* frontend/browser behavior,
* CloudFront frontend delivery,
* Nginx reverse proxy,
* Docker/API container,
* private RDS PostgreSQL.

## 4. Log Sources to Review

Recommended log sources:

API container logs:

```text
docker logs <api-container-name>
```

Nginx access log:

```text
/var/log/nginx/access.log
```

Nginx error log:

```text
/var/log/nginx/error.log
```

System/service log awareness:

```text
journalctl
```

Certbot renewal awareness:

```text
certbot renew --dry-run was previously successful
```

The actual API container name should be identified during a later approved manual review phase without exposing secrets.

## 5. Docker/API Container Log Review Plan

API container logs help diagnose application runtime behavior.

Review API logs for:

* API startup/shutdown messages,
* request errors,
* failed health checks,
* repeated stack traces,
* database connection errors,
* Prisma/runtime errors,
* authentication/authorization failures,
* CORS-related errors,
* unexpected restarts,
* errors after deployment or restart.

Useful questions:

* Did the API start cleanly?
* Did errors begin after a deploy or restart?
* Are database connection failures repeating?
* Are errors isolated or continuous?
* Are there authentication, authorization, or CORS patterns?

Do not print environment variables or full production env files while reviewing Docker logs.

## 6. Nginx Access Log Review Plan

Nginx access logs help diagnose whether requests reach EC2 and what status categories are returned.

Review for:

* `2xx` success,
* `3xx` redirects,
* `4xx` client/app route/auth/CORS/preflight-related issues,
* `5xx` backend/proxy/server issues,
* `/api/health` requests,
* repeated `404`s,
* repeated `502` or `504` errors,
* unusual request spikes,
* request method/path/status patterns.

Safe examples to summarize:

* “Nginx access log shows successful `/api/health` checks.”
* “Repeated `502` responses observed after restart.”
* “Mostly `2xx` API responses with a few expected `404`s.”

Do not expose exact client IPs.

## 7. Nginx Error Log Review Plan

Nginx error logs help diagnose proxy, TLS, and service-level problems.

Review for:

* upstream connection refused,
* upstream timed out,
* SSL/TLS/certificate issues,
* permission errors,
* bad gateway/proxy errors,
* Nginx config-related failures.

Common interpretations:

* upstream connection refused may mean the API container is down or not reachable locally,
* upstream timed out may mean the API is slow, blocked, or overloaded,
* TLS/certificate errors may indicate Certbot/Nginx certificate issues,
* config errors may explain reload or proxy failures.

Do not copy full raw error logs if they include sensitive paths, headers, request bodies, or private infrastructure details.

## 8. System/Service Log Awareness

System logs should be reviewed only if EC2, Nginx, or Docker symptoms suggest host/service issues.

Use system/service logs to investigate:

* Nginx service failures,
* unexpected service restarts,
* host-level resource or permission issues,
* Docker daemon symptoms,
* system-level errors around the same time as an incident.

Avoid broad log dumps. Summarize patterns instead of copying sensitive logs.

## 9. Certbot Renewal Log/Status Awareness

Certbot renewal awareness matters because HTTPS depends on valid certificates.

Known approved context:

```text
certbot renew --dry-run was previously successful
```

Future manual reviews may check renewal status/log awareness if HTTPS behavior changes.

Do not run Certbot in this phase. Do not expose Certbot account email, certificate private key paths, or private key material.

## 10. Safe Log Review Commands to Use Later

These are future/manual review examples only. Do not run them in this phase.

Identify container names safely:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Review recent API container logs:

```bash
docker logs --tail 100 <api-container-name>
```

Follow API container logs during active troubleshooting:

```bash
docker logs --tail 100 -f <api-container-name>
```

Review recent Nginx access logs:

```bash
sudo tail -n 100 /var/log/nginx/access.log
```

Review recent Nginx error logs:

```bash
sudo tail -n 100 /var/log/nginx/error.log
```

Review recent Nginx service logs:

```bash
sudo journalctl -u nginx --no-pager -n 100
```

Do not use commands that print environment variables or full production env files.

Do not use:

* `cat /opt/crm-modern/env/production.env`
* `env`
* `docker compose config`
* casual `docker inspect`

`docker inspect` may expose environment variables and should not be used casually.

## 11. What Log Patterns Are Normal

Normal patterns may include:

* API startup messages after a planned restart,
* occasional successful health checks,
* Nginx `2xx` responses for API requests,
* Nginx `3xx` redirects from HTTP to HTTPS,
* occasional explainable `404`s for nonexistent paths,
* no recent API errors,
* no repeated stack traces,
* no repeated database connection errors.

Normal does not mean “no logs.” Normal means the patterns match expected traffic and do not repeat in a way that suggests system failure.

## 12. What Log Patterns Are Suspicious

Suspicious patterns may include:

* repeated API stack traces,
* repeated failed health checks,
* repeated database connection errors,
* Prisma/runtime errors,
* authentication/authorization failures that spike unexpectedly,
* CORS-related errors after frontend deployment,
* unexpected container restarts,
* Nginx repeated `502` or `504` responses,
* upstream connection refused,
* upstream timed out,
* SSL/TLS/certificate errors,
* permission errors,
* sudden request spikes,
* errors starting immediately after deployment or restart.

Suspicious logs should be summarized safely and tied back to metrics when possible.

## 13. What Information Is Safe to Summarize

Safe to summarize:

* approximate counts,
* status categories such as `2xx`, `4xx`, `5xx`,
* sanitized paths like `/api/health`,
* generic error categories,
* timestamps rounded or approximate,
* “repeated 502s after restart,”
* “database connection errors observed,”
* “no recent API errors observed,”
* “Nginx access log shows successful health checks.”

Prefer summaries over raw logs.

## 14. What Information Must Not Be Copied/Exposed

Do not expose:

* EC2 public IP/DNS,
* private IPs,
* exact client/user IPs,
* RDS endpoint,
* database credentials,
* `DATABASE_URL`,
* full env file contents,
* DuckDNS token,
* Certbot account email,
* private key paths/material,
* AWS account ID,
* IAM role ARN,
* GitHub secrets,
* cookies,
* authorization headers,
* session tokens,
* request bodies with user/client data,
* full stack traces if they contain file paths/secrets/sensitive data,
* screenshots containing account metadata,
* full raw logs.

When in doubt, summarize the pattern rather than copying the log content.

## 15. Manual Log Review Checklist

Manual checklist for a later approved review phase:

* Identify the API container name safely.
* Review recent API container logs.
* Check for API startup/shutdown messages.
* Check for repeated application errors.
* Check for database connection errors.
* Check for Prisma/runtime errors.
* Check for CORS/authentication/authorization errors.
* Review Nginx access logs.
* Confirm `/api/health` requests are successful.
* Check for repeated `404`, `502`, or `504` status patterns.
* Review Nginx error logs.
* Check for upstream, timeout, TLS, or permission errors.
* Review Nginx service logs only if service symptoms suggest it.
* Summarize findings without raw sensitive logs.

## 16. Troubleshooting Flow Using Logs

Recommended flow:

1. Start with the symptom.
   * Frontend broken, API health failing, slow responses, or deployment issue.

2. Check metrics first.
   * EC2, RDS, CloudFront, and GitHub Actions status can narrow the layer.

3. Check Nginx access logs.
   * Confirm whether requests reach EC2 and what status categories are returned.

4. Check Nginx error logs.
   * If `5xx`, proxy, upstream, TLS, or timeout symptoms appear.

5. Check Docker/API logs.
   * If Nginx reaches the API but the API errors or health fails.

6. Check RDS metrics.
   * If API logs show database connection or query/runtime errors.

7. Check system/service logs.
   * Only if host/service symptoms appear.

8. Summarize and decide.
   * Avoid restarts or configuration changes until evidence points to the likely layer.

## 17. Security and Cost-Control Boundaries

Security boundaries:

* Local/manual log review first.
* Do not expose logs publicly.
* Do not paste raw logs with sensitive data.
* Do not print production env files.
* Do not print environment variables.
* Do not use commands that expose secrets.

Cost-control boundaries:

* Do not enable centralized CloudWatch Logs yet.
* Do not install CloudWatch Agent yet.
* Do not enable verbose logging.
* Do not change app logging level.
* Do not change Docker logging drivers.
* Do not change Nginx logging config.
* Do not create log groups.
* Do not change retention.
* Avoid high-ingestion logging.
* Avoid paid third-party observability tools.

## 18. What Not to Change

Do not change:

* EC2,
* Docker,
* running containers,
* Nginx,
* Certbot,
* DuckDNS,
* RDS,
* S3,
* CloudFront,
* IAM,
* GitHub Actions,
* CloudWatch alarms,
* CloudWatch dashboards,
* log groups,
* CloudWatch Logs ingestion,
* CloudWatch Agent,
* CloudFront standard logs,
* S3 access logs,
* RDS enhanced monitoring,
* monitoring/detail settings.

Do not run Prisma commands.

## 19. Expected Output From a Later Manual Log Review

Expected output from a later manual log review:

* API container log summary:
  * startup/shutdown observations,
  * error pattern summary,
  * database/API/CORS/auth findings.
* Nginx access log summary:
  * approximate status category patterns,
  * `/api/health` observation,
  * repeated 4xx/5xx findings if any.
* Nginx error log summary:
  * upstream/TLS/proxy/error findings if any.
* System/service log summary:
  * only if reviewed due to symptoms.
* Certbot renewal awareness:
  * whether renewal status/log review is needed in a later approved phase.
* Recommended next action:
  * no action,
  * deeper investigation,
  * alarm planning,
  * future centralized logging planning.

## 20. Proposed Next Phase

Recommended next phase:

* Phase 8D: Basic CloudWatch Alarm Planning

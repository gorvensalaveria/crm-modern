# CODEX Phase 8B: CloudWatch Metrics Baseline Review Guide

## 1. Phase Name and Purpose

Phase 8B prepares a manual guide for reviewing baseline CloudWatch and AWS metrics for the existing CRM Modern production deployment.

This phase is documentation/guide-only. It does not modify AWS resources, create alarms, enable logs, install agents, run commands, or change production infrastructure.

The purpose is to learn where the current metrics are, review current baseline health, document what normal looks like, and avoid creating alarms before understanding current values.

## 2. Why Baseline Metrics Matter Before Alarms

Alarms are useful only when their thresholds are grounded in normal system behavior.

A baseline review helps answer:

* what normal CPU looks like,
* what normal RDS connections look like,
* whether CloudFront errors are usually near zero,
* whether recent deployment behavior is healthy,
* whether a future alarm threshold would be actionable or noisy.

The goal of this phase is observation, not configuration.

## 3. Scope of This Baseline Review

Current production architecture:

* Frontend: S3 + CloudFront
* Frontend URL: `https://d3k197cbnbmhh7.cloudfront.net`
* Backend API: EC2 + Docker + Nginx + HTTPS
* Backend API base: `https://aucrm.duckdns.org/api/...`
* Database: private RDS PostgreSQL
* Frontend CI/CD: GitHub Actions + AWS OIDC + S3 + CloudFront

Current operational context:

* Backend CI/CD is not yet automated.
* Infrastructure is manually created, not Terraform/IaC-managed yet.
* This review is manual and read-only.

Recommended time windows:

* Last 1 hour for immediate health
* Last 3 hours if a recent deployment happened
* Last 24 hours for daily baseline
* Last 7 days for trend if available

## 4. AWS Console Paths to Metrics

CloudWatch metrics:

```text
AWS Console -> CloudWatch -> Metrics
```

EC2 metrics:

```text
AWS Console -> EC2 -> Instances -> select crm-modern-prod-ec2 -> Monitoring
```

RDS metrics:

```text
AWS Console -> RDS -> Databases -> select crm-modern-prod-rds-postgres -> Monitoring
```

CloudFront metrics:

```text
AWS Console -> CloudFront -> Distributions -> select crm-modern-frontend-cloudfront / distribution ID E1GAUKBY4OYYQZ -> Monitoring
```

S3 visibility:

```text
AWS Console -> S3 -> crm-modern-frontend-aucrm -> Objects
```

GitHub Actions:

```text
GitHub -> gorvensalaveria/crm-modern -> Actions
```

## 5. EC2 Metrics to Review

Review these EC2 metrics:

* `CPUUtilization`
* `StatusCheckFailed`
* `StatusCheckFailed_Instance`
* `StatusCheckFailed_System`
* `NetworkIn`
* `NetworkOut`
* `CPUCreditBalance` if available/applicable

Expected healthy baseline:

* status checks are passing,
* CPU is not continuously high,
* network traffic roughly matches expected app activity,
* CPU credits are not steadily draining on burstable instances.

Important caveats:

* memory usage is not available by default without CloudWatch Agent,
* disk usage is not available by default without CloudWatch Agent.

Do not install CloudWatch Agent in this phase.

## 6. RDS Metrics to Review

Review these RDS metrics:

* `CPUUtilization`
* `FreeStorageSpace`
* `DatabaseConnections`
* `FreeableMemory`
* `ReadLatency`
* `WriteLatency`
* `ReadIOPS`
* `WriteIOPS`
* `DiskQueueDepth` if available
* backup/maintenance status from the RDS dashboard if visible

Expected healthy baseline:

* CPU is low or moderate for normal demo usage,
* free storage is comfortably above warning levels,
* database connections are low and stable,
* freeable memory is not collapsing,
* read/write latency is not spiking for long periods,
* backup and maintenance status do not show failures.

Do not expose the RDS endpoint, credentials, `DATABASE_URL`, or query contents.

## 7. CloudFront Metrics to Review

Review these CloudFront metrics:

* `Requests`
* `BytesDownloaded`
* `BytesUploaded`
* `4xxErrorRate`
* `5xxErrorRate`
* `TotalErrorRate` if visible
* `CacheHitRate` if visible
* recent invalidation status

Expected healthy baseline:

* request volume matches expected manual/demo usage,
* 5xx errors are near zero,
* 4xx errors are low and explainable,
* cache hit rate is reasonable after repeated frontend visits,
* recent invalidations completed successfully.

CloudFront standard logs should not be enabled in this phase.

## 8. S3/CloudFront Frontend Visibility Checks

Review the S3 bucket object structure:

```text
crm-modern-frontend-aucrm
```

Confirm the bucket root contains:

```text
index.html
assets/
```

Confirm:

* the bucket is still not public,
* frontend traffic is served through CloudFront,
* direct public S3 website hosting is not being used,
* deployment output is not nested under an accidental `dist/` prefix.

Do not enable S3 access logs in this phase.

## 9. GitHub Actions Deployment Visibility Checks

Review:

* latest CI workflow status,
* latest frontend deploy workflow status,
* deploy duration,
* failed step names if any,
* warnings such as Node.js runtime/action deprecation notices.

Expected healthy baseline:

* CI passes before deployment,
* frontend deploy workflow completes successfully,
* deploy duration is broadly consistent with prior runs,
* warnings are documented for later cleanup but do not block deployment unless they become failures.

## 10. What Values to Record Safely

Safe to record:

* service/resource names,
* metric names,
* approximate metric ranges,
* HTTP status categories such as `2xx`, `4xx`, `5xx`,
* workflow run result and duration,
* non-secret public URLs already approved:
  * `https://d3k197cbnbmhh7.cloudfront.net`
  * `https://aucrm.duckdns.org/api/...`
* observations such as:
  * CPU low,
  * RDS connections low,
  * CloudFront 5xx near zero,
  * CI passed,
  * deploy workflow succeeded.

Prefer approximate ranges and operational observations over screenshots.

## 11. What Values Not to Record or Expose

Do not record or expose:

* EC2 public IP/DNS,
* private IPs,
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
* screenshots containing account metadata,
* detailed logs with request headers/tokens/user data,
* exact user/client IPs from logs.

Do not paste screenshots that reveal account metadata or private infrastructure details.

## 12. How to Interpret Normal vs Suspicious Values

Normal observations may include:

* EC2 status checks passing,
* EC2 CPU low or briefly spiky,
* RDS connections low and stable,
* RDS free storage stable,
* CloudFront requests visible after frontend visits,
* CloudFront 5xx near zero,
* CloudFront 4xx low and explainable,
* latest CI and deploy workflow successful.

Suspicious observations may include:

* EC2 status checks failing,
* EC2 CPU high for an extended period,
* CPU credits steadily falling toward zero on burstable instances,
* RDS free storage dropping quickly,
* RDS connections unexpectedly high,
* RDS latency spiking and staying high,
* CloudFront 5xx increasing,
* CloudFront 4xx increasing unexpectedly,
* repeated failed CI/deploy workflow runs,
* deploy duration suddenly much longer than normal.

Suspicious does not always mean emergency. It means the next phase should investigate before creating alarms or making changes.

## 13. Baseline Review Checklist

Manual checklist:

* Review EC2 metrics for the last 1 hour.
* Review EC2 metrics for the last 24 hours.
* Confirm EC2 status checks are passing.
* Record approximate EC2 CPU range.
* Record whether EC2 network traffic looks expected.
* Review RDS metrics for the last 1 hour.
* Review RDS metrics for the last 24 hours.
* Record approximate RDS CPU range.
* Record whether RDS connections are low/stable.
* Confirm RDS free storage is not near exhaustion.
* Review CloudFront metrics for the last 1 hour.
* Review CloudFront metrics for the last 24 hours.
* Record whether CloudFront 4xx/5xx rates are near zero or explainable.
* Check recent CloudFront invalidation status.
* Confirm S3 bucket root contains `index.html` and `assets/`.
* Confirm frontend is served through CloudFront.
* Review latest CI workflow status.
* Review latest frontend deploy workflow status.
* Note workflow duration and warnings.

## 14. Security and Cost-Control Boundaries

Security boundaries:

* Review only.
* Do not expose secrets.
* Do not expose private infrastructure values.
* Do not record account metadata screenshots.
* Do not copy detailed logs with sensitive headers, tokens, user data, or exact client IPs.

Cost-control boundaries:

* Do not create alarms in this phase.
* Do not enable detailed monitoring unless explicitly approved later.
* Do not enable CloudFront standard logs.
* Do not enable S3 server access logs.
* Do not enable RDS enhanced monitoring.
* Do not install CloudWatch Agent.
* Do not create dashboards.
* Do not change retention.
* Avoid high-ingestion logging.
* Avoid paid third-party tools.

## 15. What Not to Change

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
* CloudWatch Agent,
* CloudFront standard logs,
* S3 access logs,
* RDS enhanced monitoring,
* monitoring/detail settings.

Do not run Prisma commands.

## 16. Expected Output From the Manual Review

Expected output from a later manual review:

* EC2 baseline summary:
  * approximate CPU range,
  * status check state,
  * network traffic observation,
  * CPU credit observation if applicable.
* RDS baseline summary:
  * approximate CPU range,
  * free storage observation,
  * connection count observation,
  * memory/latency/IO observation.
* CloudFront baseline summary:
  * request/error observations,
  * cache hit observation if visible,
  * invalidation status.
* S3/frontend visibility summary:
  * `index.html` present,
  * `assets/` present,
  * bucket not public,
  * CloudFront serving frontend.
* GitHub Actions visibility summary:
  * latest CI result,
  * latest deploy result,
  * deploy duration,
  * warnings if any.
* Recommended next monitoring step based on observed baseline.

## 17. Proposed Next Phase

Recommended next phase:

* Phase 8C: EC2/Nginx/Docker Log Review Guide

Alternative next phase if the metrics baseline is already clear:

* Phase 8D: Basic CloudWatch Alarm Planning

# CODEX Phase 8D: Basic CloudWatch Alarm Planning Guide

## 1. Phase Name and Purpose

Phase 8D plans a small, useful, low-cost set of CloudWatch alarms for the CRM Modern AWS deployment.

This phase is documentation/planning-only. It does not create alarms, modify AWS resources, enable logs, install agents, run commands, or change production infrastructure.

The goal is to plan alarms that are actionable, low-noise, and tied to clear troubleshooting steps.

## 2. Why Alarms Should Be Planned After Baseline Metrics and Log Review

Alarms should not be guessed in isolation.

Phase 8B establishes baseline metrics so thresholds can reflect normal behavior. Phase 8C defines how to review logs when an alarm needs investigation.

Planning alarms after those guides helps:

* avoid noisy thresholds,
* avoid alert fatigue,
* map each alarm to a troubleshooting path,
* avoid alarming on normal demo traffic,
* keep monitoring simple and cost-aware.

## 3. Alarm Design Principles

Recommended design principles:

* Alarms should be actionable.
* Alarms should map to a troubleshooting step.
* Avoid alert fatigue.
* Start with a small set of high-signal alarms.
* Prefer sustained conditions over short spikes.
* Avoid alarming on normal demo traffic.
* Use baseline observations from Phase 8B before finalizing thresholds.
* Use Phase 8C log review to investigate alarm causes.
* Keep cost and simplicity in mind.

All thresholds in this guide are initial suggestions, not final production guarantees. Final thresholds should be adjusted after real baseline review.

## 4. Current Architecture Alarm Scope

Current production architecture:

* Frontend: S3 + CloudFront
* Frontend URL: `https://d3k197cbnbmhh7.cloudfront.net`
* Backend API: EC2 + Docker + Nginx + HTTPS
* Backend API base: `https://aucrm.duckdns.org/api/...`
* Database: private RDS PostgreSQL
* Frontend CI/CD: GitHub Actions + AWS OIDC + S3 + CloudFront

Alarm scope for this phase:

* EC2 instance health and CPU
* RDS CPU, storage, and connections
* CloudFront 4xx/5xx error rates
* optional AWS budget/billing alarm planning

Out of scope for this phase:

* memory alarms,
* disk alarms,
* Docker-specific metrics,
* Nginx log-based metric filters,
* custom API metrics,
* third-party observability alerts.

## 5. Recommended First Alarm Set

Recommended first alarm set to plan:

1. EC2 status check failed
2. EC2 sustained high CPU
3. RDS sustained high CPU
4. RDS low free storage
5. RDS high database connections
6. CloudFront high 5xx error rate
7. CloudFront high 4xx error rate
8. Optional AWS budget/billing alarm if not already configured

Avoid creating too many alarms at once. Start with the highest-signal alarms and tune them after observing behavior.

## 6. EC2 Alarm Planning

### EC2 Status Check Failed

Metric:

```text
StatusCheckFailed
```

Suggested behavior:

* alarm if status check failed for more than one evaluation period.

Why:

* indicates EC2 host or instance health issue.

What to check:

* EC2 instance status checks,
* Nginx availability,
* Docker/API container status,
* recent AWS events.

Suggested severity:

```text
Critical
```

### EC2 Sustained High CPU

Metric:

```text
CPUUtilization
```

Suggested initial threshold:

```text
above 80% for 10-15 minutes
```

Caveat:

* this is an initial suggestion only,
* final threshold should be based on actual baseline.

What to check:

* Nginx access patterns,
* Docker/API logs,
* traffic spike,
* possible runaway process.

Suggested severity:

```text
Warning
```

### EC2 CPU Credit Balance

Metric:

```text
CPUCreditBalance
```

Suggested behavior:

* consider later only if the instance is burstable and credits trend low.

Caveat:

* do not make this a first alarm unless baseline shows it matters.

Suggested severity:

```text
Info/optional
```

## 7. RDS Alarm Planning

### RDS Sustained High CPU

Metric:

```text
CPUUtilization
```

Suggested initial threshold:

```text
above 80% for 10-15 minutes
```

Caveat:

* this is an initial suggestion only,
* final threshold should be based on actual baseline.

What to check:

* API errors,
* query/runtime errors,
* database connection count,
* recent traffic or deployment changes.

Suggested severity:

```text
Warning
```

### RDS Low Free Storage

Metric:

```text
FreeStorageSpace
```

Suggested behavior:

* alarm if free storage drops near a conservative low-space threshold.

Important:

* avoid documenting exact current storage values if sensitive or screenshot-based,
* threshold should be selected after reviewing actual allocated storage and baseline.

What to check:

* RDS storage trend,
* database growth,
* logs/backups/configuration if relevant.

Suggested severity:

```text
Critical
```

### RDS High Database Connections

Metric:

```text
DatabaseConnections
```

Suggested behavior:

* alarm if connections are unexpectedly high compared with baseline.

Caveat:

* threshold should be based on observed normal connection count.

What to check:

* API connection pool behavior,
* application errors,
* traffic spikes,
* stuck or repeated requests.

Suggested severity:

```text
Warning
```

## 8. CloudFront Alarm Planning

### CloudFront High 5xx Error Rate

Metric:

```text
5xxErrorRate
```

Suggested behavior:

* alarm if sustained above a small non-zero percentage for several evaluation periods.

Why:

* indicates origin/server-side or CloudFront service delivery failures.

What to check:

* CloudFront monitoring,
* S3 object availability,
* recent deployment,
* invalidation status,
* frontend route behavior.

Suggested severity:

```text
Critical
```

### CloudFront High 4xx Error Rate

Metric:

```text
4xxErrorRate
```

Suggested behavior:

* alarm if unexpectedly high compared with baseline.

Caveat:

* occasional 4xx may be normal from bad paths, browser behavior, or expired routes.

What to check:

* CloudFront error metrics,
* SPA fallback behavior,
* S3 object structure,
* recent frontend deployment,
* whether errors are explainable.

Suggested severity:

```text
Warning
```

## 9. Optional Billing/Budget Alarm Planning

Budget or billing alerts are useful for cost safety.

Recommended planning:

* check whether an AWS Budget or billing alert already exists,
* if not, plan one separately,
* keep the threshold conservative and cost-control oriented,
* do not document account ID or billing screenshots.

Do not create a budget or billing alarm in this phase.

Suggested severity:

```text
Info/optional
```

## 10. Alarm Severity Levels

Suggested severity model:

Critical:

* EC2 status check failed,
* RDS low storage,
* sustained CloudFront 5xx.

Warning:

* EC2 high CPU,
* RDS high CPU,
* RDS high connections,
* CloudFront high 4xx.

Info/optional:

* CPU credit balance trend,
* budget/billing alert planning.

Severity should reflect urgency and actionability, not curiosity.

## 11. Suggested Alarm Names

Suggested alarm names:

```text
crm-modern-prod-ec2-status-check-failed
crm-modern-prod-ec2-high-cpu
crm-modern-prod-rds-high-cpu
crm-modern-prod-rds-low-free-storage
crm-modern-prod-rds-high-connections
crm-modern-frontend-cloudfront-high-5xx
crm-modern-frontend-cloudfront-high-4xx
crm-modern-budget-cost-safety
```

Final names can be adjusted later, but should clearly identify:

* project,
* environment,
* resource,
* symptom.

## 12. Suggested Initial Thresholds, With Caveats

Initial threshold suggestions:

* EC2 `StatusCheckFailed`: failed for more than one evaluation period.
* EC2 `CPUUtilization`: above 80% for 10-15 minutes.
* RDS `CPUUtilization`: above 80% for 10-15 minutes.
* RDS `FreeStorageSpace`: conservative low-space threshold after storage baseline review.
* RDS `DatabaseConnections`: unexpectedly high compared with observed baseline.
* CloudFront `5xxErrorRate`: sustained above a small non-zero percentage for several evaluation periods.
* CloudFront `4xxErrorRate`: unexpectedly high compared with baseline.
* Budget/billing: only after checking existing cost controls.

Caveats:

* these are starting points,
* final thresholds must be based on Phase 8B baseline observations,
* alarm windows should prefer sustained conditions over short spikes,
* thresholds should avoid normal demo traffic noise.

## 13. What to Check When Each Alarm Fires

EC2 status check failed:

* EC2 status checks,
* Nginx availability,
* Docker/API container status,
* recent AWS events.

EC2 high CPU:

* Nginx access patterns,
* Docker/API logs,
* traffic spike,
* possible runaway process.

RDS high CPU:

* API errors,
* query/runtime errors,
* database connection count,
* recent traffic or deployment changes.

RDS low free storage:

* RDS storage trend,
* database growth,
* backup/maintenance behavior,
* whether growth is expected.

RDS high connections:

* API connection pool behavior,
* application errors,
* traffic spikes,
* stuck or repeated requests.

CloudFront high 5xx:

* CloudFront monitoring,
* S3 object availability,
* recent frontend deployment,
* invalidation status,
* frontend route behavior.

CloudFront high 4xx:

* SPA fallback behavior,
* S3 object structure,
* recent frontend deployment,
* whether errors are explainable.

Budget/billing:

* recent AWS service usage,
* new resources,
* unexpected data transfer or logging usage.

## 14. What Alarms Not to Create Yet

Do not create yet:

* memory usage alarm,
* disk usage alarm,
* Docker container-specific alarms,
* Nginx log-based metric filters,
* API custom application metrics,
* Prometheus/Grafana alerts,
* ELK/OpenSearch alerts,
* Datadog/New Relic alerts.

Reasons:

* memory and disk alarms require CloudWatch Agent or another agent,
* Docker-specific alarms require additional metrics/logging setup,
* Nginx log-based alarms require CloudWatch Logs ingestion and metric filters,
* API custom metrics require instrumentation,
* third-party observability tools are outside the current low-cost scope.

## 15. Notification Planning

Simple notification options for later:

* email through CloudWatch alarm action/SNS,
* AWS Console alarm state review.

Keep notification setup minimal.

Do not create in this phase:

* SNS topics,
* subscriptions,
* email subscriptions,
* notification policies.

Do not include personal email addresses or Certbot account email in the guide.

## 16. Security and Cost-Control Boundaries

Security boundaries:

* Planning only.
* Do not expose secrets.
* Do not expose private infrastructure values.
* Do not include raw logs.
* Do not include screenshots with account metadata.
* Do not include personal notification email addresses.

Cost-control boundaries:

* Do not create alarms in this phase.
* Do not create SNS topics.
* Do not subscribe email addresses.
* Do not enable detailed monitoring.
* Do not enable CloudFront standard logs.
* Do not enable S3 access logs.
* Do not enable RDS enhanced monitoring.
* Do not install CloudWatch Agent.
* Do not create dashboards.
* Do not create log groups.
* Do not change retention.
* Avoid high-ingestion logging.
* Avoid paid third-party tools.

## 17. What Not to Change Yet

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
* SNS topics,
* subscriptions,
* CloudWatch dashboards,
* log groups,
* CloudWatch Logs ingestion,
* CloudWatch Agent,
* CloudFront standard logs,
* S3 access logs,
* RDS enhanced monitoring,
* monitoring/detail settings.

Do not run Prisma commands.

## 18. Expected Output Before Execution

Expected output before a future execution phase:

* selected first alarm list,
* final threshold choices based on observed baseline,
* severity assignment for each alarm,
* notification approach,
* troubleshooting notes for each alarm,
* confirmation that alarm count remains small and actionable,
* decision on whether budget/billing alarm planning is included.

## 19. Proposed Next Phase

Recommended next phase:

* Phase 8E: Basic CloudWatch Alarm Execution Guide

Alternative if alarms are deferred:

* Phase 8E: Monitoring and Logging Execution Report

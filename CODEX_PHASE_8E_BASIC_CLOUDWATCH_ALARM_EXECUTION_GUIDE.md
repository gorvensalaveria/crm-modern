# CODEX Phase 8E: Basic CloudWatch Alarm Execution Guide

## 1. Phase Name and Purpose

Phase 8E prepares a safe manual AWS Console execution guide for creating the first small set of CloudWatch alarms for the CRM Modern AWS deployment.

This phase is documentation/guide-only. It does not create alarms, modify AWS resources, create SNS topics, subscribe emails, run commands, or change production infrastructure.

The goal is to guide a later manual execution phase while keeping the alarm set small, actionable, low-noise, and safe.

## 2. Preconditions Before Creating Alarms

Before creating alarms manually:

* Phase 8B metrics baseline should be reviewed first.
* Phase 8D alarm plan should be accepted.
* User should be signed in to AWS Console.
* User should be in the correct AWS region for regional resources:
  * `ap-southeast-1` for EC2/RDS resources.
* CloudFront is global, so CloudFront alarm views may appear under global/CloudFront metrics.
* User should avoid screenshots containing account metadata.
* User should not paste sensitive values into reports or chat.

Thresholds in this guide are initial baseline-informed suggestions, not final production guarantees. Actual values should be adjusted after reviewing Phase 8B baseline observations.

## 3. Approved First Alarm Set

Approved first alarm set:

1. `crm-modern-prod-ec2-status-check-failed`
2. `crm-modern-prod-ec2-high-cpu`
3. `crm-modern-prod-rds-high-cpu`
4. `crm-modern-prod-rds-low-free-storage`
5. `crm-modern-prod-rds-high-connections`
6. `crm-modern-frontend-cloudfront-high-5xx`
7. `crm-modern-frontend-cloudfront-high-4xx`

Optional later:

8. `crm-modern-budget-cost-safety`

Keep the initial alarm set small and actionable.

## 4. AWS Console Navigation Overview

CloudWatch alarm creation path:

```text
AWS Console -> CloudWatch -> Alarms -> All alarms -> Create alarm
```

EC2 metrics path inside alarm creation:

```text
Select metric -> EC2 -> Per-Instance Metrics
```

Find/select the EC2 instance by name/context:

```text
crm-modern-prod-ec2
```

RDS metrics path inside alarm creation:

```text
Select metric -> RDS -> Per-Database Metrics
```

Find/select the DB identifier:

```text
crm-modern-prod-rds-postgres
```

CloudFront metrics path inside alarm creation:

```text
Select metric -> CloudFront metrics/distribution metrics
```

Find/select the distribution:

```text
E1GAUKBY4OYYQZ
```

CloudFront distribution name/comment:

```text
crm-modern-frontend-cloudfront
```

CloudFront URL:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

Do not document EC2 public IP/DNS, private IPs, RDS endpoint, account IDs, ARNs, or screenshots containing metadata.

## 5. EC2 Status Check Alarm Steps

Alarm name:

```text
crm-modern-prod-ec2-status-check-failed
```

Resource:

```text
crm-modern-prod-ec2
```

Metric:

```text
StatusCheckFailed
```

Initial behavior:

* alarm when status check failed for more than one evaluation period.

Severity:

```text
Critical
```

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select metric.
4. Choose EC2 per-instance metrics.
5. Select the metric for `crm-modern-prod-ec2`.
6. Choose `StatusCheckFailed`.
7. Configure threshold for failed status checks over more than one evaluation period.
8. Use notification-only planning unless a later phase approves actions.
9. Do not add EC2 recovery, stop, terminate, or reboot actions.
10. Name the alarm `crm-modern-prod-ec2-status-check-failed`.

What to check if it fires:

* EC2 instance status checks,
* Nginx availability,
* Docker/API container status,
* recent AWS events.

## 6. EC2 High CPU Alarm Steps

Alarm name:

```text
crm-modern-prod-ec2-high-cpu
```

Resource:

```text
crm-modern-prod-ec2
```

Metric:

```text
CPUUtilization
```

Initial threshold suggestion:

```text
above 80% for 10-15 minutes
```

Severity:

```text
Warning
```

Caveat:

* final threshold should depend on Phase 8B baseline observations.

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select EC2 per-instance metric for `crm-modern-prod-ec2`.
4. Choose `CPUUtilization`.
5. Configure a sustained high CPU threshold based on baseline.
6. Start with the suggested 80% / 10-15 minute concept only if it matches the baseline.
7. Use notification-only planning unless approved otherwise.
8. Name the alarm `crm-modern-prod-ec2-high-cpu`.

What to check if it fires:

* Nginx access patterns,
* Docker/API logs,
* traffic spike,
* possible runaway process.

## 7. RDS High CPU Alarm Steps

Alarm name:

```text
crm-modern-prod-rds-high-cpu
```

Resource:

```text
crm-modern-prod-rds-postgres
```

Metric:

```text
CPUUtilization
```

Initial threshold suggestion:

```text
above 80% for 10-15 minutes
```

Severity:

```text
Warning
```

Caveat:

* final threshold should depend on Phase 8B baseline observations.

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select RDS per-database metric.
4. Select DB identifier `crm-modern-prod-rds-postgres`.
5. Choose `CPUUtilization`.
6. Configure a sustained high CPU threshold based on baseline.
7. Use notification-only planning unless approved otherwise.
8. Name the alarm `crm-modern-prod-rds-high-cpu`.

What to check if it fires:

* API errors,
* query/runtime errors,
* database connection count,
* recent traffic or deployment changes.

Do not document the RDS endpoint.

## 8. RDS Low Free Storage Alarm Steps

Alarm name:

```text
crm-modern-prod-rds-low-free-storage
```

Resource:

```text
crm-modern-prod-rds-postgres
```

Metric:

```text
FreeStorageSpace
```

Initial threshold guidance:

* select threshold after checking allocated storage and baseline,
* use a conservative low-space threshold,
* do not include exact current storage values from screenshots.

Severity:

```text
Critical
```

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select RDS per-database metric.
4. Select DB identifier `crm-modern-prod-rds-postgres`.
5. Choose `FreeStorageSpace`.
6. Configure a conservative low-space threshold based on actual allocated storage and baseline.
7. Use notification-only planning unless approved otherwise.
8. Name the alarm `crm-modern-prod-rds-low-free-storage`.

What to check if it fires:

* RDS storage trend,
* database growth,
* logs/backups/configuration if relevant,
* whether growth is expected.

## 9. RDS High Database Connections Alarm Steps

Alarm name:

```text
crm-modern-prod-rds-high-connections
```

Resource:

```text
crm-modern-prod-rds-postgres
```

Metric:

```text
DatabaseConnections
```

Initial threshold guidance:

* threshold should be based on observed normal connection count.

Severity:

```text
Warning
```

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select RDS per-database metric.
4. Select DB identifier `crm-modern-prod-rds-postgres`.
5. Choose `DatabaseConnections`.
6. Configure a threshold based on the baseline normal connection count.
7. Use notification-only planning unless approved otherwise.
8. Name the alarm `crm-modern-prod-rds-high-connections`.

What to check if it fires:

* API connection pool behavior,
* application errors,
* traffic spikes,
* stuck or repeated requests.

## 10. CloudFront High 5xx Alarm Steps

Alarm name:

```text
crm-modern-frontend-cloudfront-high-5xx
```

Resource:

```text
E1GAUKBY4OYYQZ
```

Metric:

```text
5xxErrorRate
```

Initial threshold guidance:

* alarm if sustained above a small non-zero percentage for several evaluation periods.

Severity:

```text
Critical
```

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select CloudFront distribution metrics.
4. Select distribution `E1GAUKBY4OYYQZ`.
5. Choose `5xxErrorRate`.
6. Configure a sustained small non-zero threshold based on baseline.
7. Use notification-only planning unless approved otherwise.
8. Name the alarm `crm-modern-frontend-cloudfront-high-5xx`.

What to check if it fires:

* CloudFront monitoring,
* S3 object availability,
* recent deployment,
* invalidation status,
* frontend route behavior.

## 11. CloudFront High 4xx Alarm Steps

Alarm name:

```text
crm-modern-frontend-cloudfront-high-4xx
```

Resource:

```text
E1GAUKBY4OYYQZ
```

Metric:

```text
4xxErrorRate
```

Initial threshold guidance:

* alarm if unexpectedly high compared with baseline.

Severity:

```text
Warning
```

Caveat:

* occasional 4xx may be normal from bad paths, browser behavior, or expired routes.

Manual AWS Console steps:

1. Go to CloudWatch alarms.
2. Choose Create alarm.
3. Select CloudFront distribution metrics.
4. Select distribution `E1GAUKBY4OYYQZ`.
5. Choose `4xxErrorRate`.
6. Configure a threshold based on what is unusual compared with baseline.
7. Use notification-only planning unless approved otherwise.
8. Name the alarm `crm-modern-frontend-cloudfront-high-4xx`.

What to check if it fires:

* CloudFront error metrics,
* SPA fallback behavior,
* S3 object structure,
* recent frontend deployment,
* whether errors are explainable.

## 12. Optional Budget/Billing Alarm Note

Optional later alarm:

```text
crm-modern-budget-cost-safety
```

Recommended approach:

* check whether an AWS Budget or billing alert already exists,
* if not, plan one separately for cost safety,
* do not create it in this phase,
* do not document account ID or billing screenshots.

## 13. Notification/SNS Planning Note

For this guide, use one of these approaches:

* no alarm action initially, then add SNS later after planning,
* existing SNS topic only if already configured.

Do not create in this guide:

* SNS topics,
* subscriptions,
* email subscriptions.

Do not include:

* personal email addresses,
* Certbot account email.

Do not add EC2 recovery, stop, terminate, or reboot actions.

Notification-only planning should remain the default unless explicitly approved later.

## 14. Alarm Naming Convention

Recommended naming pattern:

```text
<project>-<environment>-<resource>-<symptom>
```

Examples:

```text
crm-modern-prod-ec2-status-check-failed
crm-modern-prod-rds-low-free-storage
crm-modern-frontend-cloudfront-high-5xx
```

Names should clearly identify:

* project,
* environment,
* resource,
* symptom.

## 15. Suggested Initial Threshold Guidance

Initial threshold guidance:

* EC2 status check:
  * metric: `StatusCheckFailed`
  * alarm when status check failed for more than one evaluation period
  * severity: Critical
* EC2 high CPU:
  * metric: `CPUUtilization`
  * initial suggestion: above 80% for 10-15 minutes
  * severity: Warning
  * final value should depend on baseline
* RDS high CPU:
  * metric: `CPUUtilization`
  * initial suggestion: above 80% for 10-15 minutes
  * severity: Warning
  * final value should depend on baseline
* RDS low free storage:
  * metric: `FreeStorageSpace`
  * threshold should be selected after checking allocated storage and baseline
  * use a conservative low-space threshold
  * severity: Critical
  * do not include exact current storage values from screenshots
* RDS high database connections:
  * metric: `DatabaseConnections`
  * threshold should be based on observed normal connection count
  * severity: Warning
* CloudFront high 5xx:
  * metric: `5xxErrorRate`
  * alarm if sustained above a small non-zero percentage for several evaluation periods
  * severity: Critical
* CloudFront high 4xx:
  * metric: `4xxErrorRate`
  * alarm if unexpectedly high compared with baseline
  * severity: Warning

These are initial baseline-informed suggestions, not final production guarantees.

## 16. Verification After Creation

After manual alarm creation, verify:

* alarm exists in CloudWatch Alarms list,
* alarm name matches approved naming,
* metric/resource is correct,
* threshold/evaluation period is documented,
* notification/action setting is documented,
* alarm state is one of:
  * `OK`,
  * `ALARM`,
  * `INSUFFICIENT_DATA`,
* no unexpected resources were created,
* no sensitive data was documented.

## 17. What to Document After Creation

After manual execution, document:

* created alarm names,
* metrics used,
* approximate thresholds/evaluation periods,
* severity,
* notification setting without email address,
* initial alarm state,
* any alarms skipped/deferred,
* any AWS warnings observed, sanitized,
* confirmation that no account IDs, ARNs, IPs, endpoints, screenshots with metadata, or secrets were documented.

## 18. Rollback/Delete Guidance

If an alarm is wrong or noisy:

* disable actions if configured,
* update threshold/evaluation periods,
* or delete the alarm.

Do not delete unrelated alarms.

Record what was changed in an execution report.

Do not modify the app or infrastructure to satisfy an alarm unless evidence supports it.

## 19. Security and Cost-Control Boundaries

Security boundaries:

* Do not include EC2 public IP/DNS.
* Do not include private IPs.
* Do not include RDS endpoint.
* Do not include database credentials.
* Do not include `DATABASE_URL`.
* Do not include full env file contents.
* Do not include DuckDNS token.
* Do not include Certbot account email.
* Do not include private key paths/material.
* Do not include AWS account ID.
* Do not include IAM role ARN.
* Do not include GitHub secrets.
* Do not include personal notification email addresses.
* Do not include screenshots containing account metadata.
* Do not include exact user/client IPs from logs.
* Do not include raw logs.

Cost-control boundaries:

* Keep alarm count small.
* Do not enable paid/high-ingestion features.
* Do not enable detailed monitoring.
* Do not enable CloudWatch Logs ingestion.
* Do not create dashboards.
* Do not create log groups.
* Do not install agents.
* Do not use third-party monitoring tools.

## 20. What Not to Create Yet

Do not create yet:

* memory usage alarm,
* disk usage alarm,
* Docker container-specific alarms,
* Nginx log-based metric filters,
* API custom application metrics,
* Prometheus/Grafana alerts,
* ELK/OpenSearch alerts,
* Datadog/New Relic alerts,
* CloudWatch dashboards,
* CloudWatch log groups,
* CloudWatch Agent,
* CloudFront standard logs,
* S3 access logs,
* RDS enhanced monitoring,
* EC2 recovery/reboot/stop/terminate alarm actions.

## 21. Expected Execution Report After Manual Completion

Expected report after manual completion:

* phase name and purpose,
* alarms created,
* alarms skipped/deferred,
* metrics and resources used,
* approximate thresholds/evaluation periods,
* severity for each alarm,
* notification/action setting without email address,
* initial alarm states,
* verification result,
* rollback/delete notes if needed,
* security boundaries confirmation,
* cost-control confirmation,
* what was not created or modified.

## 22. Proposed Next Phase

Recommended next phase:

* Phase 8F: Monitoring and Logging Execution Report

Alternative after AWS-native monitoring is complete:

* Phase 8F: Optional Prometheus/Grafana Expansion Planning

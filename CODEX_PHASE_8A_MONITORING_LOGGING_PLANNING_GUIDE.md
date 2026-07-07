# CODEX Phase 8A: Monitoring and Logging Planning Guide

## 1. Phase Name and Purpose

Phase 8A plans practical monitoring and logging for the CRM Modern / Modern Fullstack AWS deployment.

This phase is documentation/planning-only. It does not modify AWS resources, install agents, create alarms, enable logs, change infrastructure, run commands, or touch production.

The goal is to define a safe, low-cost observability plan that helps answer:

* Is the app healthy?
* Is the backend reachable?
* Is EC2 healthy?
* Is RDS healthy?
* Are CloudFront requests succeeding?
* Where are backend, Docker, and Nginx logs?
* What should trigger an alarm?
* What can be checked manually during incidents?

## 2. Why Monitoring/Logging Matters for DevOps/Cloud

Monitoring and logging turn a deployed app into an operable system.

For a DevOps/cloud portfolio project, this matters because it demonstrates:

* health-check thinking,
* incident response basics,
* infrastructure visibility,
* log-driven troubleshooting,
* alert design,
* cost-aware operations,
* separation of application, infrastructure, and deployment signals.

The first goal is not to build a large observability platform. The first goal is to know where to look, what normal looks like, and what should trigger investigation.

## 3. Current Architecture to Observe

Project:

```text
CRM Modern / Modern Fullstack
```

Current production architecture:

* Frontend: S3 + CloudFront
* Frontend URL: `https://d3k197cbnbmhh7.cloudfront.net`
* Backend API: EC2 + Docker + Nginx + HTTPS
* Backend API base: `https://aucrm.duckdns.org/api/...`
* Database: private RDS PostgreSQL
* CI/CD: GitHub Actions frontend deployment using AWS OIDC

Current deployment state:

* Frontend CI/CD is complete.
* GitHub Actions deploys `client/dist` to S3.
* CloudFront invalidation works.
* Browser verification passed.
* Backend CI/CD is not yet automated.
* Infrastructure is manually created, not Terraform/IaC-managed yet.

## 4. Recommended AWS-Native Monitoring Scope

Start AWS-native and simple:

* CloudWatch Metrics
* CloudWatch Logs where appropriate
* CloudWatch Alarms
* EC2 metrics
* RDS metrics
* CloudFront metrics
* S3/CloudFront access visibility basics

Start with local/manual log review before centralized log ingestion:

* Docker logs for the API container
* Nginx access/error logs
* system logs if needed
* Certbot renewal status/log awareness
* GitHub Actions deployment logs from workflow runs

Avoid overbuilding initially:

* no Prometheus/Grafana installation yet,
* no ELK/OpenSearch stack yet,
* no Datadog/New Relic yet,
* no Kubernetes/EKS,
* no ECS migration,
* no Terraform conversion in this phase.

## 5. EC2 Monitoring Plan

Recommended EC2 metrics to review:

* CPU utilization
* status checks
* network in/out

Important caveats:

* Standard EC2 CloudWatch metrics do not include disk usage by default.
* Standard EC2 CloudWatch metrics do not include memory usage by default.
* Disk and memory visibility usually require CloudWatch Agent or another host-level agent.

Recommended first approach:

* Use standard EC2 CloudWatch metrics first.
* Add basic alarms later for status check failures and sustained high CPU.
* Defer CloudWatch Agent installation to a later execution phase.
* Keep manual disk/memory checks in the troubleshooting runbook until agent-based metrics are approved.

## 6. Docker/API Container Log Plan

Primary API runtime logs should be reviewed from the API container.

Recommended log source:

```text
docker logs
```

Planning goals:

* identify the API container by name during the execution phase,
* document how to view recent logs,
* document how to follow logs during an incident,
* avoid printing secrets or full environment values,
* avoid enabling high-volume centralized log ingestion until retention and cost are planned.

Useful incident questions:

* Is the API container running?
* Is the API returning health checks?
* Are there repeated application errors?
* Are database connection errors visible?
* Did errors begin after a deploy or restart?

## 7. Nginx Access/Error Log Plan

Nginx is the public HTTPS reverse proxy for the backend API.

Recommended log paths to document:

```text
/var/log/nginx/access.log
```

```text
/var/log/nginx/error.log
```

Nginx access logs can help answer:

* are requests reaching the server?
* which paths are returning 2xx, 4xx, or 5xx?
* are health checks reaching `/api/health`?
* are requests being proxied as expected?

Nginx error logs can help answer:

* is Nginx failing to proxy to the API container?
* are there TLS or certificate-related issues?
* are there permission/configuration errors?

Do not expose logs publicly. Do not paste logs containing private headers, tokens, IP-sensitive information, or request bodies.

## 8. RDS Monitoring Plan

Recommended RDS metrics to review:

* CPU utilization
* free storage space
* database connections
* freeable memory
* read latency
* write latency
* backup/availability checks

Recommended first alarms to consider later:

* high CPU,
* low free storage,
* high database connections.

RDS remains private. Monitoring should not expose the RDS endpoint, database credentials, `DATABASE_URL`, or query contents with private data.

## 9. CloudFront Monitoring Plan

Recommended CloudFront metrics to review:

* requests
* bytes downloaded/uploaded
* 4xx error rate
* 5xx error rate
* cache hit rate if available
* invalidation visibility

Useful operational questions:

* is CloudFront serving the frontend?
* are 4xx errors increasing?
* are 5xx errors increasing?
* did a recent invalidation complete?
* are users likely receiving the latest frontend after deployment?

Recommended first alarms to consider later:

* high 5xx error rate,
* high 4xx error rate.

CloudFront standard logs should not be enabled in this phase. If added later, retention and cost should be planned first.

## 10. S3 Frontend Visibility Plan

S3 hosts the frontend build objects behind CloudFront.

Recommended visibility checks:

* confirm `index.html` exists at the bucket root,
* confirm `assets/` exists at the bucket root,
* confirm deploy workflow uploads build output to the correct structure,
* confirm CloudFront serves the frontend rather than direct public S3 website hosting.

S3 access logging is not recommended in this planning phase. If enabled later, it should use a controlled destination and retention plan.

## 11. GitHub Actions Deployment Visibility Plan

GitHub Actions already provides deployment visibility through workflow run logs.

Recommended workflow visibility checks:

* CI workflow status,
* deploy workflow run status,
* deploy workflow duration,
* failed step name,
* S3 upload step output,
* CloudFront invalidation step output,
* warnings such as runtime/action deprecation notices.

Frontend deployment should continue to treat the CI workflow as a pre-deployment quality gate.

## 12. Basic Alarm Recommendations

Basic alarms to consider in later phases:

* EC2 status check failed,
* EC2 high CPU,
* RDS high CPU,
* RDS low free storage,
* RDS high connections,
* CloudFront high 5xx error rate,
* CloudFront high 4xx error rate,
* optional billing/budget alarm if not already present.

Alarm design should start conservative:

* avoid noisy thresholds,
* prefer actionable alerts,
* document what the user should check when an alarm fires,
* avoid paid or high-ingestion features until needed.

## 13. Manual Troubleshooting Runbook Outline

Recommended manual incident flow:

1. Check frontend availability.
   * Open the CloudFront frontend URL.
   * Confirm the app loads.
   * Confirm role selection and dashboard behavior.

2. Check backend health.
   * Verify the public backend health endpoint through HTTPS.
   * Confirm API integration from the frontend.

3. Check GitHub Actions.
   * Confirm latest CI run status.
   * Confirm latest frontend deploy workflow status.
   * Review failed step logs if a deployment failed.

4. Check CloudFront.
   * Review request/error metrics.
   * Check recent invalidation status.
   * Check for 4xx/5xx spikes.

5. Check EC2.
   * Review EC2 status checks.
   * Review CPU and network metrics.
   * Use manual disk/memory checks only in an approved execution phase.

6. Check Nginx logs.
   * Review access log for request status patterns.
   * Review error log for proxy/TLS/config errors.

7. Check Docker/API logs.
   * Review recent API container logs.
   * Look for application errors or database connection failures.

8. Check RDS.
   * Review CPU, storage, memory, connection, and latency metrics.
   * Confirm there are no availability or backup issues.

9. Escalate only after evidence.
   * Avoid restarting services blindly.
   * Avoid infrastructure changes until the likely failure layer is identified.

## 14. Security and Cost-Control Boundaries

Security boundaries:

* Do not expose logs publicly.
* Do not put secrets into CloudWatch Logs.
* Do not document private infrastructure values.
* Do not paste full logs containing sensitive headers, tokens, credentials, or private request data.
* Keep RDS private.
* Keep backend runtime secrets out of monitoring documentation.

Cost-control boundaries:

* Prefer low-cost/free-tier-aware monitoring.
* Avoid high-ingestion logging until needed.
* Avoid enabling verbose logs everywhere without retention controls.
* Recommend short/controlled log retention if CloudWatch Logs is added.
* Avoid paid third-party tools for now.
* Avoid NAT Gateway, ALB, ECS/EKS, or large observability stacks in this phase.

## 15. What Not to Monitor or Expose

Do not monitor or expose:

* database credentials,
* `DATABASE_URL`,
* full env file contents,
* DuckDNS token,
* Certbot account email,
* private key paths or material,
* AWS account ID,
* IAM role ARN,
* GitHub secrets,
* RDS endpoint,
* EC2 public IP/DNS,
* private IPs,
* user public IP,
* screenshots containing account metadata,
* logs containing secrets or sensitive request data.

Do not recommend public access to logs or dashboards.

## 16. What Not to Change Yet

Do not change yet:

* EC2 configuration,
* Docker configuration,
* running containers,
* Nginx configuration,
* Certbot configuration,
* DuckDNS configuration,
* RDS configuration,
* S3 configuration,
* CloudFront configuration,
* IAM policies or roles,
* GitHub Actions workflows,
* CloudWatch alarms,
* CloudWatch log groups,
* log retention policies,
* CloudFront standard logs,
* RDS enhanced monitoring,
* dashboards,
* CloudWatch Agent installation,
* Terraform/IaC conversion.

## 17. Proposed Phase 8 Subphases

Recommended Phase 8 subphases:

* Phase 8B: CloudWatch Metrics Baseline Review
* Phase 8C: EC2/Nginx/Docker Log Collection Strategy
* Phase 8D: Basic CloudWatch Alarms
* Phase 8E: Monitoring and Logging Execution Report
* Phase 8F: Optional Prometheus/Grafana Expansion Planning

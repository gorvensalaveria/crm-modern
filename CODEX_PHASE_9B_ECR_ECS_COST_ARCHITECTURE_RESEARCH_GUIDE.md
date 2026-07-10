# CODEX Phase 9B: ECR/ECS Cost and Architecture Research Guide

## 1. Phase Name and Purpose

Phase 9B researches Option D from the backend CI/CD planning phase: using Amazon ECR and Amazon ECS as a future backend deployment architecture for CRM Modern.

This phase is documentation/research/planning-only. It does not choose ECS, implement ECS, create AWS resources, modify infrastructure, modify workflows, or touch production.

The purpose is to understand cost, architecture, tradeoffs, migration paths, and timing before deciding whether ECR/ECS is practical now or should be deferred.

## 2. Why ECR/ECS Is Job-Relevant

ECR/ECS is job-relevant because it represents a common cloud-native container deployment pattern:

* ECR stores versioned container images.
* ECS runs containerized workloads as managed services.
* Fargate removes direct EC2 host management.
* ECS on EC2 teaches cluster capacity management.
* ECS deployments connect naturally to GitHub Actions, IAM, CloudWatch, ALB, security groups, and private databases.

For a Cloud/DevOps portfolio, ECR/ECS demonstrates a stronger production-style container story than manually rebuilding a Docker container on one EC2 instance.

## 3. Why ECR/ECS Needs Cost Research Before Adoption

ECS itself is not the only cost. The architecture around ECS can add recurring monthly spend.

Costs can come from:

* Fargate task runtime,
* ALB hourly and usage-based charges,
* NAT Gateway hourly and per-GB processing charges,
* CloudWatch Logs ingestion and storage,
* ECR image storage,
* data transfer,
* additional networking or supporting resources.

Prices vary by region and usage. Exact cost estimates should be calculated with AWS Pricing Calculator before implementation.

Because the project still has limited AWS free-plan credits and limited free-plan time remaining, recurring monthly resources matter more than one-time setup complexity.

## 4. Current Architecture Baseline

Current backend architecture:

* Backend API: EC2 + Docker + Nginx + HTTPS
* Backend API base: `https://aucrm.duckdns.org/api/...`
* Database: private RDS PostgreSQL
* Backend runtime: Docker container on EC2
* Nginx reverse proxy handles HTTPS and proxies `/api/` traffic to the local API container.

Current project state:

* Phase 7 completed frontend CI/CD with GitHub Actions, OIDC, S3, and CloudFront.
* Phase 8 completed AWS-native monitoring/alarm setup.
* Phase 9A created the backend CI/CD planning guide.
* Backend CI/CD is not yet automated.
* Infrastructure is manually created, not Terraform/IaC-managed yet.

## 5. Target Architecture Options to Compare

### Option D1: ECS Fargate + ECR + ALB + Existing Private RDS

This is the most cloud-native near-term ECS target.

High-level shape:

* GitHub Actions builds backend image.
* Image is pushed to ECR.
* ECS Fargate runs the backend container.
* ALB receives public HTTPS/API traffic.
* ECS tasks connect safely to existing private RDS.

### Option D2: ECS on EC2 Launch Type + ECR + ECS-Managed EC2 Capacity

This keeps EC2-style capacity while using ECS orchestration.

High-level shape:

* GitHub Actions builds and pushes image to ECR.
* ECS schedules containers onto EC2 container instances.
* The user still manages EC2 capacity, patching, and cluster hosts.

### Option D3: Hybrid Transition: Keep Current EC2 Backend, Add ECR First

This is a cost-conscious transition.

High-level shape:

* Keep current EC2 + Docker + Nginx backend.
* Add ECR as an image registry.
* CI builds and pushes backend images to ECR.
* EC2 pulls a selected image during a controlled backend deploy.

### Option D4: Defer ECS, Use SSM Run Command Backend CI/CD First

This keeps the current architecture and focuses on safer backend deployment automation first.

High-level shape:

* Keep EC2 + Docker + Nginx.
* Use GitHub Actions OIDC where appropriate.
* Use AWS Systems Manager Run Command for controlled EC2 deployment steps.
* Revisit ECS after cost and architecture are better understood.

## 6. ECR Cost Considerations

ECR is a managed container image registry.

Potential cost drivers:

* image storage,
* image pull/push data transfer,
* cross-region or outbound transfer if used,
* stale image accumulation.

Cost-control notes:

* keep images in the same region as compute where practical,
* avoid storing many unnecessary old images,
* consider lifecycle policies later,
* avoid cross-region image movement unless needed.

Same-region transfer between ECR and AWS compute services is generally more favorable than cross-region or outbound patterns, but exact costs should be confirmed before implementation.

## 7. ECS Fargate Cost Considerations

ECS Fargate avoids managing EC2 capacity, but charges for task runtime.

Potential cost drivers:

* vCPU allocation,
* memory allocation,
* ephemeral storage allocation if above defaults,
* number of running tasks,
* 24/7 runtime,
* CloudWatch logs from tasks,
* ALB and networking resources around the service.

Cost-control notes:

* start with one small task if approved later,
* avoid over-provisioning CPU and memory,
* avoid always-on extra services,
* confirm monthly estimate before creating resources.

Fargate is likely the most job-relevant long-term path, but it may be more expensive than the current EC2-only backend.

## 8. ECS on EC2 Cost Considerations

ECS on EC2 can reuse EC2-style capacity, but it does not remove host management.

Potential cost drivers:

* EC2 instance runtime,
* EBS storage,
* data transfer,
* CloudWatch logs,
* ALB if used,
* operational cost of managing EC2 container instances.

Tradeoffs:

* can be cheaper if EC2 capacity is already needed,
* provides more control over hosts,
* requires patching, scaling, and capacity management,
* is more operationally complex than Fargate.

This option may teach more low-level operations, but it is less clean than Fargate for a simple managed-container story.

## 9. Application Load Balancer Cost Considerations

An ALB may be needed if ECS becomes the public backend entry point.

Potential cost drivers:

* hourly ALB charge,
* usage-based LCU charge,
* data transfer,
* access logging if enabled later.

Why it matters:

* ALB can add a meaningful monthly baseline cost even for low traffic.
* ALB may require changes to routing, HTTPS, security groups, and health checks.
* The current backend uses Nginx/Certbot on EC2 for HTTPS, so ALB would change the public entry-point model.

The ALB cost should be estimated before choosing ECS Fargate as the near-term architecture.

## 10. NAT Gateway Cost Risk

NAT Gateway is a major cost-risk area.

Potential cost drivers:

* hourly NAT Gateway charge,
* per-GB data processing,
* cross-AZ routing patterns if misconfigured.

Why it matters:

* Private ECS tasks may need outbound internet access for image pulls, package calls, or external APIs unless VPC endpoints or other architecture choices are used.
* NAT Gateway can become one of the most surprising recurring costs in learner projects.

Cost-control recommendation:

* avoid NAT Gateway if possible in this stage,
* research whether public subnet tasks, VPC endpoints, or the current EC2 architecture can avoid it,
* do not create NAT Gateway without a specific cost estimate and approval.

## 11. CloudWatch Logs/Metrics Cost Considerations

ECS commonly sends container logs to CloudWatch Logs.

Potential cost drivers:

* log ingestion,
* log storage,
* long retention periods,
* high-volume application logs,
* additional dashboards or custom metrics later.

Cost-control notes:

* set explicit short retention if CloudWatch Logs are enabled later,
* avoid verbose logs in production,
* avoid logging secrets or request bodies,
* keep observability useful but modest.

CloudWatch metrics are valuable, but logging volume and retention should be planned before enabling ECS task logs.

## 12. RDS Connectivity Considerations

Existing RDS is private. ECS tasks must be placed in networking that can reach RDS safely.

Planning areas:

* VPC/subnet placement,
* ECS task security group,
* RDS security group inbound rules,
* database credentials handling,
* no public RDS exposure,
* no database endpoint documentation in public docs.

Any ECS design must preserve:

* RDS remains private,
* database credentials are not added to logs,
* `DATABASE_URL` is not exposed,
* database access is limited to approved backend runtime paths.

## 13. HTTPS/Domain Routing Considerations

Current backend HTTPS terminates at Nginx/Certbot on EC2.

Current frontend API calls target:

```text
https://aucrm.duckdns.org/api/...
```

If ECS + ALB becomes the backend entry point, routing may need to change.

Considerations:

* ALB HTTPS usually uses ACM certificates.
* DuckDNS/Nginx/Certbot setup may no longer be the main public API entry point.
* The frontend build value may need to remain stable or be updated.
* CloudFront frontend CORS allowlist may need review if API origin changes.
* Custom domain and certificate planning may become necessary later.

Do not change HTTPS, DNS, Certbot, or frontend API routing in this research phase.

## 14. CI/CD Deployment Model With GitHub Actions OIDC

The preferred authentication model remains:

```text
GitHub Actions OIDC
```

Possible ECR/ECS CI/CD flow later:

* CI runs tests/typecheck/build.
* GitHub Actions assumes an AWS IAM role through OIDC.
* Backend Docker image is built.
* Image is pushed to ECR.
* ECS service is updated to a new image/task definition.
* Health checks and alarms are reviewed.

This is not implemented in Phase 9B. It is only the likely target model if ECR/ECS is approved later.

## 15. Security/IAM Considerations

ECR/ECS requires more IAM planning than current EC2-only deployment.

Potential IAM surfaces:

* GitHub Actions OIDC role,
* ECR push/pull permissions,
* ECS task execution role,
* ECS task role,
* CloudWatch Logs permissions,
* Secrets Manager or SSM Parameter Store access if used later,
* ALB/ECS service update permissions if CI/CD manages deployment.

Security principles:

* use least privilege,
* avoid long-lived AWS access keys,
* do not expose runtime secrets,
* do not put database credentials into GitHub unless explicitly approved through a secure model,
* keep RDS private,
* avoid broad IAM permissions.

## 16. Migration Complexity and Rollback Considerations

Moving from EC2 + Docker + Nginx to ECR/ECS is an architecture migration, not just a deployment workflow change.

Migration complexity includes:

* container image registry setup,
* ECS cluster/service/task definition setup,
* networking and security groups,
* RDS connectivity,
* environment/secrets handling,
* HTTPS/domain routing,
* health checks,
* deployment workflow changes,
* monitoring/logging changes,
* rollback planning.

Rollback considerations:

* keep the current EC2 backend working until ECS is verified,
* do not tear down Nginx/EC2 backend early,
* validate ECS health independently before switching traffic,
* database migrations remain harder to roll back than container images,
* avoid destructive migrations during architecture transition.

## 17. Portfolio Value Comparison

Portfolio value by option:

* D1 ECS Fargate + ECR + ALB: strongest cloud-native container deployment story, highest architecture and cost complexity.
* D2 ECS on EC2 + ECR: useful for learning ECS capacity management, but more operational burden.
* D3 ECR-first hybrid: good transition step that adds registry-based deployment without full architecture migration.
* D4 SSM Run Command first: practical near-term backend CI/CD while preserving the current architecture.

The strongest long-term resume signal is likely D1. The most cost-conscious near-term path may be D3 or D4.

## 18. Cost-Control Recommendations

Recommended cost-control posture:

* use AWS Pricing Calculator before implementation,
* do not hardcode unverified pricing assumptions,
* avoid NAT Gateway unless clearly justified,
* avoid ALB until its monthly baseline cost is accepted,
* avoid high-volume CloudWatch Logs,
* avoid creating always-on resources during research,
* consider ECR-only as a transition step,
* consider SSM Run Command if ECS cost is too high right now,
* keep current EC2 backend until migration risk and cost are acceptable.

## 19. Architecture Options Comparison Table

| Option | Architecture | Portfolio Value | Cost Risk | Complexity | Near-Term Fit |
| --- | --- | --- | --- | --- | --- |
| D1 | ECS Fargate + ECR + ALB + existing private RDS | Highest | Higher | Higher | Good only after cost approval |
| D2 | ECS on EC2 + ECR | High | Medium | Higher | Useful but operationally heavier |
| D3 | Current EC2 backend + ECR image registry | Medium-high | Lower | Medium | Strong transition option |
| D4 | Current EC2 backend + SSM Run Command CI/CD | Medium | Lower | Medium | Strong practical near-term option |

## 20. Recommendation Framework

Use this decision framework before choosing ECS:

1. Estimate monthly cost with AWS Pricing Calculator.
2. Identify whether ALB is required now.
3. Identify whether NAT Gateway can be avoided.
4. Confirm how ECS tasks will reach private RDS.
5. Confirm HTTPS/domain strategy.
6. Confirm secrets handling strategy.
7. Confirm rollback strategy.
8. Confirm whether the learning value justifies recurring cost.
9. Decide whether to implement D1, D2, D3, or defer to D4.

Suggested early direction to evaluate:

* Most job-relevant long-term: ECS Fargate + ECR + ALB.
* Most cost-conscious transition: keep current EC2 backend and optionally add ECR image registry first.
* Most practical near-term backend CI/CD if ECS cost is too high: SSM Run Command.
* Avoid NAT Gateway if possible in a learner-cost-controlled architecture.
* Do not migrate to ECS until cost model and architecture are approved.

## 21. What Not to Implement Yet

Do not implement yet:

* ECR repositories,
* ECS clusters,
* ECS task definitions,
* ECS services,
* ALB/NLB,
* target groups,
* NAT Gateway,
* new subnets or route tables,
* ACM certificates,
* DNS changes,
* new logging,
* CloudWatch log groups,
* Secrets Manager secrets,
* always-on infrastructure,
* GitHub Actions workflows,
* GitHub variables/secrets,
* IAM changes.

Do not modify:

* EC2,
* Docker,
* Nginx,
* Certbot,
* DuckDNS,
* RDS,
* S3,
* CloudFront,
* source code,
* package files,
* workflows.

## 22. Proposed Next Phase

Recommended next phase:

```text
Phase 9C: Backend Deployment Strategy Decision
```

Phase 9C should decide whether to:

* pursue ECS/Fargate research further with a real cost estimate,
* add ECR as a hybrid transition first,
* use SSM Run Command as the near-term backend CI/CD path,
* or defer ECS until credits, cost model, and architecture maturity make it safer.

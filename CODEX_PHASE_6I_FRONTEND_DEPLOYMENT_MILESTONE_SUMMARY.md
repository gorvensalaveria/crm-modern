# CODEX Phase 6I: Frontend Deployment Milestone Summary

## 1. Phase Name and Purpose

Phase 6I documents the completed Phase 6 frontend deployment milestone using S3 + CloudFront and integration with the existing HTTPS backend API.

This summary is documentation-only. It does not run commands, inspect files again, modify files, build or deploy frontend, modify AWS resources, or expose secrets.

## 2. Executive Summary

Phase 6 completed the public frontend deployment for the CRM Modern portfolio project.

The frontend deployment direction changed from same-EC2/Nginx hosting to S3 + CloudFront. The final frontend is served from CloudFront, backed by a private S3 bucket, and integrated with the existing HTTPS backend API.

Final public frontend:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

Backend API remains:

```text
https://aucrm.duckdns.org/api/...
```

Browser frontend/API integration works after the backend CORS update.

## 3. Why S3 + CloudFront Was Selected

S3 + CloudFront was selected because it is more AWS/cloud/DevOps portfolio-aligned than serving the frontend from the same EC2/Nginx server.

Reasons:

* Demonstrates static frontend hosting on AWS.
* Demonstrates private S3 origin access through CloudFront.
* Demonstrates CloudFront distribution setup.
* Demonstrates SPA fallback behavior for React Router.
* Demonstrates cross-origin frontend/backend integration and CORS troubleshooting.
* Keeps backend architecture separate and focused on EC2 + Docker + Nginx + RDS.

## 4. Final Frontend / Backend Architecture

Final Phase 6 architecture:

```text
User browser
  |
  | HTTPS
  v
CloudFront frontend
  |
  v
Private S3 bucket: crm-modern-frontend-aucrm

Frontend API calls
  |
  v
https://aucrm.duckdns.org/api/...
  |
  v
EC2 + Docker + Nginx + HTTPS backend
  |
  v
Private RDS PostgreSQL
```

Backend remained:

* EC2 + Docker + Nginx + HTTPS
* Private RDS PostgreSQL

## 5. Frontend Repo/Config Findings

Frontend inspection found:

* Frontend build command:

```bash
npm run build --workspace client
```

* Client build script:

```bash
tsc -b && vite build
```

* Build output:

```text
client/dist
```

* Frontend API env variable:

```text
VITE_API_BASE_URL
```

* API calls use:

```text
/api/...
```

Production build used:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

No frontend build secrets were found.

SPA fallback is needed because React Router is used.

## 6. S3 Deployment Summary

S3 bucket:

```text
crm-modern-frontend-aucrm
```

S3 region:

```text
ap-southeast-1
```

S3 object structure:

```text
index.html
assets/
```

Security posture:

* S3 bucket remained private.
* Block Public Access enabled.
* Object Ownership ACLs disabled.
* SSE-S3 encryption enabled.
* Versioning disabled.
* Object Lock disabled.

## 7. CloudFront Deployment Summary

CloudFront distribution:

```text
crm-modern-frontend-cloudfront
```

CloudFront URL:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

CloudFront configuration:

* S3 origin.
* Private S3 origin access through CloudFront.
* No WAF/security protections for cost control.
* No custom domain yet.
* Default root object: `index.html`.

## 8. SPA Fallback Summary

SPA fallback was configured:

* `403` -> `/index.html` -> `HTTP 200`
* `404` -> `/index.html` -> `HTTP 200`

This supports direct route refreshes and deep links for React Router routes.

## 9. Frontend Build and Upload Summary

Frontend was built locally using:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

Build output:

```text
client/dist
```

Uploaded S3 bucket root structure:

```text
index.html
assets/
```

## 10. CORS Issue and Resolution Summary

Initial frontend/backend browser integration failed because backend CORS did not allow the CloudFront origin.

CORS source path:

```text
server/src/app.ts
```

CORS env variable:

```text
CLIENT_ORIGIN
```

CORS allowed origin:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

After the backend CORS update:

* CORS GET verification succeeded.
* CORS OPTIONS/preflight succeeded.
* Browser roles/API loading worked.

## 11. Final Verification Evidence

Final verification evidence:

* CloudFront frontend loads.
* SPA route returns `HTTP 200`.
* Backend API remains HTTPS.
* Browser roles/API loading works.
* Frontend calls backend API at:

```text
https://aucrm.duckdns.org/api/...
```

CORS verification included the public CloudFront origin:

```text
Access-Control-Allow-Origin: https://d3k197cbnbmhh7.cloudfront.net
```

Preflight method support included:

```text
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

## 12. Security Posture

Security posture preserved:

* Private S3 bucket served through CloudFront.
* Backend remained EC2 + Docker + Nginx + HTTPS.
* RDS remained private.
* App port `4000` was not publicly opened.
* RDS port `5432` was not publicly opened.
* SSH was not broadened.
* RDS security group was not modified.
* No database changes were made.
* No staging, commit, or push was performed.

Sensitive values excluded:

* EC2 public IP/DNS
* User public IP
* DuckDNS token
* Certbot account email
* RDS endpoint
* Full `DATABASE_URL`
* Database password
* Full env file contents
* Private key path or material
* Screenshots containing private values

## 13. Cost-Control Decisions

Cost-control decisions:

* CloudFront WAF/security protections were not enabled for cost control.
* No custom domain was configured yet.
* Existing DuckDNS backend hostname remained in use.
* No Elastic IP was added as part of this phase.
* Frontend uses one S3 bucket and one CloudFront distribution.

## 14. Known Limitations and Caveats

Known limitations:

* CloudFront frontend currently uses the CloudFront default domain.
* No custom frontend domain is configured yet.
* No Route 53/ACM custom domain setup exists yet.
* No CI/CD exists yet for frontend deployment.
* CloudFront cache invalidation is manual for now.
* Backend deployment automation is not configured yet.
* Monitoring/logging hardening is not completed yet.

## 15. Portfolio Skills Demonstrated

Phase 6 demonstrates:

* Frontend deployment planning
* Vite production build configuration
* Public frontend env handling
* AWS S3 static asset hosting
* Private S3 bucket posture
* CloudFront distribution setup
* CloudFront/S3 origin access pattern
* React SPA fallback handling
* Browser/API integration over HTTPS
* CORS diagnosis and remediation
* Separation of frontend static hosting from backend API infrastructure
* Cost-control tradeoff documentation
* Secret-safe operational reporting

## 16. What Was Not Done

The following were not done in this documentation phase:

* No commands were run.
* No files were inspected again.
* No files were modified.
* No frontend build was run.
* No frontend deployment was performed.
* No files were uploaded to S3.
* No CloudFront invalidation was performed.
* No S3 buckets were created.
* No CloudFront distributions were created.
* No AWS resources were modified.
* No security groups were modified.
* No ports were opened or closed.
* No env file was edited.
* No env file contents were printed.
* No `env` command was run.
* No `docker compose config` command was run.
* No containers were restarted.
* No Docker Compose commands were run.
* No frontend, backend, shared, Nginx, DuckDNS, Certbot, or RDS files/config were modified.
* No Prisma commands were run.
* No database reset or deletion was performed.
* No secrets were created, edited, or exposed.
* No staging, commit, or push was performed.
* `npm audit fix --force` was not run.

## 17. Recommended Next Phases

Recommended next phases:

* CI/CD for frontend deployment to S3 + CloudFront
* CloudFront cache invalidation automation
* Backend CI/CD deployment
* CloudWatch monitoring/logging
* Terraform/IaC version of infrastructure
* Optional custom domain/Route 53/ACM later
* Optional Elastic IP if budget allows later

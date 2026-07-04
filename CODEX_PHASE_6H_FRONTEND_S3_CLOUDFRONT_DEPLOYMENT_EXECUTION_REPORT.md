# CODEX Phase 6H: Frontend S3 + CloudFront Deployment Execution Report

## 1. Phase Name and Purpose

Phase 6H documents the completed S3 + CloudFront frontend deployment execution.

This report is documentation-only. It does not run commands, inspect files again, modify files, build frontend, deploy frontend, upload files, modify AWS resources, or expose secrets.

## 2. Deployment Architecture

The frontend deployment target changed from same-EC2/Nginx hosting to S3 + CloudFront for stronger AWS/cloud/DevOps portfolio alignment.

Final architecture:

```text
Browser
  |
  | HTTPS
  v
CloudFront frontend
  |
  v
Private S3 static assets

Browser API calls
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

## 3. S3 Bucket Creation Result

S3 bucket created:

```text
crm-modern-frontend-aucrm
```

S3 region:

```text
ap-southeast-1
```

## 4. S3 Security Configuration

S3 bucket configuration:

* General purpose bucket
* Object Ownership: ACLs disabled
* Block Public Access: enabled
* Bucket Versioning: disabled
* Default encryption: SSE-S3
* Object Lock: disabled

S3 object structure uploaded to the bucket root:

```text
index.html
assets/
```

## 5. CloudFront Distribution Creation Result

CloudFront distribution created:

```text
crm-modern-frontend-cloudfront
```

CloudFront URL:

```text
https://d3k197cbnbmhh7.cloudfront.net
```

CloudFront origin:

```text
S3 bucket crm-modern-frontend-aucrm
```

## 6. CloudFront Security and Cost-Control Choices

CloudFront choices:

* Private S3 origin access through CloudFront was enabled.
* CloudFront was granted access to the S3 origin.
* WAF/security protections were not enabled for cost control.
* No custom domain was configured.

## 7. Default Root Object Correction

CloudFront default root object was corrected to:

```text
index.html
```

This allows the CloudFront root URL to serve the React app entry point.

## 8. SPA Fallback Configuration

SPA fallback/custom error responses were configured:

* `403` -> `/index.html` -> `HTTP 200`
* `404` -> `/index.html` -> `HTTP 200`
* minimum TTL `0`

This supports React Router route refreshes and deep links.

## 9. Frontend Build Result

Frontend was built locally using:

```bash
VITE_API_BASE_URL=https://aucrm.duckdns.org npm run build --workspace client
```

Build result:

* Build succeeded.
* Build output directory: `client/dist`
* Build output included:
  * `index.html`
  * `assets/`

## 10. S3 Upload Result

Files uploaded to S3 bucket root:

* `index.html`
* `assets/`

Initial upload path risk was caught:

* Uploading the parent `dist/` folder would have produced the wrong S3 structure.
* Corrected structure used the bucket root:
  * `index.html`
  * `assets/`

Upload result:

* `31` files uploaded
* `0` failed

## 11. CloudFront Root Verification

CloudFront root verification succeeded:

```text
https://d3k197cbnbmhh7.cloudfront.net/
```

Result:

```text
HTTP 200
```

The React app loaded in the browser.

## 12. SPA Route Verification

SPA route verification succeeded:

```text
https://d3k197cbnbmhh7.cloudfront.net/dashboard
```

Result:

```text
HTTP 200
```

Note:

* `x-cache: Error from cloudfront` was expected because CloudFront handled S3 `403`/`404` by serving `/index.html`.

## 13. CORS Issue Discovered After Deployment

After deployment:

* Frontend initially loaded.
* Role/API loading was stuck.
* Cause: backend CORS did not yet allow the CloudFront origin.

## 14. Phase 6G CORS Resolution Reference

Phase 6G resolved the CORS issue:

* Backend allowed the CloudFront origin.
* Browser roles loaded successfully.

## 15. Final Frontend / Backend Integration State

Final integration state:

* CloudFront frontend loads successfully.
* Browser frontend/API integration works after Phase 6G.
* Backend API remains:
  * `https://aucrm.duckdns.org/api/...`
* Backend infrastructure remains:
  * EC2 + Docker + Nginx + HTTPS
  * Private RDS PostgreSQL

## 16. Security Boundaries Preserved

Security boundaries preserved:

* App port `4000` was not publicly opened.
* RDS port `5432` was not publicly opened.
* SSH was not broadened.
* No database changes were made.
* Backend infrastructure was not moved.
* RDS remained private.
* No staging, commit, or push was performed.

## 17. Evidence and Security Notes

Safe evidence included:

* S3 bucket name
* AWS region
* CloudFront distribution name/comment
* CloudFront URL
* Public backend API base
* Public build env value `VITE_API_BASE_URL=https://aucrm.duckdns.org`
* Build command
* Build output directory
* S3 object structure
* HTTP status codes
* SPA fallback behavior
* CORS caveat and Phase 6G resolution

Excluded from this report:

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

## 18. What Was Not Done

The following were not done by Codex for this report:

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
* No frontend, backend, shared, or Nginx files were modified.
* No DuckDNS or Certbot changes were made.
* No certificates were requested.
* No RDS changes were made.
* No Prisma commands were run.
* No database reset or deletion was performed.
* No secrets were created, edited, or exposed.
* No staging, commit, or push was performed.
* `npm audit fix --force` was not run.

## 19. Next Phase Recommendation

Recommended next phase:

* Phase 6I: Full Phase 6 Frontend Deployment Milestone Summary

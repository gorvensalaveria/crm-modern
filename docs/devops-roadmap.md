# DevOps Roadmap

## Purpose

This roadmap defines the Cloud + DevOps learning and implementation path for CRM Modern / Modern Fullstack.

The goal is to turn the project into strong portfolio evidence by gradually preparing, containerizing, deploying, securing, automating, monitoring, and documenting a real full-stack application.

## Roles And Workflow

ChatGPT is the Architect / product planner / DevOps mentor / reviewer / project manager.

Codex is the coding assistant / guided implementer. Codex proposes small, scoped, testable changes and guides the user step by step after approval.

The user is the hands-on builder/operator/learner/final reviewer.

Work should follow this pattern:

1. ChatGPT Architect approves the ticket or phase.
2. Codex explains the goal, boundaries, commands, and file changes.
3. The user runs commands and makes approved edits manually.
4. Codex helps verify the result.
5. Codex produces a short completion summary.
6. ChatGPT Architect reviews before the next phase begins.

## Scope

This roadmap focuses only on practical Cloud + DevOps skills:

- Docker
- Docker Compose
- AWS EC2
- Amazon RDS PostgreSQL
- Linux / SSH
- Nginx
- Cloudflare DNS
- SSL / Certbot
- GitHub Actions CI/CD
- Environment variables / secrets
- Logs
- Backups
- Monitoring
- Troubleshooting
- Portfolio/resume evidence

## Job-Market Focus

This project prioritizes practical, in-demand skills that are useful for job applications and portfolio discussions.

The goal is not to learn every cloud tool or overbuild the architecture. The goal is to show that the user can understand, prepare, deploy, secure, automate, monitor, and troubleshoot a realistic full-stack application using common tools employers recognize.

Each phase should produce evidence that can be explained in interviews, shown in a portfolio, or summarized on a resume.

## Out Of Scope For This Document

This document is a roadmap only.

It does not create or configure:

- Dockerfiles
- Production Docker Compose files
- AWS resources
- EC2 deployment
- Amazon RDS configuration
- Terraform
- GitHub Actions deployment CI/CD
- DNS
- SSL / Certbot
- Nginx production reverse proxy
- Production deployment work

Those items must be handled later in separate approved tickets or phases.

## Roadmap Phases

### Phase 1: Local Baseline

Confirm the app runs locally, dependencies install correctly, scripts are understood, and basic verification commands pass.

Status: Accepted.

### Phase 2: Docker Review

Review the existing Docker setup and runtime requirements before creating production Docker files.

Status: Accepted.

### Phase 3: Pre-Docker Production Readiness

Prepare the project for future production containerization without creating Dockerfiles yet.

Examples:

- Confirm production start scripts
- Confirm `.dockerignore`
- Re-run safe local checks
- Document readiness findings

Status: In progress / partially completed.

### Phase 4: Dockerfile Planning And Implementation

Plan and create application Dockerfiles only after approval.

Expected focus:

- Backend image
- Frontend build output strategy
- Node version
- Build context
- Dependency installation
- Runtime commands
- Image size and security basics

### Phase 5: Production Compose Planning

Plan production-style Docker Compose only after Dockerfiles are approved.

Expected focus:

- App service
- Nginx service
- Environment variable loading
- Volumes
- Health checks
- Restart policies
- Separation from local PostgreSQL Compose

### Phase 6: AWS EC2 And Linux/SSH Preparation

Prepare the server environment only after approval.

Expected focus:

- EC2 instance basics
- SSH key access
- Linux package updates
- Firewall/security group planning
- Docker installation
- Directory structure
- Non-secret environment setup

### Phase 7: Amazon RDS PostgreSQL

Plan and configure production database connectivity only after approval.

Expected focus:

- RDS PostgreSQL target
- Security group access
- `DATABASE_URL` handling
- Prisma migration approach
- Backup and restore basics
- No production database secrets in repo

### Phase 8: Nginx Reverse Proxy

Configure Nginx only after approval.

Expected focus:

- Serving the frontend
- Proxying `/api` to the backend
- Request body limits
- Health checks
- Basic hardening headers

### Phase 9: Cloudflare DNS

Configure DNS only after approval.

Expected focus:

- Domain records
- Cloudflare proxy mode
- DNS propagation checks
- Separation of DNS setup from app deployment

### Phase 10: SSL / Certbot

Configure HTTPS only after approval.

Expected focus:

- Certbot setup
- Certificate renewal
- HTTP to HTTPS redirect
- Verification from browser and terminal

### Phase 11: GitHub Actions CI/CD

Add deployment automation only after approval.

Expected focus:

- Existing CI baseline
- Secrets in GitHub Actions
- Build and test gates
- SSH deployment strategy
- Rollback considerations

### Phase 12: Logs, Backups, Monitoring, And Troubleshooting

Add operational practices only after approval.

Expected focus:

- Docker logs
- Nginx logs
- App logs
- RDS backups
- Manual restore practice
- Basic uptime checks
- Troubleshooting runbook

### Phase 13: Portfolio / Resume Evidence

Collect and organize proof of work.

Expected focus:

- Architecture diagrams
- Screenshots
- Command outputs without secrets
- CI run screenshots
- Deployment notes
- Troubleshooting examples
- Resume bullet points

## Acceptance Gate Per Phase

Each phase should include:

- Clear goal
- Scope
- Out-of-scope items
- Commands or file changes
- Manual verification steps
- Acceptance criteria
- Completion summary
- ChatGPT Architect review before moving forward

A phase is not accepted until the user and ChatGPT Architect approve it.

## Portfolio Evidence Goals

The project should produce evidence that can be shown or discussed professionally:

- A clear architecture diagram
- A clean repository structure
- DevOps planning documents
- Docker build and run evidence
- EC2 setup notes
- RDS connection and migration evidence
- Nginx reverse proxy evidence
- Cloudflare DNS evidence
- HTTPS/Certbot evidence
- GitHub Actions CI/CD evidence
- Logs and troubleshooting examples
- Backup and restore notes
- Final portfolio summary and resume bullets

No evidence should include real secrets, passwords, tokens, private keys, or sensitive environment values.

## Current Status

Accepted:

- Phase 1: Local baseline
- Phase 2: Docker review
- Ticket 1: Create `AGENTS.md`

In progress:

- Ticket 2: Create `docs/devops-roadmap.md`

Not started:

- Dockerfile implementation
- Production Docker Compose
- AWS EC2 work
- Amazon RDS configuration
- Nginx production reverse proxy
- Cloudflare DNS
- SSL / Certbot
- GitHub Actions deployment CI/CD
- Production deployment
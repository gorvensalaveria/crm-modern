# AWS EC2 + RDS Deployment Plan

## Purpose

This document defines the future AWS EC2 + Amazon RDS PostgreSQL deployment plan for CRM Modern / Modern Fullstack.

It is a planning document only. It does not create AWS resources, RDS configuration, IAM configuration, CI/CD, DNS, SSL, Dockerfiles, production Compose files, deployment configuration, `.env` changes, or secrets.

## Target AWS Architecture

The future target architecture is:

```text
User Browser
  |
  v
Cloudflare DNS
  |
  v
AWS EC2 Instance
  |
  +-- Nginx
  |     +-- serves frontend static files
  |     +-- proxies /api to API container
  |
  +-- Docker runtime
        +-- API container
              |
              v
        Amazon RDS PostgreSQL
```

The EC2 instance hosts the application runtime and reverse proxy. Amazon RDS hosts the production PostgreSQL database.

## Recommended First AWS Version

The first AWS implementation should be simple and learning-focused:

- One EC2 instance for the app and Nginx
- One Amazon RDS PostgreSQL database
- No load balancer yet
- No auto scaling yet
- No ECS or Kubernetes yet
- No Terraform yet
- Manual setup first for learning

This keeps the project focused on practical fundamentals before adding more advanced infrastructure.

## EC2 App Server Role

The EC2 instance will eventually act as the app server.

Expected responsibilities:

- Run Linux
- Accept SSH access from the user
- Run Docker
- Run the API container
- Run Nginx
- Store deployment files and non-secret configuration
- Provide access to app, Nginx, Docker, and system logs
- Support manual troubleshooting and smoke tests

EC2 should not host the production database directly.

## Amazon RDS PostgreSQL Role

Amazon RDS PostgreSQL will eventually act as the production database.

Expected responsibilities:

- Store application data
- Provide managed PostgreSQL hosting
- Support automated backups
- Support restore options
- Expose database access only to approved network sources
- Keep database lifecycle separate from app container lifecycle

The API should connect to RDS using `DATABASE_URL`.

## Why PostgreSQL Should Not Run In Docker On EC2

Production PostgreSQL should not run in Docker on the EC2 app server.

Using RDS is preferred because it provides:

- Managed backups
- Better recovery options
- Storage durability
- Separation between app runtime and data storage
- Database monitoring options
- Security group control
- Reduced operational risk

Running PostgreSQL in Docker on EC2 would make backups, recovery, upgrades, storage management, and incident response harder for a production-style portfolio project.

## Security Group Direction

Future security group planning should follow least-privilege access.

Expected direction:

- Allow HTTP traffic to EC2 only when the web phase is approved.
- Allow HTTPS traffic to EC2 only when SSL is approved.
- Restrict SSH access to the user's trusted IP where possible.
- Do not expose RDS publicly.
- Allow RDS PostgreSQL access only from the EC2 app server or app security group.
- Avoid opening broad ports such as `0.0.0.0/0` for SSH or database access.

Exact rules should be created only during the approved AWS implementation phase.

## IAM Basics

IAM should be handled carefully and minimally.

Expected direction:

- Avoid using the AWS root account for daily work.
- Use least-privilege IAM users or roles.
- Protect AWS credentials.
- Do not commit AWS keys or credentials.
- Do not paste AWS secret values into chat or documentation.
- Add CI/CD deployment permissions only in a later approved phase.

This ticket does not create IAM users, roles, policies, or credentials.

## Linux / SSH Access

Linux and SSH setup should be handled manually during the approved AWS phase.

Expected direction:

- Use SSH key-based access.
- Keep private keys secure.
- Update system packages before installing runtime tools.
- Use a predictable deployment directory.
- Avoid storing real secrets in shell history or committed files.
- Learn basic commands for logs, services, disk usage, memory usage, and network checks.

No SSH or Linux configuration is performed in this planning ticket.

## Environment Variables And Secrets

Production configuration must be handled safely.

Expected environment variable names may include:

- `DATABASE_URL`
- `PORT`
- `CLIENT_ORIGIN`
- `AI_PROVIDER`
- `OPENAI_API_KEY`, if live AI is approved later

Rules:

- Use placeholders in documentation.
- Do not commit real values.
- Do not modify `.env` during planning.
- Do not bake secrets into Docker images.
- Do not paste secrets into chat.
- Store production secrets only through approved deployment mechanisms.

## API Container To RDS Connection

The future API container should connect to Amazon RDS PostgreSQL using `DATABASE_URL`.

Expected direction:

- The API container receives `DATABASE_URL` at runtime.
- `DATABASE_URL` points to the RDS PostgreSQL database.
- The value is not committed to the repository.
- Prisma uses the environment variable for database access.
- RDS network access is restricted to the EC2/app path.

Database migrations must be handled through an approved migration workflow, not automatically and blindly on every app startup.

## Nginx On EC2

Nginx will eventually run on EC2 or in an approved container arrangement.

Expected future responsibilities:

- Serve the built frontend static files.
- Reverse-proxy `/api` requests to the API container.
- Support SPA fallback routing.
- Apply request body limits that match app upload behavior.
- Provide Nginx access and error logs.
- Later support HTTPS after DNS and Certbot are approved.

This ticket does not create Nginx configuration.

## Cloudflare DNS Later

Cloudflare DNS should be configured only after the EC2 app target is ready.

Expected future direction:

- Point the project domain or subdomain to the EC2 public IP.
- Verify DNS propagation.
- Decide Cloudflare proxy mode intentionally.
- Keep DNS work separate from app runtime setup.

This ticket does not configure DNS.

## SSL / Certbot Later

SSL should be added only after DNS points correctly to EC2.

Expected future direction:

- Use Certbot for HTTPS.
- Configure HTTP-to-HTTPS redirect.
- Verify certificate renewal.
- Test HTTPS from browser and terminal.
- Avoid adding SSL before DNS is stable.

This ticket does not configure SSL or Certbot.

## Logs And Troubleshooting

The future deployment should make troubleshooting visible and teachable.

Expected log sources:

- Docker container logs
- API logs
- Nginx access logs
- Nginx error logs
- Linux system logs
- RDS monitoring signals
- GitHub Actions logs in a later CI/CD phase

Troubleshooting should include checking health endpoints, ports, environment variables, container status, Nginx proxy behavior, and database connectivity without exposing secrets.

## Backups

Backups should be planned before production-style use.

Expected direction:

- Use RDS automated backups.
- Understand backup retention.
- Practice at least one restore or restore-plan walkthrough.
- Keep uploaded files out of the database backup plan unless explicitly designed.
- Document what data is recoverable and what is not.

Backup implementation happens in a later approved operations phase.

## Monitoring

Initial monitoring should be simple.

Expected direction:

- Use the API health endpoint for smoke checks.
- Check EC2 CPU, memory, disk, and network basics.
- Check Docker container status.
- Check Nginx logs.
- Check RDS status and storage.
- Add uptime or external monitoring only after the basic deployment is stable.

Monitoring implementation happens in a later approved operations phase.

## Cost Awareness

AWS work should stay cost-aware.

Guidelines:

- Prefer a small EC2 instance for the first version.
- Prefer a small RDS PostgreSQL instance for learning.
- Watch free-tier eligibility and limits.
- Stop or delete unused resources when no longer needed.
- Avoid load balancers, autoscaling, ECS, Kubernetes, and Terraform in the first version.
- Track what resources exist and why they exist.

Cost awareness is part of the learning goal.

## Manual Learning Path

The first AWS version should be manual and guided.

The user should perform the setup step by step to learn:

- AWS console basics
- EC2 creation
- Security group reasoning
- SSH access
- Linux package installation
- Docker runtime setup
- RDS creation and connection concepts
- Nginx basics
- Logs and troubleshooting

Codex should guide and explain commands, but the user remains the hands-on builder/operator/learner.

## Open Questions Before AWS Implementation

Before creating AWS resources, answer:

- Which AWS region should be used?
- Which EC2 instance type should be used?
- Which Linux image should be used?
- What SSH key strategy should be used?
- What trusted IP should be allowed for SSH?
- What RDS instance size should be used?
- Should RDS be publicly accessible? Expected answer: no, unless Architect approves a temporary learning exception.
- What database backup retention should be used?
- What deployment directory structure should be used on EC2?
- How will production environment variables be stored?
- What is the approved Prisma migration workflow?
- Will the first Docker implementation be API-only or include Nginx/static frontend?
- When should CI/CD be introduced?

## Out Of Scope

This planning ticket does not create or configure:

- AWS resources
- EC2 instances
- RDS databases
- Security groups
- IAM users, roles, or policies
- SSH keys
- Dockerfiles
- Production Docker Compose files
- Nginx configuration
- GitHub Actions deployment CI/CD
- DNS
- SSL / Certbot
- Deployment configuration
- `.env` changes
- Real secrets

## Acceptance Criteria

This planning ticket is complete when:

- The target AWS architecture is documented.
- The recommended first AWS version is documented.
- EC2 and RDS responsibilities are explained.
- The reason for using RDS instead of PostgreSQL in Docker on EC2 is explained.
- Security group direction is documented.
- IAM basics are documented.
- Linux / SSH access expectations are documented.
- Environment variable and secret rules are documented.
- API-to-RDS connection direction is documented.
- Nginx, Cloudflare DNS, and SSL future phases are documented.
- Logs, backups, monitoring, cost awareness, and manual learning path are documented.
- Open questions before AWS implementation are listed.
- No AWS resources, RDS config, IAM config, CI/CD, DNS, SSL, Dockerfiles, production Compose, deployment config, `.env` changes, or secrets are introduced.
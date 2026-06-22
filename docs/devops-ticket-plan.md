# DevOps Ticket Plan

## Purpose

This document converts the Cloud + DevOps roadmap for CRM Modern / Modern Fullstack into controlled execution tickets.

The goal is to keep work small, reviewable, testable, and focused on practical portfolio evidence.

## Ticket Workflow

Each ticket follows this workflow:

1. ChatGPT Architect approves the ticket.
2. Codex explains the goal, scope, boundaries, commands, and file changes.
3. The user runs commands and makes approved edits manually.
4. Codex helps inspect and verify the result.
5. Codex produces a short ticket completion summary.
6. ChatGPT Architect reviews the summary.
7. The next ticket starts only after Architect approval.

The user remains the hands-on builder/operator/learner/final reviewer.

Codex remains the coding assistant / guided implementer.

## Ticket Template

Each ticket should define:

```markdown
## Ticket ID: Short Title

Status: Not Started

### Goal

What this ticket is trying to accomplish.

### Scope

What is allowed in this ticket.

### Forbidden Scope

What must not be done in this ticket.

### Files Expected To Change

List expected files, or write `None` for read-only tickets.

### Verification Steps

List safe commands, inspections, or manual checks.

### Acceptance Criteria

List observable conditions that prove the ticket is complete.

### Expected Outputs

List documents, summaries, screenshots, command results, or other evidence.

### Architect Review

Required before the next ticket starts.
```

## Ticket Sequence

### T1: Create `AGENTS.md`

Status: Accepted

Goal: Define repo-level Codex operating rules, role boundaries, approval flow, secrets safety, and phase boundaries.

### T2: Create `docs/devops-roadmap.md`

Status: Accepted

Goal: Define the high-level Cloud + DevOps learning and implementation roadmap.

### T3: Create `docs/devops-ticket-plan.md`

Status: In Progress

Goal: Convert the roadmap into controlled tickets with scope, verification, acceptance criteria, and review gates.

### T4: Create Docker Production Plan

Status: Not Started

Goal: Plan Dockerfile and production image strategy without implementing Dockerfiles yet.

### T5: Create AWS EC2 + RDS Deployment Plan

Status: Not Started

Goal: Plan the AWS hosting architecture, EC2 responsibilities, RDS PostgreSQL connectivity, and security boundaries without creating resources.

### T6: Create Operations Runbook

Status: Not Started

Goal: Plan logs, backups, monitoring, troubleshooting, smoke tests, and rollback habits.

### T7: Create Portfolio Evidence Plan

Status: Not Started

Goal: Define what screenshots, diagrams, command outputs, summaries, and resume bullets will be collected.

### T8: Dockerfile Implementation

Status: Not Started

Goal: Create approved Dockerfiles after planning is accepted.

### T9: Production Compose Implementation

Status: Not Started

Goal: Create approved production Compose configuration after Dockerfiles are accepted.

### T10: AWS EC2 Preparation

Status: Not Started

Goal: Prepare EC2 and Linux/SSH environment after AWS planning is accepted.

### T11: Amazon RDS PostgreSQL Configuration

Status: Not Started

Goal: Configure production PostgreSQL connectivity and migration workflow after AWS/RDS planning is accepted.

### T12: Nginx Reverse Proxy

Status: Not Started

Goal: Configure Nginx for frontend serving and `/api` proxying after EC2 and app runtime are ready.

### T13: Cloudflare DNS

Status: Not Started

Goal: Configure domain DNS only after the app has a stable public target.

### T14: SSL / Certbot

Status: Not Started

Goal: Add HTTPS and certificate renewal only after DNS is correctly configured.

### T15: GitHub Actions Deployment CI/CD

Status: Not Started

Goal: Automate safe deployment only after manual deployment is understood and accepted.

### T16: Logs, Backups, Monitoring, And Troubleshooting

Status: Not Started

Goal: Add operational checks, backup habits, monitoring basics, and troubleshooting evidence.

## Acceptance Criteria Rules

Every ticket must have acceptance criteria before implementation starts.

Acceptance criteria should be:

- Specific
- Observable
- Testable
- Small enough to review
- Aligned with the approved ticket scope

A ticket is not complete just because files were created. It is complete only when the acceptance criteria are met and verified.

## Verification Rules

Verification should match the ticket scope.

Examples of safe verification:

- Read-only file inspection
- Markdown review
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual browser QA
- Health check
- Log review
- Screenshot or command-output evidence without secrets

Verification must not include deployment or infrastructure changes unless those actions are explicitly approved for the current ticket.

## Architect Review Gate

Every ticket requires a short completion summary before review.

The completion summary should include:

- What changed
- What was inspected
- What was verified
- Any failures, risks, or follow-ups
- Confirmation that boundaries were respected

The next ticket must not start until ChatGPT Architect accepts the current ticket or gives corrected instructions.

## Ticket Status Values

Use these ticket status values consistently:

- Not Started
- In Progress
- Blocked
- Ready for Architect Review
- Accepted
- Deferred

## Current Ticket Status

Accepted:

- T1: Create `AGENTS.md`
- T2: Create `docs/devops-roadmap.md`

In Progress:

- T3: Create `docs/devops-ticket-plan.md`

Not Started:

- T4: Create Docker Production Plan
- T5: Create AWS EC2 + RDS Deployment Plan
- T6: Create Operations Runbook
- T7: Create Portfolio Evidence Plan
- T8: Dockerfile Implementation
- T9: Production Compose Implementation
- T10: AWS EC2 Preparation
- T11: Amazon RDS PostgreSQL Configuration
- T12: Nginx Reverse Proxy
- T13: Cloudflare DNS
- T14: SSL / Certbot
- T15: GitHub Actions Deployment CI/CD
- T16: Logs, Backups, Monitoring, And Troubleshooting
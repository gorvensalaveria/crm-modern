# ASUN Migrations CRM Product Showcase

Use this guide when preparing the project for employer, stakeholder, or product review. The goal is to present ASUN Migrations CRM as a real full-stack SaaS product, with screenshots that show end-to-end product thinking rather than isolated UI screens.

## Product Positioning

ASUN Migrations CRM is a modern SaaS platform for Australian migration agencies. It brings client records, visa matters, document workflows, billing, compliance, reporting, audit logs, and client self-service into one role-aware product experience.

The system is designed to show:

- Full-stack TypeScript delivery across React, Express, Prisma, PostgreSQL, and shared contracts
- Operational workflows from a detailed business requirements document
- Role-aware workspaces for admin, RMA, case officer, finance, and client users
- AI-assisted matter work, document review, reports, compliance checks, and portal guidance
- Compliance-conscious features including audit logs, retention requests, document status, and tenant settings
- Production-style engineering habits: validation, RBAC, tests, build checks, exports, and CI

## Screenshot Checklist

Capture screenshots in a browser at desktop width first. If you want to show responsive polish, capture one extra mobile screenshot of the dashboard with the navigation menu open.

### 1. Role Selection

Page: `/`

Show the product entry point where a reviewer chooses a workspace role. This explains why there is no traditional login screen while still showing role-based access.

Recommended role selected: `Registered Migration Agent`

### 2. Staff Dashboard

Page: `/app`

Show workload metrics, tasks, pipeline, deadline alerts, revenue signals, and recent activity. This is the best first impression for the staff workspace.

### 3. Matter Detail With AI

Page: `/app/matters/:matterId`

Show the matter workspace with:

- matter stage/progress
- tasks
- checklist
- document review
- invoice
- messages
- AI Matter Assistant result

This is the strongest product screenshot because it shows the CRM operating around a real case.

### 4. AI Workflow Suggestions

Page: `/app/matters/:matterId`

Capture the matter page after generating AI workflow suggestions. This shows the AI is not just summarizing text; it recommends task, checklist, automation, and risk actions from the current matter state.

### 5. Matter Creation From Template

Page: `/app/matters/new`

Show workflow automation before matter creation:

- client selection
- visa workflow template
- generated task/checklist output
- AI Intake Assistant result

This demonstrates process automation and product thinking from intake to matter setup.

### 6. Document Review With AI

Page: `/app/matters/:matterId`

Capture the document review section after generating AI document review. Show the recommendation, confidence, findings, risks, compliance notes, and next steps.

### 7. Reports With AI Insights

Page: `/app/reports`

Show charts plus the AI Report Insights panel. This is useful for proving the product supports managers, not only case officers.

### 8. Compliance Centre With AI Review

Page: `/app/compliance`

Show compliance settings, document security, retention requests, notification/integration logs, and AI Compliance Review. This screenshot supports the MARA/APP compliance story from the BRD.

### 9. Billing

Page: `/app/billing`

Show invoice tracking, status, mock payment handling, and receipt capability. This proves the financial workflow exists outside the matter page.

### 10. Client Portal With AI Guidance

Role: `Client Portal User`

Page: `/app/portal`

Show the client-facing workspace:

- matter progress
- requested documents
- invoice
- secure message panel
- AI Portal Assistant guidance

This is important because it proves the product has both staff and client experiences.

### Optional Mobile Screenshot

Page: `/app`

Viewport: mobile width

Open the burger menu and capture the dashboard with the mobile navigation visible. This proves the CRM is responsive and usable beyond desktop.

## Suggested Screenshot Order

Use this order in README, GitHub, slides, or a product walkthrough:

1. Role selection
2. Staff dashboard
3. Matter detail with AI Matter Assistant
4. Matter creation with AI Intake Assistant
5. Document review with AI
6. Reports with AI insights
7. Compliance centre with AI review
8. Client portal with AI guidance

## Screenshot File Names

Save screenshots with these names if you want them to be easy to reference later:

```text
docs/screenshots/01-role-selection.png
docs/screenshots/02-dashboard.png
docs/screenshots/03-matter-ai-brief.png
docs/screenshots/04-matter-intake-ai.png
docs/screenshots/05-document-ai-review.png
docs/screenshots/06-report-ai-insights.png
docs/screenshots/07-compliance-ai-review.png
docs/screenshots/08-client-portal-ai-guidance.png
docs/screenshots/09-mobile-navigation.png
```

## Product Walkthrough Script

Use this short talk track when presenting:

ASUN Migrations CRM is a full-stack SaaS product for migration agencies. It centralizes clients, visa matters, workflows, documents, billing, compliance, reporting, and a client portal. The app uses selectable roles for quick workspace access, but the backend still enforces RBAC and validates API requests. The most important product layer is the matter workspace, where staff can manage tasks, checklist items, documents, invoices, notes, and AI-assisted next actions from one operational view.

The AI features are placed where they support real work: intake planning before matter creation, matter briefs during case management, document review support during verification, report insights for managers, compliance review for admins, and portal guidance for clients. This makes the AI feel like an operations assistant rather than a separate chatbot.

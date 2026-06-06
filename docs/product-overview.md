# Product Overview

## Product Summary

ASUN Migrations is a multi-tenant SaaS CRM for Australian migration agencies. It helps staff manage clients, visa matters, required documents, workflow tasks, invoices, compliance records, reporting, audit trails, and client communication.

The product uses selectable workspace roles as the current access layer. This keeps each operational perspective available while preserving role-based access control and server-side authorization.

## Current Product Scope

- Workspace role selection
- Staff dashboard
- Client management
- Matter management
- Workflow-generated tasks and checklists
- AI intake planning before matter creation
- AI matter briefs and workflow suggestions
- AI client-message drafting
- Document upload, storage metadata, scan state, and verification workflow
- AI document review notes
- Client portal
- Billing and invoice tracking
- Mock Stripe checkout and webhook-ready payment handling
- PDF invoice receipts
- Reporting dashboard
- CSV and XLSX report exports
- AI report insights
- Audit event log
- Workflow template administration
- Compliance centre
- Tenant settings
- Retention and erasure requests
- AI compliance review
- Mock DocuSign envelope workflow
- Notification and integration logs

## Integration Boundaries

The product includes production-shaped integration boundaries while keeping external dependencies controlled:

- OpenAI can be enabled with `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_PROVIDER=openai`.
- Local deterministic AI remains available with `AI_PROVIDER=local`.
- Stripe payment handling is represented through mock checkout/session and webhook-ready flows.
- DocuSign envelope handling is represented through mock envelope and webhook-ready flows.
- Document scanning is represented through local mock AV rules.
- Uploaded files use local persistence unless an object storage provider is added.

## Main User Journeys

1. User opens the app and selects a product role.
2. Staff user lands on a dashboard showing tasks, pipeline, alerts, and revenue.
3. Staff user creates or reviews a client.
4. Staff user creates a visa matter from a workflow template.
5. The app generates tasks and checklist items for that visa subclass.
6. Staff user generates an AI intake plan or matter brief.
7. Client user uploads requested documents through the portal.
8. Staff user verifies or rejects uploaded documents.
9. Finance user creates an invoice and records a payment event.
10. Admin or RMA views reports and audit logs.
11. Admin user reviews compliance settings, retention requests, integration logs, and AI compliance findings.

## Product Strengths

- Full-stack TypeScript delivery
- Clean frontend/backend separation
- Shared contracts
- Practical migration-agency domain modeling
- SaaS multi-tenancy awareness
- Role-based product experiences
- Workflow automation
- AI-assisted operational workflows
- Compliance-oriented audit logs
- Payment and webhook readiness
- Reporting and export workflows
- Professional dashboard UI

# Product Implementation Plan

## Product Summary

ASUN Migrations is a multi-tenant SaaS CRM for migration agencies. It helps staff manage clients, visa matters, required documents, workflow tasks, invoices, compliance records, and client communication.

For portfolio purposes, the app will use a demo role selector instead of a traditional login screen. This keeps the product easy to present while still showing role-based access, scoped data, and different dashboards.

## MVP Scope

The MVP should include:

- Demo landing page with "View Demo As" role selector
- Staff dashboard
- Client management
- Matter management
- Workflow-generated tasks and checklists
- Document upload and verification states
- Client portal view
- Billing and invoice tracking
- Stripe test checkout simulation
- Reporting dashboard
- Audit event log
- Admin configuration screens

## Out of Scope for First Build

These should be represented as mocked or planned integrations first:

- Real DocuSign envelope execution
- Real SMS MFA
- Real virus scanning
- Real Xero or QuickBooks sync
- Advanced automation rule builder
- Multi-language portal
- Employer or sponsor portal

## Main User Journeys

1. Employer opens the app and selects a demo role.
2. Staff user lands on a dashboard showing tasks, pipeline, alerts, and revenue.
3. Staff user creates or reviews a client.
4. Staff user creates a visa matter from a workflow template.
5. The app generates tasks and checklist items for that visa subclass.
6. Client portal user uploads requested documents.
7. Staff user verifies or rejects uploaded documents.
8. Finance user creates an invoice and records a Stripe payment event.
9. Admin or RMA views reports and audit logs.

## Portfolio Story

This project should show:

- Full-stack TypeScript development
- Clean frontend/backend separation
- Practical domain modeling
- SaaS multi-tenancy awareness
- Role-based product experiences
- Workflow automation
- Compliance-oriented audit logs
- Payment and webhook readiness
- Professional dashboard UI


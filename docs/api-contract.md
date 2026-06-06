# API Contract

## API Style

The API uses REST endpoints under `/api`. Successful JSON responses use:

```json
{
  "data": {}
}
```

Errors use:

```json
{
  "error": {
    "code": "RBAC_403",
    "message": "Role CLIENT cannot access this API endpoint"
  }
}
```

The client sends the current product user through the `x-user-id` header. Protected endpoints resolve role access on the server.

## System

```txt
GET  /api/health
GET  /api/role-users
POST /api/role-session
```

Purpose:

- Health check.
- Return selectable product users.
- Validate and return a selected user session payload.

## Dashboard

```txt
GET /api/dashboard
```

Access:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Case Officer
- Finance Officer

Returns staff metrics, task signals, pipeline summaries, alerts, revenue indicators, and recent messages.

## Clients

```txt
GET   /api/clients
POST  /api/clients
GET   /api/clients/:clientId
PATCH /api/clients/:clientId
```

Access:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Case Officer

Validation includes unique tenant-scoped email, date of birth, passport masking, consent state, and conflict status.

## Matters

```txt
GET   /api/matters
GET   /api/matters/:matterId
POST  /api/matters/ai-intake-plan
POST  /api/matters/from-template
PATCH /api/matters/:matterId/stage
POST  /api/matters/:matterId/ai-brief
POST  /api/matters/:matterId/ai-workflow-suggestions
POST  /api/matters/:matterId/ai-message-draft
POST  /api/matters/:matterId/tasks
POST  /api/matters/:matterId/checklist-items
POST  /api/matters/:matterId/documents
POST  /api/matters/:matterId/invoices
POST  /api/matters/:matterId/messages
```

Access:

- Matter operations: ASUN Admin, Agency Admin, Registered Migration Agent, Case Officer
- Matter billing: ASUN Admin, Agency Admin, Registered Migration Agent, Finance Officer
- Client uploads/messages: CLIENT can upload documents and send external messages

Matter creation uses workflow templates and creates operational tasks, checklist items, key dates, and audit events.

## Tasks And Checklist

```txt
PATCH /api/tasks/:taskId/status
PATCH /api/checklist-items/:checklistItemId/status
```

Access:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Case Officer

Task and checklist status changes refresh the matter workspace and write audit events.

## Documents

```txt
POST  /api/matters/:matterId/documents
PATCH /api/documents/:documentId/review
POST  /api/documents/:documentId/ai-review
POST  /api/envelopes
POST  /api/webhook/docusign/status
```

Document uploads accept metadata plus optional base64 file content. Files are persisted locally for the current deployment target, scanned through the mock AV rules, and linked to checklist items when applicable.

E-signature endpoints create and update mock DocuSign envelope records, integration events, notification logs, and document signing state.

## Billing

```txt
GET  /api/invoices
POST /api/matters/:matterId/invoices
POST /api/invoices/:invoiceId/pay
GET  /api/invoices/:invoiceId/receipt.pdf
POST /api/checkout/session/create
POST /api/webhook/stripe/payment
```

Access:

- Invoice list: ASUN Admin, Agency Admin, Finance Officer
- Invoice creation: ASUN Admin, Agency Admin, Registered Migration Agent, Finance Officer
- Payment and receipts: ASUN Admin, Agency Admin, Finance Officer, Client

Payment endpoints support internal payment actions, mock checkout session creation, webhook-ready Stripe event handling, payment records, paid invoice state, and PDF receipts.

## Reports

```txt
GET  /api/reports
POST /api/reports/ai-insights
GET  /api/reports/export
GET  /api/reports/export-xlsx
```

Access:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Finance Officer

Report export accepts `type` values:

- `pipeline`
- `revenue`
- `sla`
- `deadlines`
- `workload`

Exports write audit events and return CSV or XLSX-compatible content.

## Compliance

```txt
GET   /api/compliance
POST  /api/compliance/ai-review
PATCH /api/compliance/settings
POST  /api/compliance/retention-requests
PATCH /api/compliance/retention-requests/:retentionRequestId
```

Access:

- ASUN Admin
- Agency Admin

The compliance centre covers tenant settings, retention and erasure requests, document security, notifications, integration logs, and AI compliance review.

Completed erasure requests anonymize client records instead of physically deleting them.

## Portal

```txt
GET  /api/portal/summary
POST /api/portal/ai-guidance
```

Access:

- Client

The portal summary includes matter status, requested documents, invoices, and messages. Portal guidance generates client-friendly next steps.

## Audit Events

```txt
GET /api/audit-events
```

Access:

- ASUN Admin
- Agency Admin

Supported filters:

- `action`
- `actor`
- `entity`
- `from`
- `to`

Audit events are written for client updates, matter creation and stage changes, task and checklist changes, document uploads/reviews, e-signature events, invoice/payment actions, exports, AI actions, compliance changes, and retention decisions.

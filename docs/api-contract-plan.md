# API Contract Plan

## API Style

Use REST APIs under the `/api` prefix. Responses should be JSON and follow predictable shapes.

Common success shape:

```json
{
  "data": {}
}
```

Common list shape:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "pageSize": 25
  }
}
```

Common error shape:

```json
{
  "error": {
    "code": "RBAC_403",
    "message": "Insufficient permissions"
  }
}
```

## Demo Session

```txt
GET  /api/demo-users
POST /api/demo-session
```

Purpose:

- Return available demo personas.
- Set or simulate current role context.

Demo users:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Case Officer
- Finance Officer
- Client Portal User

## Dashboard

```txt
GET /api/dashboard
```

Returns:

- Metrics
- My tasks
- Pipeline summary
- Alerts
- Recent messages

Role rules:

- Clients should not use this endpoint.
- Staff should only see data allowed by their role and assignment.

## Clients

```txt
GET    /api/clients
POST   /api/clients
GET    /api/clients/:clientId
PATCH  /api/clients/:clientId
POST   /api/clients/:clientId/conflict-check
POST   /api/clients/:clientId/dependants
```

Validation:

- Email must be valid and unique per tenant.
- DOB cannot be in the future.
- Passport should match the selected validation strategy.
- Consent should be captured before acting.

## Matters

```txt
GET    /api/matters
POST   /api/matters
GET    /api/matters/:matterId
PATCH  /api/matters/:matterId
POST   /api/matters/:matterId/stage
POST   /api/matters/:matterId/team
GET    /api/matters/:matterId/timeline
```

Create matter payload should include:

- `clientId`
- `visaSubclass`
- `primaryAgentId`
- `caseOfficerId`
- `templateId`

On create:

- Create matter.
- Generate tasks.
- Generate checklist items.
- Create audit event.

## Tasks

```txt
GET   /api/tasks
PATCH /api/tasks/:taskId
POST  /api/tasks/:taskId/complete
POST  /api/tasks/:taskId/snooze
```

## Checklist

```txt
GET   /api/matters/:matterId/checklist
PATCH /api/checklist-items/:itemId
POST  /api/checklist-items/:itemId/verify
POST  /api/checklist-items/:itemId/reject
```

## Documents

```txt
POST /api/documents/upload
GET  /api/documents/:documentId
POST /api/documents/:documentId/verify
POST /api/documents/:documentId/reject
GET  /api/documents/:documentId/download
```

MVP behavior:

- Store file metadata.
- Use local storage or mock storage.
- Log download events.
- Simulate virus scan result.

## E-Signature

```txt
POST /api/envelopes
POST /api/webhook/docusign/status
```

MVP behavior:

- Create mock envelope record.
- Allow status transitions from `sent` to `completed`.
- Store signed document status in the database.

## Client Portal

```txt
GET  /api/portal/summary
GET  /api/portal/matters
GET  /api/portal/matters/:matterId
POST /api/portal/documents/upload
GET  /api/portal/invoices
POST /api/portal/messages
```

Role rules:

- Only `CLIENT` demo role should use portal endpoints.
- Client sees only their linked matters and invoices.

## Billing

```txt
GET   /api/invoices
POST  /api/invoices
GET   /api/invoices/:invoiceId
PATCH /api/invoices/:invoiceId
POST  /api/quotes
POST  /api/quotes/:quoteId/convert-to-invoice
POST  /api/checkout/session/create
POST  /api/webhook/stripe/payment
```

Stripe MVP behavior:

- Create a test checkout session or mocked payment URL.
- Webhook updates invoice status.
- Create payment record.
- Create audit event.

## Reports

```txt
GET /api/reports/pipeline
GET /api/reports/deadlines
GET /api/reports/revenue
GET /api/reports/sla
GET /api/reports/export
```

Reports should be available to:

- ASUN Admin
- Agency Admin
- RMA
- Finance for revenue reports

## Audit Events

```txt
GET /api/audit-events
```

Audit should record:

- Demo role selected
- Client created or updated
- Matter created or stage changed
- Document uploaded, verified, rejected, or downloaded
- Invoice created or paid
- Report exported


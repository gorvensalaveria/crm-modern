# Demo Role Strategy

## Why No Login Page

This is a portfolio product. Future employers should be able to explore it quickly without account creation, credentials, or authentication friction.

Instead of a login page, the app will use a demo role selector.

## Demo Entry Flow

1. User opens the app.
2. Landing page shows "View Demo As".
3. User selects a persona.
4. App stores demo user context locally.
5. App redirects to the correct dashboard.
6. Header includes role switcher for quick demos.

## Demo Personas

### ASUN Admin

Purpose:

- Show SaaS platform management.

Can access:

- Tenant overview
- Agency setup
- Global templates
- Audit logs

### Agency Admin

Purpose:

- Show agency configuration and management.

Can access:

- Staff dashboard
- Clients
- Matters
- Users
- Workflow templates
- Reports
- Audit logs

### Registered Migration Agent

Purpose:

- Show primary professional case management.

Can access:

- Assigned matters
- Client records
- Document verification
- Stage updates
- Reports

### Case Officer

Purpose:

- Show operational task and checklist execution.

Can access:

- Assigned tasks
- Matter checklists
- Document upload/review
- Client messages

### Finance Officer

Purpose:

- Show billing and payment workflows.

Can access:

- Quotes
- Invoices
- Payments
- Revenue reports

### Client Portal User

Purpose:

- Show client-facing self-service.

Can access:

- Matter progress
- Requested documents
- Invoices
- Secure messages

## Implementation Approach

Frontend:

- Store selected demo user in local storage.
- Use React context for current role.
- Protect routes with role checks.
- Show role-specific navigation.

Backend:

- Accept demo role/user through a controlled header, for example `x-demo-user-id`.
- Resolve the role on the server.
- Scope records by tenant and role.
- Return forbidden errors for disallowed actions.

## Important Portfolio Detail

Even though there is no real login page, the code should still prove authentication readiness:

- Centralized current-user handling
- Role permission mapping
- Tenant scoping
- Audit events
- Clear upgrade path to real auth


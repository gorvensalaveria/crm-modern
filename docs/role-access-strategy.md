# Role Access Strategy

## Product Entry Flow

ASUN Migrations uses a workspace role selector as the current access layer. This keeps each product workspace immediately available while still exercising frontend route permissions, backend RBAC, tenant scoping, validation, and audit logging.

Current flow:

1. User opens the application.
2. Landing page shows available product roles.
3. User selects a workspace role.
4. App stores the selected user context locally.
5. App routes staff users to `/app` and client users to `/app/portal`.
6. Header includes a role switcher for operational review and QA.

## Product Roles

### ASUN Admin

Purpose:

- Platform-level administration and audit visibility.

Can access:

- Dashboard
- Workflow templates
- Reports
- Compliance centre
- Audit logs

### Agency Admin

Purpose:

- Agency configuration and operational oversight.

Can access:

- Dashboard
- Clients
- Matters
- Workflow templates
- Reports
- Billing
- Compliance centre
- Audit logs

### Registered Migration Agent

Purpose:

- Professional case management and lodgement oversight.

Can access:

- Dashboard
- Client records
- Matters
- Document review
- AI-assisted matter work
- Reports

### Case Officer

Purpose:

- Daily task, checklist, document, and client communication execution.

Can access:

- Dashboard
- Client records
- Matters
- Checklist updates
- Document uploads
- Client messages

### Finance Officer

Purpose:

- Invoice, payment, receipt, and revenue workflow management.

Can access:

- Dashboard
- Billing
- Invoice payment status
- PDF receipts
- Revenue reports

### Client

Purpose:

- Client-facing self-service.

Can access:

- Matter progress
- Requested document uploads
- Secure messages
- Invoice payment
- AI portal guidance

## Implementation

Frontend:

- Stores selected user in local storage under `asun-current-user`.
- Uses React context for current-user state.
- Protects routes through role permission checks.
- Sends the selected user ID to the API through `x-user-id`.

Backend:

- Resolves the request role from `x-user-id`.
- Applies central `requireRoles` middleware to protected routes.
- Uses tenant-aware repository operations.
- Returns typed `RBAC_403` errors for disallowed access.
- Writes audit events for material workflow actions.

## Authentication Upgrade Path

The current access layer is intentionally isolated. A production authentication provider can replace the selector without rewriting product workflows:

- Replace local user selection with authenticated sessions or JWTs.
- Map authenticated accounts to the existing `User` and `Role` model.
- Keep route permission checks, backend RBAC, tenant scoping, and audit events.
- Add password reset, MFA, invitations, and client portal account activation when required.

# Frontend UX

## Design Direction

The app is a professional SaaS operations tool. It is clean, dense, scannable, and built for daily case work.

The product avoids marketing-heavy surfaces inside the application. The landing page establishes the product and role access, while the main workspace prioritizes workflows, tables, dashboards, filters, status clarity, and fast operational movement.

## First Screen

The first screen is a product entry page with:

- Product name: ASUN Migrations
- Short value proposition
- Workspace role selector
- Role descriptions
- Primary action button

Available product roles:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Case Officer
- Finance Officer
- Client Portal User

After role selection, staff users enter the staff workspace and client users enter the portal workspace.

## App Shell

Staff app layout:

- Left sidebar navigation
- Top header with tenant name and role switcher
- Main content area
- Contextual action buttons

Client portal layout:

- Focused portal navigation
- Matter progress summary
- Outstanding documents
- Invoice/payment card
- Secure messages

## Navigation By Role

ASUN Admin:

- Dashboard
- Workflows
- Reports
- Compliance
- Audit Logs

Agency Admin:

- Dashboard
- Clients
- Matters
- Workflows
- Billing
- Reports
- Compliance
- Audit Logs

Registered Migration Agent:

- Dashboard
- Clients
- Matters
- Reports

Case Officer:

- Dashboard
- Clients
- Matters

Finance Officer:

- Dashboard
- Billing
- Reports

Client:

- Portal

## Key Screens

### Dashboard

Widgets:

- Active matters
- Overdue tasks
- Upcoming deadlines
- Monthly revenue
- Client portal adoption
- Pipeline by stage
- Recent messages

### Clients

Features:

- Client table
- Client profile page
- Create/edit client form
- Consent status
- Conflict status
- Dependants
- Matter history

### Matters

Features:

- Matter table
- Matter creation from workflow template
- AI intake plan
- Matter overview page
- Stage tracker
- Key dates
- Tasks
- Checklist
- Documents
- Invoices
- Messages and notes
- AI matter assistant
- AI workflow suggestions
- AI message drafting

### Documents

Features:

- Upload controls
- File metadata
- Scan status
- Status badges
- AI review
- Verify/reject actions
- E-signature envelope action

### Billing

Features:

- Invoice table
- Payment status
- Mock checkout
- Paid status updates
- Receipt download

### Reports

Features:

- Pipeline chart
- Revenue chart
- SLA table
- Deadline table
- Workload table
- AI report insights
- CSV export
- XLSX export

### Compliance

Features:

- Tenant settings
- AI compliance review
- Document security summary
- Retention and erasure requests
- Notification logs
- Integration event logs

### Audit Logs

Features:

- Filter by actor, entity, action, and date
- Timeline table
- Metadata details

## UI Component Style

The product uses Tailwind with reusable components:

- Buttons
- Icon buttons
- Badges
- Status pills
- Data tables
- Form fields
- Select menus
- Empty states
- Loading states
- Error states

Icons come from Lucide React.

## Accessibility

Target WCAG 2.2 AA:

- Keyboard navigable controls
- Visible focus states
- Sufficient contrast
- Labelled form fields
- Clear error messages
- No text overlap on small screens

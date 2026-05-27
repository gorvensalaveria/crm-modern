# Frontend UX Plan

## Design Direction

The app should feel like a professional SaaS operations tool. It should be clean, dense, scannable, and built for daily case work.

Avoid a marketing-heavy interface inside the application. The landing page can introduce the demo, but the main product should prioritize workflows, tables, dashboards, filters, and status clarity.

## First Screen

The first screen should be a demo entry page with:

- Product name: ASUN Migrations
- Short value proposition
- "View Demo As" dropdown
- Role descriptions
- Primary action button

The user should be able to select:

- ASUN Admin
- Agency Admin
- Registered Migration Agent
- Case Officer
- Finance Officer
- Client Portal User

After selecting a role, route to the correct experience.

## App Shell

Staff app layout:

- Left sidebar navigation
- Top header with tenant name and role switcher
- Main content area
- Contextual action buttons

Client portal layout:

- Simpler header
- Matter progress summary
- Outstanding documents
- Invoice/payment card
- Secure messages

## Navigation by Role

ASUN Admin:

- Dashboard
- Tenants
- Users
- Templates
- Audit Logs

Agency Admin:

- Dashboard
- Clients
- Matters
- Workflows
- Users
- Reports
- Audit Logs

RMA:

- Dashboard
- Clients
- Matters
- Documents
- Reports
- Messages

Case Officer:

- Dashboard
- Clients
- Matters
- Tasks
- Documents
- Messages

Finance:

- Dashboard
- Invoices
- Quotes
- Payments
- Revenue Reports

Client:

- My Matter
- Documents
- Invoices
- Messages

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

- Searchable table
- Filters by consent status and conflict check
- Client profile page
- Dependants section
- Identifiers section
- Matter history

### Matters

Features:

- Pipeline board or table
- Matter overview page
- Stage tracker
- Key dates
- Team assignment
- Tasks
- Checklist
- Documents
- Invoices

### Documents

Features:

- Upload area
- File metadata
- Status badges
- Preview placeholder
- Verify/reject actions
- Audit history

### Billing

Features:

- Invoice table
- Invoice detail
- Quote to invoice action
- Payment status
- Stripe checkout simulation

### Reports

Features:

- Pipeline chart
- Revenue by subclass
- Overdue work table
- Export buttons

### Audit Logs

Features:

- Filter by actor, entity, action, date
- Timeline table
- Metadata drawer

## UI Component Style

Use Tailwind with reusable components:

- Buttons
- Icon buttons
- Badges
- Status pills
- Data tables
- Form fields
- Select menus
- Tabs
- Dialogs
- Empty states
- Toasts

Use icons from Lucide React where appropriate.

## Accessibility

Target WCAG 2.2 AA:

- Keyboard navigable controls
- Visible focus states
- Sufficient contrast
- Labelled form fields
- Clear error messages
- No text overlap on small screens


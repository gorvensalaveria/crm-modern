# Development Roadmap

## Phase 1: Project Foundation

Goal:

Create the working full-stack skeleton.

Tasks:

- Set up React + Vite client.
- Set up Express + TypeScript server.
- Connect npm workspaces.
- Add Tailwind CSS.
- Add shared TypeScript package.
- Add base layout and routing.
- Add API health endpoint.

Deliverable:

- Frontend and backend run together with `npm run dev`.

## Phase 2: Demo Session and App Shell

Goal:

Create the presentation-friendly demo entry flow.

Tasks:

- Build landing page with role dropdown.
- Add demo user context.
- Add role switcher in app shell.
- Add role-specific navigation.
- Add protected route helper.

Deliverable:

- User can select a persona and enter the matching app experience.

## Phase 3: Dashboard

Goal:

Create the main staff dashboard.

Tasks:

- Add dashboard API endpoint.
- Add seeded demo dashboard data.
- Build metric cards.
- Build task list.
- Build pipeline chart.
- Build alerts and recent messages.

Deliverable:

- Employer can immediately see the product value after role selection.

## Phase 4: Clients

Goal:

Build the client CRM foundation.

Tasks:

- Add clients API endpoints.
- Build clients table.
- Build client detail page.
- Add create/edit client form.
- Add consent and conflict status.
- Add dependant list.

Deliverable:

- Staff can manage client records.

## Phase 5: Matters and Workflows

Goal:

Show the strongest business logic in the app.

Tasks:

- Add matters API endpoints.
- Add workflow template seed data.
- Create matter from template.
- Generate tasks and checklist items.
- Build matter detail page.
- Add stage tracker.

Deliverable:

- Creating a visa matter automatically generates operational work.

## Phase 6: Documents

Goal:

Support document tracking and compliance states.

Tasks:

- Add document metadata model.
- Add upload endpoint.
- Build document upload UI.
- Add verify/reject actions.
- Log audit events.

Deliverable:

- Client and staff document workflows are visible.

## Phase 7: Client Portal

Goal:

Build the client-facing experience.

Tasks:

- Add portal summary endpoint.
- Build matter progress screen.
- Build outstanding documents screen.
- Build invoice list.
- Build secure messages screen.

Deliverable:

- Demo role can switch to client and see a simplified portal.

## Phase 8: Billing and Stripe Simulation

Goal:

Show financial workflow readiness.

Tasks:

- Add invoice endpoints.
- Add quote endpoints.
- Add mocked checkout session endpoint.
- Add Stripe webhook handler.
- Build invoice and payment screens.

Deliverable:

- Finance role can demonstrate invoice tracking and payment updates.

## Phase 9: Reports and Audit Logs

Goal:

Show management visibility and compliance.

Tasks:

- Add reporting endpoints.
- Build pipeline report.
- Build revenue report.
- Build overdue work report.
- Build audit logs screen.
- Add export simulation.

Deliverable:

- Admin/RMA users can inspect business and compliance data.

## Phase 10: Portfolio Polish

Goal:

Make the project employer-ready.

Tasks:

- Add strong seed data.
- Add loading, empty, and error states.
- Improve responsive layouts.
- Add README screenshots.
- Add tests for key backend services.
- Add deployment guide.
- Add CI workflow.

Deliverable:

- A polished, deployable product demo with clear technical documentation.


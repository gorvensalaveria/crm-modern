import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { demoUsers, mockApiRoutes, renderApp, storeDemoUser } from "./test/render-app";

const dashboard = {
  metrics: {
    activeMatters: 3,
    overdueTasks: 1,
    upcomingDeadlines: 2,
    monthlyRevenue: 4200,
    clientPortalAdoption: 72
  },
  tasks: [
    {
      id: "task-1",
      title: "Verify health check certificate",
      status: "OPEN",
      dueOn: "2026-06-01",
      assignee: "Sophie Nguyen",
      matterId: "matter-1"
    }
  ],
  matters: [
    {
      id: "matter-1",
      clientName: "John Smith",
      visaSubclass: "482",
      title: "482 Temporary Skill Shortage",
      stage: "DOCUMENTS",
      progress: 45,
      primaryAgent: "Daniel Cho",
      caseOfficer: "Sophie Nguyen",
      trn: "ABC1234567",
      keyDate: "2026-06-30",
      tasksOpen: 1,
      tasksTotal: 2,
      documents: [],
      invoices: []
    }
  ],
  recentMessages: [
    {
      id: "message-1",
      from: "John Smith",
      preview: "I uploaded the certificate.",
      matterTitle: "482 Temporary Skill Shortage",
      receivedAt: "2026-05-28"
    }
  ],
  alerts: [
    {
      id: "alert-1",
      severity: "WARNING",
      title: "Visa expiry inside 30 days",
      description: "Review the upcoming key date.",
      dueOn: "2026-06-15"
    }
  ]
};

const portalSummary = {
  matterId: "matter-1",
  clientName: "John Smith",
  matterTitle: "482 Temporary Skill Shortage",
  stage: "DOCUMENTS",
  progress: 45,
  outstandingDocuments: 1,
  nextStep: "Upload your passport bio page.",
  invoice: {
    id: "invoice-1",
    number: "INV-2026-1001",
    amount: 1100,
    status: "SENT",
    dueOn: "2099-07-15"
  },
  documents: [
    {
      id: "checklist-1",
      title: "Passport bio page",
      status: "REQUESTED",
      updatedAt: "2026-05-28",
      documentCount: 0,
      latestDocument: null
    }
  ]
};

describe("ASUN Migrations frontend shell", () => {
  it("lets an employer choose a demo role and enter the staff dashboard", async () => {
    const user = userEvent.setup();
    mockApiRoutes({
      "/api/demo-users": demoUsers,
      "/api/dashboard": dashboard
    });

    renderApp(<App />);

    expect(await screen.findByRole("heading", { name: "ASUN Migrations" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Registered Migration Agent" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Demo persona"), "rma-demo");
    expect(screen.getByText("Daniel Cho")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /enter demo/i }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Verify health check certificate")).toBeInTheDocument();

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("asun-demo-user") ?? "{}")).toMatchObject({
        id: "rma-demo",
        role: "RMA"
      });
    });
  });

  it("redirects protected workspace routes to the role picker when no demo user is selected", async () => {
    mockApiRoutes({
      "/api/demo-users": demoUsers
    });

    renderApp(<App />, "/app");

    expect(await screen.findByRole("heading", { name: "ASUN Migrations" })).toBeInTheDocument();
    expect(screen.getByText("Choose a product role")).toBeInTheDocument();
  });

  it("blocks client users from staff-only routes in the browser", async () => {
    storeDemoUser(demoUsers[2]!);

    renderApp(<App />, "/app/billing");

    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(screen.getByText(/Current role: Client Portal User/)).toBeInTheDocument();
    expect(screen.getByText(/Allowed roles: ASUN ADMIN, AGENCY ADMIN, FINANCE/)).toBeInTheDocument();
  });

  it("sends client users to the portal workspace", async () => {
    storeDemoUser(demoUsers[2]!);
    mockApiRoutes({
      "/api/portal/summary": portalSummary
    });

    renderApp(<App />, "/app");

    expect(await screen.findByRole("heading", { name: "Welcome, John Smith" })).toBeInTheDocument();
    expect(screen.getByText("Requested Documents")).toBeInTheDocument();
    expect(screen.getAllByText("Passport bio page")).toHaveLength(2);
  });
});

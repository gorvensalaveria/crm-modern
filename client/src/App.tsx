import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { RequireRole } from "./components/RequireRole";
import { useDemoUser } from "./state/demo-user";

const AuditPage = lazy(() => import("./pages/AuditPage").then((module) => ({ default: module.AuditPage })));
const BillingPage = lazy(() => import("./pages/BillingPage").then((module) => ({ default: module.BillingPage })));
const ClientDetailPage = lazy(() =>
  import("./pages/ClientDetailPage").then((module) => ({ default: module.ClientDetailPage }))
);
const ClientFormPage = lazy(() =>
  import("./pages/ClientFormPage").then((module) => ({ default: module.ClientFormPage }))
);
const ClientsPage = lazy(() => import("./pages/ClientsPage").then((module) => ({ default: module.ClientsPage })));
const CompliancePage = lazy(() =>
  import("./pages/CompliancePage").then((module) => ({ default: module.CompliancePage }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const MatterDetailPage = lazy(() =>
  import("./pages/MatterDetailPage").then((module) => ({ default: module.MatterDetailPage }))
);
const MatterFormPage = lazy(() =>
  import("./pages/MatterFormPage").then((module) => ({ default: module.MatterFormPage }))
);
const MattersPage = lazy(() => import("./pages/MattersPage").then((module) => ({ default: module.MattersPage })));
const PortalPage = lazy(() => import("./pages/PortalPage").then((module) => ({ default: module.PortalPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const WorkflowsPage = lazy(() =>
  import("./pages/WorkflowsPage").then((module) => ({ default: module.WorkflowsPage }))
);

function RouteLoading() {
  return (
    <div className="grid min-h-[45vh] place-items-center">
      <div className="rounded-md border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-ink shadow-sm">
        Loading workspace...
      </div>
    </div>
  );
}

export function App() {
  const { currentUser } = useDemoUser();

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/app"
          element={currentUser ? <AppLayout /> : <Navigate to="/" replace />}
        >
          <Route
            index
            element={
              currentUser?.role === "CLIENT" ? (
                <RequireRole permission="portal">
                  <PortalPage />
                </RequireRole>
              ) : (
                <RequireRole permission="dashboard">
                  <DashboardPage />
                </RequireRole>
              )
            }
          />
          <Route
            path="clients"
            element={
              <RequireRole permission="clients">
                <ClientsPage />
              </RequireRole>
            }
          />
          <Route
            path="clients/new"
            element={
              <RequireRole permission="clients">
                <ClientFormPage />
              </RequireRole>
            }
          />
          <Route
            path="clients/:clientId"
            element={
              <RequireRole permission="clients">
                <ClientDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="clients/:clientId/edit"
            element={
              <RequireRole permission="clients">
                <ClientFormPage />
              </RequireRole>
            }
          />
          <Route
            path="matters"
            element={
              <RequireRole permission="matters">
                <MattersPage />
              </RequireRole>
            }
          />
          <Route
            path="matters/new"
            element={
              <RequireRole permission="matters">
                <MatterFormPage />
              </RequireRole>
            }
          />
          <Route
            path="matters/:matterId"
            element={
              <RequireRole permission="matters">
                <MatterDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="billing"
            element={
              <RequireRole permission="billing">
                <BillingPage />
              </RequireRole>
            }
          />
          <Route
            path="reports"
            element={
              <RequireRole permission="reports">
                <ReportsPage />
              </RequireRole>
            }
          />
          <Route
            path="workflows"
            element={
              <RequireRole permission="workflows">
                <WorkflowsPage />
              </RequireRole>
            }
          />
          <Route
            path="audit"
            element={
              <RequireRole permission="audit">
                <AuditPage />
              </RequireRole>
            }
          />
          <Route
            path="compliance"
            element={
              <RequireRole permission="compliance">
                <CompliancePage />
              </RequireRole>
            }
          />
          <Route
            path="portal"
            element={
              <RequireRole permission="portal">
                <PortalPage />
              </RequireRole>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

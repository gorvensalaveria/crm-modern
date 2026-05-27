import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AuditPage } from "./pages/AuditPage";
import { BillingPage } from "./pages/BillingPage";
import { ClientDetailPage } from "./pages/ClientDetailPage";
import { ClientFormPage } from "./pages/ClientFormPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { MatterFormPage } from "./pages/MatterFormPage";
import { MatterDetailPage } from "./pages/MatterDetailPage";
import { MattersPage } from "./pages/MattersPage";
import { PortalPage } from "./pages/PortalPage";
import { ReportsPage } from "./pages/ReportsPage";
import { useDemoUser } from "./state/demo-user";

export function App() {
  const { currentUser } = useDemoUser();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/app"
        element={currentUser ? <AppLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={currentUser?.role === "CLIENT" ? <PortalPage /> : <DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientFormPage />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />
        <Route path="clients/:clientId/edit" element={<ClientFormPage />} />
        <Route path="matters" element={<MattersPage />} />
        <Route path="matters/new" element={<MatterFormPage />} />
        <Route path="matters/:matterId" element={<MatterDetailPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="portal" element={<PortalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

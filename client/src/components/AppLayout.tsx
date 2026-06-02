import {
  BarChart3,
  BriefcaseBusiness,
  GitBranchPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Users
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { canAccess, type PermissionKey } from "../auth/permissions";
import { useCurrentUser } from "../state/current-user";

const navItems: Array<{
  label: string;
  to: string;
  icon: React.ComponentType<{ size: number }>;
  permission: PermissionKey;
}> = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard, permission: "dashboard" },
  { label: "Clients", to: "/app/clients", icon: Users, permission: "clients" },
  { label: "Matters", to: "/app/matters", icon: BriefcaseBusiness, permission: "matters" },
  { label: "Workflows", to: "/app/workflows", icon: GitBranchPlus, permission: "workflows" },
  { label: "Billing", to: "/app/billing", icon: Receipt, permission: "billing" },
  { label: "Reports", to: "/app/reports", icon: BarChart3, permission: "reports" },
  { label: "Compliance", to: "/app/compliance", icon: SlidersHorizontal, permission: "compliance" },
  { label: "Audit Logs", to: "/app/audit", icon: ShieldCheck, permission: "audit" },
  { label: "Portal", to: "/app/portal", icon: LayoutDashboard, permission: "portal" }
];

export function AppLayout() {
  const { currentUser, clearCurrentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleNavItems = currentUser
    ? navItems.filter((item) => canAccess(currentUser.role, item.permission))
    : [];

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-ink">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-20 bg-ink/35 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-black/10 bg-white/95 px-5 py-6 shadow-panel transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
        aria-label="Primary navigation"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">ASUN</p>
            <h1 className="mt-1 text-2xl font-semibold">Migrations CRM</h1>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-ink/70 hover:border-coral hover:text-coral lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/app"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-ink text-white"
                      : "text-ink/70 hover:bg-mint hover:text-ink"
                  ].join(" ")
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-md border border-black/10 bg-wheat p-4">
          <p className="text-sm font-semibold">{currentUser?.name}</p>
          <p className="mt-1 text-xs text-ink/60">{currentUser?.title}</p>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-[#f7f5ef]/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-black/10 bg-white text-ink shadow-sm hover:border-moss hover:text-moss lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">
                  Role
                </p>
                <h2 className="truncate text-lg font-semibold md:text-xl">{currentUser?.title}</h2>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:border-coral hover:text-coral md:px-4"
              onClick={() => {
                clearCurrentUser();
                navigate("/");
              }}
            >
              <LogOut size={16} />
              Change role
            </button>
          </div>
        </header>

        <div className="px-4 py-6 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

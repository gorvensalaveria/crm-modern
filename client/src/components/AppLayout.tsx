import {
  BarChart3,
  BriefcaseBusiness,
  GitBranchPlus,
  LayoutDashboard,
  LogOut,
  Receipt,
  ShieldCheck,
  Users
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { canAccess, type PermissionKey } from "../auth/permissions";
import { useDemoUser } from "../state/demo-user";

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
  { label: "Audit Logs", to: "/app/audit", icon: ShieldCheck, permission: "audit" },
  { label: "Portal", to: "/app/portal", icon: LayoutDashboard, permission: "portal" }
];

export function AppLayout() {
  const { currentUser, clearCurrentUser } = useDemoUser();
  const navigate = useNavigate();
  const visibleNavItems = currentUser
    ? navItems.filter((item) => canAccess(currentUser.role, item.permission))
    : [];

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-black/10 bg-white/90 px-5 py-6 shadow-panel lg:block">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-moss">ASUN</p>
          <h1 className="mt-1 text-2xl font-semibold">Migrations CRM</h1>
        </div>

        <nav className="mt-8 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/app"}
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

        <div className="absolute bottom-6 left-5 right-5 rounded-md border border-black/10 bg-wheat p-4">
          <p className="text-sm font-semibold">{currentUser?.name}</p>
          <p className="mt-1 text-xs text-ink/60">{currentUser?.title}</p>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-[#f7f5ef]/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">
                Demo role
              </p>
              <h2 className="text-xl font-semibold">{currentUser?.title}</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-coral hover:text-coral"
              onClick={() => {
                clearCurrentUser();
                navigate("/");
              }}
            >
              <LogOut size={16} />
              Change demo role
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

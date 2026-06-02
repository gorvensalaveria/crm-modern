import { ArrowRight, Building2, ShieldCheck, Workflow } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useCurrentUser } from "../state/current-user";

export function LandingPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useCurrentUser();
  const { data: roleUsers = [], isLoading } = useQuery({
    queryKey: ["workspace-users"],
    queryFn: api.roleUsers
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const selectedUser = roleUsers.find((user) => user.id === selectedUserId);

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-8 text-ink md:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss">
            SaaS CRM
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight tracking-normal md:text-7xl">
            ASUN Migrations
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/70">
            A migration-agency operations platform for clients, visa matters, workflows,
            documents, billing, reporting, and compliance-ready audit trails.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Building2, label: "Multi-tenant CRM" },
              { icon: Workflow, label: "Visa workflows" },
              { icon: ShieldCheck, label: "Audit ready" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-black/10 bg-white p-4">
                  <Icon className="text-coral" size={22} />
                  <p className="mt-3 text-sm font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
            View workspace as
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Choose a product role</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Choose the workspace perspective you want to access.
          </p>

          <label className="mt-6 block text-sm font-semibold" htmlFor="product-role">
            Role
          </label>
          <select
            id="product-role"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-2 w-full rounded-md border border-black/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-mint"
          >
            <option value="">{isLoading ? "Loading roles..." : "Select a role"}</option>
            {roleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.title}
              </option>
            ))}
          </select>

          {selectedUser ? (
            <div className="mt-4 rounded-md bg-wheat p-4">
              <p className="font-semibold">{selectedUser.name}</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">{selectedUser.description}</p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={!selectedUser}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/30"
            onClick={() => {
              if (!selectedUser) return;
              setCurrentUser(selectedUser);
              navigate(selectedUser.role === "CLIENT" ? "/app/portal" : "/app");
            }}
          >
            Enter workspace
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  );
}

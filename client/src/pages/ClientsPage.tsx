import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export function ClientsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients
  });

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Clients"
        description="Centralized client records with identifiers, consent status, conflict checks, dependants, and portal access."
      />

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-black/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Client Register</h2>
            <p className="mt-1 text-sm text-ink/55">Create, edit, and inspect client records.</p>
          </div>
          <Link
            to="/app/clients/new"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
          >
            <Plus size={16} />
            New client
          </Link>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-ink/60">Loading clients...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-wheat text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Nationality</th>
                  <th className="px-5 py-3">Passport</th>
                  <th className="px-5 py-3">Consent</th>
                  <th className="px-5 py-3">Conflict</th>
                  <th className="px-5 py-3">Dependants</th>
                  <th className="px-5 py-3">Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {data.map((client) => (
                  <tr key={client.id}>
                    <td className="px-5 py-4">
                      <Link
                        to={`/app/clients/${client.id}`}
                        className="inline-flex items-center gap-2 font-semibold hover:text-coral"
                      >
                        <Search size={15} />
                        {client.name}
                      </Link>
                      <p className="text-ink/55">{client.email}</p>
                    </td>
                    <td className="px-5 py-4">{client.nationality}</td>
                    <td className="px-5 py-4 font-mono text-xs">{client.passportMasked}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={client.consentStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={client.conflictCheck} />
                    </td>
                    <td className="px-5 py-4">{client.dependants}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span>{client.portalActive ? "Active" : "Not invited"}</span>
                        <Link
                          to={`/app/clients/${client.id}/edit`}
                          className="text-xs font-semibold text-moss hover:text-coral"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

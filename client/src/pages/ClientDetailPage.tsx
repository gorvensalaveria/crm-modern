import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Edit, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export function ClientDetailPage() {
  const { clientId } = useParams();
  const { data: client, isLoading, error } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api.client(clientId ?? ""),
    enabled: Boolean(clientId)
  });

  if (isLoading) return <p className="text-sm text-ink/60">Loading client...</p>;
  if (error || !client) return <p className="text-sm text-rose-700">Client not found.</p>;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/app/clients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-moss hover:text-coral"
        >
          <ArrowLeft size={16} />
          Back to clients
        </Link>
        <Link
          to={`/app/clients/${client.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
        >
          <Edit size={16} />
          Edit client
        </Link>
      </div>

      <PageHeader
        eyebrow="Client Profile"
        title={client.name}
        description="Client profile, compliance status, dependants, and linked visa matters."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Profile</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <Info label="Email" value={client.email} />
            <Info label="Date of birth" value={client.dob} />
            <Info label="Nationality" value={client.nationality} />
            <Info label="Passport" value={client.passportMasked} />
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status={client.consentStatus} />
            <StatusBadge status={client.conflictCheck} />
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Portal {client.portalActive ? "active" : "inactive"}
            </span>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Linked Matters</h2>
          <div className="mt-4 space-y-3">
            {client.matters.length ? (
              client.matters.map((matter) => (
                <div key={matter.id} className="rounded-md border border-black/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-coral">Subclass {matter.visaSubclass}</p>
                      <p className="mt-1 font-semibold">{matter.title}</p>
                      <p className="mt-1 text-sm text-ink/55">
                        {matter.primaryAgent} · {matter.caseOfficer}
                      </p>
                    </div>
                    <StatusBadge status={matter.stage} />
                  </div>
                  <p className="mt-3 text-sm text-ink/60">
                    {matter.tasksOpen} open tasks · ${matter.invoicesTotal.toLocaleString()} invoiced
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No matters linked yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText size={18} />
          <h2 className="text-lg font-semibold">Dependants</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {client.dependantList.length ? (
            client.dependantList.map((dependant) => (
              <div key={dependant.id} className="rounded-md bg-wheat p-4">
                <p className="font-semibold">{dependant.name}</p>
                <p className="mt-1 text-sm text-ink/55">{dependant.relationship}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink/60">No dependants recorded.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink/50">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}


import { useQuery } from "@tanstack/react-query";
import { FileCheck2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

export function MattersPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["matters"],
    queryFn: api.matters
  });

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader
          eyebrow="Visa Operations"
          title="Matters"
          description="Matter workspaces connect client records, stages, key dates, workflow tasks, checklist items, documents, and invoices."
        />
        <Link
          to="/app/matters/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
        >
          <Plus size={16} />
          New matter
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink/60">Loading matters...</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          {data.map((matter) => (
            <article key={matter.id} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-coral">Subclass {matter.visaSubclass}</p>
                  <Link to={`/app/matters/${matter.id}`} className="mt-1 block text-xl font-semibold hover:text-coral">
                    {matter.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink/60">{matter.clientName}</p>
                </div>
                <StatusBadge status={matter.stage} />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/60">Progress</span>
                  <span className="font-semibold">{matter.progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-black/10">
                  <div
                    className="h-2 rounded-full bg-coral"
                    style={{ width: `${matter.progress}%` }}
                  />
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-ink/50">Primary agent</dt>
                  <dd className="mt-1 font-semibold">{matter.primaryAgent}</dd>
                </div>
                <div>
                  <dt className="text-ink/50">Case officer</dt>
                  <dd className="mt-1 font-semibold">{matter.caseOfficer}</dd>
                </div>
                <div>
                  <dt className="text-ink/50">Key date</dt>
                  <dd className="mt-1 font-semibold">{matter.keyDate}</dd>
                </div>
                <div>
                  <dt className="text-ink/50">Tasks</dt>
                  <dd className="mt-1 font-semibold">
                    {matter.tasksOpen}/{matter.tasksTotal} open
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-md bg-wheat p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileCheck2 size={16} />
                  Documents
                </div>
                <div className="mt-3 space-y-2">
                  {matter.documents.length ? (
                    matter.documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>{document.title}</span>
                        <StatusBadge status={document.status} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-ink/55">No checklist items generated yet.</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

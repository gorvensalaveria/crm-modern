import { useQuery } from "@tanstack/react-query";
import { Filter, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { AuditFilters } from "../types";

const emptyFilters: AuditFilters = {
  action: "",
  actor: "",
  entity: "",
  from: "",
  to: ""
};

export function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const { data, isLoading } = useQuery({
    queryKey: ["audit-events", filters],
    queryFn: () => api.auditEvents(filters)
  });
  const meta = data?.meta ?? { total: 0, actions: [], actors: [] };
  const events = data?.events ?? [];

  function updateFilter<K extends keyof AuditFilters>(field: K, value: AuditFilters[K]) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Compliance"
        title="Audit Logs"
        description="A searchable compliance trail for sensitive actions, record updates, downloads, stage changes, invoices, messages, and verification events."
      />

      <section className="mb-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter size={18} />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.7fr_0.7fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold">Action</span>
            <select
              value={filters.action}
              onChange={(event) => updateFilter("action", event.target.value)}
              className="form-input mt-2"
            >
              <option value="">All actions</option>
              {meta.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Actor</span>
            <input
              value={filters.actor}
              onChange={(event) => updateFilter("actor", event.target.value)}
              placeholder="Search actor"
              className="form-input mt-2"
              list="audit-actors"
            />
            <datalist id="audit-actors">
              {meta.actors.map((actor) => (
                <option key={actor} value={actor} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Entity</span>
            <input
              value={filters.entity}
              onChange={(event) => updateFilter("entity", event.target.value)}
              placeholder="Client, invoice, matter"
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">From</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">To</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
              className="form-input mt-2"
            />
          </label>

          <button
            type="button"
            onClick={() => setFilters(emptyFilters)}
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-black/10 px-4 text-sm font-semibold hover:border-coral hover:text-coral"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} />
            <h2 className="text-lg font-semibold">Events</h2>
          </div>
          <p className="text-sm text-ink/55">{meta.total} matching events</p>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-ink/60">Loading audit events...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {events.length ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="grid gap-3 rounded-md border border-black/10 p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{event.action}</p>
                      <StatusBadge status={event.entityType} />
                    </div>
                    <p className="mt-1 text-sm text-ink/60">
                      {event.actor} acted on {event.entity}
                    </p>
                  </div>
                  <p className="text-sm text-ink/50">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No audit events match these filters.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

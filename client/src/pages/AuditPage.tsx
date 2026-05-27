import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

export function AuditPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["audit-events"],
    queryFn: api.auditEvents
  });

  return (
    <div>
      <PageHeader
        eyebrow="Compliance"
        title="Audit Logs"
        description="A compliance trail for sensitive actions, record updates, downloads, stage changes, invoices, and verification events."
      />

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-ink/60">Loading audit events...</p>
        ) : (
          <div className="space-y-3">
            {data.map((event) => (
              <div key={event.id} className="grid gap-2 rounded-md border border-black/10 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold">{event.action}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    {event.actor} acted on {event.entity}
                  </p>
                </div>
                <p className="text-sm text-ink/50">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


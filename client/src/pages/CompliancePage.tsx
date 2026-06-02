import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { AiComplianceReview, RetentionRequestPayload, TenantSettingsPayload } from "../types";
import { FileCheck2, MailCheck, PlugZap, ShieldCheck, Sparkles } from "lucide-react";
import { aiProviderLabel } from "../utils/ai";

const emptyRetentionRequest: RetentionRequestPayload = {
  action: "ARCHIVE_REVIEW",
  reason: ""
};

export function CompliancePage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<TenantSettingsPayload | null>(null);
  const [retentionRequest, setRetentionRequest] = useState<RetentionRequestPayload>(emptyRetentionRequest);
  const { data, isLoading, error } = useQuery({
    queryKey: ["compliance"],
    queryFn: api.compliance
  });

  useEffect(() => {
    if (data && !settings) {
      setSettings({
        brandColor: data.settings.brandColor,
        retentionYears: data.settings.retentionYears,
        taxRate: data.settings.taxRate,
        privacyContactEmail: data.settings.privacyContactEmail ?? "",
        stripeMode: data.settings.stripeMode,
        docusignMode: data.settings.docusignMode,
        emailProvider: data.settings.emailProvider
      });
    }
  }, [data, settings]);

  const settingsMutation = useMutation({
    mutationFn: () => api.updateTenantSettings(settings!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["compliance"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    }
  });

  const retentionMutation = useMutation({
    mutationFn: () => api.createRetentionRequest(retentionRequest),
    onSuccess: async () => {
      setRetentionRequest(emptyRetentionRequest);
      await queryClient.invalidateQueries({ queryKey: ["compliance"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    }
  });

  const decisionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" | "COMPLETED" }) =>
      api.decideRetentionRequest(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["compliance"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    }
  });

  const complianceReviewMutation = useMutation({
    mutationFn: api.generateComplianceReview
  });

  function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settings) settingsMutation.mutate();
  }

  function submitRetention(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    retentionMutation.mutate();
  }

  if (isLoading) return <p className="text-sm text-ink/60">Loading compliance centre...</p>;
  if (error || !data || !settings) return <p className="text-sm text-rose-700">Compliance centre unavailable.</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Compliance Centre"
        description="Tenant settings, document security, provider events, notifications, and retention controls aligned to MARA and APP obligations."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Clean documents" value={String(data.documentSecurity.clean)} helper="Passed mock AV scanning" icon={FileCheck2} />
        <MetricCard label="Blocked scans" value={String(data.documentSecurity.blocked)} helper="Failed or quarantined files" icon={ShieldCheck} />
        <MetricCard label="Notifications" value={String(data.notifications.length)} helper="Recent email delivery log" icon={MailCheck} />
        <MetricCard label="Integrations" value={String(data.integrationEvents.length)} helper="Stripe, DocuSign, email events" icon={PlugZap} />
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="text-lg font-semibold">AI Compliance Review</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
              Review privacy settings, retention, document security, provider logs, notifications, and recent audit activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => complianceReviewMutation.mutate()}
            disabled={complianceReviewMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Sparkles size={16} />
            {complianceReviewMutation.isPending ? "Reviewing..." : "Generate Compliance Review"}
          </button>
        </div>

        {complianceReviewMutation.error ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {complianceReviewMutation.error instanceof Error
              ? complianceReviewMutation.error.message
              : "Unable to generate compliance review"}
          </div>
        ) : null}

        {complianceReviewMutation.data ? (
          <AiComplianceReviewPanel review={complianceReviewMutation.data} />
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submitSettings} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Tenant & Compliance Settings</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Brand color
              <input
                value={settings.brandColor}
                onChange={(event) => setSettings({ ...settings, brandColor: event.target.value })}
                className="form-input mt-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Retention years
              <input
                type="number"
                min={1}
                max={30}
                value={settings.retentionYears}
                onChange={(event) => setSettings({ ...settings, retentionYears: Number(event.target.value) })}
                className="form-input mt-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Tax rate
              <input
                type="number"
                min={0}
                max={100}
                value={settings.taxRate}
                onChange={(event) => setSettings({ ...settings, taxRate: Number(event.target.value) })}
                className="form-input mt-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Privacy contact
              <input
                value={settings.privacyContactEmail ?? ""}
                onChange={(event) => setSettings({ ...settings, privacyContactEmail: event.target.value })}
                className="form-input mt-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Stripe mode
              <select
                value={settings.stripeMode}
                onChange={(event) => setSettings({ ...settings, stripeMode: event.target.value as "mock" | "live" })}
                className="form-input mt-2"
              >
                <option value="mock">Mock</option>
                <option value="live">Live ready</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Email provider
              <select
                value={settings.emailProvider}
                onChange={(event) => setSettings({ ...settings, emailProvider: event.target.value as "mock" | "sendgrid" | "ses" })}
                className="form-input mt-2"
              >
                <option value="mock">Mock</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">AWS SES</option>
              </select>
            </label>
          </div>
          <button type="submit" className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">
            Save settings
          </button>
        </form>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Document Security</h2>
          <div className="mt-4 space-y-3">
            {data.documentSecurity.recent.slice(0, 6).map((document) => (
              <div key={document.id} className="flex items-center justify-between gap-3 rounded-md border border-black/10 p-3">
                <div>
                  <p className="font-semibold">{document.title}</p>
                  <p className="text-sm text-ink/55">{document.storageProvider} storage · scanned {document.scannedAt ? new Date(document.scannedAt).toLocaleDateString() : "pending"}</p>
                </div>
                <StatusBadge status={document.scanStatus} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Retention & Erasure Requests</h2>
          <form onSubmit={submitRetention} className="mt-4 grid gap-3 md:grid-cols-[0.7fr_1fr_auto]">
            <select
              value={retentionRequest.action}
              onChange={(event) => setRetentionRequest({ ...retentionRequest, action: event.target.value as RetentionRequestPayload["action"] })}
              className="form-input"
            >
              <option value="ARCHIVE_REVIEW">Archive review</option>
              <option value="EXPORT">Access/export request</option>
              <option value="ERASURE">Erasure request</option>
            </select>
            <input
              required
              value={retentionRequest.reason}
              onChange={(event) => setRetentionRequest({ ...retentionRequest, reason: event.target.value })}
              placeholder="Reason"
              className="form-input"
            />
            <button type="submit" className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">
              Create
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {data.retentionRequests.map((request) => (
              <div key={request.id} className="rounded-md border border-black/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.action.replaceAll("_", " ")}</p>
                    <p className="text-sm text-ink/55">{request.reason}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["APPROVED", "REJECTED", "COMPLETED"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => decisionMutation.mutate({ id: request.id, status })}
                      className="rounded-md border border-black/10 px-3 py-1.5 text-xs font-semibold hover:border-moss hover:text-moss"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Integration & Notification Logs</h2>
          <div className="mt-4 space-y-3">
            {data.integrationEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-md border border-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{event.provider} · {event.eventType}</p>
                  <StatusBadge status={event.status} />
                </div>
                <p className="mt-1 text-sm text-ink/55">{new Date(event.receivedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AiComplianceReviewPanel({ review }: { review: AiComplianceReview }) {
  const postureClass =
    review.compliancePosture === "ACTION_REQUIRED"
      ? "bg-rose-50 text-rose-800"
      : review.compliancePosture === "WATCH"
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";

  return (
    <div className="mt-5 rounded-md bg-wheat p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${postureClass}`}>
          {review.compliancePosture.replaceAll("_", " ")}
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {aiProviderLabel(review.provider)} · {review.model} · {new Date(review.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{review.summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ComplianceList title="Privacy" items={review.privacyNotes} />
        <ComplianceList title="Retention" items={review.retentionNotes} />
        <ComplianceList title="Document security" items={review.documentSecurityNotes} />
        <ComplianceList title="Integrations" items={review.integrationNotes} />
        <ComplianceList title="Audit findings" items={review.auditFindings} />
        <ComplianceList title="Recommended actions" items={review.recommendedActions} />
      </div>
    </div>
  );
}

function ComplianceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-ink/65">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-white/75 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

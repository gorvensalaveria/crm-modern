import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, ClipboardList, Download, Sparkles } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import type { AiReportInsights } from "../types";

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: api.reports
  });
  const insightsMutation = useMutation({
    mutationFn: api.generateReportInsights
  });

  if (isLoading || !data) return <p className="text-sm text-ink/60">Loading reports...</p>;

  return (
    <div>
      <PageHeader
        eyebrow="Visibility"
        title="Reports"
        description="Pipeline, workload, deadline, SLA, and revenue reports for agency managers and RMAs."
      />

      <section className="mb-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">CSV & XLSX Exports</h2>
            <p className="mt-1 text-sm text-ink/55">Exports are generated from live database aggregates and logged for compliance.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton label="Pipeline" type="pipeline" />
            <ExportButton label="Revenue" type="revenue" />
            <ExportButton label="SLA" type="sla" />
            <ExportButton label="Deadlines" type="deadlines" />
            <ExportButton label="Workload" type="workload" />
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="text-lg font-semibold">AI Report Insights</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
              Summarize pipeline, revenue, SLA, deadline, and workload signals for manager review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => insightsMutation.mutate()}
            disabled={insightsMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Sparkles size={16} />
            {insightsMutation.isPending ? "Analyzing..." : "Generate Report Insights"}
          </button>
        </div>

        {insightsMutation.error ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {insightsMutation.error instanceof Error
              ? insightsMutation.error.message
              : "Unable to generate report insights"}
          </div>
        ) : null}

        {insightsMutation.data ? <AiReportInsightsPanel insights={insightsMutation.data} /> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Pipeline by Stage</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipelineByStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#47624f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Revenue by Subclass</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueBySubclass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subclass" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#f9735b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">SLA Breaches</h2>
          <div className="mt-4 grid gap-3">
            {data.slaBreaches.length ? (
              data.slaBreaches.map((breach) => (
                <div key={`${breach.matterTitle}-${breach.taskTitle}`} className="rounded-md bg-wheat p-4">
                  <p className="font-semibold">{breach.matterTitle}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    {breach.taskTitle} · {breach.owner} · {breach.daysOverdue} days overdue
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No overdue open tasks.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} />
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {data.upcomingDeadlines.length ? (
              data.upcomingDeadlines.map((deadline) => (
                <div key={`${deadline.matterTitle}-${deadline.date}`} className="rounded-md border border-black/10 p-4">
                  <p className="font-semibold">{deadline.matterTitle}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    {deadline.clientName} · {deadline.label} · {deadline.date}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-coral">{deadline.daysAway} days away</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No deadlines inside 30 days.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} />
          <h2 className="text-lg font-semibold">Workload by Owner</h2>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.workloadByOwner}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="owner" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="openTasks" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function AiReportInsightsPanel({ insights }: { insights: AiReportInsights }) {
  const healthClass =
    insights.overallHealth === "AT_RISK"
      ? "bg-rose-50 text-rose-800"
      : insights.overallHealth === "WATCH"
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";

  return (
    <div className="mt-5 rounded-md bg-wheat p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${healthClass}`}>
          {insights.overallHealth.replaceAll("_", " ")}
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {insights.provider} · {insights.model} · {new Date(insights.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{insights.executiveSummary}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightList title="Pipeline" items={insights.pipelineInsights} />
        <InsightList title="Revenue" items={insights.revenueInsights} />
        <InsightList title="Deadlines & SLA" items={insights.deadlineRisks} />
        <InsightList title="Workload" items={insights.workloadRisks} />
        <div className="md:col-span-2">
          <InsightList title="Recommended actions" items={insights.recommendedActions} />
        </div>
      </div>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
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

function ExportButton({
  label,
  type
}: {
  label: string;
  type: "pipeline" | "revenue" | "sla" | "deadlines" | "workload";
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => void api.exportReport(type)}
        className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-coral hover:text-coral"
      >
        <Download size={14} />
        {label} CSV
      </button>
      <button
        type="button"
        onClick={() => void api.exportReportXlsx(type)}
        className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-moss hover:text-moss"
      >
        <Download size={14} />
        {label} XLSX
      </button>
    </>
  );
}

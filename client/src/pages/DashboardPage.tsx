import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BriefcaseBusiness, CalendarClock, DollarSign, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";

const colors = ["#47624f", "#f9735b", "#2563eb", "#7c3aed", "#d97706"];

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard
  });

  if (isLoading) return <p className="text-sm text-ink/60">Loading dashboard...</p>;
  if (error || !data) return <p className="text-sm text-rose-700">Dashboard unavailable.</p>;

  const pipelineData = data.matters.map((matter) => ({
    name: matter.stage.replaceAll("_", " "),
    value: 1
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="A real-time workspace for tasks, visa deadlines, pipeline health, client messages, and billing signals."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Active matters"
          value={String(data.metrics.activeMatters)}
          helper="Across active agency workload"
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Overdue tasks"
          value={String(data.metrics.overdueTasks)}
          helper="Needs same-day attention"
          icon={AlertTriangle}
        />
        <MetricCard
          label="Upcoming deadlines"
          value={String(data.metrics.upcomingDeadlines)}
          helper="Inside the next 30 days"
          icon={CalendarClock}
        />
        <MetricCard
          label="Monthly revenue"
          value={`$${data.metrics.monthlyRevenue.toLocaleString()}`}
          helper="Paid and sent invoices"
          icon={DollarSign}
        />
        <MetricCard
          label="Portal adoption"
          value={`${data.metrics.clientPortalAdoption}%`}
          helper="Clients active in portal"
          icon={Users}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Priority Tasks</h2>
            <span className="text-sm text-ink/55">{data.tasks.length} open items</span>
          </div>
          <div className="space-y-3">
            {data.tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-md border border-black/10 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="mt-1 text-sm text-ink/55">
                    {task.assignee} · due {task.dueOn}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Pipeline Snapshot</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={pipelineData} innerRadius={54} outerRadius={92} paddingAngle={4}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <div className="mt-4 space-y-3">
            {data.alerts.map((alert) => (
              <div key={alert.id} className="rounded-md bg-wheat p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{alert.title}</p>
                  <StatusBadge status={alert.severity} />
                </div>
                <p className="mt-1 text-sm text-ink/65">{alert.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Client Messages</h2>
          <div className="mt-4 space-y-3">
            {data.recentMessages.map((message) => (
              <div key={message.id} className="rounded-md border border-black/10 p-4">
                <p className="font-semibold">{message.from}</p>
                <p className="mt-1 text-sm text-ink/65">{message.preview}</p>
                <p className="mt-2 text-xs text-ink/45">{message.matterTitle}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


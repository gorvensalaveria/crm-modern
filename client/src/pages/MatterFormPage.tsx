import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GitBranchPlus, Save, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import type { AiMatterIntakePlan, MatterFromTemplatePayload } from "../types";
import { aiProviderLabel } from "../utils/ai";

const emptyForm: MatterFromTemplatePayload = {
  clientId: "",
  templateId: "",
  keyDate: ""
};

export function MatterFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients
  });
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: api.workflowTemplates
  });
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId),
    [templates, form.templateId]
  );

  const mutation = useMutation({
    mutationFn: () => api.createMatterFromTemplate(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["matters"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
      navigate("/app/matters");
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create matter");
    }
  });

  const intakePlanMutation = useMutation({
    mutationFn: () => api.generateMatterIntakePlan(form),
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to generate AI intake plan");
    }
  });

  function updateField<K extends keyof MatterFromTemplatePayload>(
    field: K,
    value: MatterFromTemplatePayload[K]
  ) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div>
      <Link
        to="/app/matters"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-moss hover:text-coral"
      >
        <ArrowLeft size={16} />
        Back to matters
      </Link>

      <PageHeader
        eyebrow="Workflow Automation"
        title="Create Matter From Template"
        description="Select a client and visa workflow template. The system will create the matter, key date, assigned tasks, and requested checklist items."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        {error ? (
          <div className="mb-5 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Client</span>
            <select
              required
              value={form.clientId}
              disabled={clientsLoading}
              onChange={(event) => updateField("clientId", event.target.value)}
              className="form-input mt-2"
            >
              <option value="">{clientsLoading ? "Loading clients..." : "Select client"}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} · {client.nationality}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Workflow template</span>
            <select
              required
              value={form.templateId}
              disabled={templatesLoading}
              onChange={(event) => updateField("templateId", event.target.value)}
              className="form-input mt-2"
            >
              <option value="">
                {templatesLoading ? "Loading templates..." : "Select workflow template"}
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  Subclass {template.visaSubclass} · {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Target lodgement date</span>
            <input
              required
              type="date"
              value={form.keyDate}
              onChange={(event) => updateField("keyDate", event.target.value)}
              className="form-input mt-2"
            />
          </label>
        </div>

        {selectedTemplate ? (
          <div className="mt-6 rounded-md bg-wheat p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <GitBranchPlus size={16} />
              Template output
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {selectedTemplate.description ?? "This workflow will generate matter work items."}
            </p>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <TemplateMetric label="Generated tasks" value={selectedTemplate.taskCount} />
              <TemplateMetric label="Checklist items" value={selectedTemplate.checklistCount} />
              <TemplateMetric label="Total items" value={selectedTemplate.itemCount} />
            </div>
          </div>
        ) : null}

        <section className="mt-6 rounded-lg border border-black/10 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <h2 className="text-lg font-semibold">AI Intake Assistant</h2>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
                Generate a staff-reviewed intake plan before creating tasks and checklist items.
              </p>
            </div>
            <button
              type="button"
              disabled={intakePlanMutation.isPending || !form.clientId || !form.templateId || !form.keyDate}
              onClick={() => intakePlanMutation.mutate()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:border-moss hover:text-moss disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={16} />
              {intakePlanMutation.isPending ? "Planning..." : "Generate Intake Plan"}
            </button>
          </div>

          {intakePlanMutation.data ? <AiMatterIntakePlanPanel plan={intakePlanMutation.data} /> : null}
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/app/matters"
            className="inline-flex items-center justify-center rounded-md border border-black/10 px-4 py-2 text-sm font-semibold hover:border-coral hover:text-coral"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Save size={16} />
            {mutation.isPending ? "Creating..." : "Create matter"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AiMatterIntakePlanPanel({ plan }: { plan: AiMatterIntakePlan }) {
  const riskClass =
    plan.intakeRisk === "HIGH"
      ? "bg-rose-50 text-rose-800"
      : plan.intakeRisk === "MEDIUM"
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";

  return (
    <div className="mt-5 rounded-md bg-wheat p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskClass}`}>
          {plan.intakeRisk} risk
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          Subclass {plan.recommendedVisaSubclass}
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {aiProviderLabel(plan.provider)} · {plan.model} · {new Date(plan.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{plan.summary}</p>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <IntakeList title="Readiness checks" items={plan.readinessChecks} />
        <IntakeList title="Client questions" items={plan.clientQuestions} />

        <div>
          <p className="text-sm font-semibold">Suggested tasks</p>
          <div className="mt-2 space-y-2">
            {plan.suggestedTasks.map((task) => (
              <div key={`${task.title}-${task.dueInDays}`} className="rounded-md bg-white/75 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{task.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {task.priority} · {task.dueInDays}d
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-ink/65">{task.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Suggested checklist</p>
          <div className="mt-2 space-y-2">
            {plan.suggestedChecklistItems.map((item) => (
              <div key={`${item.title}-${item.category}`} className="rounded-md bg-white/75 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {item.category} · {item.required ? "Required" : "Optional"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-ink/65">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <IntakeList title="Compliance notes" items={plan.complianceNotes} />
        <IntakeList title="Automation suggestions" items={plan.automationSuggestions} />
      </div>
    </div>
  );
}

function IntakeList({ title, items }: { title: string; items: string[] }) {
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

function TemplateMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
    </div>
  );
}

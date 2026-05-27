import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GitBranchPlus, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import type { MatterFromTemplatePayload } from "../types";

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

function TemplateMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
    </div>
  );
}


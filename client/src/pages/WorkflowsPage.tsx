import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranchPlus, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { WorkflowTemplatePayload } from "../types";

const emptyForm: WorkflowTemplatePayload = {
  visaSubclass: "",
  name: "",
  description: ""
};

export function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["workflow-templates"],
    queryFn: api.workflowTemplates
  });

  const mutation = useMutation({
    mutationFn: () => api.createWorkflowTemplate(form),
    onSuccess: async () => {
      setForm(emptyForm);
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create template");
    }
  });

  function updateField<K extends keyof WorkflowTemplatePayload>(field: K, value: WorkflowTemplatePayload[K]) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Workflow Templates"
        description="Configure reusable visa subclass templates that generate tasks and checklist items when a new matter is created."
      />

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Plus size={18} />
          <h2 className="text-lg font-semibold">Create Template</h2>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          This v1 creates a standard starter workflow with two checklist items and one RMA review task.
        </p>

        {error ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-[0.4fr_0.8fr_1.2fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold">Subclass</span>
            <input
              required
              value={form.visaSubclass}
              onChange={(event) => updateField("visaSubclass", event.target.value)}
              placeholder="500"
              className="form-input mt-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="500 Student Visa Workflow"
              className="form-input mt-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Description</span>
            <input
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Default workflow for student visa matters"
              className="form-input mt-2"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <GitBranchPlus size={16} />
            {mutation.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Active Templates</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-ink/60">Loading templates...</p>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {templates.map((template) => (
              <article key={template.id} className="rounded-md border border-black/10 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-coral">Subclass {template.visaSubclass}</p>
                    <h3 className="mt-1 text-lg font-semibold">{template.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/60">
                      {template.description ?? "No description provided."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={`${template.taskCount} TASKS`} />
                    <StatusBadge status={`${template.checklistCount} CHECKLIST`} />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(template.items ?? []).map((item) => (
                    <div key={item.id} className="rounded-md bg-wheat p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{item.title}</p>
                        <StatusBadge status={item.type} />
                      </div>
                      <p className="mt-1 text-ink/55">
                        {item.stage.replaceAll("_", " ")} · +{item.dueOffsetDays} days
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


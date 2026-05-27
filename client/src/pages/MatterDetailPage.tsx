import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Receipt,
  Upload
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { DocumentUploadPayload, InvoicePayload, MatterDetail } from "../types";

const matterStages: MatterDetail["stage"][] = [
  "INTAKE",
  "DOCUMENTS",
  "LODGEMENT",
  "CASE_OFFICER_REQUEST",
  "DECISION",
  "ARCHIVED"
];

const taskStatuses: MatterDetail["tasks"][number]["status"][] = ["OPEN", "BLOCKED", "DONE", "SNOOZED"];
const checklistStatuses: MatterDetail["checklistItems"][number]["status"][] = [
  "REQUESTED",
  "RECEIVED",
  "VERIFIED",
  "REJECTED"
];

const emptyUploadForm: DocumentUploadPayload = {
  checklistItemId: "",
  title: "",
  fileName: "",
  fileType: "PDF",
  fileSize: 512000
};

const emptyInvoiceForm: InvoicePayload = {
  description: "",
  subtotal: 0,
  tax: 0,
  dueOn: "",
  status: "SENT"
};

export function MatterDetailPage() {
  const { matterId } = useParams();
  const queryClient = useQueryClient();
  const [uploadForm, setUploadForm] = useState<DocumentUploadPayload>(emptyUploadForm);
  const [uploadError, setUploadError] = useState("");
  const [invoiceForm, setInvoiceForm] = useState<InvoicePayload>(emptyInvoiceForm);
  const [invoiceError, setInvoiceError] = useState("");
  const { data: matter, isLoading, error } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => api.matter(matterId ?? ""),
    enabled: Boolean(matterId)
  });

  const stageMutation = useMutation({
    mutationFn: (stage: MatterDetail["stage"]) => api.updateMatterStage(matterId ?? "", stage),
    onSuccess: async (updatedMatter) => refreshMatter(queryClient, updatedMatter.id)
  });

  const taskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: MatterDetail["tasks"][number]["status"] }) =>
      api.updateTaskStatus(taskId, status),
    onSuccess: async (updatedMatter) => refreshMatter(queryClient, updatedMatter.id)
  });

  const checklistMutation = useMutation({
    mutationFn: ({
      checklistItemId,
      status
    }: {
      checklistItemId: string;
      status: MatterDetail["checklistItems"][number]["status"];
    }) => api.updateChecklistStatus(checklistItemId, status),
    onSuccess: async (updatedMatter) => refreshMatter(queryClient, updatedMatter.id)
  });

  const uploadMutation = useMutation({
    mutationFn: () => api.uploadMatterDocument(matterId ?? "", uploadForm),
    onSuccess: async (updatedMatter) => {
      setUploadForm(emptyUploadForm);
      setUploadError("");
      await refreshMatter(queryClient, updatedMatter.id);
    },
    onError: (mutationError) => {
      setUploadError(mutationError instanceof Error ? mutationError.message : "Unable to upload document");
    }
  });

  const documentReviewMutation = useMutation({
    mutationFn: ({ documentId, status }: { documentId: string; status: "VERIFIED" | "REJECTED" }) =>
      api.reviewDocument(documentId, status),
    onSuccess: async (updatedMatter) => refreshMatter(queryClient, updatedMatter.id)
  });

  const invoiceMutation = useMutation({
    mutationFn: () => api.createMatterInvoice(matterId ?? "", invoiceForm),
    onSuccess: async (updatedMatter) => {
      setInvoiceForm(emptyInvoiceForm);
      setInvoiceError("");
      await refreshMatter(queryClient, updatedMatter.id);
    },
    onError: (mutationError) => {
      setInvoiceError(mutationError instanceof Error ? mutationError.message : "Unable to create invoice");
    }
  });

  const paymentMutation = useMutation({
    mutationFn: (invoiceId: string) => api.payInvoice(invoiceId),
    onSuccess: async (updatedMatter) => refreshMatter(queryClient, updatedMatter.id)
  });

  function updateUploadField<K extends keyof DocumentUploadPayload>(
    field: K,
    value: DocumentUploadPayload[K]
  ) {
    setUploadError("");
    setUploadForm((current) => ({ ...current, [field]: value }));
  }

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    uploadMutation.mutate();
  }

  function updateInvoiceField<K extends keyof InvoicePayload>(field: K, value: InvoicePayload[K]) {
    setInvoiceError("");
    setInvoiceForm((current) => ({ ...current, [field]: value }));
  }

  function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    invoiceMutation.mutate();
  }

  if (isLoading) return <p className="text-sm text-ink/60">Loading matter...</p>;
  if (error || !matter) return <p className="text-sm text-rose-700">Matter not found.</p>;

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
        eyebrow={`Subclass ${matter.visaSubclass}`}
        title={matter.title}
        description={`${matter.clientName} · ${matter.primaryAgent} · ${matter.caseOfficer}`}
      />

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={matter.stage} />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                TRN {matter.trn ?? "not assigned"}
              </span>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/60">Matter progress</span>
                <span className="font-semibold">{matter.progress}%</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-black/10">
                <div className="h-3 rounded-full bg-coral" style={{ width: `${matter.progress}%` }} />
              </div>
            </div>
          </div>

          <label className="block min-w-60">
            <span className="text-sm font-semibold">Stage</span>
            <select
              value={matter.stage}
              onChange={(event) => stageMutation.mutate(event.target.value as MatterDetail["stage"])}
              className="form-input mt-2"
            >
              {matterStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} />
            <h2 className="text-lg font-semibold">Tasks</h2>
          </div>
          <div className="mt-4 space-y-3">
            {matter.tasks.map((task) => (
              <div key={task.id} className="rounded-md border border-black/10 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-sm text-ink/55">
                      {task.assignee} · due {task.dueOn}
                    </p>
                    {task.description ? (
                      <p className="mt-2 text-sm leading-6 text-ink/60">{task.description}</p>
                    ) : null}
                  </div>
                  <select
                    value={task.status}
                    onChange={(event) =>
                      taskMutation.mutate({
                        taskId: task.id,
                        status: event.target.value as MatterDetail["tasks"][number]["status"]
                      })
                    }
                    className="form-input md:w-40"
                  >
                    {taskStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileCheck2 size={18} />
            <h2 className="text-lg font-semibold">Checklist</h2>
          </div>
          <div className="mt-4 space-y-3">
            {matter.checklistItems.map((item) => (
              <div key={item.id} className="rounded-md bg-wheat p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-ink/55">
                      {item.category.replaceAll("_", " ")} · due {item.dueOn ?? "not set"} ·{" "}
                      {item.documentCount} files
                    </p>
                    {item.verifiedBy ? (
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        Verified by {item.verifiedBy}
                      </p>
                    ) : null}
                  </div>
                  <select
                    value={item.status}
                    onChange={(event) =>
                      checklistMutation.mutate({
                        checklistItemId: item.id,
                        status: event.target.value as MatterDetail["checklistItems"][number]["status"]
                      })
                    }
                    className="form-input md:w-40"
                  >
                    {checklistStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Upload size={18} />
          <h2 className="text-lg font-semibold">Upload Document Metadata</h2>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          This MVP records upload metadata and links it to a checklist item. Real file storage comes later.
        </p>

        {uploadError ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {uploadError}
          </div>
        ) : null}

        <form onSubmit={handleUpload} className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr_0.7fr_0.7fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold">Checklist item</span>
            <select
              required
              value={uploadForm.checklistItemId}
              onChange={(event) => updateUploadField("checklistItemId", event.target.value)}
              className="form-input mt-2"
            >
              <option value="">Select item</option>
              {matter.checklistItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Document title</span>
            <input
              required
              value={uploadForm.title}
              onChange={(event) => updateUploadField("title", event.target.value)}
              placeholder="Updated passport scan"
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">File name</span>
            <input
              required
              value={uploadForm.fileName}
              onChange={(event) => updateUploadField("fileName", event.target.value)}
              placeholder="passport.pdf"
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Type</span>
            <select
              value={uploadForm.fileType}
              onChange={(event) =>
                updateUploadField("fileType", event.target.value as DocumentUploadPayload["fileType"])
              }
              className="form-input mt-2"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="JPG">JPG</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Upload size={16} />
            {uploadMutation.isPending ? "Saving..." : "Upload"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileCheck2 size={18} />
          <h2 className="text-lg font-semibold">Document Review</h2>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          Verify accepted documents or reject them so the checklist returns to an action state.
        </p>

        <div className="mt-4 space-y-3">
          {matter.documents.length ? (
            matter.documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-md border border-black/10 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold">{document.title}</p>
                  <p className="mt-1 text-sm text-ink/55">
                    {document.fileType} · uploaded by {document.uploadedBy} · updated {document.updatedAt}
                  </p>
                  {document.verifiedBy ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Verified by {document.verifiedBy}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={document.status} />
                  <button
                    type="button"
                    disabled={document.status === "VERIFIED" || documentReviewMutation.isPending}
                    onClick={() =>
                      documentReviewMutation.mutate({ documentId: document.id, status: "VERIFIED" })
                    }
                    className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={document.status === "REJECTED" || documentReviewMutation.isPending}
                    onClick={() =>
                      documentReviewMutation.mutate({ documentId: document.id, status: "REJECTED" })
                    }
                    className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No documents uploaded yet.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Receipt size={18} />
          <h2 className="text-lg font-semibold">Create Invoice</h2>
        </div>
        <p className="mt-1 text-sm text-ink/55">
          Generate a matter-linked invoice with automatic numbering and audit logging.
        </p>

        {invoiceError ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {invoiceError}
          </div>
        ) : null}

        <form onSubmit={handleInvoiceSubmit} className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.7fr_0.6fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold">Description</span>
            <input
              required
              value={invoiceForm.description}
              onChange={(event) => updateInvoiceField("description", event.target.value)}
              placeholder="Professional service fee"
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Subtotal</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={invoiceForm.subtotal || ""}
              onChange={(event) => updateInvoiceField("subtotal", Number(event.target.value))}
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Tax</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={invoiceForm.tax || ""}
              onChange={(event) => updateInvoiceField("tax", Number(event.target.value))}
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Due date</span>
            <input
              required
              type="date"
              value={invoiceForm.dueOn}
              onChange={(event) => updateInvoiceField("dueOn", event.target.value)}
              className="form-input mt-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Status</span>
            <select
              value={invoiceForm.status}
              onChange={(event) => updateInvoiceField("status", event.target.value as InvoicePayload["status"])}
              className="form-input mt-2"
            >
              <option value="SENT">Sent</option>
              <option value="DRAFT">Draft</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={invoiceMutation.isPending}
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Receipt size={16} />
            {invoiceMutation.isPending ? "Creating..." : "Create"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          {matter.invoices.length ? (
            matter.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-md border border-black/10 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">{invoice.number}</p>
                  <p className="mt-1 text-sm text-ink/55">
                    ${invoice.amount.toLocaleString()} · due {invoice.dueOn}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={invoice.status} />
                  {invoice.status !== "PAID" ? (
                    <button
                      type="button"
                      disabled={paymentMutation.isPending}
                      onClick={() => paymentMutation.mutate(invoice.id)}
                      className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Mock Stripe Pay
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No invoices created yet.</p>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SummaryPanel icon={CalendarClock} label="Key date" value={matter.keyDate} />
        <SummaryPanel icon={CheckCircle2} label="Open tasks" value={`${matter.tasksOpen}/${matter.tasksTotal}`} />
        <SummaryPanel icon={FileCheck2} label="Documents" value={String(matter.documents.length)} />
      </div>
    </div>
  );
}

async function refreshMatter(queryClient: ReturnType<typeof useQueryClient>, matterId: string) {
  await queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
  await queryClient.invalidateQueries({ queryKey: ["matters"] });
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
}

function SummaryPanel({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink/60">
        <Icon size={18} />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </section>
  );
}

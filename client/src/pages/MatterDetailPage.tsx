import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Receipt,
  MessageSquare,
  Sparkles,
  Upload
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type {
  AiDocumentReview,
  AiMessageDraft,
  AiMessageDraftIntent,
  AiMatterBrief,
  AiWorkflowSuggestion,
  DocumentUploadPayload,
  InvoicePayload,
  MatterChecklistPayload,
  MatterDetail,
  MatterTaskPayload
} from "../types";

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

const emptyTaskForm = (): MatterTaskPayload => ({
  title: "",
  description: "",
  dueOn: dateOffset(7)
});

const emptyChecklistForm = (): MatterChecklistPayload => ({
  title: "",
  category: "GENERAL",
  dueOn: dateOffset(7),
  required: true
});

const emptyInvoiceForm: InvoicePayload = {
  description: "",
  subtotal: 0,
  tax: 0,
  dueOn: dateOffset(14),
  status: "SENT"
};

export function MatterDetailPage() {
  const { matterId } = useParams();
  const queryClient = useQueryClient();
  const [uploadForm, setUploadForm] = useState<DocumentUploadPayload>(emptyUploadForm);
  const [uploadError, setUploadError] = useState("");
  const [taskForm, setTaskForm] = useState<MatterTaskPayload>(emptyTaskForm);
  const [taskError, setTaskError] = useState("");
  const [checklistForm, setChecklistForm] = useState<MatterChecklistPayload>(emptyChecklistForm);
  const [checklistError, setChecklistError] = useState("");
  const [invoiceForm, setInvoiceForm] = useState<InvoicePayload>(emptyInvoiceForm);
  const [invoiceError, setInvoiceError] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageVisibility, setMessageVisibility] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [messageError, setMessageError] = useState("");
  const [draftMeta, setDraftMeta] = useState<AiMessageDraft | null>(null);
  const [documentAiReviews, setDocumentAiReviews] = useState<Record<string, AiDocumentReview>>({});
  const [signatureStatus, setSignatureStatus] = useState("");
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

  const createTaskMutation = useMutation({
    mutationFn: () => api.createMatterTask(matterId ?? "", taskForm),
    onSuccess: async (updatedMatter) => {
      setTaskForm(emptyTaskForm());
      setTaskError("");
      await refreshMatter(queryClient, updatedMatter.id);
    },
    onError: (mutationError) => {
      setTaskError(mutationError instanceof Error ? mutationError.message : "Unable to create task");
    }
  });

  const createChecklistMutation = useMutation({
    mutationFn: () => api.createMatterChecklistItem(matterId ?? "", checklistForm),
    onSuccess: async (updatedMatter) => {
      setChecklistForm(emptyChecklistForm());
      setChecklistError("");
      await refreshMatter(queryClient, updatedMatter.id);
    },
    onError: (mutationError) => {
      setChecklistError(mutationError instanceof Error ? mutationError.message : "Unable to create checklist item");
    }
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

  const documentAiReviewMutation = useMutation({
    mutationFn: (documentId: string) => api.generateDocumentAiReview(documentId),
    onSuccess: (review, documentId) => {
      setDocumentAiReviews((current) => ({ ...current, [documentId]: review }));
    }
  });

  const signatureMutation = useMutation({
    mutationFn: (documentId: string) => api.createSignatureEnvelope(documentId, "client.signer@example.com"),
    onSuccess: async (envelope) => {
      setSignatureStatus(`Envelope ${envelope.envelopeId} sent`);
      if (matterId) await refreshMatter(queryClient, matterId);
    },
    onError: (mutationError) => {
      setSignatureStatus(mutationError instanceof Error ? mutationError.message : "Unable to send envelope");
    }
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

  const messageMutation = useMutation({
    mutationFn: () =>
      api.createMatterMessage(matterId ?? "", {
        body: messageBody,
        visibility: messageVisibility
      }),
    onSuccess: async (updatedMatter) => {
      setMessageBody("");
      setMessageVisibility("INTERNAL");
      setMessageError("");
      setDraftMeta(null);
      await refreshMatter(queryClient, updatedMatter.id);
    },
    onError: (mutationError) => {
      setMessageError(mutationError instanceof Error ? mutationError.message : "Unable to save note");
    }
  });

  const aiBriefMutation = useMutation({
    mutationFn: () => api.generateMatterAiBrief(matterId ?? "")
  });

  const workflowSuggestionMutation = useMutation({
    mutationFn: () => api.generateWorkflowSuggestions(matterId ?? "")
  });

  const messageDraftMutation = useMutation({
    mutationFn: (intent: AiMessageDraftIntent) => api.generateMatterMessageDraft(matterId ?? "", intent),
    onSuccess: (draft) => {
      setDraftMeta(draft);
      setMessageBody(draft.draft);
      setMessageVisibility("EXTERNAL");
      setMessageError("");
    },
    onError: (mutationError) => {
      setMessageError(mutationError instanceof Error ? mutationError.message : "Unable to draft message");
    }
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

  function updateTaskField<K extends keyof MatterTaskPayload>(field: K, value: MatterTaskPayload[K]) {
    setTaskError("");
    setTaskForm((current) => ({ ...current, [field]: value }));
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createTaskMutation.mutate();
  }

  function updateChecklistField<K extends keyof MatterChecklistPayload>(
    field: K,
    value: MatterChecklistPayload[K]
  ) {
    setChecklistError("");
    setChecklistForm((current) => ({ ...current, [field]: value }));
  }

  function handleChecklistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createChecklistMutation.mutate();
  }

  function updateInvoiceField<K extends keyof InvoicePayload>(field: K, value: InvoicePayload[K]) {
    setInvoiceError("");
    setInvoiceForm((current) => ({ ...current, [field]: value }));
  }

  function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    invoiceMutation.mutate();
  }

  function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    messageMutation.mutate();
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

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="text-lg font-semibold">AI Matter Assistant</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
              Generate a live case brief from tasks, documents, billing, messages, and compliance signals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => aiBriefMutation.mutate()}
            disabled={aiBriefMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Sparkles size={16} />
            {aiBriefMutation.isPending ? "Generating..." : "Generate AI Brief"}
          </button>
        </div>

        {aiBriefMutation.error ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {aiBriefMutation.error instanceof Error ? aiBriefMutation.error.message : "Unable to generate AI brief"}
          </div>
        ) : null}

        {aiBriefMutation.data ? <AiMatterBriefPanel brief={aiBriefMutation.data} /> : null}
      </section>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList size={18} />
              <h2 className="text-lg font-semibold">AI Workflow Suggestions</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
              Suggest staff-reviewed stage, task, checklist, automation, and risk actions from the current matter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => workflowSuggestionMutation.mutate()}
            disabled={workflowSuggestionMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:border-moss hover:text-moss disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={16} />
            {workflowSuggestionMutation.isPending ? "Suggesting..." : "Suggest Workflow Actions"}
          </button>
        </div>

        {workflowSuggestionMutation.error ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {workflowSuggestionMutation.error instanceof Error
              ? workflowSuggestionMutation.error.message
              : "Unable to generate workflow suggestions"}
          </div>
        ) : null}

        {workflowSuggestionMutation.data ? (
          <AiWorkflowSuggestionPanel suggestion={workflowSuggestionMutation.data} />
        ) : null}
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
          <form onSubmit={handleTaskSubmit} className="mt-4 rounded-md bg-wheat p-4">
            <p className="text-sm font-semibold">Add task</p>
            {taskError ? (
              <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                {taskError}
              </div>
            ) : null}
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.7fr]">
              <input
                required
                value={taskForm.title}
                onChange={(event) => updateTaskField("title", event.target.value)}
                placeholder="Follow up document review"
                className="form-input"
              />
              <input
                required
                type="date"
                value={taskForm.dueOn}
                onChange={(event) => updateTaskField("dueOn", event.target.value)}
                className="form-input"
              />
            </div>
            <textarea
              value={taskForm.description}
              onChange={(event) => updateTaskField("description", event.target.value)}
              placeholder="Optional task notes"
              rows={3}
              className="form-input mt-3 resize-none"
            />
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="mt-3 w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
            >
              {createTaskMutation.isPending ? "Adding..." : "Add task"}
            </button>
          </form>
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
          <form onSubmit={handleChecklistSubmit} className="mt-4 rounded-md bg-wheat p-4">
            <p className="text-sm font-semibold">Add checklist item</p>
            {checklistError ? (
              <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                {checklistError}
              </div>
            ) : null}
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.7fr]">
              <input
                required
                value={checklistForm.title}
                onChange={(event) => updateChecklistField("title", event.target.value)}
                placeholder="Passport bio page"
                className="form-input"
              />
              <input
                value={checklistForm.category}
                onChange={(event) => updateChecklistField("category", event.target.value)}
                placeholder="IDENTITY"
                className="form-input"
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[0.8fr_1fr]">
              <input
                type="date"
                value={checklistForm.dueOn ?? ""}
                onChange={(event) => updateChecklistField("dueOn", event.target.value)}
                className="form-input"
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                <input
                  type="checkbox"
                  checked={checklistForm.required}
                  onChange={(event) => updateChecklistField("required", event.target.checked)}
                />
                Required
              </label>
            </div>
            <button
              type="submit"
              disabled={createChecklistMutation.isPending}
              className="mt-3 w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
            >
              {createChecklistMutation.isPending ? "Adding..." : "Add checklist item"}
            </button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Upload size={18} />
          <h2 className="text-lg font-semibold">Upload Document</h2>
        </div>

        {uploadError ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {uploadError}
          </div>
        ) : null}

        <form onSubmit={handleUpload} className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr_0.7fr_0.7fr_auto]">
          <label className="block">
            <span className="text-sm font-semibold">Checklist item</span>
            <select
              value={uploadForm.checklistItemId}
              onChange={(event) => updateUploadField("checklistItemId", event.target.value)}
              className="form-input mt-2"
            >
              <option value="">General matter document</option>
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
            <input
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void fileToBase64(file).then((fileContentBase64) => {
                  setUploadForm((current) => ({
                    ...current,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.name.toLowerCase().endsWith(".docx")
                      ? "DOCX"
                      : file.type.includes("image")
                        ? "JPG"
                        : "PDF",
                    fileContentBase64
                  }));
                });
              }}
              className="mt-2 block w-full text-xs text-ink/60"
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
          Verify accepted documents, reject them, or send clean documents for mock DocuSign e-signature.
        </p>
        {signatureStatus ? (
          <div className="mt-4 rounded-md bg-mint px-4 py-3 text-sm font-semibold text-ink">
            {signatureStatus}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {matter.documents.length ? (
            matter.documents.map((document) => (
              <div
                key={document.id}
                className="rounded-md border border-black/10 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">{document.title}</p>
                    <p className="mt-1 text-sm text-ink/55">
                      {document.fileType} · uploaded by {document.uploadedBy} · updated {document.updatedAt}
                    </p>
                    <p className="mt-1 text-xs text-ink/50">
                      Scan: {document.scanStatus ?? "PENDING"} · Storage: {document.storageProvider ?? "local"}
                    </p>
                    {document.verifiedBy ? (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        Verified by {document.verifiedBy}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={document.status} />
                    <StatusBadge status={document.scanStatus ?? "PENDING"} />
                    <button
                      type="button"
                      disabled={documentAiReviewMutation.isPending}
                      onClick={() => documentAiReviewMutation.mutate(document.id)}
                      className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-moss hover:text-moss disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      AI Review
                    </button>
                    <button
                      type="button"
                      disabled={document.status === "VERIFIED" || document.scanStatus !== "CLEAN" || documentReviewMutation.isPending}
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
                    <button
                      type="button"
                      disabled={document.scanStatus !== "CLEAN" || signatureMutation.isPending}
                      onClick={() => signatureMutation.mutate(document.id)}
                      className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send E-Sign
                    </button>
                  </div>
                </div>
                {documentAiReviews[document.id] ? (
                  <AiDocumentReviewPanel review={documentAiReviews[document.id]!} />
                ) : null}
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

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} />
          <h2 className="text-lg font-semibold">Messages & Notes</h2>
        </div>

        <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="space-y-3">
            {matter.messages.length ? (
              matter.messages.map((message) => (
                <div key={message.id} className="rounded-md border border-black/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{message.sender}</p>
                    <StatusBadge status={message.visibility} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{message.body}</p>
                  <p className="mt-2 text-xs text-ink/45">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-wheat p-4 text-sm text-ink/60">No messages yet.</p>
            )}
          </div>

          <form onSubmit={handleMessageSubmit} className="rounded-md bg-wheat p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">Draft message or internal note</p>
              <label className="block">
                <span className="sr-only">Visibility</span>
                <select
                  value={messageVisibility}
                  onChange={(event) => setMessageVisibility(event.target.value as "INTERNAL" | "EXTERNAL")}
                  className="form-input h-10 text-xs font-semibold"
                >
                  <option value="INTERNAL">Internal note</option>
                  <option value="EXTERNAL">Client message</option>
                </select>
              </label>
            </div>
            {messageError ? (
              <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                {messageError}
              </div>
            ) : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <DraftButton
                label="Document request"
                intent="DOCUMENT_REQUEST"
                pending={messageDraftMutation.isPending}
                onClick={(intent) => messageDraftMutation.mutate(intent)}
              />
              <DraftButton
                label="Invoice follow-up"
                intent="INVOICE_FOLLOW_UP"
                pending={messageDraftMutation.isPending}
                onClick={(intent) => messageDraftMutation.mutate(intent)}
              />
              <DraftButton
                label="Status update"
                intent="STATUS_UPDATE"
                pending={messageDraftMutation.isPending}
                onClick={(intent) => messageDraftMutation.mutate(intent)}
              />
            </div>
            {draftMeta ? (
              <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-xs font-semibold text-ink/55">
                Drafted as client message by {draftMeta.provider} · {draftMeta.model} · {draftMeta.subject}
              </p>
            ) : null}
            <textarea
              required
              rows={8}
              value={messageBody}
              onChange={(event) => {
                setMessageError("");
                setDraftMeta(null);
                setMessageBody(event.target.value);
              }}
              placeholder="Draft a client message or record internal advice"
              className="form-input mt-3 resize-none"
            />
            <button
              type="submit"
              disabled={messageMutation.isPending}
              className="mt-3 w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
            >
              {messageMutation.isPending ? "Saving..." : "Save note"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function refreshMatter(queryClient: ReturnType<typeof useQueryClient>, matterId: string) {
  await queryClient.invalidateQueries({ queryKey: ["matter", matterId] });
  await queryClient.invalidateQueries({ queryKey: ["matters"] });
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
}

function AiMatterBriefPanel({ brief }: { brief: AiMatterBrief }) {
  const riskClass =
    brief.riskLevel === "HIGH"
      ? "bg-rose-50 text-rose-800"
      : brief.riskLevel === "MEDIUM"
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <div className="rounded-md bg-wheat p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskClass}`}>
            {brief.riskLevel} risk
          </span>
          <span className="text-xs font-semibold text-ink/45">
            {brief.provider} · {brief.model} · {new Date(brief.generatedAt).toLocaleString()}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/70">{brief.summary}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <BriefList title="Blockers" items={brief.blockers} />
          <BriefList title="Next actions" items={brief.nextActions} />
          <BriefList title="Compliance notes" items={brief.complianceNotes} />
          <BriefList title="Automation suggestions" items={brief.automationSuggestions} />
        </div>
      </div>

      <div className="rounded-md border border-black/10 p-4">
        <p className="text-sm font-semibold">Client message draft</p>
        <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-6 text-ink/70">
          {brief.clientMessageDraft}
        </pre>
      </div>
    </div>
  );
}

function AiWorkflowSuggestionPanel({ suggestion }: { suggestion: AiWorkflowSuggestion }) {
  return (
    <div className="mt-5 rounded-md bg-wheat p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          Recommend {suggestion.recommendedStage.replaceAll("_", " ")}
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {suggestion.provider} · {suggestion.model} · {new Date(suggestion.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{suggestion.stageRationale}</p>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Suggested tasks</p>
          <div className="mt-2 space-y-2">
            {suggestion.suggestedTasks.map((task) => (
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
            {suggestion.suggestedChecklistItems.map((item) => (
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

        <BriefList title="Automation suggestions" items={suggestion.automationSuggestions} />
        <BriefList title="Risk flags" items={suggestion.riskFlags} />
      </div>
    </div>
  );
}

function AiDocumentReviewPanel({ review }: { review: AiDocumentReview }) {
  const recommendationClass =
    review.recommendation === "VERIFY"
      ? "bg-emerald-50 text-emerald-800"
      : review.recommendation === "REJECT"
        ? "bg-rose-50 text-rose-800"
        : "bg-amber-50 text-amber-800";

  return (
    <div className="mt-4 rounded-md bg-wheat p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationClass}`}>
          {review.recommendation.replaceAll("_", " ")}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink/60">
          {review.confidence} confidence
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {review.provider} · {review.model} · {new Date(review.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{review.summary}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BriefList title="Findings" items={review.findings} />
        <BriefList title="Risks" items={review.risks} />
        <BriefList title="Compliance" items={review.complianceNotes} />
        <BriefList title="Next steps" items={review.nextSteps} />
      </div>
    </div>
  );
}

function BriefList({ title, items }: { title: string; items: string[] }) {
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

function DraftButton({
  label,
  intent,
  pending,
  onClick
}: {
  label: string;
  intent: AiMessageDraftIntent;
  pending: boolean;
  onClick: (intent: AiMessageDraftIntent) => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onClick(intent)}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-semibold hover:border-moss hover:text-moss disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles size={14} />
      {pending ? "Drafting..." : label}
    </button>
  );
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, MessageSquare, Receipt, Sparkles, Upload } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import { useCurrentUser } from "../state/current-user";
import type { AiPortalGuidance, DocumentUploadPayload } from "../types";
import { aiProviderLabel } from "../utils/ai";

const emptyUpload: DocumentUploadPayload = {
  checklistItemId: "",
  title: "",
  fileName: "",
  fileType: "PDF",
  fileSize: 512000
};

export function PortalPage() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const [uploadForm, setUploadForm] = useState<DocumentUploadPayload>(emptyUpload);
  const [uploadError, setUploadError] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageError, setMessageError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["portal-summary", currentUser?.id],
    queryFn: api.portalSummary
  });

  const uploadMutation = useMutation({
    mutationFn: () => api.uploadMatterDocument(data?.matterId ?? "", uploadForm),
    onSuccess: async () => {
      setUploadForm(emptyUpload);
      setUploadError("");
      await queryClient.invalidateQueries({ queryKey: ["portal-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["matters"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : "Unable to upload document");
    }
  });

  const paymentMutation = useMutation({
    mutationFn: (invoiceId: string) => api.payInvoice(invoiceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portal-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    }
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      api.createMatterMessage(data?.matterId ?? "", {
        body: messageBody,
        visibility: "EXTERNAL"
      }),
    onSuccess: async () => {
      setMessageBody("");
      setMessageError("");
      await queryClient.invalidateQueries({ queryKey: ["portal-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["matter", data?.matterId] });
      await queryClient.invalidateQueries({ queryKey: ["audit-events"] });
    },
    onError: (error) => {
      setMessageError(error instanceof Error ? error.message : "Unable to send message");
    }
  });

  const portalGuidanceMutation = useMutation({
    mutationFn: api.generatePortalGuidance
  });

  function updateUpload<K extends keyof DocumentUploadPayload>(field: K, value: DocumentUploadPayload[K]) {
    setUploadError("");
    setUploadForm((current) => ({ ...current, [field]: value }));
  }

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    uploadMutation.mutate();
  }

  function handleMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    messageMutation.mutate();
  }

  if (isLoading || !data) return <p className="text-sm text-ink/60">Loading portal...</p>;
  const hasMatter = data.hasMatter ?? Boolean(data.matterId);

  return (
    <div>
      <PageHeader
        eyebrow="Client Portal"
        title={`Welcome, ${data.clientName}`}
        description="A simplified client experience for matter progress, requested documents, invoices, and secure communication."
      />

      <section className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-coral">{data.matterTitle}</p>
            <h2 className="mt-1 text-2xl font-semibold">{data.stage.replaceAll("_", " ")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{data.nextStep}</p>
          </div>
          <StatusBadge status={data.stage} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink/60">Matter progress</span>
            <span className="font-semibold">{data.progress}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-black/10">
            <div className="h-3 rounded-full bg-coral" style={{ width: `${data.progress}%` }} />
          </div>
        </div>
      </section>

      {!hasMatter ? (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          This portal account is active, but no matter has been opened for this client yet.
          Staff can create a matter from the Matters workspace, then this portal will show
          requested documents, invoices, messages, and next steps.
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <h2 className="text-lg font-semibold">AI Portal Assistant</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/55">
              Generate a plain-language summary of visible matter status, documents, invoice, and next steps.
            </p>
          </div>
          <button
            type="button"
            onClick={() => portalGuidanceMutation.mutate()}
            disabled={portalGuidanceMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            <Sparkles size={16} />
            {portalGuidanceMutation.isPending ? "Generating..." : "Generate Portal Guidance"}
          </button>
        </div>

        {portalGuidanceMutation.error ? (
          <div className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {portalGuidanceMutation.error instanceof Error
              ? portalGuidanceMutation.error.message
              : "Unable to generate portal guidance"}
          </div>
        ) : null}

        {portalGuidanceMutation.data ? (
          <AiPortalGuidancePanel guidance={portalGuidanceMutation.data} />
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-2">
            <FileUp size={18} />
            <h2 className="text-lg font-semibold">Requested Documents</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-3 rounded-md border border-black/10 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{document.title}</p>
                  <p className="mt-1 text-sm text-ink/55">
                    Updated {document.updatedAt} · {document.documentCount} uploaded
                  </p>
                  {document.latestDocument ? (
                    <p className="mt-1 text-xs text-ink/50">Latest: {document.latestDocument.title}</p>
                  ) : null}
                </div>
                <StatusBadge status={document.status} />
              </div>
            ))}
          </div>

          <form onSubmit={handleUpload} className="mt-5 rounded-md bg-wheat p-4">
            <div className="flex items-center gap-2">
              <Upload size={16} />
              <h3 className="text-sm font-semibold">Upload document metadata</h3>
            </div>

            {uploadError ? (
              <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                {uploadError}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                required
                value={uploadForm.checklistItemId}
                onChange={(event) => updateUpload("checklistItemId", event.target.value)}
                className="form-input"
              >
                <option value="">Select request</option>
                {data.documents
                  .filter((document) => document.status !== "VERIFIED")
                  .map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.title}
                    </option>
                  ))}
              </select>
              <input
                required
                value={uploadForm.title}
                onChange={(event) => updateUpload("title", event.target.value)}
                placeholder="Document title"
                className="form-input"
              />
              <input
                required
                value={uploadForm.fileName}
                onChange={(event) => updateUpload("fileName", event.target.value)}
                placeholder="file-name.pdf"
                className="form-input"
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
                className="block w-full text-xs text-ink/60"
              />
              <button
                type="submit"
                disabled={uploadMutation.isPending || !hasMatter}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Receipt size={18} />
              <h2 className="text-lg font-semibold">Invoice</h2>
            </div>
            <p className="mt-4 text-2xl font-semibold">${data.invoice.amount.toLocaleString()}</p>
            <p className="mt-1 text-sm text-ink/55">
              {data.invoice.number}
              {data.invoice.dueOn ? ` · due ${data.invoice.dueOn}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={data.invoice.status} />
              {data.invoice.id && data.invoice.status !== "PAID" ? (
                <button
                  type="button"
                  disabled={paymentMutation.isPending || !hasMatter}
                  onClick={() => paymentMutation.mutate(data.invoice.id!)}
                  className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mock Stripe Pay
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <h2 className="text-lg font-semibold">Secure Message</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/60">
              Your agent will be notified when documents are uploaded or a payment is completed.
            </p>
            {messageError ? (
              <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
                {messageError}
              </div>
            ) : null}
            <form onSubmit={handleMessage} className="mt-4">
              <textarea
                required
                value={messageBody}
                onChange={(event) => {
                  setMessageError("");
                  setMessageBody(event.target.value);
                }}
                rows={4}
                placeholder="Write a message to your agent"
                className="form-input resize-none"
              />
              <button
                type="submit"
                disabled={messageMutation.isPending || !hasMatter}
                className="mt-3 w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/40"
              >
                {messageMutation.isPending ? "Sending..." : "Message agent"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function AiPortalGuidancePanel({ guidance }: { guidance: AiPortalGuidance }) {
  const toneClass =
    guidance.tone === "URGENT"
      ? "bg-rose-50 text-rose-800"
      : guidance.tone === "ACTION_NEEDED"
        ? "bg-amber-50 text-amber-800"
        : "bg-emerald-50 text-emerald-800";

  return (
    <div className="mt-5 rounded-md bg-wheat p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
          {guidance.tone.replaceAll("_", " ")}
        </span>
        <span className="text-xs font-semibold text-ink/45">
          {aiProviderLabel(guidance.provider)} · {guidance.model} · {new Date(guidance.generatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{guidance.statusSummary}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PortalGuidanceList title="Outstanding items" items={guidance.outstandingItems} />
        <PortalGuidanceList title="Important notes" items={guidance.importantNotes} />
        <div className="rounded-md bg-white/75 px-3 py-2">
          <p className="text-sm font-semibold">Next step</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">{guidance.nextStep}</p>
        </div>
        <div className="rounded-md bg-white/75 px-3 py-2">
          <p className="text-sm font-semibold">Payment</p>
          <p className="mt-2 text-sm leading-6 text-ink/65">{guidance.paymentReminder}</p>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-black/10 bg-white p-4">
        <p className="text-sm font-semibold">Message draft</p>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/70">{guidance.messageDraft}</pre>
      </div>
    </div>
  );
}

function PortalGuidanceList({ title, items }: { title: string; items: string[] }) {
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

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

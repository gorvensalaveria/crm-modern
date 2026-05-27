import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, MessageSquare, Receipt, Upload } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import type { DocumentUploadPayload } from "../types";

const emptyUpload: DocumentUploadPayload = {
  checklistItemId: "",
  title: "",
  fileName: "",
  fileType: "PDF",
  fileSize: 512000
};

export function PortalPage() {
  const queryClient = useQueryClient();
  const [uploadForm, setUploadForm] = useState<DocumentUploadPayload>(emptyUpload);
  const [uploadError, setUploadError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["portal-summary"],
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

  function updateUpload<K extends keyof DocumentUploadPayload>(field: K, value: DocumentUploadPayload[K]) {
    setUploadError("");
    setUploadForm((current) => ({ ...current, [field]: value }));
  }

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    uploadMutation.mutate();
  }

  if (isLoading || !data) return <p className="text-sm text-ink/60">Loading portal...</p>;

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
              <button
                type="submit"
                disabled={uploadMutation.isPending}
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
              {data.invoice.number} · due {data.invoice.dueOn}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={data.invoice.status} />
              {data.invoice.id && data.invoice.status !== "PAID" ? (
                <button
                  type="button"
                  disabled={paymentMutation.isPending}
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
            <button className="mt-4 w-full rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
              Message agent
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}


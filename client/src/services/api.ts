import type {
  AuditFilters,
  AuditResponse,
  AiComplianceReview,
  AiDocumentReview,
  AiMessageDraft,
  AiMessageDraftIntent,
  AiMatterBrief,
  AiMatterIntakePlan,
  AiPortalGuidance,
  AiReportInsights,
  AiWorkflowSuggestion,
  ClientDetail,
  ClientPayload,
  ClientRecord,
  ComplianceCenter,
  Dashboard,
  DemoUser,
  DocumentUploadPayload,
  InvoicePayload,
  InvoiceRecord,
  Matter,
  MatterChecklistPayload,
  MatterDetail,
  MatterFromTemplatePayload,
  MatterTaskPayload,
  MessagePayload,
  PortalSummary,
  Report,
  RetentionRequestPayload,
  SignatureEnvelope,
  TenantSettingsPayload,
  WorkflowTemplate,
  WorkflowTemplatePayload
} from "../types";

const headers = (): HeadersInit => {
  const rawUser = localStorage.getItem("asun-demo-user");
  const demoUser = rawUser ? (JSON.parse(rawUser) as DemoUser) : null;

  return demoUser ? { "x-demo-user-id": demoUser.id } : {};
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: headers() });
  const body = (await response.json()) as { data?: T; error?: { message: string } };

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Request failed");
  }

  return body.data as T;
}

async function sendJson<T>(url: string, method: "POST" | "PATCH", payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      ...headers(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = (await response.json()) as { data?: T; error?: { message: string } };

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Request failed");
  }

  return body.data as T;
}

async function download(url: string, filename: string) {
  const response = await fetch(url, { headers: headers() });

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export const api = {
  demoUsers: () => getJson<DemoUser[]>("/api/demo-users"),
  dashboard: () => getJson<Dashboard>("/api/dashboard"),
  clients: () => getJson<ClientRecord[]>("/api/clients"),
  client: (clientId: string) => getJson<ClientDetail>(`/api/clients/${clientId}`),
  createClient: (payload: ClientPayload) => sendJson<ClientDetail>("/api/clients", "POST", payload),
  updateClient: (clientId: string, payload: ClientPayload) =>
    sendJson<ClientDetail>(`/api/clients/${clientId}`, "PATCH", payload),
  matters: () => getJson<Matter[]>("/api/matters"),
  matter: (matterId: string) => getJson<MatterDetail>(`/api/matters/${matterId}`),
  generateMatterIntakePlan: (payload: MatterFromTemplatePayload) =>
    sendJson<AiMatterIntakePlan>("/api/matters/ai-intake-plan", "POST", payload),
  generateMatterAiBrief: (matterId: string) =>
    sendJson<AiMatterBrief>(`/api/matters/${matterId}/ai-brief`, "POST", {}),
  generateWorkflowSuggestions: (matterId: string) =>
    sendJson<AiWorkflowSuggestion>(`/api/matters/${matterId}/ai-workflow-suggestions`, "POST", {}),
  generateMatterMessageDraft: (matterId: string, intent: AiMessageDraftIntent) =>
    sendJson<AiMessageDraft>(`/api/matters/${matterId}/ai-message-draft`, "POST", { intent }),
  updateMatterStage: (matterId: string, stage: MatterDetail["stage"]) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/stage`, "PATCH", { stage }),
  updateTaskStatus: (taskId: string, status: MatterDetail["tasks"][number]["status"]) =>
    sendJson<MatterDetail>(`/api/tasks/${taskId}/status`, "PATCH", { status }),
  updateChecklistStatus: (
    checklistItemId: string,
    status: MatterDetail["checklistItems"][number]["status"]
  ) => sendJson<MatterDetail>(`/api/checklist-items/${checklistItemId}/status`, "PATCH", { status }),
  createMatterTask: (matterId: string, payload: MatterTaskPayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/tasks`, "POST", payload),
  createMatterChecklistItem: (matterId: string, payload: MatterChecklistPayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/checklist-items`, "POST", payload),
  uploadMatterDocument: (matterId: string, payload: DocumentUploadPayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/documents`, "POST", payload),
  reviewDocument: (documentId: string, status: "VERIFIED" | "REJECTED") =>
    sendJson<MatterDetail>(`/api/documents/${documentId}/review`, "PATCH", { status }),
  generateDocumentAiReview: (documentId: string) =>
    sendJson<AiDocumentReview>(`/api/documents/${documentId}/ai-review`, "POST", {}),
  createSignatureEnvelope: (documentId: string, signerEmail: string) =>
    sendJson<SignatureEnvelope>("/api/envelopes", "POST", { documentId, signerEmail }),
  createMatterInvoice: (matterId: string, payload: InvoicePayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/invoices`, "POST", payload),
  payInvoice: (invoiceId: string) => sendJson<MatterDetail>(`/api/invoices/${invoiceId}/pay`, "POST", {}),
  createMatterMessage: (matterId: string, payload: MessagePayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/messages`, "POST", payload),
  invoices: () => getJson<InvoiceRecord[]>("/api/invoices"),
  workflowTemplates: () => getJson<WorkflowTemplate[]>("/api/workflow-templates"),
  createWorkflowTemplate: (payload: WorkflowTemplatePayload) =>
    sendJson<WorkflowTemplate>("/api/workflow-templates", "POST", payload),
  createMatterFromTemplate: (payload: MatterFromTemplatePayload) =>
    sendJson<Matter>("/api/matters/from-template", "POST", payload),
  reports: () => getJson<Report>("/api/reports"),
  generateReportInsights: () => sendJson<AiReportInsights>("/api/reports/ai-insights", "POST", {}),
  exportReport: (type: "pipeline" | "revenue" | "sla" | "deadlines" | "workload") =>
    download(`/api/reports/export?type=${type}`, `asun-${type}-report.csv`),
  exportReportXlsx: (type: "pipeline" | "revenue" | "sla" | "deadlines" | "workload") =>
    download(`/api/reports/export-xlsx?type=${type}`, `asun-${type}-report.xlsx`),
  downloadReceipt: (invoiceId: string, invoiceNumber: string) =>
    download(`/api/invoices/${invoiceId}/receipt.pdf`, `${invoiceNumber}-receipt.pdf`),
  auditEvents: (filters: AuditFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return getJson<AuditResponse>(`/api/audit-events${query ? `?${query}` : ""}`);
  },
  compliance: () => getJson<ComplianceCenter>("/api/compliance"),
  generateComplianceReview: () => sendJson<AiComplianceReview>("/api/compliance/ai-review", "POST", {}),
  updateTenantSettings: (payload: TenantSettingsPayload) =>
    sendJson<ComplianceCenter>("/api/compliance/settings", "PATCH", payload),
  createRetentionRequest: (payload: RetentionRequestPayload) =>
    sendJson<ComplianceCenter>("/api/compliance/retention-requests", "POST", payload),
  decideRetentionRequest: (retentionRequestId: string, status: "APPROVED" | "REJECTED" | "COMPLETED") =>
    sendJson<ComplianceCenter>(`/api/compliance/retention-requests/${retentionRequestId}`, "PATCH", { status }),
  portalSummary: () => getJson<PortalSummary>("/api/portal/summary"),
  generatePortalGuidance: () => sendJson<AiPortalGuidance>("/api/portal/ai-guidance", "POST", {})
};

import type {
  ClientDetail,
  ClientPayload,
  ClientRecord,
  Dashboard,
  DemoUser,
  DocumentUploadPayload,
  InvoicePayload,
  InvoiceRecord,
  Matter,
  MatterDetail,
  MatterFromTemplatePayload,
  PortalSummary,
  Report,
  WorkflowTemplate
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
  updateMatterStage: (matterId: string, stage: MatterDetail["stage"]) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/stage`, "PATCH", { stage }),
  updateTaskStatus: (taskId: string, status: MatterDetail["tasks"][number]["status"]) =>
    sendJson<MatterDetail>(`/api/tasks/${taskId}/status`, "PATCH", { status }),
  updateChecklistStatus: (
    checklistItemId: string,
    status: MatterDetail["checklistItems"][number]["status"]
  ) => sendJson<MatterDetail>(`/api/checklist-items/${checklistItemId}/status`, "PATCH", { status }),
  uploadMatterDocument: (matterId: string, payload: DocumentUploadPayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/documents`, "POST", payload),
  reviewDocument: (documentId: string, status: "VERIFIED" | "REJECTED") =>
    sendJson<MatterDetail>(`/api/documents/${documentId}/review`, "PATCH", { status }),
  createMatterInvoice: (matterId: string, payload: InvoicePayload) =>
    sendJson<MatterDetail>(`/api/matters/${matterId}/invoices`, "POST", payload),
  payInvoice: (invoiceId: string) => sendJson<MatterDetail>(`/api/invoices/${invoiceId}/pay`, "POST", {}),
  invoices: () => getJson<InvoiceRecord[]>("/api/invoices"),
  workflowTemplates: () => getJson<WorkflowTemplate[]>("/api/workflow-templates"),
  createMatterFromTemplate: (payload: MatterFromTemplatePayload) =>
    sendJson<Matter>("/api/matters/from-template", "POST", payload),
  reports: () => getJson<Report>("/api/reports"),
  auditEvents: () =>
    getJson<Array<{ id: string; actor: string; action: string; entity: string; timestamp: string }>>(
      "/api/audit-events"
    ),
  portalSummary: () => getJson<PortalSummary>("/api/portal/summary")
};

import "dotenv/config";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { z } from "zod";
import { roleUsers } from "./data/role-data.js";
import {
  createClient,
  createCheckoutSession,
  createMatterChecklistItem,
  createMatterInvoice,
  createMatterMessage,
  createMatterTask,
  createMatterFromTemplate,
  createRetentionRequest,
  createSignatureEnvelope,
  createWorkflowTemplate,
  decideRetentionRequest,
  exportReportCsv,
  exportReportXlsx,
  generateComplianceReview,
  generateInvoiceReceiptPdf,
  generateDocumentAiReview,
  generateMatterAiBrief,
  generateMatterIntakePlan,
  generateMatterMessageDraft,
  generatePortalGuidance,
  generateReportInsights,
  generateWorkflowSuggestions,
  getAuditEvents,
  getClientById,
  getClients,
  getComplianceCenter,
  getDashboard,
  getInvoices,
  getMatterById,
  getMatters,
  getPortalSummary,
  getReports,
  getWorkflowTemplates,
  handleSignatureWebhook,
  handleStripeWebhook,
  payInvoice,
  reviewDocument,
  updateChecklistStatus,
  updateClient,
  updateMatterStage,
  updateTenantSettings,
  updateTaskStatus,
  uploadMatterDocument
} from "./services/crm-repository.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "30mb" }));

type AppRole = "ASUN_ADMIN" | "AGENCY_ADMIN" | "RMA" | "CASE_OFFICER" | "FINANCE" | "CLIENT";
type ApiErrorCode =
  | "API_500"
  | "API_404"
  | "CHECKLIST_404"
  | "CLIENT_404"
  | "CLIENT_409"
  | "USER_404"
  | "DOC_400"
  | "DOC_404"
  | "INVOICE_400"
  | "MATTER_400"
  | "MATTER_404"
  | "MESSAGE_404"
  | "PAY_404"
  | "RBAC_403"
  | "RETENTION_404"
  | "TASK_404"
  | "VALIDATION_400"
  | "WORKFLOW_409";

class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string
  ) {
    super(message);
  }
}

const roles = {
  staff: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "FINANCE"],
  clientOps: ["CLIENT"],
  clientAndFinance: ["ASUN_ADMIN", "AGENCY_ADMIN", "FINANCE", "CLIENT"],
  clientMatterUpload: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "CLIENT"],
  clientMessaging: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "CLIENT"],
  clientRecords: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER"],
  matterOps: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER"],
  finance: ["ASUN_ADMIN", "AGENCY_ADMIN", "FINANCE"],
  matterBilling: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "FINANCE"],
  reports: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "FINANCE"],
  admin: ["ASUN_ADMIN", "AGENCY_ADMIN"]
} satisfies Record<string, AppRole[]>;

function getRequestRole(req: Request): AppRole {
  const userId = requestUserId(req) ?? roleUsers.find((item) => item.role === "RMA")?.id;
  const user = roleUsers.find((item) => item.id === userId);
  return (user?.role ?? "RMA") as AppRole;
}

function requestUserId(req: Request) {
  return req.header("x-user-id") ?? undefined;
}

function requireRoles(allowedRoles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getRequestRole(req);

    if (!allowedRoles.includes(role)) {
      next(new ApiError(403, "RBAC_403", `Role ${role.replaceAll("_", " ")} cannot access this API endpoint`));
      return;
    }

    next();
  };
}

function routeParam(req: Request, name: string) {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseRequest<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  fallbackMessage: string
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_400", parsed.error.issues[0]?.message ?? fallbackMessage);
  }

  return parsed.data;
}

function notFound(message: string, code: ApiErrorCode = "API_404"): never {
  throw new ApiError(404, code, message);
}

function requestFailed(
  error: unknown,
  statusCode: number,
  code: ApiErrorCode,
  fallbackMessage: string
): never {
  throw new ApiError(statusCode, code, error instanceof Error ? error.message : fallbackMessage);
}

app.get("/api/health", (_req, res) => {
  res.json({ data: { status: "ok", service: "asun-migrations-api" } });
});

app.get("/api/role-users", (_req, res) => {
  res.json({ data: roleUsers });
});

function createRoleSession(req: Request, res: Response) {
  const selectedUser = roleUsers.find((user) => user.id === req.body?.userId);

  if (!selectedUser) {
    notFound("User not found", "USER_404");
  }

  res.json({ data: selectedUser });
}

app.post("/api/role-session", createRoleSession);

app.get("/api/dashboard", requireRoles(roles.staff), async (_req, res) => {
  res.json({ data: await getDashboard() });
});

app.get("/api/clients", requireRoles(roles.clientRecords), async (_req, res) => {
  res.json({ data: await getClients() });
});

app.get("/api/clients/:clientId", requireRoles(roles.clientRecords), async (req, res) => {
  const client = await getClientById(routeParam(req, "clientId"));

  if (!client) {
    notFound("Client not found", "CLIENT_404");
  }

  res.json({ data: client });
});

app.post("/api/clients", requireRoles(roles.clientRecords), async (req, res) => {
  const payload = parseRequest(createClientPayloadSchema, req.body, "Invalid client payload");

  try {
    const client = await createClient(payload, requestUserId(req));
    res.status(201).json({ data: client });
  } catch (error) {
    requestFailed(error, 409, "CLIENT_409", "Unable to create client");
  }
});

app.patch("/api/clients/:clientId", requireRoles(roles.clientRecords), async (req, res) => {
  const payload = parseRequest(updateClientPayloadSchema, req.body, "Invalid client payload");

  try {
    const client = await updateClient(routeParam(req, "clientId"), payload, requestUserId(req));
    res.json({ data: client });
  } catch (error) {
    requestFailed(error, 404, "CLIENT_404", "Unable to update client");
  }
});

app.get("/api/matters", requireRoles(roles.matterOps), async (_req, res) => {
  res.json({ data: await getMatters() });
});

app.get("/api/matters/:matterId", requireRoles(roles.matterOps), async (req, res) => {
  const matter = await getMatterById(routeParam(req, "matterId"));

  if (!matter) {
    notFound("Matter not found", "MATTER_404");
  }

  res.json({ data: matter });
});

app.post("/api/matters/ai-intake-plan", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(createMatterFromTemplateSchema, req.body, "Invalid AI intake plan payload");

  try {
    const plan = await generateMatterIntakePlan(payload, requestUserId(req));
    res.json({ data: plan });
  } catch (error) {
    requestFailed(error, 404, "MATTER_404", "Unable to generate AI matter intake plan");
  }
});

app.post("/api/matters/from-template", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(createMatterFromTemplateSchema, req.body, "Invalid matter payload");

  try {
    const matter = await createMatterFromTemplate(payload, requestUserId(req));
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "MATTER_400", "Unable to create matter");
  }
});

app.patch("/api/matters/:matterId/stage", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(updateMatterStageSchema, req.body, "Invalid matter stage");

  try {
    const matter = await updateMatterStage(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "MATTER_404", "Unable to update matter stage");
  }
});

app.post("/api/matters/:matterId/ai-brief", requireRoles(roles.matterOps), async (req, res) => {
  try {
    const brief = await generateMatterAiBrief(
      routeParam(req, "matterId"),
      requestUserId(req)
    );
    res.json({ data: brief });
  } catch (error) {
    requestFailed(error, 404, "MATTER_404", "Unable to generate matter AI brief");
  }
});

app.post("/api/matters/:matterId/ai-workflow-suggestions", requireRoles(roles.matterOps), async (req, res) => {
  try {
    const suggestions = await generateWorkflowSuggestions(
      routeParam(req, "matterId"),
      requestUserId(req)
    );
    res.json({ data: suggestions });
  } catch (error) {
    requestFailed(error, 404, "MATTER_404", "Unable to generate AI workflow suggestions");
  }
});

app.post("/api/matters/:matterId/ai-message-draft", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(aiMessageDraftSchema, req.body, "Invalid AI message draft payload");

  try {
    const draft = await generateMatterMessageDraft(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.json({ data: draft });
  } catch (error) {
    requestFailed(error, 404, "MATTER_404", "Unable to generate AI message draft");
  }
});

app.patch("/api/tasks/:taskId/status", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(updateTaskStatusSchema, req.body, "Invalid task status");

  try {
    const matter = await updateTaskStatus(
      routeParam(req, "taskId"),
      payload,
      requestUserId(req)
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "TASK_404", "Unable to update task");
  }
});

app.patch("/api/checklist-items/:checklistItemId/status", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(updateChecklistStatusSchema, req.body, "Invalid checklist status");

  try {
    const matter = await updateChecklistStatus(
      routeParam(req, "checklistItemId"),
      payload,
      requestUserId(req)
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "CHECKLIST_404", "Unable to update checklist item");
  }
});

app.post("/api/matters/:matterId/tasks", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(createMatterTaskSchema, req.body, "Invalid task payload");

  try {
    const matter = await createMatterTask(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "TASK_404", "Unable to create task");
  }
});

app.post("/api/matters/:matterId/checklist-items", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(createMatterChecklistSchema, req.body, "Invalid checklist payload");

  try {
    const matter = await createMatterChecklistItem(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "CHECKLIST_404", "Unable to create checklist item");
  }
});

app.post("/api/matters/:matterId/documents", requireRoles(roles.clientMatterUpload), async (req, res) => {
  const payload = parseRequest(uploadDocumentSchema, req.body, "Invalid document payload");

  try {
    const matter = await uploadMatterDocument(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "DOC_400", "Unable to upload document");
  }
});

app.patch("/api/documents/:documentId/review", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(reviewDocumentSchema, req.body, "Invalid document review payload");

  try {
    const matter = await reviewDocument(
      routeParam(req, "documentId"),
      payload,
      requestUserId(req)
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "DOC_404", "Unable to review document");
  }
});

app.post("/api/documents/:documentId/ai-review", requireRoles(roles.matterOps), async (req, res) => {
  try {
    const review = await generateDocumentAiReview(
      routeParam(req, "documentId"),
      requestUserId(req)
    );
    res.json({ data: review });
  } catch (error) {
    requestFailed(error, 404, "DOC_404", "Unable to generate document AI review");
  }
});

app.post("/api/matters/:matterId/invoices", requireRoles(roles.matterBilling), async (req, res) => {
  const payload = parseRequest(createInvoiceSchema, req.body, "Invalid invoice payload");

  try {
    const matter = await createMatterInvoice(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "INVOICE_400", "Unable to create invoice");
  }
});

app.post("/api/invoices/:invoiceId/pay", requireRoles(roles.clientAndFinance), async (req, res) => {
  try {
    const matter = await payInvoice(routeParam(req, "invoiceId"), requestUserId(req));
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "PAY_404", "Unable to pay invoice");
  }
});

app.post("/api/matters/:matterId/messages", requireRoles(roles.clientMessaging), async (req, res) => {
  const payload = parseRequest(createMessageSchema, req.body, "Invalid message payload");

  if (getRequestRole(req) === "CLIENT" && payload.visibility !== "EXTERNAL") {
    throw new ApiError(403, "RBAC_403", "Client users can only send external portal messages");
  }

  try {
    const matter = await createMatterMessage(
      routeParam(req, "matterId"),
      payload,
      requestUserId(req)
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "MESSAGE_404", "Unable to send message");
  }
});

app.get("/api/invoices", requireRoles(roles.finance), async (_req, res) => {
  res.json({ data: await getInvoices() });
});

app.get("/api/workflow-templates", requireRoles([...roles.matterOps, ...roles.admin]), async (_req, res) => {
  res.json({ data: await getWorkflowTemplates() });
});

app.post("/api/workflow-templates", requireRoles(roles.admin), async (req, res) => {
  const payload = parseRequest(createWorkflowTemplateSchema, req.body, "Invalid workflow template payload");

  try {
    const template = await createWorkflowTemplate(payload, requestUserId(req));
    res.status(201).json({ data: template });
  } catch (error) {
    requestFailed(error, 409, "WORKFLOW_409", "Unable to create workflow template");
  }
});

app.get("/api/reports", requireRoles(roles.reports), async (_req, res) => {
  res.json({ data: await getReports() });
});

app.post("/api/reports/ai-insights", requireRoles(roles.reports), async (req, res) => {
  res.json({ data: await generateReportInsights(requestUserId(req)) });
});

app.get("/api/reports/export", requireRoles(roles.reports), async (req, res) => {
  const query = parseRequest(reportExportSchema, req.query, "Invalid report export type");

  const exported = await exportReportCsv(query.type, requestUserId(req));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
  res.send(exported.csv);
});

app.get("/api/reports/export-xlsx", requireRoles(roles.reports), async (req, res) => {
  const query = parseRequest(reportExportSchema, req.query, "Invalid report export type");

  const exported = await exportReportXlsx(query.type, requestUserId(req));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
  res.send(exported.buffer);
});

app.get("/api/invoices/:invoiceId/receipt.pdf", requireRoles(roles.clientAndFinance), async (req, res) => {
  try {
    const receipt = await generateInvoiceReceiptPdf(
      routeParam(req, "invoiceId"),
      requestUserId(req)
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${receipt.filename}"`);
    res.send(receipt.buffer);
  } catch (error) {
    requestFailed(error, 404, "INVOICE_400", "Unable to generate receipt");
  }
});

app.get("/api/audit-events", requireRoles(roles.admin), async (req, res) => {
  res.json({
    data: await getAuditEvents({
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      actor: typeof req.query.actor === "string" ? req.query.actor : undefined,
      entity: typeof req.query.entity === "string" ? req.query.entity : undefined,
      from: typeof req.query.from === "string" ? req.query.from : undefined,
      to: typeof req.query.to === "string" ? req.query.to : undefined
    })
  });
});

app.get("/api/portal/summary", requireRoles(roles.clientOps), async (_req, res) => {
  res.json({ data: await getPortalSummary() });
});

app.post("/api/portal/ai-guidance", requireRoles(roles.clientOps), async (req, res) => {
  res.json({ data: await generatePortalGuidance(requestUserId(req)) });
});

app.post("/api/checkout/session/create", requireRoles(roles.clientAndFinance), async (req, res) => {
  const payload = parseRequest(checkoutSessionSchema, req.body, "Invalid checkout payload");

  try {
    res.json({ data: await createCheckoutSession(payload.invoiceId, requestUserId(req)) });
  } catch (error) {
    requestFailed(error, 404, "PAY_404", "Unable to create checkout session");
  }
});

app.post("/api/webhook/stripe/payment", async (req, res) => {
  const payload = parseRequest(stripeWebhookSchema, req.body, "Invalid Stripe webhook payload");

  try {
    res.json({ data: await handleStripeWebhook(payload, requestUserId(req)) });
  } catch (error) {
    requestFailed(error, 404, "PAY_404", "Unable to process Stripe webhook");
  }
});

app.post("/api/envelopes", requireRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(signatureEnvelopeSchema, req.body, "Invalid signature envelope payload");

  try {
    res.status(201).json({ data: await createSignatureEnvelope(payload, requestUserId(req)) });
  } catch (error) {
    requestFailed(error, 400, "DOC_400", "Unable to create signature envelope");
  }
});

app.post("/api/webhook/docusign/status", async (req, res) => {
  const payload = parseRequest(signatureWebhookSchema, req.body, "Invalid DocuSign webhook payload");

  try {
    res.json({ data: await handleSignatureWebhook(payload, requestUserId(req)) });
  } catch (error) {
    requestFailed(error, 404, "DOC_404", "Unable to process signature status");
  }
});

app.get("/api/compliance", requireRoles(roles.admin), async (_req, res) => {
  res.json({ data: await getComplianceCenter() });
});

app.post("/api/compliance/ai-review", requireRoles(roles.admin), async (req, res) => {
  res.json({ data: await generateComplianceReview(requestUserId(req)) });
});

app.patch("/api/compliance/settings", requireRoles(roles.admin), async (req, res) => {
  const payload = parseRequest(tenantSettingsSchema, req.body, "Invalid tenant settings payload");
  res.json({ data: await updateTenantSettings(payload, requestUserId(req)) });
});

app.post("/api/compliance/retention-requests", requireRoles(roles.admin), async (req, res) => {
  const payload = parseRequest(retentionRequestSchema, req.body, "Invalid retention request payload");
  res.status(201).json({ data: await createRetentionRequest(payload, requestUserId(req)) });
});

app.patch("/api/compliance/retention-requests/:retentionRequestId", requireRoles(roles.admin), async (req, res) => {
  const payload = parseRequest(retentionDecisionSchema, req.body, "Invalid retention decision payload");

  try {
    res.json({
      data: await decideRetentionRequest(
        routeParam(req, "retentionRequestId"),
        payload,
        requestUserId(req)
      )
    });
  } catch (error) {
    requestFailed(error, 404, "RETENTION_404", "Unable to update retention request");
  }
});

app.use("/api", (req, _res, next) => {
  next(new ApiError(404, "API_404", `API route not found: ${req.method} ${req.path}`));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: "Malformed JSON request body"
      }
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      code: "API_500",
      message: "Unexpected API error"
    }
  });
});

const baseClientPayloadSchema = z.object({
  name: z.string().trim().min(2, "Client name is required"),
  email: z.string().trim().email("A valid email is required"),
  dateOfBirth: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date <= new Date();
  }, "Date of birth must be today or earlier"),
  nationality: z.string().trim().min(2, "Nationality is required"),
  consentStatus: z.enum(["SIGNED", "PENDING", "EXPIRED"]),
  conflictCheckStatus: z.enum(["CLEAR", "ESCALATE", "DECLINED"]),
  portalActive: z.boolean()
});

const createClientPayloadSchema = baseClientPayloadSchema.extend({
  passportNumber: z
    .string()
    .trim()
    .regex(/^[A-Z][0-9]{7}$/i, "Passport must be 1 letter followed by 7 digits")
});

const updateClientPayloadSchema = baseClientPayloadSchema.extend({
  passportNumber: z
    .string()
    .trim()
    .regex(/^[A-Z][0-9]{7}$/i, "Passport must be 1 letter followed by 7 digits")
    .optional()
    .or(z.literal(""))
});

const createMatterFromTemplateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  templateId: z.string().min(1, "Workflow template is required"),
  keyDate: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date >= new Date(new Date().toDateString());
  }, "Key date must be today or later")
});

const updateMatterStageSchema = z.object({
  stage: z.enum(["INTAKE", "DOCUMENTS", "LODGEMENT", "CASE_OFFICER_REQUEST", "DECISION", "ARCHIVED"])
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["OPEN", "BLOCKED", "DONE", "SNOOZED"])
});

const updateChecklistStatusSchema = z.object({
  status: z.enum(["REQUESTED", "RECEIVED", "VERIFIED", "REJECTED"])
});

const aiMessageDraftSchema = z.object({
  intent: z.enum(["DOCUMENT_REQUEST", "INVOICE_FOLLOW_UP", "STATUS_UPDATE"])
});

const createMatterTaskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required"),
  description: z.string().trim().max(500).optional(),
  dueOn: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date >= new Date(new Date().toDateString());
  }, "Task due date must be today or later")
});

const createMatterChecklistSchema = z.object({
  title: z.string().trim().min(2, "Checklist title is required"),
  category: z.string().trim().min(2, "Checklist category is required"),
  dueOn: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      return !Number.isNaN(date.valueOf()) && date >= new Date(new Date().toDateString());
    }, "Checklist due date must be today or later"),
  required: z.boolean()
});

const uploadDocumentSchema = z.object({
  checklistItemId: z.string().optional(),
  title: z.string().trim().min(2, "Document title is required"),
  fileName: z
    .string()
    .trim()
    .min(3, "File name is required")
    .regex(/\.(pdf|docx|jpg|jpeg)$/i, "File name must end in PDF, DOCX, JPG, or JPEG"),
  fileType: z.enum(["PDF", "DOCX", "JPG"]),
  fileSize: z.number().int().positive("File size must be greater than 0").max(25 * 1024 * 1024),
  fileContentBase64: z.string().optional()
});

const reviewDocumentSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"])
});

const createInvoiceSchema = z.object({
  description: z.string().trim().min(2, "Line item description is required"),
  subtotal: z.number().positive("Subtotal must be greater than 0"),
  tax: z.number().min(0, "Tax cannot be negative"),
  dueOn: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date >= new Date(new Date().toDateString());
  }, "Due date must be today or later"),
  status: z.enum(["DRAFT", "SENT"])
});

const createMessageSchema = z.object({
  body: z.string().trim().min(2, "Message is required").max(2000, "Message is too long"),
  visibility: z.enum(["INTERNAL", "EXTERNAL"])
});

const createWorkflowTemplateSchema = z.object({
  visaSubclass: z.string().trim().min(2, "Visa subclass is required").max(20),
  name: z.string().trim().min(3, "Template name is required"),
  description: z.string().trim().max(500).optional()
});

const reportExportSchema = z.object({
  type: z.enum(["pipeline", "revenue", "sla", "deadlines", "workload"])
});

const checkoutSessionSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required")
});

const stripeWebhookSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  eventType: z.string().trim().min(2, "Event type is required"),
  status: z.enum(["succeeded", "failed"]),
  providerPaymentId: z.string().optional()
});

const signatureEnvelopeSchema = z.object({
  documentId: z.string().min(1, "Document is required"),
  signerEmail: z.string().email("A valid signer email is required")
});

const signatureWebhookSchema = z.object({
  envelopeId: z.string().min(1, "Envelope is required"),
  status: z.enum(["completed", "declined", "expired"])
});

const tenantSettingsSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Brand color must be a hex color"),
  retentionYears: z.number().int().min(1).max(30),
  taxRate: z.number().min(0).max(100),
  privacyContactEmail: z.string().email().optional().or(z.literal("")),
  stripeMode: z.enum(["mock", "live"]),
  docusignMode: z.enum(["mock", "live"]),
  emailProvider: z.enum(["mock", "sendgrid", "ses"])
});

const retentionRequestSchema = z.object({
  clientId: z.string().optional(),
  action: z.enum(["EXPORT", "ERASURE", "ARCHIVE_REVIEW"]),
  reason: z.string().trim().min(5, "Reason is required")
});

const retentionDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"])
});

import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { z } from "zod";
import { demoUsers } from "./data/demo-data.js";
import {
  createClient,
  createMatterInvoice,
  createMatterMessage,
  createMatterFromTemplate,
  createWorkflowTemplate,
  exportReportCsv,
  getAuditEvents,
  getClientById,
  getClients,
  getDashboard,
  getInvoices,
  getMatterById,
  getMatters,
  getPortalSummary,
  getReports,
  getWorkflowTemplates,
  payInvoice,
  reviewDocument,
  updateChecklistStatus,
  updateClient,
  updateMatterStage,
  updateTaskStatus,
  uploadMatterDocument
} from "./services/crm-repository.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

type DemoRole = "ASUN_ADMIN" | "AGENCY_ADMIN" | "RMA" | "CASE_OFFICER" | "FINANCE" | "CLIENT";
type ApiErrorCode =
  | "API_500"
  | "API_404"
  | "CHECKLIST_404"
  | "CLIENT_404"
  | "CLIENT_409"
  | "DEMO_404"
  | "DOC_400"
  | "DOC_404"
  | "INVOICE_400"
  | "MATTER_400"
  | "MATTER_404"
  | "MESSAGE_404"
  | "PAY_404"
  | "RBAC_403"
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
  reports: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "FINANCE"],
  admin: ["ASUN_ADMIN", "AGENCY_ADMIN"]
} satisfies Record<string, DemoRole[]>;

function getDemoRole(req: Request): DemoRole {
  const demoUserId = req.header("x-demo-user-id") ?? "rma-demo";
  const user = demoUsers.find((item) => item.id === demoUserId);
  return (user?.role ?? "RMA") as DemoRole;
}

function requireDemoRoles(allowedRoles: DemoRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getDemoRole(req);

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

app.get("/api/demo-users", (_req, res) => {
  res.json({ data: demoUsers });
});

app.post("/api/demo-session", (req, res) => {
  const selectedUser = demoUsers.find((user) => user.id === req.body?.userId);

  if (!selectedUser) {
    notFound("Demo user not found", "DEMO_404");
  }

  res.json({ data: selectedUser });
});

app.get("/api/dashboard", requireDemoRoles(roles.staff), async (_req, res) => {
  res.json({ data: await getDashboard() });
});

app.get("/api/clients", requireDemoRoles(roles.clientRecords), async (_req, res) => {
  res.json({ data: await getClients() });
});

app.get("/api/clients/:clientId", requireDemoRoles(roles.clientRecords), async (req, res) => {
  const client = await getClientById(routeParam(req, "clientId"));

  if (!client) {
    notFound("Client not found", "CLIENT_404");
  }

  res.json({ data: client });
});

app.post("/api/clients", requireDemoRoles(roles.clientRecords), async (req, res) => {
  const payload = parseRequest(createClientPayloadSchema, req.body, "Invalid client payload");

  try {
    const client = await createClient(payload, req.header("x-demo-user-id") ?? undefined);
    res.status(201).json({ data: client });
  } catch (error) {
    requestFailed(error, 409, "CLIENT_409", "Unable to create client");
  }
});

app.patch("/api/clients/:clientId", requireDemoRoles(roles.clientRecords), async (req, res) => {
  const payload = parseRequest(updateClientPayloadSchema, req.body, "Invalid client payload");

  try {
    const client = await updateClient(routeParam(req, "clientId"), payload, req.header("x-demo-user-id") ?? undefined);
    res.json({ data: client });
  } catch (error) {
    requestFailed(error, 404, "CLIENT_404", "Unable to update client");
  }
});

app.get("/api/matters", requireDemoRoles(roles.matterOps), async (_req, res) => {
  res.json({ data: await getMatters() });
});

app.get("/api/matters/:matterId", requireDemoRoles(roles.matterOps), async (req, res) => {
  const matter = await getMatterById(routeParam(req, "matterId"));

  if (!matter) {
    notFound("Matter not found", "MATTER_404");
  }

  res.json({ data: matter });
});

app.post("/api/matters/from-template", requireDemoRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(createMatterFromTemplateSchema, req.body, "Invalid matter payload");

  try {
    const matter = await createMatterFromTemplate(payload, req.header("x-demo-user-id") ?? undefined);
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "MATTER_400", "Unable to create matter");
  }
});

app.patch("/api/matters/:matterId/stage", requireDemoRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(updateMatterStageSchema, req.body, "Invalid matter stage");

  try {
    const matter = await updateMatterStage(
      routeParam(req, "matterId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "MATTER_404", "Unable to update matter stage");
  }
});

app.patch("/api/tasks/:taskId/status", requireDemoRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(updateTaskStatusSchema, req.body, "Invalid task status");

  try {
    const matter = await updateTaskStatus(
      routeParam(req, "taskId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "TASK_404", "Unable to update task");
  }
});

app.patch("/api/checklist-items/:checklistItemId/status", requireDemoRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(updateChecklistStatusSchema, req.body, "Invalid checklist status");

  try {
    const matter = await updateChecklistStatus(
      routeParam(req, "checklistItemId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "CHECKLIST_404", "Unable to update checklist item");
  }
});

app.post("/api/matters/:matterId/documents", requireDemoRoles(roles.clientMatterUpload), async (req, res) => {
  const payload = parseRequest(uploadDocumentSchema, req.body, "Invalid document payload");

  try {
    const matter = await uploadMatterDocument(
      routeParam(req, "matterId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "DOC_400", "Unable to upload document");
  }
});

app.patch("/api/documents/:documentId/review", requireDemoRoles(roles.matterOps), async (req, res) => {
  const payload = parseRequest(reviewDocumentSchema, req.body, "Invalid document review payload");

  try {
    const matter = await reviewDocument(
      routeParam(req, "documentId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "DOC_404", "Unable to review document");
  }
});

app.post("/api/matters/:matterId/invoices", requireDemoRoles(roles.finance), async (req, res) => {
  const payload = parseRequest(createInvoiceSchema, req.body, "Invalid invoice payload");

  try {
    const matter = await createMatterInvoice(
      routeParam(req, "matterId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 400, "INVOICE_400", "Unable to create invoice");
  }
});

app.post("/api/invoices/:invoiceId/pay", requireDemoRoles(roles.clientAndFinance), async (req, res) => {
  try {
    const matter = await payInvoice(routeParam(req, "invoiceId"), req.header("x-demo-user-id") ?? undefined);
    res.json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "PAY_404", "Unable to pay invoice");
  }
});

app.post("/api/matters/:matterId/messages", requireDemoRoles(roles.clientMessaging), async (req, res) => {
  const payload = parseRequest(createMessageSchema, req.body, "Invalid message payload");

  if (getDemoRole(req) === "CLIENT" && payload.visibility !== "EXTERNAL") {
    throw new ApiError(403, "RBAC_403", "Client users can only send external portal messages");
  }

  try {
    const matter = await createMatterMessage(
      routeParam(req, "matterId"),
      payload,
      req.header("x-demo-user-id") ?? undefined
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    requestFailed(error, 404, "MESSAGE_404", "Unable to send message");
  }
});

app.get("/api/invoices", requireDemoRoles(roles.finance), async (_req, res) => {
  res.json({ data: await getInvoices() });
});

app.get("/api/workflow-templates", requireDemoRoles([...roles.matterOps, ...roles.admin]), async (_req, res) => {
  res.json({ data: await getWorkflowTemplates() });
});

app.post("/api/workflow-templates", requireDemoRoles(roles.admin), async (req, res) => {
  const payload = parseRequest(createWorkflowTemplateSchema, req.body, "Invalid workflow template payload");

  try {
    const template = await createWorkflowTemplate(payload, req.header("x-demo-user-id") ?? undefined);
    res.status(201).json({ data: template });
  } catch (error) {
    requestFailed(error, 409, "WORKFLOW_409", "Unable to create workflow template");
  }
});

app.get("/api/reports", requireDemoRoles(roles.reports), async (_req, res) => {
  res.json({ data: await getReports() });
});

app.get("/api/reports/export", requireDemoRoles(roles.reports), async (req, res) => {
  const query = parseRequest(reportExportSchema, req.query, "Invalid report export type");

  const exported = await exportReportCsv(query.type, req.header("x-demo-user-id") ?? undefined);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${exported.filename}"`);
  res.send(exported.csv);
});

app.get("/api/audit-events", requireDemoRoles(roles.admin), async (req, res) => {
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

app.get("/api/portal/summary", requireDemoRoles(roles.clientOps), async (_req, res) => {
  res.json({ data: await getPortalSummary() });
});

app.post("/api/checkout/session/create", requireDemoRoles(roles.clientAndFinance), (req, res) => {
  res.json({
    data: {
      invoiceId: req.body?.invoiceId ?? "inv-1001",
      paymentUrl: "https://checkout.stripe.com/demo/asun-migrations",
      mode: "mock"
    }
  });
});

app.post("/api/webhook/stripe/payment", (_req, res) => {
  res.json({
    data: {
      received: true,
      status: "succeeded"
    }
  });
});

app.post("/api/envelopes", requireDemoRoles(roles.matterOps), (req, res) => {
  res.status(201).json({
    data: {
      envelopeId: "env-demo-001",
      matterId: req.body?.matterId,
      documentId: req.body?.documentId,
      status: "sent"
    }
  });
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

const uploadDocumentSchema = z.object({
  checklistItemId: z.string().min(1, "Checklist item is required"),
  title: z.string().trim().min(2, "Document title is required"),
  fileName: z
    .string()
    .trim()
    .min(3, "File name is required")
    .regex(/\.(pdf|docx|jpg|jpeg)$/i, "File name must end in PDF, DOCX, JPG, or JPEG"),
  fileType: z.enum(["PDF", "DOCX", "JPG"]),
  fileSize: z.number().int().positive("File size must be greater than 0").max(25 * 1024 * 1024)
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

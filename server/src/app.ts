import cors from "cors";
import express from "express";
import helmet from "helmet";
import { z } from "zod";
import { demoUsers } from "./data/demo-data.js";
import {
  createClient,
  createMatterInvoice,
  createMatterFromTemplate,
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

app.get("/api/health", (_req, res) => {
  res.json({ data: { status: "ok", service: "asun-migrations-api" } });
});

app.get("/api/demo-users", (_req, res) => {
  res.json({ data: demoUsers });
});

app.post("/api/demo-session", (req, res) => {
  const selectedUser = demoUsers.find((user) => user.id === req.body?.userId);

  if (!selectedUser) {
    res.status(404).json({
      error: {
        code: "DEMO_404",
        message: "Demo user not found"
      }
    });
    return;
  }

  res.json({ data: selectedUser });
});

app.get("/api/dashboard", async (req, res) => {
  const demoUserId = req.header("x-demo-user-id") ?? "rma-demo";
  const user = demoUsers.find((item) => item.id === demoUserId) ?? demoUsers[2];

  if (user?.role === "CLIENT") {
    res.status(403).json({
      error: {
        code: "RBAC_403",
        message: "Client users should use the portal dashboard"
      }
    });
    return;
  }

  res.json({ data: await getDashboard() });
});

app.get("/api/clients", async (_req, res) => {
  res.json({ data: await getClients() });
});

app.get("/api/clients/:clientId", async (req, res) => {
  const client = await getClientById(req.params.clientId);

  if (!client) {
    res.status(404).json({
      error: {
        code: "CLIENT_404",
        message: "Client not found"
      }
    });
    return;
  }

  res.json({ data: client });
});

app.post("/api/clients", async (req, res) => {
  const parsed = createClientPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid client payload"
      }
    });
    return;
  }

  try {
    const client = await createClient(parsed.data, req.header("x-demo-user-id") ?? undefined);
    res.status(201).json({ data: client });
  } catch (error) {
    res.status(409).json({
      error: {
        code: "CLIENT_409",
        message: error instanceof Error ? error.message : "Unable to create client"
      }
    });
  }
});

app.patch("/api/clients/:clientId", async (req, res) => {
  const parsed = updateClientPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid client payload"
      }
    });
    return;
  }

  try {
    const client = await updateClient(req.params.clientId, parsed.data, req.header("x-demo-user-id") ?? undefined);
    res.json({ data: client });
  } catch (error) {
    res.status(404).json({
      error: {
        code: "CLIENT_404",
        message: error instanceof Error ? error.message : "Unable to update client"
      }
    });
  }
});

app.get("/api/matters", async (_req, res) => {
  res.json({ data: await getMatters() });
});

app.get("/api/matters/:matterId", async (req, res) => {
  const matter = await getMatterById(req.params.matterId);

  if (!matter) {
    res.status(404).json({
      error: {
        code: "MATTER_404",
        message: "Matter not found"
      }
    });
    return;
  }

  res.json({ data: matter });
});

app.post("/api/matters/from-template", async (req, res) => {
  const parsed = createMatterFromTemplateSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid matter payload"
      }
    });
    return;
  }

  try {
    const matter = await createMatterFromTemplate(parsed.data, req.header("x-demo-user-id") ?? undefined);
    res.status(201).json({ data: matter });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "MATTER_400",
        message: error instanceof Error ? error.message : "Unable to create matter"
      }
    });
  }
});

app.patch("/api/matters/:matterId/stage", async (req, res) => {
  const parsed = updateMatterStageSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid matter stage"
      }
    });
    return;
  }

  try {
    const matter = await updateMatterStage(
      req.params.matterId,
      parsed.data,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    res.status(404).json({
      error: {
        code: "MATTER_404",
        message: error instanceof Error ? error.message : "Unable to update matter stage"
      }
    });
  }
});

app.patch("/api/tasks/:taskId/status", async (req, res) => {
  const parsed = updateTaskStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid task status"
      }
    });
    return;
  }

  try {
    const matter = await updateTaskStatus(
      req.params.taskId,
      parsed.data,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    res.status(404).json({
      error: {
        code: "TASK_404",
        message: error instanceof Error ? error.message : "Unable to update task"
      }
    });
  }
});

app.patch("/api/checklist-items/:checklistItemId/status", async (req, res) => {
  const parsed = updateChecklistStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid checklist status"
      }
    });
    return;
  }

  try {
    const matter = await updateChecklistStatus(
      req.params.checklistItemId,
      parsed.data,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    res.status(404).json({
      error: {
        code: "CHECKLIST_404",
        message: error instanceof Error ? error.message : "Unable to update checklist item"
      }
    });
  }
});

app.post("/api/matters/:matterId/documents", async (req, res) => {
  const parsed = uploadDocumentSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid document payload"
      }
    });
    return;
  }

  try {
    const matter = await uploadMatterDocument(
      req.params.matterId,
      parsed.data,
      req.header("x-demo-user-id") ?? undefined
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "DOC_400",
        message: error instanceof Error ? error.message : "Unable to upload document"
      }
    });
  }
});

app.patch("/api/documents/:documentId/review", async (req, res) => {
  const parsed = reviewDocumentSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid document review payload"
      }
    });
    return;
  }

  try {
    const matter = await reviewDocument(
      req.params.documentId,
      parsed.data,
      req.header("x-demo-user-id") ?? undefined
    );
    res.json({ data: matter });
  } catch (error) {
    res.status(404).json({
      error: {
        code: "DOC_404",
        message: error instanceof Error ? error.message : "Unable to review document"
      }
    });
  }
});

app.post("/api/matters/:matterId/invoices", async (req, res) => {
  const parsed = createInvoiceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: parsed.error.issues[0]?.message ?? "Invalid invoice payload"
      }
    });
    return;
  }

  try {
    const matter = await createMatterInvoice(
      req.params.matterId,
      parsed.data,
      req.header("x-demo-user-id") ?? undefined
    );
    res.status(201).json({ data: matter });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "INVOICE_400",
        message: error instanceof Error ? error.message : "Unable to create invoice"
      }
    });
  }
});

app.post("/api/invoices/:invoiceId/pay", async (req, res) => {
  try {
    const matter = await payInvoice(req.params.invoiceId, req.header("x-demo-user-id") ?? undefined);
    res.json({ data: matter });
  } catch (error) {
    res.status(404).json({
      error: {
        code: "PAY_404",
        message: error instanceof Error ? error.message : "Unable to pay invoice"
      }
    });
  }
});

app.get("/api/invoices", async (_req, res) => {
  res.json({ data: await getInvoices() });
});

app.get("/api/workflow-templates", async (_req, res) => {
  res.json({ data: await getWorkflowTemplates() });
});

app.get("/api/reports", async (_req, res) => {
  res.json({ data: await getReports() });
});

app.get("/api/audit-events", async (_req, res) => {
  res.json({ data: await getAuditEvents() });
});

app.get("/api/portal/summary", async (_req, res) => {
  res.json({ data: await getPortalSummary() });
});

app.post("/api/checkout/session/create", (req, res) => {
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

app.post("/api/envelopes", (req, res) => {
  res.status(201).json({
    data: {
      envelopeId: "env-demo-001",
      matterId: req.body?.matterId,
      documentId: req.body?.documentId,
      status: "sent"
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

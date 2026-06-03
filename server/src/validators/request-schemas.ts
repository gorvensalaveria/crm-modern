import { z } from "zod";

const today = () => new Date(new Date().toDateString());

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

export const createClientPayloadSchema = baseClientPayloadSchema.extend({
  passportNumber: z
    .string()
    .trim()
    .regex(/^[A-Z][0-9]{7}$/i, "Passport must be 1 letter followed by 7 digits")
});

export const updateClientPayloadSchema = baseClientPayloadSchema.extend({
  passportNumber: z
    .string()
    .trim()
    .regex(/^[A-Z][0-9]{7}$/i, "Passport must be 1 letter followed by 7 digits")
    .optional()
    .or(z.literal(""))
});

export const createMatterFromTemplateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  templateId: z.string().min(1, "Workflow template is required"),
  keyDate: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date >= today();
  }, "Key date must be today or later")
});

export const updateMatterStageSchema = z.object({
  stage: z.enum(["INTAKE", "DOCUMENTS", "LODGEMENT", "CASE_OFFICER_REQUEST", "DECISION", "ARCHIVED"])
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["OPEN", "BLOCKED", "DONE", "SNOOZED"])
});

export const updateChecklistStatusSchema = z.object({
  status: z.enum(["REQUESTED", "RECEIVED", "VERIFIED", "REJECTED"])
});

export const aiMessageDraftSchema = z.object({
  intent: z.enum(["DOCUMENT_REQUEST", "INVOICE_FOLLOW_UP", "STATUS_UPDATE"])
});

export const createMatterTaskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required"),
  description: z.string().trim().max(500).optional(),
  dueOn: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date >= today();
  }, "Task due date must be today or later")
});

export const createMatterChecklistSchema = z.object({
  title: z.string().trim().min(2, "Checklist title is required"),
  category: z.string().trim().min(2, "Checklist category is required"),
  dueOn: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      return !Number.isNaN(date.valueOf()) && date >= today();
    }, "Checklist due date must be today or later"),
  required: z.boolean()
});

export const uploadDocumentSchema = z.object({
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

export const reviewDocumentSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"])
});

export const createInvoiceSchema = z.object({
  description: z.string().trim().min(2, "Line item description is required"),
  subtotal: z.number().positive("Subtotal must be greater than 0"),
  tax: z.number().min(0, "Tax cannot be negative"),
  dueOn: z.string().refine((value) => {
    const date = new Date(value);
    return !Number.isNaN(date.valueOf()) && date >= today();
  }, "Due date must be today or later"),
  status: z.enum(["DRAFT", "SENT"])
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(2, "Message is required").max(2000, "Message is too long"),
  visibility: z.enum(["INTERNAL", "EXTERNAL"])
});

export const createWorkflowTemplateSchema = z.object({
  visaSubclass: z.string().trim().min(2, "Visa subclass is required").max(20),
  name: z.string().trim().min(3, "Template name is required"),
  description: z.string().trim().max(500).optional()
});

export const reportExportSchema = z.object({
  type: z.enum(["pipeline", "revenue", "sla", "deadlines", "workload"])
});

export const checkoutSessionSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required")
});

export const stripeWebhookSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  eventType: z.string().trim().min(2, "Event type is required"),
  status: z.enum(["succeeded", "failed"]),
  providerPaymentId: z.string().optional()
});

export const signatureEnvelopeSchema = z.object({
  documentId: z.string().min(1, "Document is required"),
  signerEmail: z.string().email("A valid signer email is required")
});

export const signatureWebhookSchema = z.object({
  envelopeId: z.string().min(1, "Envelope is required"),
  status: z.enum(["completed", "declined", "expired"])
});

export const tenantSettingsSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Brand color must be a hex color"),
  retentionYears: z.number().int().min(1).max(30),
  taxRate: z.number().min(0).max(100),
  privacyContactEmail: z.string().email().optional().or(z.literal("")),
  stripeMode: z.enum(["mock", "live"]),
  docusignMode: z.enum(["mock", "live"]),
  emailProvider: z.enum(["mock", "sendgrid", "ses"])
});

export const retentionRequestSchema = z.object({
  clientId: z.string().optional(),
  action: z.enum(["EXPORT", "ERASURE", "ARCHIVE_REVIEW"]),
  reason: z.string().trim().min(5, "Reason is required")
});

export const retentionDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"])
});

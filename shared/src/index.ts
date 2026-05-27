import { z } from "zod";

export const roleSchema = z.enum([
  "ASUN_ADMIN",
  "AGENCY_ADMIN",
  "RMA",
  "CASE_OFFICER",
  "FINANCE",
  "CLIENT"
]);

export const matterStageSchema = z.enum([
  "INTAKE",
  "DOCUMENTS",
  "LODGEMENT",
  "CASE_OFFICER_REQUEST",
  "DECISION",
  "ARCHIVED"
]);

export const taskStatusSchema = z.enum(["OPEN", "BLOCKED", "DONE", "SNOOZED"]);
export const documentStatusSchema = z.enum(["REQUESTED", "RECEIVED", "VERIFIED", "REJECTED", "SIGNING"]);
export const invoiceStatusSchema = z.enum(["DRAFT", "SENT", "OVERDUE", "PAID"]);

export type Role = z.infer<typeof roleSchema>;
export type MatterStage = z.infer<typeof matterStageSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  dob: z.string(),
  nationality: z.string(),
  passportMasked: z.string(),
  consentStatus: z.enum(["SIGNED", "PENDING", "EXPIRED"]),
  conflictCheck: z.enum(["CLEAR", "ESCALATE", "DECLINED"]),
  dependants: z.number().int().nonnegative(),
  portalActive: z.boolean()
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: taskStatusSchema,
  dueOn: z.string(),
  assignee: z.string(),
  matterId: z.string()
});

export const documentSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: documentStatusSchema,
  fileType: z.enum(["PDF", "DOCX", "JPG"]),
  uploadedBy: z.string(),
  verifiedBy: z.string().nullable(),
  updatedAt: z.string()
});

export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  clientName: z.string(),
  matterId: z.string(),
  amount: z.number().positive(),
  status: invoiceStatusSchema,
  dueOn: z.string()
});

export const matterSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string(),
  visaSubclass: z.string(),
  title: z.string(),
  stage: matterStageSchema,
  progress: z.number().min(0).max(100),
  primaryAgent: z.string(),
  caseOfficer: z.string(),
  trn: z.string().nullable(),
  keyDate: z.string(),
  tasksOpen: z.number().int().nonnegative(),
  tasksTotal: z.number().int().positive(),
  documents: z.array(documentSchema),
  invoices: z.array(invoiceSchema)
});

export const dashboardSchema = z.object({
  metrics: z.object({
    activeMatters: z.number(),
    overdueTasks: z.number(),
    upcomingDeadlines: z.number(),
    monthlyRevenue: z.number(),
    clientPortalAdoption: z.number()
  }),
  tasks: z.array(taskSchema),
  matters: z.array(matterSchema),
  recentMessages: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      preview: z.string(),
      matterTitle: z.string(),
      receivedAt: z.string()
    })
  ),
  alerts: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      title: z.string(),
      description: z.string(),
      dueOn: z.string()
    })
  )
});

export const reportSchema = z.object({
  pipelineByStage: z.array(z.object({ stage: matterStageSchema, count: z.number() })),
  revenueBySubclass: z.array(z.object({ subclass: z.string(), revenue: z.number() })),
  slaBreaches: z.array(z.object({ matterTitle: z.string(), owner: z.string(), daysOverdue: z.number() }))
});

export type Client = z.infer<typeof clientSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Document = z.infer<typeof documentSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type Matter = z.infer<typeof matterSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type Report = z.infer<typeof reportSchema>;

export const createCheckoutSessionSchema = z.object({
  invoiceId: z.string()
});

export const createEnvelopeSchema = z.object({
  matterId: z.string(),
  documentId: z.string(),
  signerEmail: z.string().email()
});


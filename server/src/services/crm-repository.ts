import { prisma } from "../lib/prisma.js";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  auditEvents as fallbackAuditEvents,
  clients as fallbackClients,
  dashboard as fallbackDashboard,
  matters as fallbackMatters,
  productUsers,
  portalSummary as fallbackPortalSummary
} from "../data/product-data.js";

const defaultTenantId = "tenant-asun-primary";

const productUserToDbUser: Record<string, string> = {
  "asun-admin-user": "user-asun-admin",
  "agency-admin-user": "user-agency-admin",
  "rma-user": "user-rma",
  "case-officer-user": "user-case-officer",
  "finance-user": "user-finance",
  "client-user": "user-client"
};

const portalUserPrefix = "client-portal:";

type ProductRoleUser = {
  id: string;
  name: string;
  role: "ASUN_ADMIN" | "AGENCY_ADMIN" | "RMA" | "CASE_OFFICER" | "FINANCE" | "CLIENT";
  title: string;
  description: string;
  clientId?: string;
};

type PortalSummaryData = {
  hasMatter?: boolean;
  matterId: string;
  clientName: string;
  matterTitle: string;
  stage: string;
  progress: number;
  outstandingDocuments: number;
  nextStep: string;
  invoice: {
    id?: string;
    number: string;
    amount: number;
    status: string;
    dueOn: string;
  };
  documents: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
    documentCount: number;
    latestDocument: {
      id: string;
      title: string;
      status: string;
      updatedAt: string;
    } | null;
  }>;
};

export type ClientInput = {
  name: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber?: string;
  consentStatus: "SIGNED" | "PENDING" | "EXPIRED";
  conflictCheckStatus: "CLEAR" | "ESCALATE" | "DECLINED";
  portalActive: boolean;
};

export async function getProductRoleUsers(): Promise<ProductRoleUser[]> {
  return withFallback(productUsers as unknown, async () => {
    const portalClients = await prisma.client.findMany({
      where: { tenantId: defaultTenantId, portalActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        nationality: true
      }
    });

    const portalUsers: ProductRoleUser[] = portalClients.map((client) => ({
      id: `${portalUserPrefix}${client.id}`,
      name: client.name,
      role: "CLIENT",
      title: `${client.name} - Client Portal`,
      description: `Client portal access for ${client.name}${client.nationality ? ` (${client.nationality})` : ""}.`,
      clientId: client.id
    }));

    return [
      ...productUsers.filter((user) => user.id !== "client-user"),
      ...portalUsers
    ] as ProductRoleUser[];
  });
}

export type MatterFromTemplateInput = {
  clientId: string;
  templateId: string;
  keyDate: string;
};

export type MatterIntakePlanInput = MatterFromTemplateInput;

export type MatterStageInput = {
  stage: "INTAKE" | "DOCUMENTS" | "LODGEMENT" | "CASE_OFFICER_REQUEST" | "DECISION" | "ARCHIVED";
};

export type TaskStatusInput = {
  status: "OPEN" | "BLOCKED" | "DONE" | "SNOOZED";
};

export type ChecklistStatusInput = {
  status: "REQUESTED" | "RECEIVED" | "VERIFIED" | "REJECTED";
};

export type MatterTaskInput = {
  title: string;
  description?: string;
  dueOn: string;
};

export type MatterChecklistInput = {
  title: string;
  category: string;
  dueOn?: string;
  required: boolean;
};

export type DocumentUploadInput = {
  checklistItemId?: string;
  title: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | "JPG";
  fileSize: number;
  fileContentBase64?: string;
};

export type DocumentReviewInput = {
  status: "VERIFIED" | "REJECTED";
};

export type InvoiceInput = {
  description: string;
  subtotal: number;
  tax: number;
  dueOn: string;
  status: "DRAFT" | "SENT";
};

export type MessageInput = {
  body: string;
  visibility: "INTERNAL" | "EXTERNAL";
};

export type AiMessageDraftInput = {
  intent: "DOCUMENT_REQUEST" | "INVOICE_FOLLOW_UP" | "STATUS_UPDATE";
};

export type WorkflowTemplateInput = {
  visaSubclass: string;
  name: string;
  description?: string;
};

export type TenantSettingsInput = {
  brandColor: string;
  retentionYears: number;
  taxRate: number;
  privacyContactEmail?: string;
  stripeMode: string;
  docusignMode: string;
  emailProvider: string;
};

export type RetentionRequestInput = {
  clientId?: string;
  action: "EXPORT" | "ERASURE" | "ARCHIVE_REVIEW";
  reason: string;
};

export type RetentionDecisionInput = {
  status: "APPROVED" | "REJECTED" | "COMPLETED";
};

export type SignatureEnvelopeInput = {
  documentId: string;
  signerEmail: string;
};

export type SignatureWebhookInput = {
  envelopeId: string;
  status: "completed" | "declined" | "expired";
};

export type StripeWebhookInput = {
  invoiceId: string;
  eventType: string;
  status: "succeeded" | "failed";
  providerPaymentId?: string;
};

export type AuditFilters = {
  action?: string;
  actor?: string;
  entity?: string;
  from?: string;
  to?: string;
};

export type ReportExportType = "pipeline" | "revenue" | "sla" | "deadlines" | "workload";

export type AiMatterBrief = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  blockers: string[];
  nextActions: string[];
  complianceNotes: string[];
  automationSuggestions: string[];
  clientMessageDraft: string;
};

export type AiMessageDraft = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  intent: AiMessageDraftInput["intent"];
  subject: string;
  draft: string;
};

export type AiDocumentReview = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  recommendation: "VERIFY" | "REJECT" | "NEEDS_REVIEW";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  findings: string[];
  risks: string[];
  complianceNotes: string[];
  nextSteps: string[];
};

export type AiWorkflowSuggestion = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  recommendedStage: MatterStageInput["stage"];
  stageRationale: string;
  suggestedTasks: Array<{
    title: string;
    description: string;
    dueInDays: number;
    priority: "LOW" | "MEDIUM" | "HIGH";
  }>;
  suggestedChecklistItems: Array<{
    title: string;
    category: string;
    required: boolean;
    reason: string;
  }>;
  automationSuggestions: string[];
  riskFlags: string[];
};

export type AiMatterIntakePlan = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  intakeRisk: "LOW" | "MEDIUM" | "HIGH";
  recommendedVisaSubclass: string;
  summary: string;
  readinessChecks: string[];
  suggestedTasks: Array<{
    title: string;
    description: string;
    dueInDays: number;
    priority: "LOW" | "MEDIUM" | "HIGH";
  }>;
  suggestedChecklistItems: Array<{
    title: string;
    category: string;
    required: boolean;
    reason: string;
  }>;
  clientQuestions: string[];
  complianceNotes: string[];
  automationSuggestions: string[];
};

export type AiReportInsights = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  overallHealth: "LOW_RISK" | "WATCH" | "AT_RISK";
  executiveSummary: string;
  pipelineInsights: string[];
  revenueInsights: string[];
  deadlineRisks: string[];
  workloadRisks: string[];
  recommendedActions: string[];
};

export type AiComplianceReview = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  compliancePosture: "GOOD" | "WATCH" | "ACTION_REQUIRED";
  summary: string;
  privacyNotes: string[];
  retentionNotes: string[];
  documentSecurityNotes: string[];
  integrationNotes: string[];
  auditFindings: string[];
  recommendedActions: string[];
};

export type AiPortalGuidance = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  tone: "REASSURING" | "ACTION_NEEDED" | "URGENT";
  statusSummary: string;
  nextStep: string;
  outstandingItems: string[];
  paymentReminder: string;
  messageDraft: string;
  importantNotes: string[];
};

const aiMatterBriefSchema = z.object({
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  blockers: z.array(z.string()).min(1),
  nextActions: z.array(z.string()).min(1),
  complianceNotes: z.array(z.string()).min(1),
  automationSuggestions: z.array(z.string()).min(1),
  clientMessageDraft: z.string()
});

const aiMessageDraftSchema = z.object({
  subject: z.string(),
  draft: z.string()
});

const aiDocumentReviewSchema = z.object({
  recommendation: z.enum(["VERIFY", "REJECT", "NEEDS_REVIEW"]),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  findings: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  complianceNotes: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1)
});

const aiWorkflowSuggestionSchema = z.object({
  recommendedStage: z.enum(["INTAKE", "DOCUMENTS", "LODGEMENT", "CASE_OFFICER_REQUEST", "DECISION", "ARCHIVED"]),
  stageRationale: z.string(),
  suggestedTasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        dueInDays: z.number().int().min(0).max(90),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"])
      })
    )
    .min(1),
  suggestedChecklistItems: z
    .array(
      z.object({
        title: z.string(),
        category: z.string(),
        required: z.boolean(),
        reason: z.string()
      })
    )
    .min(1),
  automationSuggestions: z.array(z.string()).min(1),
  riskFlags: z.array(z.string()).min(1)
});

const aiMatterIntakePlanSchema = z.object({
  intakeRisk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  recommendedVisaSubclass: z.string(),
  summary: z.string(),
  readinessChecks: z.array(z.string()).min(1),
  suggestedTasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        dueInDays: z.number().int().min(0).max(90),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"])
      })
    )
    .min(1),
  suggestedChecklistItems: z
    .array(
      z.object({
        title: z.string(),
        category: z.string(),
        required: z.boolean(),
        reason: z.string()
      })
    )
    .min(1),
  clientQuestions: z.array(z.string()).min(1),
  complianceNotes: z.array(z.string()).min(1),
  automationSuggestions: z.array(z.string()).min(1)
});

const aiReportInsightsSchema = z.object({
  overallHealth: z.enum(["LOW_RISK", "WATCH", "AT_RISK"]),
  executiveSummary: z.string(),
  pipelineInsights: z.array(z.string()).min(1),
  revenueInsights: z.array(z.string()).min(1),
  deadlineRisks: z.array(z.string()).min(1),
  workloadRisks: z.array(z.string()).min(1),
  recommendedActions: z.array(z.string()).min(1)
});

const aiComplianceReviewSchema = z.object({
  compliancePosture: z.enum(["GOOD", "WATCH", "ACTION_REQUIRED"]),
  summary: z.string(),
  privacyNotes: z.array(z.string()).min(1),
  retentionNotes: z.array(z.string()).min(1),
  documentSecurityNotes: z.array(z.string()).min(1),
  integrationNotes: z.array(z.string()).min(1),
  auditFindings: z.array(z.string()).min(1),
  recommendedActions: z.array(z.string()).min(1)
});

const aiPortalGuidanceSchema = z.object({
  tone: z.enum(["REASSURING", "ACTION_NEEDED", "URGENT"]),
  statusSummary: z.string(),
  nextStep: z.string(),
  outstandingItems: z.array(z.string()).min(1),
  paymentReminder: z.string(),
  messageDraft: z.string(),
  importantNotes: z.array(z.string()).min(1)
});

export async function getClients() {
  return withFallback(fallbackClients as unknown, async () => {
    const clients = await prisma.client.findMany({
      where: { tenantId: defaultTenantId },
      include: {
        primaryFamilyLinks: true
      },
      orderBy: { name: "asc" }
    });

    return clients
      .filter((client) => client.email !== "emma.smith@example.com")
      .map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        dob: client.dateOfBirth.toISOString().slice(0, 10),
        nationality: client.nationality,
        passportMasked: client.passportMasked,
        consentStatus: client.consentStatus,
        conflictCheck: client.conflictCheckStatus,
        dependants: client.primaryFamilyLinks.length,
        portalActive: client.portalActive
      }));
  });
}

export async function getClientById(clientId: string) {
  return withFallback(null, async () => {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: defaultTenantId },
      include: {
        primaryFamilyLinks: {
          include: { dependantClient: true }
        },
        matters: {
          include: {
            primaryAgent: true,
            caseOfficer: true,
            tasks: true,
            invoices: true
          },
          orderBy: { openedAt: "desc" }
        }
      }
    });

    if (!client) {
      return null;
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      dob: client.dateOfBirth.toISOString().slice(0, 10),
      nationality: client.nationality,
      passportMasked: client.passportMasked,
      consentStatus: client.consentStatus,
      conflictCheck: client.conflictCheckStatus,
      dependants: client.primaryFamilyLinks.length,
      portalActive: client.portalActive,
      dependantList: client.primaryFamilyLinks.map((link) => ({
        id: link.dependantClient.id,
        name: link.dependantClient.name,
        relationship: link.relationship
      })),
      matters: client.matters.map((matter) => ({
        id: matter.id,
        title: matter.title,
        visaSubclass: matter.visaSubclass,
        stage: matter.stage,
        primaryAgent: matter.primaryAgent?.name ?? "Unassigned",
        caseOfficer: matter.caseOfficer?.name ?? "Unassigned",
        tasksOpen: matter.tasks.filter((task) => task.status !== "DONE").length,
        invoicesTotal: matter.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0)
      }))
    };
  });
}

export async function createClient(input: ClientInput, productUserId?: string) {
  const client = await prisma.client.create({
    data: {
      tenantId: defaultTenantId,
      name: input.name,
      email: input.email,
      dateOfBirth: new Date(input.dateOfBirth),
      nationality: input.nationality,
      passportEncrypted: `encrypted:${input.passportNumber ?? ""}`,
      passportMasked: maskPassport(input.passportNumber ?? ""),
      consentStatus: input.consentStatus,
      conflictCheckStatus: input.conflictCheckStatus,
      portalActive: input.portalActive
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "client.created",
    entityType: "Client",
    entityId: client.id,
    metadata: { name: client.name, email: client.email }
  });

  return getClientById(client.id);
}

export async function updateClient(clientId: string, input: ClientInput, productUserId?: string) {
  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      name: input.name,
      email: input.email,
      dateOfBirth: new Date(input.dateOfBirth),
      nationality: input.nationality,
      ...(input.passportNumber
        ? {
            passportEncrypted: `encrypted:${input.passportNumber}`,
            passportMasked: maskPassport(input.passportNumber)
          }
        : {}),
      consentStatus: input.consentStatus,
      conflictCheckStatus: input.conflictCheckStatus,
      portalActive: input.portalActive
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "client.updated",
    entityType: "Client",
    entityId: client.id,
    metadata: { name: client.name, email: client.email }
  });

  return getClientById(client.id);
}

export async function getMatters() {
  return withFallback(fallbackMatters as unknown, async () => {
    const matters = await prisma.matter.findMany({
      where: { tenantId: defaultTenantId },
      include: {
        client: true,
        primaryAgent: true,
        caseOfficer: true,
        tasks: true,
        checklistItems: true,
        keyDates: { orderBy: { date: "asc" }, take: 1 },
        documents: {
          include: {
            uploadedBy: true,
            verifiedBy: true
          },
          orderBy: { updatedAt: "desc" }
        },
        invoices: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { openedAt: "desc" }
    });

    return matters.map((matter) => {
      const tasksOpen = matter.tasks.filter((task) => task.status !== "DONE").length;

      return {
        id: matter.id,
        clientId: matter.clientId,
        clientName: matter.client.name,
        visaSubclass: matter.visaSubclass,
        title: matter.title,
        stage: matter.stage,
        progress: progressForStage(matter.stage),
        primaryAgent: matter.primaryAgent?.name ?? "Unassigned",
        caseOfficer: matter.caseOfficer?.name ?? "Unassigned",
        trn: matter.trn,
        keyDate: matter.keyDates[0]?.date.toISOString().slice(0, 10) ?? "Not set",
        tasksOpen,
        tasksTotal: matter.tasks.length || 1,
        documents: [
          ...matter.documents.map((document) => ({
            id: document.id,
            title: document.title,
            status: document.status,
            fileType: document.fileType,
            uploadedBy: document.uploadedBy?.name ?? "Pending",
            verifiedBy: document.verifiedBy?.name ?? null,
            updatedAt: document.updatedAt.toISOString().slice(0, 10),
            scanStatus: document.scanStatus,
            storageProvider: document.storageProvider
          })),
          ...matter.checklistItems
            .filter((item) => !matter.documents.some((document) => document.checklistItemId === item.id))
            .map((item) => ({
              id: item.id,
              title: item.title,
              status: item.status,
              fileType: "PDF",
              uploadedBy: "Pending",
              verifiedBy: null,
              updatedAt: item.updatedAt.toISOString().slice(0, 10),
              scanStatus: "PENDING",
              storageProvider: "local"
            }))
        ],
        invoices: matter.invoices.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          clientName: matter.client.name,
          matterId: invoice.matterId,
          amount: Number(invoice.total),
          status: invoice.status,
          dueOn: invoice.dueOn.toISOString().slice(0, 10)
        }))
      };
    });
  });
}

export async function getMatterById(matterId: string) {
  return withFallback(null, async () => {
    const matter = await prisma.matter.findFirst({
      where: { id: matterId, tenantId: defaultTenantId },
      include: {
        client: true,
        primaryAgent: true,
        caseOfficer: true,
        keyDates: { orderBy: { date: "asc" } },
        tasks: {
          include: { assignee: true },
          orderBy: { dueOn: "asc" }
        },
        checklistItems: {
          include: {
            verifiedBy: true,
            documents: {
              orderBy: { updatedAt: "desc" }
            }
          },
          orderBy: { dueOn: "asc" }
        },
        documents: {
          include: {
            uploadedBy: true,
            verifiedBy: true
          },
          orderBy: { updatedAt: "desc" }
        },
        invoices: {
          orderBy: { createdAt: "desc" }
        },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!matter) {
      return null;
    }

    return {
      id: matter.id,
      clientId: matter.clientId,
      clientName: matter.client.name,
      visaSubclass: matter.visaSubclass,
      title: matter.title,
      stage: matter.stage,
      progress: progressForStage(matter.stage),
      primaryAgent: matter.primaryAgent?.name ?? "Unassigned",
      caseOfficer: matter.caseOfficer?.name ?? "Unassigned",
      trn: matter.trn,
      keyDate: matter.keyDates[0]?.date.toISOString().slice(0, 10) ?? "Not set",
      tasksOpen: matter.tasks.filter((task) => task.status !== "DONE").length,
      tasksTotal: matter.tasks.length || 1,
      tasks: matter.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueOn: task.dueOn.toISOString().slice(0, 10),
        assignee: task.assignee?.name ?? "Unassigned",
        completedAt: task.completedAt?.toISOString() ?? null
      })),
      checklistItems: matter.checklistItems.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        status: item.status,
        required: item.required,
        dueOn: item.dueOn?.toISOString().slice(0, 10) ?? null,
        verifiedBy: item.verifiedBy?.name ?? null,
        verifiedAt: item.verifiedAt?.toISOString() ?? null,
        documentCount: item.documents.length
      })),
      documents: matter.documents.map((document) => ({
        id: document.id,
        title: document.title,
        status: document.status,
        fileType: document.fileType,
        uploadedBy: document.uploadedBy?.name ?? "Pending",
        verifiedBy: document.verifiedBy?.name ?? null,
        updatedAt: document.updatedAt.toISOString().slice(0, 10),
        scanStatus: document.scanStatus,
        scanMessage: document.scanMessage,
        scannedAt: document.scannedAt?.toISOString() ?? null,
        storageProvider: document.storageProvider,
        storageKey: document.storageKey,
        checksum: document.checksum,
        verifiedAt: document.verifiedAt?.toISOString() ?? null
      })),
      invoices: matter.invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        clientName: matter.client.name,
        matterId: invoice.matterId,
        amount: Number(invoice.total),
        status: invoice.status,
        dueOn: invoice.dueOn.toISOString().slice(0, 10)
      })),
      messages: matter.messages.map((message) => ({
        id: message.id,
        sender: message.sender?.name ?? "System",
        body: message.body,
        visibility: message.visibility,
        createdAt: message.createdAt.toISOString()
      }))
    };
  });
}

export async function generateMatterAiBrief(matterId: string, productUserId?: string): Promise<AiMatterBrief> {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId },
    include: {
      client: true,
      primaryAgent: true,
      caseOfficer: true,
      keyDates: { orderBy: { date: "asc" } },
      tasks: {
        include: { assignee: true },
        orderBy: { dueOn: "asc" }
      },
      checklistItems: {
        include: { documents: true },
        orderBy: { dueOn: "asc" }
      },
      documents: {
        include: { verifiedBy: true },
        orderBy: { updatedAt: "desc" }
      },
      invoices: {
        include: { payments: true },
        orderBy: { dueOn: "asc" }
      },
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "desc" },
        take: 3
      }
    }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const today = new Date();
  const openTasks = matter.tasks.filter((task) => task.status !== "DONE");
  const overdueTasks = openTasks.filter((task) => task.dueOn < today);
  const missingChecklist = matter.checklistItems.filter((item) =>
    ["REQUESTED", "REJECTED"].includes(item.status)
  );
  const unverifiedDocuments = matter.documents.filter((document) => document.status !== "VERIFIED");
  const infectedDocuments = matter.documents.filter((document) => document.scanStatus === "INFECTED");
  const unpaidInvoices = matter.invoices.filter((invoice) => invoice.status !== "PAID");
  const upcomingKeyDates = matter.keyDates.filter((keyDate) => {
    const daysAway = daysBetween(today, keyDate.date);
    return daysAway >= 0 && daysAway <= 30;
  });

  const blockers = [
    ...overdueTasks.map((task) => `Overdue task: ${task.title} assigned to ${task.assignee?.name ?? "Unassigned"}.`),
    ...missingChecklist.map((item) => `${item.title} is ${item.status.toLowerCase()} and still needs attention.`),
    ...infectedDocuments.map((document) => `${document.title} failed mock virus scanning and cannot be verified.`),
    ...unpaidInvoices.map((invoice) => `${invoice.number} is ${invoice.status.toLowerCase()} for $${Number(invoice.total).toFixed(2)}.`)
  ];

  const riskLevel: AiMatterBrief["riskLevel"] =
    infectedDocuments.length || overdueTasks.length > 2 || missingChecklist.length > 3
      ? "HIGH"
      : overdueTasks.length || missingChecklist.length || unpaidInvoices.length
        ? "MEDIUM"
        : "LOW";

  const nextActions = [
    missingChecklist[0] ? `Request or resolve ${missingChecklist[0].title}.` : null,
    unverifiedDocuments[0] ? `Review ${unverifiedDocuments[0].title} and verify or reject it.` : null,
    overdueTasks[0] ? `Follow up on overdue task ${overdueTasks[0].title}.` : null,
    unpaidInvoices[0] ? `Send payment reminder for ${unpaidInvoices[0].number}.` : null,
    upcomingKeyDates[0] ? `Prepare for ${upcomingKeyDates[0].label} due ${upcomingKeyDates[0].date.toISOString().slice(0, 10)}.` : null
  ].filter(Boolean) as string[];

  if (!nextActions.length) {
    nextActions.push("Matter is on track. Continue monitoring messages, key dates, and final document verification.");
  }

  const complianceNotes = [
    matter.client.consentStatus === "SIGNED"
      ? "Client consent is recorded."
      : "Client consent is not signed; do not proceed with substantive action until resolved.",
    matter.client.conflictCheckStatus === "CLEAR"
      ? "Conflict check is clear."
      : `Conflict check is ${matter.client.conflictCheckStatus.toLowerCase()} and should be reviewed.`,
    unverifiedDocuments.length
      ? `${unverifiedDocuments.length} document(s) still need verification with user and timestamp evidence.`
      : "All uploaded documents are verified or no documents are pending review.",
    "Audit logging is active for matter, document, billing, and compliance actions."
  ];

  const automationSuggestions = [
    missingChecklist.length
      ? `Create a client reminder for ${missingChecklist.length} outstanding checklist item(s).`
      : null,
    overdueTasks.length ? `Create a manager escalation for ${overdueTasks.length} overdue task(s).` : null,
    upcomingKeyDates.length ? "Schedule deadline reminders at 14 days and 7 days before the next key date." : null,
    unpaidInvoices.length ? "Queue an overdue/payment reminder workflow for unpaid invoices." : null,
    matter.stage === "DOCUMENTS" && !missingChecklist.length ? "Suggest moving the matter to lodgement review." : null
  ].filter(Boolean) as string[];

  if (!automationSuggestions.length) {
    automationSuggestions.push("No urgent automation suggested; keep the standard visa workflow active.");
  }

  const summary = [
    `${matter.title} for ${matter.client.name} is currently in ${matter.stage.replaceAll("_", " ").toLowerCase()} stage.`,
    `${openTasks.length} open task(s), ${missingChecklist.length} outstanding checklist item(s), and ${unpaidInvoices.length} unpaid invoice(s) were found.`,
    `Risk is ${riskLevel.toLowerCase()} based on deadlines, document status, scan results, and billing state.`
  ].join(" ");

  const clientMessageDraft = [
    `Hi ${matter.client.name.split(" ")[0] ?? matter.client.name},`,
    "",
    missingChecklist.length
      ? `We are progressing your ${matter.visaSubclass} matter and need your help with: ${missingChecklist
          .slice(0, 3)
          .map((item) => item.title)
          .join(", ")}.`
      : `Your ${matter.visaSubclass} matter is progressing and we are reviewing the current file status.`,
    unpaidInvoices.length ? ` Please also review the outstanding invoice ${unpaidInvoices[0]?.number}.` : "",
    "",
    "Please upload the requested items or reply if you need clarification.",
    "",
    "Kind regards,",
    matter.primaryAgent?.name ?? "ASUN Migrations"
  ].join("\n");

  const localBrief: AiMatterBrief = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    riskLevel,
    summary,
    blockers: blockers.length ? blockers : ["No critical blockers detected from the current matter data."],
    nextActions,
    complianceNotes,
    automationSuggestions,
    clientMessageDraft
  };

  const matterContext = {
    matter: {
      title: matter.title,
      visaSubclass: matter.visaSubclass,
      stage: matter.stage,
      trn: matter.trn,
      primaryAgent: matter.primaryAgent?.name ?? "Unassigned",
      caseOfficer: matter.caseOfficer?.name ?? "Unassigned"
    },
    client: {
      name: matter.client.name,
      consentStatus: matter.client.consentStatus,
      conflictCheckStatus: matter.client.conflictCheckStatus,
      portalActive: matter.client.portalActive
    },
    tasks: matter.tasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueOn: task.dueOn.toISOString().slice(0, 10),
      assignee: task.assignee?.name ?? "Unassigned"
    })),
    checklistItems: matter.checklistItems.map((item) => ({
      title: item.title,
      status: item.status,
      required: item.required,
      dueOn: item.dueOn?.toISOString().slice(0, 10) ?? null,
      documentCount: item.documents.length
    })),
    documents: matter.documents.map((document) => ({
      title: document.title,
      status: document.status,
      fileType: document.fileType,
      scanStatus: document.scanStatus,
      verifiedBy: document.verifiedBy?.name ?? null
    })),
    invoices: matter.invoices.map((invoice) => ({
      number: invoice.number,
      status: invoice.status,
      total: Number(invoice.total),
      dueOn: invoice.dueOn.toISOString().slice(0, 10)
    })),
    keyDates: matter.keyDates.map((keyDate) => ({
      label: keyDate.label,
      date: keyDate.date.toISOString().slice(0, 10)
    })),
    recentMessages: matter.messages.map((message) => ({
      sender: message.sender?.name ?? "System",
      visibility: message.visibility,
      body: message.body
    })),
    deterministicBaseline: localBrief
  };

  const openAiBrief = await maybeGenerateOpenAiMatterBrief(matterContext);
  const selectedBrief = openAiBrief ?? localBrief;

  await writeAuditEvent({
    productUserId,
    action: "ai.matter_brief_generated",
    entityType: "Matter",
    entityId: matter.id,
    metadata: {
      name: matter.title,
      provider: selectedBrief.provider,
      model: selectedBrief.model,
      riskLevel: selectedBrief.riskLevel
    }
  });

  return selectedBrief;
}

async function maybeGenerateOpenAiMatterBrief(matterContext: unknown): Promise<AiMatterBrief | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI casework assistant for an Australian migration-agency CRM.",
            "Generate practical operational guidance from the supplied CRM JSON.",
            "Do not invent facts, legislation, dates, payments, or documents.",
            "Keep advice workflow-focused, compliance-aware, and suitable for staff review.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(matterContext)
        }
      ],
      text: {
        format: zodTextFormat(aiMatterBriefSchema, "matter_brief")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI matter brief generation failed; using local fallback.", error);
    return null;
  }
}

export async function generateWorkflowSuggestions(
  matterId: string,
  productUserId?: string
): Promise<AiWorkflowSuggestion> {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId },
    include: {
      client: true,
      primaryAgent: true,
      caseOfficer: true,
      keyDates: { orderBy: { date: "asc" } },
      tasks: {
        include: { assignee: true },
        orderBy: { dueOn: "asc" }
      },
      checklistItems: {
        include: { documents: true },
        orderBy: { dueOn: "asc" }
      },
      documents: {
        include: { verifiedBy: true },
        orderBy: { updatedAt: "desc" }
      },
      invoices: {
        include: { payments: true },
        orderBy: { dueOn: "asc" }
      },
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "desc" },
        take: 3
      }
    }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const today = new Date();
  const openTasks = matter.tasks.filter((task) => task.status !== "DONE");
  const overdueTasks = openTasks.filter((task) => task.dueOn < today);
  const incompleteChecklist = matter.checklistItems.filter((item) => item.status !== "VERIFIED");
  const requestedOrRejectedChecklist = matter.checklistItems.filter((item) =>
    ["REQUESTED", "REJECTED"].includes(item.status)
  );
  const unverifiedDocuments = matter.documents.filter((document) => document.status !== "VERIFIED");
  const rejectedDocuments = matter.documents.filter((document) => document.status === "REJECTED");
  const infectedDocuments = matter.documents.filter((document) => document.scanStatus === "INFECTED");
  const unpaidInvoices = matter.invoices.filter((invoice) => invoice.status !== "PAID");
  const upcomingKeyDates = matter.keyDates.filter((keyDate) => {
    const daysAway = daysBetween(today, keyDate.date);
    return daysAway >= 0 && daysAway <= 30;
  });
  const sameTitleDocuments = matter.documents.filter((document, _index, documents) =>
    documents.some((item) => item.id !== document.id && item.title.toLowerCase() === document.title.toLowerCase())
  );
  const hasConflictingDocuments = sameTitleDocuments.some((document) =>
    sameTitleDocuments.some(
      (item) => item.id !== document.id && item.title.toLowerCase() === document.title.toLowerCase() && item.status !== document.status
    )
  );

  const recommendedStage: MatterStageInput["stage"] =
    matter.client.consentStatus !== "SIGNED" || matter.client.conflictCheckStatus !== "CLEAR"
      ? "INTAKE"
      : incompleteChecklist.length || unverifiedDocuments.length || hasConflictingDocuments
        ? "DOCUMENTS"
        : matter.stage === "DECISION" || matter.stage === "ARCHIVED"
          ? matter.stage
          : "LODGEMENT";

  const suggestedTasks: AiWorkflowSuggestion["suggestedTasks"] = [
    hasConflictingDocuments
      ? {
          title: "Resolve conflicting document versions",
          description: "Review same-title uploads with mixed verification statuses and confirm the file to rely on.",
          dueInDays: 1,
          priority: "HIGH" as const
        }
      : null,
    rejectedDocuments[0]
      ? {
          title: `Replace rejected ${rejectedDocuments[0].title}`,
          description: "Ask the client for a corrected file or document a staff reason if the rejection stands.",
          dueInDays: 2,
          priority: "HIGH" as const
        }
      : null,
    requestedOrRejectedChecklist[0]
      ? {
          title: `Follow up ${requestedOrRejectedChecklist[0].title}`,
          description: "Confirm whether the requested checklist item is still required and send a client reminder if needed.",
          dueInDays: 3,
          priority: "MEDIUM" as const
        }
      : null,
    unpaidInvoices[0]
      ? {
          title: `Follow up ${unpaidInvoices[0].number}`,
          description: "Send a payment reminder or confirm whether finance should resend the invoice.",
          dueInDays: 3,
          priority: "MEDIUM" as const
        }
      : null,
    overdueTasks[0]
      ? {
          title: `Escalate overdue task: ${overdueTasks[0].title}`,
          description: "Review the overdue task owner and decide whether reassignment or escalation is needed.",
          dueInDays: 1,
          priority: "HIGH" as const
        }
      : null,
    !incompleteChecklist.length && !unverifiedDocuments.length
      ? {
          title: "Prepare lodgement readiness review",
          description: "Run a final file completeness check before moving the matter toward lodgement.",
          dueInDays: 2,
          priority: "MEDIUM" as const
        }
      : null
  ].filter(Boolean) as AiWorkflowSuggestion["suggestedTasks"];

  if (!suggestedTasks.length) {
    suggestedTasks.push({
      title: "Continue matter monitoring",
      description: "No urgent workflow changes detected; monitor portal uploads, messages, and key dates.",
      dueInDays: 7,
      priority: "LOW"
    });
  }

  const suggestedChecklistItems: AiWorkflowSuggestion["suggestedChecklistItems"] = [
    hasConflictingDocuments
      ? {
          title: "Confirmed final document version",
          category: "QUALITY_CHECK",
          required: true,
          reason: "Duplicate or same-title documents have conflicting statuses and need a final record."
        }
      : null,
    matter.checklistItems.length === 0
      ? {
          title: "Identity evidence",
          category: "IDENTITY",
          required: true,
          reason: "The matter has no checklist items yet, so baseline identity evidence should be tracked."
        }
      : null,
    !incompleteChecklist.length
      ? {
          title: "Final pre-lodgement review",
          category: "LODGEMENT",
          required: true,
          reason: "Current checklist items appear complete and should be reviewed before lodgement."
        }
      : null,
    upcomingKeyDates[0]
      ? {
          title: `${upcomingKeyDates[0].label} readiness evidence`,
          category: "DEADLINE",
          required: true,
          reason: `A key date is approaching on ${upcomingKeyDates[0].date.toISOString().slice(0, 10)}.`
        }
      : null
  ].filter(Boolean) as AiWorkflowSuggestion["suggestedChecklistItems"];

  if (!suggestedChecklistItems.length) {
    suggestedChecklistItems.push({
      title: "Matter progress review",
      category: "GENERAL",
      required: false,
      reason: "Use this as a lightweight checkpoint if staff want an extra audit trail for the next review."
    });
  }

  const automationSuggestions = [
    requestedOrRejectedChecklist.length
      ? `Schedule a client document reminder for ${requestedOrRejectedChecklist.length} outstanding checklist item(s).`
      : null,
    unpaidInvoices.length ? `Trigger a payment follow-up workflow for ${unpaidInvoices[0]?.number}.` : null,
    upcomingKeyDates.length ? "Create 14-day and 7-day deadline reminders for the next key date." : null,
    hasConflictingDocuments ? "Flag duplicate document titles with mixed statuses for manual review." : null,
    openTasks.length ? "Create a weekly staff digest for open task owners." : null
  ].filter(Boolean) as string[];

  if (!automationSuggestions.length) {
    automationSuggestions.push("Keep the standard visa workflow active; no new automation is urgent.");
  }

  const riskFlags = [
    matter.client.consentStatus !== "SIGNED" ? "Client consent is not signed." : null,
    matter.client.conflictCheckStatus !== "CLEAR" ? "Conflict check is not clear." : null,
    infectedDocuments.length ? `${infectedDocuments.length} document(s) failed mock virus scanning.` : null,
    hasConflictingDocuments ? "Same-title documents have conflicting verification statuses." : null,
    requestedOrRejectedChecklist.length ? `${requestedOrRejectedChecklist.length} checklist item(s) remain requested or rejected.` : null,
    unpaidInvoices.length ? `${unpaidInvoices.length} invoice(s) are not paid.` : null,
    upcomingKeyDates.length ? `Key date ${upcomingKeyDates[0]?.label} is within 30 days.` : null
  ].filter(Boolean) as string[];

  if (!riskFlags.length) {
    riskFlags.push("No critical workflow risk detected from the current matter data.");
  }

  const localSuggestion: AiWorkflowSuggestion = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    recommendedStage,
    stageRationale:
      recommendedStage === matter.stage
        ? `Keep the matter in ${matter.stage.replaceAll("_", " ").toLowerCase()} because current records still require staff review.`
        : `Recommend ${recommendedStage.replaceAll("_", " ").toLowerCase()} based on consent, conflict, document, checklist, invoice, and key-date signals.`,
    suggestedTasks,
    suggestedChecklistItems,
    automationSuggestions,
    riskFlags
  };

  const context = {
    matter: {
      title: matter.title,
      visaSubclass: matter.visaSubclass,
      stage: matter.stage,
      primaryAgent: matter.primaryAgent?.name ?? "Unassigned",
      caseOfficer: matter.caseOfficer?.name ?? "Unassigned"
    },
    client: {
      name: matter.client.name,
      consentStatus: matter.client.consentStatus,
      conflictCheckStatus: matter.client.conflictCheckStatus,
      portalActive: matter.client.portalActive
    },
    tasks: matter.tasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueOn: task.dueOn.toISOString().slice(0, 10),
      assignee: task.assignee?.name ?? "Unassigned"
    })),
    checklistItems: matter.checklistItems.map((item) => ({
      title: item.title,
      category: item.category,
      status: item.status,
      required: item.required,
      dueOn: item.dueOn?.toISOString().slice(0, 10) ?? null,
      documentCount: item.documents.length
    })),
    documents: matter.documents.map((document) => ({
      title: document.title,
      status: document.status,
      scanStatus: document.scanStatus,
      verifiedBy: document.verifiedBy?.name ?? null
    })),
    invoices: matter.invoices.map((invoice) => ({
      number: invoice.number,
      status: invoice.status,
      total: Number(invoice.total),
      dueOn: invoice.dueOn.toISOString().slice(0, 10)
    })),
    keyDates: matter.keyDates.map((keyDate) => ({
      label: keyDate.label,
      date: keyDate.date.toISOString().slice(0, 10)
    })),
    recentMessages: matter.messages.map((message) => ({
      sender: message.sender?.name ?? "System",
      visibility: message.visibility,
      body: message.body
    })),
    deterministicBaseline: localSuggestion
  };

  const openAiSuggestion = await maybeGenerateOpenAiWorkflowSuggestions(context);
  const selectedSuggestion = openAiSuggestion ?? localSuggestion;

  await writeAuditEvent({
    productUserId,
    action: "ai.workflow_suggestions_generated",
    entityType: "Matter",
    entityId: matter.id,
    metadata: {
      name: matter.title,
      provider: selectedSuggestion.provider,
      model: selectedSuggestion.model,
      recommendedStage: selectedSuggestion.recommendedStage
    }
  });

  return selectedSuggestion;
}

async function maybeGenerateOpenAiWorkflowSuggestions(context: unknown): Promise<AiWorkflowSuggestion | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI workflow planning assistant for an Australian migration-agency CRM.",
            "Use only the supplied CRM JSON and deterministic baseline.",
            "Suggest staff-reviewable workflow actions only; do not auto-create tasks, checklist items, stages, or legal advice.",
            "Prioritize compliance, auditability, document completeness, billing state, deadline risk, and client communication.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiWorkflowSuggestionSchema, "workflow_suggestions")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI workflow suggestion generation failed; using local fallback.", error);
    return null;
  }
}

export async function generateMatterIntakePlan(
  input: MatterIntakePlanInput,
  productUserId?: string
): Promise<AiMatterIntakePlan> {
  const [client, template] = await Promise.all([
    prisma.client.findFirst({
      where: { id: input.clientId, tenantId: defaultTenantId },
      include: {
        matters: {
          include: { tasks: true, checklistItems: true },
          orderBy: { openedAt: "desc" }
        }
      }
    }),
    prisma.workflowTemplate.findFirst({
      where: { id: input.templateId, tenantId: defaultTenantId, active: true },
      include: { items: { orderBy: { dueOffsetDays: "asc" } } }
    })
  ]);

  if (!client) {
    throw new Error("Client not found");
  }

  if (!template) {
    throw new Error("Workflow template not found");
  }

  const targetDate = new Date(input.keyDate);
  if (Number.isNaN(targetDate.valueOf())) {
    throw new Error("Invalid target lodgement date");
  }

  const daysToLodgement = daysBetween(new Date(), targetDate);
  const templateTasks = template.items.filter((item) => item.type === "TASK");
  const templateChecklist = template.items.filter((item) => item.type === "CHECKLIST");
  const priorSubclassMatter = client.matters.find((matter) => matter.visaSubclass === template.visaSubclass);
  const intakeRisk: AiMatterIntakePlan["intakeRisk"] =
    client.conflictCheckStatus !== "CLEAR" || daysToLodgement < 14
      ? "HIGH"
      : client.consentStatus !== "SIGNED" || priorSubclassMatter
        ? "MEDIUM"
        : "LOW";

  const suggestedTasks: AiMatterIntakePlan["suggestedTasks"] = [
    client.consentStatus !== "SIGNED"
      ? {
          title: "Obtain signed engagement consent",
          description: "Confirm the engagement letter is signed before substantive migration advice or lodgement work continues.",
          dueInDays: 1,
          priority: "HIGH" as const
        }
      : null,
    client.conflictCheckStatus !== "CLEAR"
      ? {
          title: "Resolve conflict check before acting",
          description: "Escalate the conflict outcome and record the decision before creating active casework.",
          dueInDays: 1,
          priority: "HIGH" as const
        }
      : null,
    daysToLodgement <= 30
      ? {
          title: "Confirm lodgement feasibility",
          description: "Review whether the target lodgement date is realistic against document and evidence requirements.",
          dueInDays: 1,
          priority: "HIGH" as const
        }
      : null,
    ...templateTasks.slice(0, 3).map((item) => ({
      title: item.title,
      description: item.description ?? "Template task recommended for this visa workflow.",
      dueInDays: item.dueOffsetDays,
      priority: item.dueOffsetDays <= 3 ? ("HIGH" as const) : item.dueOffsetDays <= 10 ? ("MEDIUM" as const) : ("LOW" as const)
    }))
  ].filter(Boolean) as AiMatterIntakePlan["suggestedTasks"];

  if (!suggestedTasks.length) {
    suggestedTasks.push({
      title: "Run initial matter review",
      description: "Review the client profile, selected visa subclass, target date, and required evidence.",
      dueInDays: 2,
      priority: "MEDIUM"
    });
  }

  const suggestedChecklistItems: AiMatterIntakePlan["suggestedChecklistItems"] = [
    {
      title: "Signed engagement letter",
      category: "COMPLIANCE",
      required: true,
      reason: "MARA-aligned records should show consent before acting."
    },
    ...templateChecklist.slice(0, 5).map((item) => ({
      title: item.title,
      category: item.stage,
      required: item.required,
      reason: item.description ?? "Template evidence requirement for the selected visa workflow."
    })),
    priorSubclassMatter
      ? {
          title: "Prior matter cross-check",
          category: "CONFLICTS",
          required: true,
          reason: `Client already has a ${template.visaSubclass} matter record, so staff should check duplication or related history.`
        }
      : null
  ].filter(Boolean) as AiMatterIntakePlan["suggestedChecklistItems"];

  const readinessChecks = [
    client.consentStatus === "SIGNED"
      ? "Client consent is signed."
      : "Client consent is not signed and must be resolved before acting.",
    client.conflictCheckStatus === "CLEAR"
      ? "Conflict check is clear."
      : `Conflict check is ${client.conflictCheckStatus.toLowerCase()} and needs staff review.`,
    daysToLodgement >= 30
      ? `Target lodgement date gives ${daysToLodgement} day(s) for intake and evidence collection.`
      : `Target lodgement date is close, with ${Math.max(daysToLodgement, 0)} day(s) remaining.`,
    `${templateChecklist.length} checklist item(s) and ${templateTasks.length} task(s) are available from the selected template.`
  ];

  const localPlan: AiMatterIntakePlan = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    intakeRisk,
    recommendedVisaSubclass: template.visaSubclass,
    summary: `${template.name} is suitable as the intake baseline for ${client.name}. Intake risk is ${intakeRisk.toLowerCase()} based on consent, conflict status, prior matters, target date, and template readiness.`,
    readinessChecks,
    suggestedTasks,
    suggestedChecklistItems,
    clientQuestions: [
      "Can you confirm the target lodgement date still reflects your timing requirement?",
      "Are there any dependants, sponsors, or related applicants that should be linked before lodgement?",
      "Do you have updated identity, health, character, and employment evidence ready to upload?"
    ],
    complianceNotes: [
      "Do not treat this intake plan as legal advice; staff must review and approve the workflow.",
      "Keep consent, conflict checks, client instructions, and document requests auditable.",
      "Sensitive identifiers should remain masked or encrypted according to the agency privacy settings."
    ],
    automationSuggestions: [
      "Invite the client to the portal after the matter is created.",
      "Schedule document reminders from template due offsets.",
      "Create deadline reminders at 30, 14, and 7 days before target lodgement."
    ]
  };

  const context = {
    selectedClient: {
      name: client.name,
      nationality: client.nationality,
      consentStatus: client.consentStatus,
      conflictCheckStatus: client.conflictCheckStatus,
      portalActive: client.portalActive,
      existingMatters: client.matters.map((matter) => ({
        title: matter.title,
        visaSubclass: matter.visaSubclass,
        stage: matter.stage,
        openTasks: matter.tasks.filter((task) => task.status !== "DONE").length,
        checklistItems: matter.checklistItems.length
      }))
    },
    selectedTemplate: {
      visaSubclass: template.visaSubclass,
      name: template.name,
      description: template.description,
      items: template.items.map((item) => ({
        type: item.type,
        title: item.title,
        description: item.description,
        stage: item.stage,
        dueOffsetDays: item.dueOffsetDays,
        required: item.required
      }))
    },
    targetLodgementDate: input.keyDate,
    deterministicBaseline: localPlan
  };

  const openAiPlan = await maybeGenerateOpenAiMatterIntakePlan(context);
  const selectedPlan = openAiPlan ?? localPlan;

  await writeAuditEvent({
    productUserId,
    action: "ai.matter_intake_plan_generated",
    entityType: "Client",
    entityId: client.id,
    metadata: {
      name: client.name,
      provider: selectedPlan.provider,
      model: selectedPlan.model,
      visaSubclass: selectedPlan.recommendedVisaSubclass,
      intakeRisk: selectedPlan.intakeRisk
    }
  });

  return selectedPlan;
}

async function maybeGenerateOpenAiMatterIntakePlan(context: unknown): Promise<AiMatterIntakePlan | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI intake planning assistant for an Australian migration-agency CRM.",
            "Use only the supplied client, workflow template, target lodgement date, and deterministic baseline.",
            "Suggest a staff-reviewable intake plan. Do not provide legal advice, eligibility findings, or invented facts.",
            "Focus on workflow readiness, compliance records, evidence collection, client questions, and automation opportunities.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiMatterIntakePlanSchema, "matter_intake_plan")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI matter intake plan generation failed; using local fallback.", error);
    return null;
  }
}

export async function generateMatterMessageDraft(
  matterId: string,
  input: AiMessageDraftInput,
  productUserId?: string
): Promise<AiMessageDraft> {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId },
    include: {
      client: true,
      primaryAgent: true,
      caseOfficer: true,
      keyDates: { orderBy: { date: "asc" } },
      tasks: { include: { assignee: true }, orderBy: { dueOn: "asc" } },
      checklistItems: { include: { documents: true }, orderBy: { dueOn: "asc" } },
      documents: { include: { verifiedBy: true }, orderBy: { updatedAt: "desc" } },
      invoices: { orderBy: { dueOn: "asc" } },
      messages: { include: { sender: true }, orderBy: { createdAt: "desc" }, take: 3 }
    }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const missingChecklist = matter.checklistItems.filter((item) =>
    ["REQUESTED", "REJECTED"].includes(item.status)
  );
  const unpaidInvoices = matter.invoices.filter((invoice) => invoice.status !== "PAID");
  const openTasks = matter.tasks.filter((task) => task.status !== "DONE");
  const firstName = matter.client.name.split(" ")[0] ?? matter.client.name;
  const localSubject =
    input.intent === "INVOICE_FOLLOW_UP"
      ? `Invoice follow-up for ${matter.title}`
      : input.intent === "DOCUMENT_REQUEST"
        ? `Documents requested for ${matter.title}`
        : `Status update for ${matter.title}`;
  const localDraft = [
    `Hi ${firstName},`,
    "",
    input.intent === "INVOICE_FOLLOW_UP"
      ? `We are progressing your ${matter.visaSubclass} matter and noticed ${unpaidInvoices[0]?.number ?? "an invoice"} is still awaiting payment. Please review it when convenient, or reply if you need it resent.`
      : input.intent === "DOCUMENT_REQUEST"
        ? `We are progressing your ${matter.visaSubclass} matter and need your help with: ${missingChecklist
            .slice(0, 3)
            .map((item) => item.title)
            .join(", ") || "the requested documents"}. Please upload the requested item(s) through the portal.`
        : `We are currently reviewing your ${matter.visaSubclass} matter. The file is in ${matter.stage.replaceAll("_", " ").toLowerCase()} stage, with ${openTasks.length} open task(s) and ${missingChecklist.length} outstanding checklist item(s).`,
    "",
    "Kind regards,",
    matter.primaryAgent?.name ?? "ASUN Migrations"
  ].join("\n");

  const localDraftResult: AiMessageDraft = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    intent: input.intent,
    subject: localSubject,
    draft: localDraft
  };

  const context = {
    intent: input.intent,
    matter: {
      title: matter.title,
      visaSubclass: matter.visaSubclass,
      stage: matter.stage,
      primaryAgent: matter.primaryAgent?.name ?? "Unassigned",
      caseOfficer: matter.caseOfficer?.name ?? "Unassigned"
    },
    client: {
      name: matter.client.name,
      consentStatus: matter.client.consentStatus,
      conflictCheckStatus: matter.client.conflictCheckStatus
    },
    checklistItems: matter.checklistItems.map((item) => ({
      title: item.title,
      status: item.status,
      documentCount: item.documents.length,
      dueOn: item.dueOn?.toISOString().slice(0, 10) ?? null
    })),
    documents: matter.documents.map((document) => ({
      title: document.title,
      status: document.status,
      scanStatus: document.scanStatus,
      verifiedBy: document.verifiedBy?.name ?? null
    })),
    invoices: matter.invoices.map((invoice) => ({
      number: invoice.number,
      status: invoice.status,
      total: Number(invoice.total),
      dueOn: invoice.dueOn.toISOString().slice(0, 10)
    })),
    tasks: matter.tasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueOn: task.dueOn.toISOString().slice(0, 10)
    })),
    recentMessages: matter.messages.map((message) => ({
      sender: message.sender?.name ?? "System",
      visibility: message.visibility,
      body: message.body
    }))
  };

  const openAiDraft = await maybeGenerateOpenAiMessageDraft(context, input.intent);
  const selectedDraft = openAiDraft ?? localDraftResult;

  await writeAuditEvent({
    productUserId,
    action: "ai.message_draft_generated",
    entityType: "Matter",
    entityId: matter.id,
    metadata: {
      name: matter.title,
      provider: selectedDraft.provider,
      model: selectedDraft.model,
      intent: selectedDraft.intent
    }
  });

  return selectedDraft;
}

async function maybeGenerateOpenAiMessageDraft(
  context: unknown,
  intent: AiMessageDraftInput["intent"]
): Promise<AiMessageDraft | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You draft concise, professional client-facing messages for an Australian migration-agency CRM.",
            "Use only the supplied CRM facts. Do not provide legal advice or invent missing details.",
            "Keep the message warm, clear, and suitable for staff review before sending.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiMessageDraftSchema, "message_draft")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model,
      intent
    };
  } catch (error) {
    console.warn("OpenAI message draft generation failed; using local fallback.", error);
    return null;
  }
}

export async function generateDocumentAiReview(documentId: string, productUserId?: string): Promise<AiDocumentReview> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId: defaultTenantId },
    include: {
      uploadedBy: true,
      verifiedBy: true,
      checklistItem: true,
      matter: {
        include: {
          client: true,
          primaryAgent: true,
          caseOfficer: true,
          checklistItems: true,
          documents: true,
          keyDates: { orderBy: { date: "asc" } }
        }
      }
    }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const duplicateTitles = document.matter.documents.filter(
    (item) => item.id !== document.id && item.title.toLowerCase() === document.title.toLowerCase()
  );
  const hasConflictingDuplicate = duplicateTitles.some((item) => item.status !== document.status);
  const recommendation: AiDocumentReview["recommendation"] =
    document.scanStatus !== "CLEAN" || document.status === "REJECTED"
      ? "REJECT"
      : hasConflictingDuplicate || !document.checklistItemId
        ? "NEEDS_REVIEW"
        : "VERIFY";
  const confidence: AiDocumentReview["confidence"] =
    document.scanStatus !== "CLEAN" || hasConflictingDuplicate || !document.checklistItemId ? "MEDIUM" : "HIGH";

  const localReview: AiDocumentReview = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    recommendation,
    confidence,
    summary: `${document.title} is a ${document.fileType} document for ${document.matter.title}. Scan status is ${document.scanStatus.toLowerCase()} and document status is ${document.status.toLowerCase()}.`,
    findings: [
      `Uploaded by ${document.uploadedBy?.name ?? "unknown user"} on ${document.createdAt.toISOString().slice(0, 10)}.`,
      document.checklistItem
        ? `Linked to checklist item ${document.checklistItem.title}.`
        : "Not linked to a checklist item.",
      duplicateTitles.length
        ? `${duplicateTitles.length} other document(s) share this title.`
        : "No same-title duplicate document found."
    ],
    risks: [
      document.scanStatus === "CLEAN" ? "No mock virus scan issue detected." : "Document scan is not clean.",
      hasConflictingDuplicate
        ? "Same-title documents have conflicting review statuses."
        : "No conflicting same-title review status detected.",
      document.checklistItemId ? "Checklist linkage is present." : "Checklist linkage is missing."
    ],
    complianceNotes: [
      "Staff must review the actual file content before relying on this recommendation.",
      "Verification or rejection should remain auditable with user and timestamp.",
      "Do not treat this review as legal advice or a substitute for RMA judgement."
    ],
    nextSteps: [
      recommendation === "VERIFY"
        ? "If the file content matches the checklist item, mark the document verified."
        : recommendation === "REJECT"
          ? "Reject or replace the document after confirming the issue with the client."
          : "Resolve checklist linkage or duplicate-status conflict before final review."
    ]
  };

  const context = {
    document: {
      title: document.title,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      scanStatus: document.scanStatus,
      scanMessage: document.scanMessage,
      storageProvider: document.storageProvider,
      uploadedBy: document.uploadedBy?.name ?? null,
      verifiedBy: document.verifiedBy?.name ?? null
    },
    checklistItem: document.checklistItem
      ? {
          title: document.checklistItem.title,
          category: document.checklistItem.category,
          status: document.checklistItem.status,
          required: document.checklistItem.required
        }
      : null,
    matter: {
      title: document.matter.title,
      visaSubclass: document.matter.visaSubclass,
      stage: document.matter.stage,
      primaryAgent: document.matter.primaryAgent?.name ?? "Unassigned",
      caseOfficer: document.matter.caseOfficer?.name ?? "Unassigned"
    },
    client: {
      name: document.matter.client.name,
      consentStatus: document.matter.client.consentStatus,
      conflictCheckStatus: document.matter.client.conflictCheckStatus
    },
    relatedDocuments: document.matter.documents.map((item) => ({
      id: item.id,
      title: item.title,
      fileType: item.fileType,
      status: item.status,
      scanStatus: item.scanStatus,
      isCurrentDocument: item.id === document.id
    })),
    deterministicBaseline: localReview
  };

  const openAiReview = await maybeGenerateOpenAiDocumentReview(context);
  const selectedReview = openAiReview ?? localReview;

  await writeAuditEvent({
    productUserId,
    action: "ai.document_review_generated",
    entityType: "Document",
    entityId: document.id,
    metadata: {
      name: document.title,
      provider: selectedReview.provider,
      model: selectedReview.model,
      recommendation: selectedReview.recommendation
    }
  });

  return selectedReview;
}

async function maybeGenerateOpenAiDocumentReview(context: unknown): Promise<AiDocumentReview | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI document review assistant for an Australian migration-agency CRM.",
            "Review only the supplied metadata and workflow context. You cannot see the file contents.",
            "Flag scan, checklist-linkage, duplicate-status, audit, and workflow risks.",
            "Do not provide legal advice. Keep recommendations suitable for staff review.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiDocumentReviewSchema, "document_review")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI document review generation failed; using local fallback.", error);
    return null;
  }
}

export async function updateMatterStage(matterId: string, input: MatterStageInput, productUserId?: string) {
  const matter = await prisma.matter.update({
    where: { id: matterId },
    data: { stage: input.stage }
  });

  await writeAuditEvent({
    productUserId,
    action: "matter.stage_changed",
    entityType: "Matter",
    entityId: matter.id,
    metadata: { name: matter.title, stage: input.stage }
  });

  return getMatterById(matter.id);
}

export async function updateTaskStatus(taskId: string, input: TaskStatusInput, productUserId?: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      completedAt: input.status === "DONE" ? new Date() : null
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "task.status_changed",
    entityType: "Task",
    entityId: task.id,
    metadata: { name: task.title, status: input.status }
  });

  return getMatterById(task.matterId);
}

export async function updateChecklistStatus(
  checklistItemId: string,
  input: ChecklistStatusInput,
  productUserId?: string
) {
  const checklistItem = await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: {
      status: input.status,
      verifiedById: input.status === "VERIFIED" ? productUserToDbUser[productUserId ?? "rma-user"] : null,
      verifiedAt: input.status === "VERIFIED" ? new Date() : null
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "checklist.status_changed",
    entityType: "ChecklistItem",
    entityId: checklistItem.id,
    metadata: { name: checklistItem.title, status: input.status }
  });

  return getMatterById(checklistItem.matterId);
}

export async function createMatterTask(matterId: string, input: MatterTaskInput, productUserId?: string) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const task = await prisma.task.create({
    data: {
      tenantId: defaultTenantId,
      matterId,
      title: input.title,
      description: input.description,
      dueOn: new Date(input.dueOn),
      assigneeId: productUserId ? productUserToDbUser[productUserId] : matter.caseOfficerId
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "task.created",
    entityType: "Task",
    entityId: task.id,
    metadata: { name: task.title, matterId }
  });

  return getMatterById(matterId);
}

export async function createMatterChecklistItem(
  matterId: string,
  input: MatterChecklistInput,
  productUserId?: string
) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const item = await prisma.checklistItem.create({
    data: {
      tenantId: defaultTenantId,
      matterId,
      title: input.title,
      category: input.category,
      dueOn: input.dueOn ? new Date(input.dueOn) : null,
      required: input.required
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "checklist.created",
    entityType: "ChecklistItem",
    entityId: item.id,
    metadata: { name: item.title, matterId }
  });

  return getMatterById(matterId);
}

export async function uploadMatterDocument(
  matterId: string,
  input: DocumentUploadInput,
  productUserId?: string
) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const checklistItem = input.checklistItemId
    ? await prisma.checklistItem.findFirst({
        where: {
          id: input.checklistItemId,
          matterId,
          tenantId: defaultTenantId
        }
      })
    : null;

  if (input.checklistItemId && !checklistItem) {
    throw new Error("Checklist item not found");
  }

  const scan = scanUploadedDocument(input.fileName, input.fileSize);
  const storage = await persistUploadedDocument(matterId, input);
  const document = await prisma.document.create({
    data: {
      tenantId: defaultTenantId,
      matterId,
      checklistItemId: checklistItem?.id,
      title: input.title,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      storageKey: storage.storageKey,
      storageProvider: "local",
      checksum: storage.checksum,
      scanStatus: scan.status,
      scanProvider: "mock-av",
      scanMessage: scan.message,
      scannedAt: new Date(),
      status: "RECEIVED",
      uploadedById: productUserId ? productUserToDbUser[productUserId] : undefined
    }
  });

  if (scan.status === "INFECTED") {
    await writeAuditEvent({
      productUserId,
      action: "document.quarantined",
      entityType: "Document",
      entityId: document.id,
      metadata: { name: document.title, fileName: document.fileName }
    });
    throw new Error("Virus scan failed");
  }

  if (checklistItem) {
    await prisma.checklistItem.update({
      where: { id: checklistItem.id },
      data: { status: "RECEIVED" }
    });
  }

  await writeAuditEvent({
    productUserId,
    action: "document.uploaded",
    entityType: "Document",
    entityId: document.id,
    metadata: { name: document.title, fileName: document.fileName }
  });

  await queueNotification({
    recipient: "case.officer@asun.test",
    subject: `Document received: ${document.title}`,
    body: `${document.fileName} passed ${scan.provider} scanning and is ready for review.`,
    provider: "mock"
  });

  return getMatterById(matterId);
}

export async function reviewDocument(documentId: string, input: DocumentReviewInput, productUserId?: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId: defaultTenantId }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.scanStatus !== "CLEAN") {
    throw new Error("Document must pass virus scan before review");
  }

  const reviewedDocument = await prisma.document.update({
    where: { id: document.id },
    data: {
      status: input.status,
      verifiedById: input.status === "VERIFIED" ? productUserToDbUser[productUserId ?? "rma-user"] : null,
      verifiedAt: input.status === "VERIFIED" ? new Date() : null
    }
  });

  if (reviewedDocument.checklistItemId) {
    await prisma.checklistItem.update({
      where: { id: reviewedDocument.checklistItemId },
      data: {
        status: input.status,
        verifiedById: input.status === "VERIFIED" ? productUserToDbUser[productUserId ?? "rma-user"] : null,
        verifiedAt: input.status === "VERIFIED" ? new Date() : null
      }
    });
  }

  await writeAuditEvent({
    productUserId,
    action: input.status === "VERIFIED" ? "document.verified" : "document.rejected",
    entityType: "Document",
    entityId: reviewedDocument.id,
    metadata: { name: reviewedDocument.title, status: input.status }
  });

  await queueNotification({
    recipient: "client@asun.test",
    subject: input.status === "VERIFIED" ? "Document verified" : "Document rejected",
    body: `${reviewedDocument.title} was marked ${input.status.toLowerCase()}.`,
    provider: "mock"
  });

  return getMatterById(reviewedDocument.matterId);
}

export async function createMatterInvoice(matterId: string, input: InvoiceInput, productUserId?: string) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId },
    include: { client: true }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const invoiceNumber = await nextInvoiceNumber();
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: defaultTenantId,
      matterId: matter.id,
      clientId: matter.clientId,
      number: invoiceNumber,
      status: input.status,
      subtotal: input.subtotal,
      tax: input.tax,
      total: input.subtotal + input.tax,
      dueOn: new Date(input.dueOn),
      sentAt: input.status === "SENT" ? new Date() : null
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "invoice.created",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: {
      number: invoice.number,
      name: `${invoice.number} - ${input.description}`,
      client: matter.client.name
    }
  });

  return getMatterById(matter.id);
}

export async function payInvoice(invoiceId: string, productUserId?: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: defaultTenantId },
    include: { matter: true }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "PAID") {
    return getMatterById(invoice.matterId);
  }

  const paidAt = new Date();

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        tenantId: defaultTenantId,
        invoiceId: invoice.id,
        provider: "stripe_mock",
        providerPaymentId: `pi_mock_${invoice.id.slice(0, 8)}`,
        amount: invoice.total,
        status: "SUCCEEDED",
        paidAt
      }
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt
      }
    })
  ]);

  await writeAuditEvent({
    productUserId,
    action: "payment.succeeded",
    entityType: "Payment",
    entityId: invoice.id,
    metadata: {
      number: invoice.number,
      amount: String(invoice.total)
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "invoice.paid",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: {
      number: invoice.number,
      amount: String(invoice.total)
    }
  });

  return getMatterById(invoice.matterId);
}

export async function createCheckoutSession(invoiceId: string, productUserId?: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: defaultTenantId },
    include: { client: true }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const checkoutSessionId = `cs_mock_${invoice.id.slice(0, 8)}`;
  await prisma.integrationEvent.create({
    data: {
      tenantId: defaultTenantId,
      provider: "STRIPE",
      eventType: "checkout.session.created",
      externalId: checkoutSessionId,
      status: "created",
      payload: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: String(invoice.total),
        mode: "mock"
      }
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "stripe.checkout_created",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: { name: invoice.number, number: invoice.number }
  });

  return {
    invoiceId: invoice.id,
    paymentUrl: `https://checkout.stripe.com/mock/${checkoutSessionId}`,
    checkoutSessionId,
    mode: "mock"
  };
}

export async function handleStripeWebhook(input: StripeWebhookInput, productUserId?: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: defaultTenantId }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  await prisma.integrationEvent.create({
    data: {
      tenantId: defaultTenantId,
      provider: "STRIPE",
      eventType: input.eventType,
      externalId: input.providerPaymentId,
      status: input.status,
      payload: input
    }
  });

  if (input.status === "succeeded") {
    return payInvoice(invoice.id, productUserId);
  }

  await prisma.payment.create({
    data: {
      tenantId: defaultTenantId,
      invoiceId: invoice.id,
      provider: "stripe_mock",
      providerPaymentId: input.providerPaymentId,
      amount: invoice.total,
      status: "FAILED"
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "payment.failed",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: { name: invoice.number, number: invoice.number }
  });

  return getMatterById(invoice.matterId);
}

export async function createSignatureEnvelope(input: SignatureEnvelopeInput, productUserId?: string) {
  const document = await prisma.document.findFirst({
    where: { id: input.documentId, tenantId: defaultTenantId }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.scanStatus !== "CLEAN") {
    throw new Error("Document must pass virus scan before e-signature");
  }

  const providerEnvelopeId = `env_mock_${document.id.slice(0, 8)}`;
  const envelope = await prisma.signatureEnvelope.create({
    data: {
      tenantId: defaultTenantId,
      documentId: document.id,
      provider: "docusign_mock",
      providerEnvelopeId,
      status: "sent",
      signerEmail: input.signerEmail,
      signingUrl: `https://signing.docusign.local/sign/${providerEnvelopeId}`
    }
  });

  await prisma.document.update({
    where: { id: document.id },
    data: { status: "SIGNING" }
  });

  await prisma.integrationEvent.create({
    data: {
      tenantId: defaultTenantId,
      provider: "DOCUSIGN",
      eventType: "envelope.sent",
      externalId: providerEnvelopeId,
      status: "sent",
      payload: { documentId: document.id, signerEmail: input.signerEmail }
    }
  });

  await queueNotification({
    recipient: input.signerEmail,
    subject: "Signature requested",
    body: `Please sign ${document.title}.`,
    provider: "mock"
  });

  await writeAuditEvent({
    productUserId,
    action: "signature.envelope_sent",
    entityType: "SignatureEnvelope",
    entityId: envelope.id,
    metadata: { name: document.title }
  });

  return {
    id: envelope.id,
    envelopeId: envelope.providerEnvelopeId,
    documentId: envelope.documentId,
    status: envelope.status,
    signingUrl: envelope.signingUrl
  };
}

export async function handleSignatureWebhook(input: SignatureWebhookInput, productUserId?: string) {
  const envelope = await prisma.signatureEnvelope.findFirst({
    where: { providerEnvelopeId: input.envelopeId, tenantId: defaultTenantId },
    include: { document: true }
  });

  if (!envelope) {
    throw new Error("Envelope not found");
  }

  const completedAt = input.status === "completed" ? new Date() : null;
  const updated = await prisma.signatureEnvelope.update({
    where: { id: envelope.id },
    data: {
      status: input.status,
      completedAt,
      certificateStorageKey: completedAt ? `certificates/${envelope.providerEnvelopeId}.pdf` : null
    }
  });

  if (input.status === "completed") {
    await prisma.document.update({
      where: { id: envelope.documentId },
      data: { status: "VERIFIED", verifiedAt: new Date() }
    });
  }

  await prisma.integrationEvent.create({
    data: {
      tenantId: defaultTenantId,
      provider: "DOCUSIGN",
      eventType: "envelope.status",
      externalId: input.envelopeId,
      status: input.status,
      payload: input
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "signature.envelope_status",
    entityType: "SignatureEnvelope",
    entityId: envelope.id,
    metadata: { name: envelope.document.title, status: input.status }
  });

  return {
    id: updated.id,
    envelopeId: updated.providerEnvelopeId,
    status: updated.status,
    completedAt: updated.completedAt?.toISOString() ?? null,
    certificateStorageKey: updated.certificateStorageKey
  };
}

export async function createMatterMessage(matterId: string, input: MessageInput, productUserId?: string) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const message = await prisma.message.create({
    data: {
      tenantId: defaultTenantId,
      matterId,
      senderId: productUserId ? productUserToDbUser[productUserId] : undefined,
      visibility: input.visibility,
      body: input.body
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "message.sent",
    entityType: "Message",
    entityId: message.id,
    metadata: {
      name: `Message on ${matter.title}`,
      visibility: input.visibility
    }
  });

  return getMatterById(matterId);
}

export async function getInvoices() {
  return withFallback([], async () => {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: defaultTenantId },
      include: {
        client: true,
        matter: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: [{ status: "asc" }, { dueOn: "asc" }]
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      clientName: invoice.client.name,
      matterId: invoice.matterId,
      matterTitle: invoice.matter.title,
      visaSubclass: invoice.matter.visaSubclass,
      amount: Number(invoice.total),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      status: invoice.status,
      dueOn: invoice.dueOn.toISOString().slice(0, 10),
      paidAt: invoice.paidAt?.toISOString() ?? null,
      latestPayment: invoice.payments[0]
        ? {
            id: invoice.payments[0].id,
            provider: invoice.payments[0].provider,
            status: invoice.payments[0].status,
            amount: Number(invoice.payments[0].amount),
            paidAt: invoice.payments[0].paidAt?.toISOString() ?? null
          }
        : null
    }));
  });
}

export async function getReports() {
  return withFallback(
    {
      pipelineByStage: [],
      revenueBySubclass: [],
      slaBreaches: [],
      upcomingDeadlines: [],
      workloadByOwner: []
    },
    async () => {
      const [matters, paidInvoices, overdueTasks, upcomingDeadlines, openTasks] = await Promise.all([
        prisma.matter.findMany({
          where: { tenantId: defaultTenantId },
          include: {
            primaryAgent: true,
            caseOfficer: true
          }
        }),
        prisma.invoice.findMany({
          where: { tenantId: defaultTenantId, status: "PAID" },
          include: { matter: true }
        }),
        prisma.task.findMany({
          where: {
            tenantId: defaultTenantId,
            status: { in: ["OPEN", "BLOCKED", "SNOOZED"] },
            dueOn: { lt: new Date() }
          },
          include: {
            assignee: true,
            matter: true
          },
          orderBy: { dueOn: "asc" }
        }),
        prisma.matterKeyDate.findMany({
          where: {
            tenantId: defaultTenantId,
            date: {
              gte: new Date(),
              lte: daysFromNow(30)
            }
          },
          include: { matter: { include: { client: true } } },
          orderBy: { date: "asc" },
          take: 10
        }),
        prisma.task.findMany({
          where: {
            tenantId: defaultTenantId,
            status: { in: ["OPEN", "BLOCKED", "SNOOZED"] }
          },
          include: { assignee: true }
        })
      ]);

      return {
        pipelineByStage: countBy(matters, (matter) => matter.stage).map(([stage, count]) => ({
          stage,
          count
        })),
        revenueBySubclass: sumBy(paidInvoices, (invoice) => invoice.matter.visaSubclass, (invoice) => Number(invoice.total)).map(
          ([subclass, revenue]) => ({
            subclass,
            revenue
          })
        ),
        slaBreaches: overdueTasks.map((task) => ({
          matterTitle: task.matter.title,
          owner: task.assignee?.name ?? "Unassigned",
          daysOverdue: daysBetween(task.dueOn, new Date()),
          taskTitle: task.title
        })),
        upcomingDeadlines: upcomingDeadlines.map((date) => ({
          matterTitle: date.matter.title,
          clientName: date.matter.client.name,
          label: date.label,
          date: date.date.toISOString().slice(0, 10),
          daysAway: daysBetween(new Date(), date.date)
        })),
        workloadByOwner: countBy(openTasks, (task) => task.assignee?.name ?? "Unassigned").map(([owner, openTasks]) => ({
          owner,
          openTasks
        }))
      };
    }
  );
}

export async function generateReportInsights(productUserId?: string): Promise<AiReportInsights> {
  const reports = await getReports();
  const totalMatters = reports.pipelineByStage.reduce((sum, row) => sum + row.count, 0);
  const totalRevenue = reports.revenueBySubclass.reduce((sum, row) => sum + row.revenue, 0);
  const overdueCount = reports.slaBreaches.length;
  const urgentDeadlines = reports.upcomingDeadlines.filter((deadline) => deadline.daysAway <= 14);
  const busiestOwner = [...reports.workloadByOwner].sort((a, b) => b.openTasks - a.openTasks)[0];
  const topStage = [...reports.pipelineByStage].sort((a, b) => b.count - a.count)[0];
  const topSubclassRevenue = [...reports.revenueBySubclass].sort((a, b) => b.revenue - a.revenue)[0];
  const overallHealth: AiReportInsights["overallHealth"] =
    overdueCount > 2 || urgentDeadlines.length > 2
      ? "AT_RISK"
      : overdueCount || urgentDeadlines.length || (busiestOwner?.openTasks ?? 0) > 3
        ? "WATCH"
        : "LOW_RISK";

  const localInsights: AiReportInsights = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    overallHealth,
    executiveSummary: `The agency has ${totalMatters} active matter(s), $${totalRevenue.toFixed(2)} paid revenue in the current dataset, ${overdueCount} overdue task(s), and ${reports.upcomingDeadlines.length} upcoming deadline(s). Overall health is ${overallHealth.replaceAll("_", " ").toLowerCase()}.`,
    pipelineInsights: [
      topStage
        ? `${topStage.stage.replaceAll("_", " ")} has the highest matter volume with ${topStage.count} matter(s).`
        : "No active pipeline volume is currently available.",
      `${reports.pipelineByStage.length} pipeline stage(s) currently have matter activity.`
    ],
    revenueInsights: [
      topSubclassRevenue
        ? `Subclass ${topSubclassRevenue.subclass} contributes the highest paid revenue at $${topSubclassRevenue.revenue.toFixed(2)}.`
        : "No paid revenue is currently available.",
      totalRevenue > 0
        ? "Paid invoice reporting is available for finance review."
        : "No paid invoices are present, so revenue reporting needs payment activity."
    ],
    deadlineRisks: [
      urgentDeadlines.length
        ? `${urgentDeadlines.length} deadline(s) fall within 14 days and should be checked first.`
        : "No deadlines fall within the next 14 days.",
      reports.slaBreaches[0]
        ? `${reports.slaBreaches[0].taskTitle} is the oldest visible SLA risk at ${reports.slaBreaches[0].daysOverdue} day(s) overdue.`
        : "No overdue open tasks are currently reported."
    ],
    workloadRisks: [
      busiestOwner
        ? `${busiestOwner.owner} has the highest open workload with ${busiestOwner.openTasks} task(s).`
        : "No open workload is currently reported.",
      reports.workloadByOwner.length > 1
        ? "Compare owner workload before assigning new intake or lodgement tasks."
        : "Workload is concentrated in a single visible owner group."
    ],
    recommendedActions: [
      overdueCount ? "Review overdue SLA tasks and assign owners or due-date decisions." : "Keep monitoring SLA health weekly.",
      urgentDeadlines.length ? "Run a deadline review for matters due within 14 days." : "Maintain standard key-date reminders.",
      busiestOwner && busiestOwner.openTasks > 3
        ? `Consider redistributing work from ${busiestOwner.owner}.`
        : "Current workload does not show a major redistribution trigger.",
      "Export reports after review if a manager needs evidence for the weekly operations meeting."
    ]
  };

  const context = {
    reports,
    metrics: {
      totalMatters,
      totalRevenue,
      overdueCount,
      urgentDeadlineCount: urgentDeadlines.length,
      busiestOwner,
      topStage,
      topSubclassRevenue
    },
    deterministicBaseline: localInsights
  };

  const openAiInsights = await maybeGenerateOpenAiReportInsights(context);
  const selectedInsights = openAiInsights ?? localInsights;

  await writeAuditEvent({
    productUserId,
    action: "ai.report_insights_generated",
    entityType: "Report",
    entityId: "reports",
    metadata: {
      name: "AI report insights",
      provider: selectedInsights.provider,
      model: selectedInsights.model,
      overallHealth: selectedInsights.overallHealth
    }
  });

  return selectedInsights;
}

async function maybeGenerateOpenAiReportInsights(context: unknown): Promise<AiReportInsights | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI operations analyst for an Australian migration-agency CRM.",
            "Use only the supplied report aggregates and deterministic baseline.",
            "Explain pipeline, revenue, deadline, SLA, and workload signals in manager-friendly language.",
            "Do not invent records, financial totals, deadlines, or legal advice.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiReportInsightsSchema, "report_insights")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI report insights generation failed; using local fallback.", error);
    return null;
  }
}

export async function exportReportCsv(type: ReportExportType, productUserId?: string) {
  const reports = await getReports();
  const rowsByType = reportRowsByType(reports);

  await writeAuditEvent({
    productUserId,
    action: "report.exported",
    entityType: "Report",
    entityId: type,
    metadata: {
      name: `${type} report export`,
      type
    }
  });

  return {
    filename: `asun-${type}-report.csv`,
    csv: toCsv(rowsByType[type])
  };
}

export async function exportReportXlsx(type: ReportExportType, productUserId?: string) {
  const reports = await getReports();
  const rowsByType = reportRowsByType(reports);
  const rows = rowsByType[type];

  await writeAuditEvent({
    productUserId,
    action: "report.exported",
    entityType: "Report",
    entityId: `${type}-xlsx`,
    metadata: {
      name: `${type} XLSX report export`,
      type
    }
  });

  return {
    filename: `asun-${type}-report.xlsx`,
    buffer: createXlsxBuffer(rows, type)
  };
}

export async function generateInvoiceReceiptPdf(invoiceId: string, productUserId?: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: defaultTenantId },
    include: {
      client: true,
      matter: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  await writeAuditEvent({
    productUserId,
    action: "receipt.generated",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: { name: invoice.number, number: invoice.number }
  });

  const lines = [
    "ASUN Migrations",
    "Payment Receipt",
    "",
    `Invoice: ${invoice.number}`,
    `Client: ${invoice.client.name}`,
    `Matter: ${invoice.matter.title}`,
    `Status: ${invoice.status}`,
    `Subtotal: $${Number(invoice.subtotal).toFixed(2)}`,
    `Tax: $${Number(invoice.tax).toFixed(2)}`,
    `Total: $${Number(invoice.total).toFixed(2)}`,
    `Due: ${invoice.dueOn.toISOString().slice(0, 10)}`,
    `Paid: ${invoice.paidAt?.toISOString().slice(0, 10) ?? "Not paid"}`,
    `Payment Provider: ${invoice.payments[0]?.provider ?? "N/A"}`,
    `Payment Status: ${invoice.payments[0]?.status ?? "N/A"}`
  ];

  return {
    filename: `${invoice.number}-receipt.pdf`,
    buffer: createSimplePdf(lines)
  };
}

export async function getWorkflowTemplates() {
  return withFallback([], async () => {
    const templates = await prisma.workflowTemplate.findMany({
      where: { tenantId: defaultTenantId, active: true },
      include: { items: { orderBy: { dueOffsetDays: "asc" } } },
      orderBy: [{ visaSubclass: "asc" }, { name: "asc" }]
    });

    return templates.map((template) => ({
      id: template.id,
      visaSubclass: template.visaSubclass,
      name: template.name,
      description: template.description,
      itemCount: template.items.length,
      taskCount: template.items.filter((item) => item.type === "TASK").length,
      checklistCount: template.items.filter((item) => item.type === "CHECKLIST").length,
      items: template.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        stage: item.stage,
        dueOffsetDays: item.dueOffsetDays,
        required: item.required
      }))
    }));
  });
}

export async function createWorkflowTemplate(input: WorkflowTemplateInput, productUserId?: string) {
  const template = await prisma.workflowTemplate.create({
    data: {
      tenantId: defaultTenantId,
      visaSubclass: input.visaSubclass,
      name: input.name,
      description: input.description,
      items: {
        create: [
          {
            type: "CHECKLIST",
            title: "Passport bio page",
            description: "Identity document required before lodgement.",
            stage: "DOCUMENTS",
            dueOffsetDays: 2,
            required: true
          },
          {
            type: "CHECKLIST",
            title: "Evidence pack",
            description: "Core evidence requested for this visa subclass.",
            stage: "DOCUMENTS",
            dueOffsetDays: 7,
            required: true
          },
          {
            type: "TASK",
            title: "RMA lodgement review",
            description: "Registered Migration Agent review before submission.",
            stage: "LODGEMENT",
            dueOffsetDays: 14,
            required: true
          }
        ]
      }
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "workflow_template.created",
    entityType: "WorkflowTemplate",
    entityId: template.id,
    metadata: {
      name: template.name,
      visaSubclass: template.visaSubclass
    }
  });

  const templates = await getWorkflowTemplates();
  return templates.find((item) => item.id === template.id);
}

export async function createMatterFromTemplate(input: MatterFromTemplateInput, productUserId?: string) {
  const template = await prisma.workflowTemplate.findFirst({
    where: { id: input.templateId, tenantId: defaultTenantId, active: true },
    include: { items: true }
  });

  if (!template) {
    throw new Error("Workflow template not found");
  }

  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId: defaultTenantId }
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const matter = await prisma.matter.create({
    data: {
      tenantId: defaultTenantId,
      clientId: input.clientId,
      visaSubclass: template.visaSubclass,
      title: template.name.replace(" Standard Workflow", ""),
      stage: "INTAKE",
      primaryAgentId: "user-rma",
      caseOfficerId: "user-case-officer",
      keyDates: {
        create: {
          tenantId: defaultTenantId,
          type: "target_lodgement",
          label: "Target lodgement date",
          date: new Date(input.keyDate),
          alertBeforeDays: 30
        }
      }
    }
  });

  const today = new Date();
  const taskItems = template.items.filter((item) => item.type === "TASK");
  const checklistItems = template.items.filter((item) => item.type === "CHECKLIST");

  if (taskItems.length) {
    await prisma.task.createMany({
      data: taskItems.map((item) => ({
        tenantId: defaultTenantId,
        matterId: matter.id,
        assigneeId: "user-case-officer",
        title: item.title,
        description: item.description,
        status: "OPEN",
        dueOn: addDays(today, item.dueOffsetDays)
      }))
    });
  }

  if (checklistItems.length) {
    await prisma.checklistItem.createMany({
      data: checklistItems.map((item) => ({
        tenantId: defaultTenantId,
        matterId: matter.id,
        title: item.title,
        category: item.stage,
        status: "REQUESTED",
        required: item.required,
        dueOn: addDays(today, item.dueOffsetDays)
      }))
    });
  }

  await writeAuditEvent({
    productUserId,
    action: "matter.created_from_template",
    entityType: "Matter",
    entityId: matter.id,
    metadata: {
      name: matter.title,
      client: client.name,
      template: template.name
    }
  });

  const matters = await getMatters();
  return matters.find((item) => item.id === matter.id);
}

export async function getDashboard() {
  return withFallback(fallbackDashboard as unknown, async () => {
    const [matters, overdueTasks, upcomingDeadlines, paidInvoices, portalClients, totalClients, messages] =
      await Promise.all([
        getMatters(),
        prisma.task.count({
          where: {
            tenantId: defaultTenantId,
            status: { in: ["OPEN", "BLOCKED"] },
            dueOn: { lt: new Date() }
          }
        }),
        prisma.matterKeyDate.count({
          where: {
            tenantId: defaultTenantId,
            date: {
              gte: new Date(),
              lte: daysFromNow(30)
            }
          }
        }),
        prisma.invoice.findMany({
          where: {
            tenantId: defaultTenantId,
            status: "PAID"
          }
        }),
        prisma.client.count({ where: { tenantId: defaultTenantId, portalActive: true } }),
        prisma.client.count({ where: { tenantId: defaultTenantId } }),
        prisma.message.findMany({
          where: { tenantId: defaultTenantId, visibility: "EXTERNAL" },
          include: { sender: true, matter: true },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      ]);

    const tasks = await prisma.task.findMany({
      where: { tenantId: defaultTenantId, status: { in: ["OPEN", "BLOCKED"] } },
      include: { assignee: true },
      orderBy: { dueOn: "asc" },
      take: 5
    });

    return {
      metrics: {
        activeMatters: matters.length,
        overdueTasks,
        upcomingDeadlines,
        monthlyRevenue: paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0),
        clientPortalAdoption: totalClients ? Math.round((portalClients / totalClients) * 100) : 0
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueOn: task.dueOn.toISOString().slice(0, 10),
        assignee: task.assignee?.name ?? "Unassigned",
        matterId: task.matterId
      })),
      matters,
      recentMessages: messages.map((message) => ({
        id: message.id,
        from: message.sender?.name ?? "Client",
        preview: message.body,
        matterTitle: message.matter.title,
        receivedAt: message.createdAt.toISOString()
      })),
      alerts: fallbackDashboard.alerts
    };
  });
}

export async function getAuditEvents(filters: AuditFilters = {}) {
  return withFallback(auditEventsFallback(), async () => {
    const where = {
      tenantId: defaultTenantId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: endOfDay(new Date(filters.to)) } : {})
            }
          }
        : {}),
      ...(filters.actor
        ? {
            actor: {
              name: {
                contains: filters.actor,
                mode: "insensitive" as const
              }
            }
          }
        : {})
    };

    const events = await prisma.auditEvent.findMany({
      where,
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const mappedEvents = events
      .map((event) => ({
        id: event.id,
        actor: event.actor?.name ?? "System",
        action: event.action,
        entity: auditEntityLabel(event.metadata, event.entityId),
        entityType: event.entityType,
        timestamp: event.createdAt.toISOString()
      }))
      .filter((event) =>
        filters.entity ? event.entity.toLowerCase().includes(filters.entity.toLowerCase()) : true
      );

    const allEvents = await prisma.auditEvent.findMany({
      where: { tenantId: defaultTenantId },
      include: { actor: true },
      orderBy: { action: "asc" }
    });

    return {
      events: mappedEvents,
      meta: {
        total: mappedEvents.length,
        actions: [...new Set(allEvents.map((event) => event.action))],
        actors: [...new Set(allEvents.map((event) => event.actor?.name ?? "System"))]
      }
    };
  });
}

function auditEventsFallback() {
  const events = fallbackAuditEvents.map((event) => ({
    ...event,
    entityType: "AuditEvent"
  }));

  return {
    events,
    meta: {
      total: events.length,
      actions: [...new Set(events.map((event) => event.action))],
      actors: [...new Set(events.map((event) => event.actor))]
    }
  };
}

export async function getPortalSummary(productUserId?: string): Promise<PortalSummaryData> {
  return withFallback(normalizeFallbackPortalSummary(), async () => {
    const portalClientId = resolvePortalClientId(productUserId);
    const fallbackClient = portalClientId
      ? await prisma.client.findFirst({
          where: { id: portalClientId, tenantId: defaultTenantId },
          select: { id: true, name: true }
        })
      : null;

    const matter = await prisma.matter.findFirst({
      where: {
        tenantId: defaultTenantId,
        ...(portalClientId ? { clientId: portalClientId } : { clientId: "client-john-smith" })
      },
      include: {
        client: true,
        checklistItems: {
          include: {
            documents: { orderBy: { updatedAt: "desc" } }
          },
          orderBy: { dueOn: "asc" }
        },
        documents: { orderBy: { updatedAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } }
      }
    });

    if (!matter) {
      if (portalClientId && fallbackClient) {
        return emptyPortalSummary(fallbackClient.name);
      }

      return normalizeFallbackPortalSummary();
    }

    const invoice = matter.invoices[0];

    return {
      hasMatter: true,
      matterId: matter.id,
      clientName: matter.client.name,
      matterTitle: matter.title,
      stage: matter.stage,
      progress: progressForStage(matter.stage),
      outstandingDocuments: matter.checklistItems.filter((item) => item.status !== "VERIFIED").length,
      nextStep: nextPortalStep(matter.checklistItems),
      invoice: invoice
        ? {
            id: invoice.id,
            number: invoice.number,
            amount: Number(invoice.total),
            status: invoice.status,
            dueOn: invoice.dueOn.toISOString().slice(0, 10)
          }
        : {
            number: "No invoice",
            amount: 0,
            status: "NONE",
            dueOn: ""
          },
      documents: matter.checklistItems.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        updatedAt: item.updatedAt.toISOString().slice(0, 10),
        documentCount: item.documents.length,
        latestDocument: item.documents[0]
          ? {
              id: item.documents[0].id,
              title: item.documents[0].title,
              status: item.documents[0].status,
              updatedAt: item.documents[0].updatedAt.toISOString().slice(0, 10)
            }
          : null
      }))
    };
  });
}

export async function generatePortalGuidance(productUserId?: string): Promise<AiPortalGuidance> {
  const summary = await getPortalSummary(productUserId);
  const outstandingDocuments = summary.documents.filter((document) => document.status !== "VERIFIED");
  const invoice = summary.invoice;
  const hasMatter = summary.hasMatter ?? Boolean(summary.matterId);
  const invoiceNeedsPayment = Boolean(hasMatter && invoice && invoice.status !== "PAID" && invoice.amount > 0);
  const tone: AiPortalGuidance["tone"] =
    !hasMatter || outstandingDocuments.length > 2 || invoiceNeedsPayment ? "ACTION_NEEDED" : "REASSURING";
  const firstName = summary.clientName.split(" ")[0] ?? summary.clientName;

  const localGuidance: AiPortalGuidance = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    tone,
    statusSummary: hasMatter
      ? `${summary.matterTitle} is currently in ${summary.stage.replaceAll("_", " ").toLowerCase()} stage and is ${summary.progress}% complete in the portal view.`
      : "No active matter is visible in the portal yet.",
    nextStep: summary.nextStep,
    outstandingItems: outstandingDocuments.length
      ? outstandingDocuments.map((document) => `${document.title} is ${document.status.toLowerCase()}.`)
      : ["No outstanding document requests are visible in the portal."],
    paymentReminder: invoiceNeedsPayment
      ? `${invoice!.number} is ${invoice!.status.toLowerCase()} for $${invoice!.amount.toFixed(2)} and is due ${invoice!.dueOn}.`
      : "No payment action is currently required from the portal invoice summary.",
    messageDraft: [
      `Hi ${firstName},`,
      "",
      outstandingDocuments.length
        ? `Please review the outstanding document request(s): ${outstandingDocuments
            .slice(0, 3)
            .map((document) => document.title)
            .join(", ")}.`
        : "Your visible document requests currently look up to date.",
      invoiceNeedsPayment ? ` Please also review invoice ${invoice!.number} when convenient.` : "",
      "",
      "You can reply here if you need help with the next step."
    ].join("\n"),
    importantNotes: [
      "This guidance summarizes portal data only and is not migration legal advice.",
      "Your migration agent will review uploaded documents before relying on them.",
      "Use secure portal messaging for questions about documents, invoices, or timing."
    ]
  };

  const context = {
    portalSummary: summary,
    deterministicBaseline: localGuidance
  };

  const openAiGuidance = await maybeGenerateOpenAiPortalGuidance(context);
  const selectedGuidance = openAiGuidance ?? localGuidance;

  await writeAuditEvent({
    productUserId,
    action: "ai.portal_guidance_generated",
    entityType: "Matter",
    entityId: "matterId" in summary ? summary.matterId : "portal-summary",
    metadata: {
      name: summary.matterTitle,
      provider: selectedGuidance.provider,
      model: selectedGuidance.model,
      tone: selectedGuidance.tone
    }
  });

  return selectedGuidance;
}

async function maybeGenerateOpenAiPortalGuidance(context: unknown): Promise<AiPortalGuidance | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI client portal assistant for an Australian migration-agency CRM.",
            "Use only the supplied portal summary and deterministic baseline.",
            "Write client-friendly operational guidance about visible matter status, requested documents, invoice status, and next steps.",
            "Do not provide legal advice, eligibility advice, visa strategy, outcome predictions, or invented facts.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiPortalGuidanceSchema, "portal_guidance")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI portal guidance generation failed; using local fallback.", error);
    return null;
  }
}

export async function getComplianceCenter() {
  return withFallback(complianceCenterFallback(), async () => {
    const tenant = await prisma.tenant.findUnique({ where: { id: defaultTenantId } });
    const notifications = await prisma.notification.findMany({
      where: { tenantId: defaultTenantId },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    const retentionRequests = await prisma.retentionRequest.findMany({
      where: { tenantId: defaultTenantId },
      include: { client: true, requestedBy: true, approvedBy: true },
      orderBy: { requestedAt: "desc" },
      take: 20
    });
    const integrationEvents = await prisma.integrationEvent.findMany({
      where: { tenantId: defaultTenantId },
      orderBy: { receivedAt: "desc" },
      take: 20
    });
    const documents = await prisma.document.findMany({
      where: { tenantId: defaultTenantId },
      orderBy: { updatedAt: "desc" },
      take: 20
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return {
      settings: {
        tenantName: tenant.name,
        brandColor: tenant.brandColor,
        retentionYears: tenant.retentionYears,
        taxRate: Number(tenant.taxRate),
        dataRegion: tenant.dataRegion,
        privacyContactEmail: tenant.privacyContactEmail,
        deletionApproverRole: tenant.deletionApproverRole,
        stripeMode: tenant.stripeMode,
        docusignMode: tenant.docusignMode,
        emailProvider: tenant.emailProvider
      },
      documentSecurity: {
        total: documents.length,
        clean: documents.filter((document) => document.scanStatus === "CLEAN").length,
        pending: documents.filter((document) => document.scanStatus === "PENDING").length,
        blocked: documents.filter((document) => ["INFECTED", "FAILED"].includes(document.scanStatus)).length,
        recent: documents.map((document) => ({
          id: document.id,
          title: document.title,
          status: document.status,
          scanStatus: document.scanStatus,
          storageProvider: document.storageProvider,
          scannedAt: document.scannedAt?.toISOString() ?? null
        }))
      },
      notifications: notifications.map((notification) => ({
        id: notification.id,
        recipient: notification.recipient,
        subject: notification.subject,
        status: notification.status,
        provider: notification.provider,
        sentAt: notification.sentAt?.toISOString() ?? null,
        createdAt: notification.createdAt.toISOString()
      })),
      retentionRequests: retentionRequests.map((request) => ({
        id: request.id,
        clientName: request.client?.name ?? "Tenant-wide",
        action: request.action,
        reason: request.reason,
        status: request.status,
        requestedBy: request.requestedBy?.name ?? "System",
        approvedBy: request.approvedBy?.name ?? null,
        requestedAt: request.requestedAt.toISOString(),
        completedAt: request.completedAt?.toISOString() ?? null
      })),
      integrationEvents: integrationEvents.map((event) => ({
        id: event.id,
        provider: event.provider,
        eventType: event.eventType,
        status: event.status,
        externalId: event.externalId,
        receivedAt: event.receivedAt.toISOString()
      }))
    };
  });
}

function complianceCenterFallback() {
  const now = new Date().toISOString();

  return {
    settings: {
      tenantName: "ASUN Migrations",
      brandColor: "#47624f",
      retentionYears: 7,
      taxRate: 10,
      dataRegion: "AU",
      privacyContactEmail: "privacy@asunmigrations.example",
      deletionApproverRole: "AGENCY_ADMIN",
      stripeMode: "mock",
      docusignMode: "mock",
      emailProvider: "mock"
    },
    documentSecurity: {
      total: 3,
      clean: 2,
      pending: 1,
      blocked: 0,
      recent: [
        {
          id: "fallback-document-passport",
          title: "Passport bio page",
          status: "VERIFIED",
          scanStatus: "CLEAN",
          storageProvider: "local",
          scannedAt: now
        },
        {
          id: "fallback-document-form-956",
          title: "Form 956 appointment",
          status: "RECEIVED",
          scanStatus: "CLEAN",
          storageProvider: "local",
          scannedAt: now
        },
        {
          id: "fallback-document-health",
          title: "Health examination receipt",
          status: "REQUESTED",
          scanStatus: "PENDING",
          storageProvider: "local",
          scannedAt: null
        }
      ]
    },
    notifications: [
      {
        id: "fallback-notification-document",
        recipient: "client@example.com",
        subject: "Document verified",
        status: "SENT",
        provider: "mock",
        sentAt: now,
        createdAt: now
      }
    ],
    retentionRequests: [
      {
        id: "fallback-retention-review",
        clientName: "Miguel Santos",
        action: "ARCHIVE_REVIEW",
        reason: "Review retention status for inactive intake matter.",
        status: "REQUESTED",
        requestedBy: "Mina Patel",
        approvedBy: null,
        requestedAt: now,
        completedAt: null
      }
    ],
    integrationEvents: [
      {
        id: "fallback-integration-email",
        provider: "EMAIL",
        eventType: "notification.sent",
        status: "sent",
        externalId: null,
        receivedAt: now
      },
      {
        id: "fallback-integration-stripe",
        provider: "STRIPE",
        eventType: "payment_intent.succeeded",
        status: "succeeded",
        externalId: "pi_fallback",
        receivedAt: now
      }
    ]
  };
}

export async function generateComplianceReview(productUserId?: string): Promise<AiComplianceReview> {
  const [center, auditEvents] = await Promise.all([
    getComplianceCenter(),
    prisma.auditEvent.findMany({
      where: { tenantId: defaultTenantId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 25
    })
  ]);

  const pendingRetention = center.retentionRequests.filter((request) =>
    ["REQUESTED", "APPROVED"].includes(request.status)
  );
  const blockedDocuments = center.documentSecurity.blocked;
  const pendingDocuments = center.documentSecurity.pending;
  const failedNotifications = center.notifications.filter((notification) => notification.status !== "SENT");
  const failedIntegrations = center.integrationEvents.filter((event) =>
    ["failed", "error", "rejected"].includes(event.status.toLowerCase())
  );
  const destructiveAuditEvents = auditEvents.filter((event) =>
    /erased|deleted|retention|webhook|exported|download/i.test(event.action)
  );
  const compliancePosture: AiComplianceReview["compliancePosture"] =
    blockedDocuments || failedIntegrations.length || failedNotifications.length
      ? "ACTION_REQUIRED"
      : pendingRetention.length || pendingDocuments
        ? "WATCH"
        : "GOOD";

  const localReview: AiComplianceReview = {
    generatedAt: new Date().toISOString(),
    provider: "local-ai",
    model: "rules-v1",
    compliancePosture,
    summary: `Compliance posture is ${compliancePosture.replaceAll("_", " ").toLowerCase()} across ${center.documentSecurity.total} recent document(s), ${center.retentionRequests.length} retention request(s), ${center.notifications.length} notification(s), ${center.integrationEvents.length} integration event(s), and ${auditEvents.length} recent audit event(s).`,
    privacyNotes: [
      `Privacy contact is ${center.settings.privacyContactEmail || "not configured"}.`,
      `Data region is ${center.settings.dataRegion}; retention is configured for ${center.settings.retentionYears} year(s).`,
      "Sensitive client identifiers should remain masked or encrypted in exported and displayed records."
    ],
    retentionNotes: [
      pendingRetention.length
        ? `${pendingRetention.length} retention request(s) still need a decision or completion.`
        : "No open retention requests require immediate decision.",
      center.retentionRequests.some((request) => request.action === "ERASURE" && request.status === "COMPLETED")
        ? "Completed erasure activity is present and should remain auditable."
        : "No completed erasure request is visible in the current compliance queue."
    ],
    documentSecurityNotes: [
      blockedDocuments
        ? `${blockedDocuments} document(s) are blocked or failed scanning and require action.`
        : "No blocked document scans are visible.",
      pendingDocuments
        ? `${pendingDocuments} document(s) still have pending scan status.`
        : "No pending document scans are visible.",
      `${center.documentSecurity.clean} document(s) have clean scan status.`
    ],
    integrationNotes: [
      failedIntegrations.length
        ? `${failedIntegrations.length} integration event(s) indicate failure or rejection.`
        : "No failed provider events are visible in the recent log.",
      failedNotifications.length
        ? `${failedNotifications.length} notification(s) are not marked sent.`
        : "Recent notifications are marked sent.",
      `Current provider modes: Stripe ${center.settings.stripeMode}, DocuSign ${center.settings.docusignMode}, email ${center.settings.emailProvider}.`
    ],
    auditFindings: [
      destructiveAuditEvents.length
        ? `${destructiveAuditEvents.length} sensitive audit event(s) such as retention, export, webhook, or erasure activity are present.`
        : "No sensitive audit actions found in the recent sample.",
      auditEvents[0]
        ? `Most recent audit action is ${auditEvents[0].action} on ${auditEvents[0].entityType}.`
        : "No audit events are available in the recent sample."
    ],
    recommendedActions: [
      blockedDocuments ? "Resolve blocked document scans before verification or e-signature workflows continue." : "Continue monitoring document scan status.",
      pendingRetention.length ? "Review open retention requests and document approval/completion decisions." : "Keep retention queue under regular admin review.",
      failedIntegrations.length || failedNotifications.length
        ? "Investigate failed provider or notification events before relying on automated delivery."
        : "Provider event logs do not show immediate delivery failures.",
      "Export or review audit logs before compliance meetings where evidence of actions is required."
    ]
  };

  const context = {
    complianceCenter: center,
    recentAuditEvents: auditEvents.map((event) => ({
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actor: event.actor?.name ?? "System",
      createdAt: event.createdAt.toISOString(),
      metadata: event.metadata
    })),
    deterministicBaseline: localReview
  };

  const openAiReview = await maybeGenerateOpenAiComplianceReview(context);
  const selectedReview = openAiReview ?? localReview;

  await writeAuditEvent({
    productUserId,
    action: "ai.compliance_review_generated",
    entityType: "Compliance",
    entityId: defaultTenantId,
    metadata: {
      name: "AI compliance review",
      provider: selectedReview.provider,
      model: selectedReview.model,
      compliancePosture: selectedReview.compliancePosture
    }
  });

  return selectedReview;
}

async function maybeGenerateOpenAiComplianceReview(context: unknown): Promise<AiComplianceReview | null> {
  if (process.env.NODE_ENV === "test" || !process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === "local") {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are an AI compliance review assistant for an Australian migration-agency CRM.",
            "Use only the supplied compliance center data, recent audit events, and deterministic baseline.",
            "Summarize operational compliance posture across privacy settings, retention, document security, notifications, integrations, and auditability.",
            "Do not provide legal advice, do not invent events, and keep recommendations suitable for admin review.",
            "Return only the structured output requested by the schema."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify(context)
        }
      ],
      text: {
        format: zodTextFormat(aiComplianceReviewSchema, "compliance_review")
      }
    });

    if (!response.output_parsed) {
      return null;
    }

    return {
      ...response.output_parsed,
      generatedAt: new Date().toISOString(),
      provider: "openai",
      model
    };
  } catch (error) {
    console.warn("OpenAI compliance review generation failed; using local fallback.", error);
    return null;
  }
}

export async function updateTenantSettings(input: TenantSettingsInput, productUserId?: string) {
  const tenant = await prisma.tenant.update({
    where: { id: defaultTenantId },
    data: {
      brandColor: input.brandColor,
      retentionYears: input.retentionYears,
      taxRate: input.taxRate,
      privacyContactEmail: input.privacyContactEmail,
      stripeMode: input.stripeMode,
      docusignMode: input.docusignMode,
      emailProvider: input.emailProvider
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "tenant.settings_updated",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { name: tenant.name }
  });

  return getComplianceCenter();
}

export async function createRetentionRequest(input: RetentionRequestInput, productUserId?: string) {
  const request = await prisma.retentionRequest.create({
    data: {
      tenantId: defaultTenantId,
      clientId: input.clientId,
      requestedById: productUserId ? productUserToDbUser[productUserId] : undefined,
      action: input.action,
      reason: input.reason
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "retention.requested",
    entityType: "RetentionRequest",
    entityId: request.id,
    metadata: { name: input.action, status: request.status }
  });

  return getComplianceCenter();
}

export async function decideRetentionRequest(
  retentionRequestId: string,
  input: RetentionDecisionInput,
  productUserId?: string
) {
  const now = new Date();
  const request = await prisma.retentionRequest.update({
    where: { id: retentionRequestId },
    data: {
      status: input.status,
      approvedById: input.status === "APPROVED" || input.status === "COMPLETED" ? productUserToDbUser[productUserId ?? "agency-admin-user"] : undefined,
      approvedAt: input.status === "APPROVED" || input.status === "COMPLETED" ? now : undefined,
      completedAt: input.status === "COMPLETED" ? now : undefined
    }
  });

  if (input.status === "COMPLETED" && request.action === "ERASURE" && request.clientId) {
    await executeClientErasure(request.clientId, productUserId);
  }

  await writeAuditEvent({
    productUserId,
    action: `retention.${input.status.toLowerCase()}`,
    entityType: "RetentionRequest",
    entityId: request.id,
    metadata: { name: request.action, status: request.status }
  });

  return getComplianceCenter();
}

async function withFallback<T>(fallback: unknown, action: () => Promise<T>) {
  try {
    return await action();
  } catch {
    return fallback as T;
  }
}

function progressForStage(stage: string) {
  const progressByStage: Record<string, number> = {
    INTAKE: 18,
    DOCUMENTS: 46,
    LODGEMENT: 72,
    CASE_OFFICER_REQUEST: 82,
    DECISION: 94,
    ARCHIVED: 100
  };

  return progressByStage[stage] ?? 0;
}

function resolvePortalClientId(productUserId?: string) {
  return productUserId?.startsWith(portalUserPrefix)
    ? productUserId.slice(portalUserPrefix.length)
    : undefined;
}

function emptyPortalSummary(clientName: string) {
  return {
    hasMatter: false,
    matterId: "",
    clientName,
    matterTitle: "No active matter yet",
    stage: "INTAKE",
    progress: 0,
    outstandingDocuments: 0,
    nextStep: "Your migration team has not opened a matter for this portal account yet.",
    invoice: {
      number: "No invoice",
      amount: 0,
      status: "NONE",
      dueOn: ""
    },
    documents: []
  };
}

function normalizeFallbackPortalSummary(): PortalSummaryData {
  const invoice = fallbackPortalSummary.invoice ?? {
    id: undefined,
    number: "No invoice",
    amount: 0,
    status: "NONE",
    dueOn: ""
  };

  return {
    hasMatter: true,
    matterId: "matter-001",
    clientName: fallbackPortalSummary.clientName,
    matterTitle: fallbackPortalSummary.matterTitle,
    stage: fallbackPortalSummary.stage,
    progress: fallbackPortalSummary.progress,
    outstandingDocuments: fallbackPortalSummary.outstandingDocuments,
    nextStep: fallbackPortalSummary.nextStep,
    invoice: {
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount,
      status: invoice.status,
      dueOn: invoice.dueOn
    },
    documents: fallbackPortalSummary.documents.map((document) => ({
      id: document.id,
      title: document.title,
      status: document.status,
      updatedAt: document.updatedAt,
      documentCount: 0,
      latestDocument: null
    }))
  };
}

function nextPortalStep(checklistItems: Array<{ title: string; status: string }>) {
  const outstanding = checklistItems.find((item) => item.status !== "VERIFIED");

  if (!outstanding) {
    return "All requested documents are verified. Your agent will confirm the next stage.";
  }

  if (outstanding.status === "REJECTED") {
    return `Please upload a replacement for ${outstanding.title}.`;
  }

  if (outstanding.status === "RECEIVED") {
    return `${outstanding.title} is received and awaiting agent verification.`;
  }

  return `Upload ${outstanding.title}.`;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
}

function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()];
}

function sumBy<T>(items: T[], getKey: (item: T) => string, getValue: (item: T) => number) {
  const sums = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    sums.set(key, (sums.get(key) ?? 0) + getValue(item));
  }

  return [...sums.entries()];
}

function reportRowsByType(reports: Awaited<ReturnType<typeof getReports>>) {
  return {
    pipeline: reports.pipelineByStage.map((row) => ({
      stage: row.stage,
      count: row.count
    })),
    revenue: reports.revenueBySubclass.map((row) => ({
      subclass: row.subclass,
      revenue: row.revenue
    })),
    sla: reports.slaBreaches.map((row) => ({
      matterTitle: row.matterTitle,
      taskTitle: row.taskTitle,
      owner: row.owner,
      daysOverdue: row.daysOverdue
    })),
    deadlines: reports.upcomingDeadlines.map((row) => ({
      matterTitle: row.matterTitle,
      clientName: row.clientName,
      label: row.label,
      date: row.date,
      daysAway: row.daysAway
    })),
    workload: reports.workloadByOwner.map((row) => ({
      owner: row.owner,
      openTasks: row.openTasks
    }))
  } satisfies Record<ReportExportType, Array<Record<string, string | number>>>;
}

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) {
    return "No data\n";
  }

  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? "")).join(","))
  ];

  return `${lines.join("\n")}\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function auditEntityLabel(metadata: unknown, entityId: string) {
  const value = metadata as { title?: string; number?: string; name?: string } | null;
  return String(value?.title ?? value?.number ?? value?.name ?? entityId);
}

function maskPassport(passportNumber: string) {
  const trimmed = passportNumber.trim();

  if (trimmed.length <= 4) {
    return trimmed;
  }

  return `${trimmed.slice(0, 3)}****${trimmed.slice(-1)}`;
}

function scanUploadedDocument(fileName: string, fileSize: number) {
  const suspicious = /virus|malware|infected/i.test(fileName);

  if (suspicious) {
    return {
      status: "INFECTED" as const,
      provider: "mock-av",
      message: "Mock AV detected a suspicious file name pattern."
    };
  }

  if (fileSize > 25 * 1024 * 1024) {
    return {
      status: "FAILED" as const,
      provider: "mock-av",
      message: "File exceeds configured scan limit."
    };
  }

  return {
    status: "CLEAN" as const,
    provider: "mock-av",
    message: "No threats detected."
  };
}

function checksumFor(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function persistUploadedDocument(matterId: string, input: DocumentUploadInput) {
  const safeFileName = input.fileName.replaceAll(/[^a-z0-9._-]/gi, "_");
  const storageDir = path.join(process.cwd(), "uploads", defaultTenantId, matterId);
  const storageKey = path.join("uploads", defaultTenantId, matterId, safeFileName);
  const content = input.fileContentBase64
    ? Buffer.from(input.fileContentBase64, "base64")
    : Buffer.from(`ASUN upload placeholder for ${input.fileName}\n`);

  await mkdir(storageDir, { recursive: true });
  await writeFile(path.join(storageDir, safeFileName), content);

  return {
    storageKey,
    checksum: checksumFor(`${matterId}:${safeFileName}:${content.toString("base64")}`)
  };
}

async function executeClientErasure(clientId: string, productUserId?: string) {
  const erasedAt = new Date().toISOString();
  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: `Erased Client ${clientId.slice(0, 8)}`,
      email: `erased-${clientId}@asun.local`,
      passportEncrypted: "erased",
      passportMasked: "ERASED",
      portalActive: false,
      consentStatus: "EXPIRED",
      conflictCheckStatus: "DECLINED"
    }
  });

  await writeAuditEvent({
    productUserId,
    action: "client.erased",
    entityType: "Client",
    entityId: clientId,
    metadata: { name: "Erased client record", erasedAt }
  });
}

function createSimplePdf(lines: string[]) {
  const escapedLines = lines.map((line) => line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)"));
  const content = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    ...escapedLines.flatMap((line, index) => [
      index === 0 ? "" : "0 -24 Td",
      `(${line || " "}) Tj`
    ]).filter(Boolean),
    "ET"
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}

function createXlsxBuffer(rows: Array<Record<string, string | number>>, sheetName: string) {
  const headers = Object.keys(rows[0] ?? { report: "No data" });
  const allRows = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
  const worksheetRows = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${xlsxColumnName(columnIndex + 1)}${rowIndex + 1}`;
          if (typeof value === "number") {
            return `<c r="${ref}"><v>${value}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const files: Record<string, string> = {
    "[Content_Types].xml": [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
      "</Types>"
    ].join(""),
    "_rels/.rels": [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
      "</Relationships>"
    ].join(""),
    "xl/workbook.xml": [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      `<sheets><sheet name="${escapeXml(sheetName.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>`,
      "</workbook>"
    ].join(""),
    "xl/_rels/workbook.xml.rels": [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
      "</Relationships>"
    ].join(""),
    "xl/worksheets/sheet1.xml": [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      `<sheetData>${worksheetRows}</sheetData>`,
      "</worksheet>"
    ].join("")
  };

  return createZipBuffer(files);
}

function createZipBuffer(files: Record<string, string>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  Object.entries(files).forEach(([fileName, content]) => {
    const name = Buffer.from(fileName);
    const data = Buffer.from(content);
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function xlsxColumnName(index: number) {
  let column = "";
  let current = index;
  while (current > 0) {
    current -= 1;
    column = String.fromCharCode(65 + (current % 26)) + column;
    current = Math.floor(current / 26);
  }
  return column;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function queueNotification({
  recipient,
  subject,
  body,
  provider
}: {
  recipient: string;
  subject: string;
  body: string;
  provider: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      tenantId: defaultTenantId,
      recipient,
      channel: "email",
      subject,
      body,
      status: "SENT",
      provider,
      sentAt: new Date()
    }
  });

  await prisma.integrationEvent.create({
    data: {
      tenantId: defaultTenantId,
      provider: "EMAIL",
      eventType: "notification.sent",
      externalId: notification.id,
      status: "sent",
      payload: {
        recipient,
        subject
      }
    }
  });

  return notification;
}

async function writeAuditEvent({
  productUserId,
  action,
  entityType,
  entityId,
  metadata
}: {
  productUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
}) {
  await prisma.auditEvent.create({
    data: {
      tenantId: defaultTenantId,
      actorUserId: productUserId ? productUserToDbUser[productUserId] : undefined,
      action,
      entityType,
      entityId,
      metadata
    }
  });
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      tenantId: defaultTenantId,
      number: {
        startsWith: `INV-${year}-`
      }
    }
  });
  return `INV-${year}-${String(count + 1001).padStart(4, "0")}`;
}

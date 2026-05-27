import { prisma } from "../lib/prisma.js";
import {
  auditEvents as fallbackAuditEvents,
  clients as fallbackClients,
  dashboard as fallbackDashboard,
  matters as fallbackMatters,
  portalSummary as fallbackPortalSummary
} from "../data/demo-data.js";

const defaultTenantId = "tenant-asun-demo";

const demoUserToDbUser: Record<string, string> = {
  "asun-admin-demo": "user-asun-admin",
  "agency-admin-demo": "user-agency-admin",
  "rma-demo": "user-rma",
  "case-officer-demo": "user-case-officer",
  "finance-demo": "user-finance",
  "client-demo": "user-client"
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

export type MatterFromTemplateInput = {
  clientId: string;
  templateId: string;
  keyDate: string;
};

export type MatterStageInput = {
  stage: "INTAKE" | "DOCUMENTS" | "LODGEMENT" | "CASE_OFFICER_REQUEST" | "DECISION" | "ARCHIVED";
};

export type TaskStatusInput = {
  status: "OPEN" | "BLOCKED" | "DONE" | "SNOOZED";
};

export type ChecklistStatusInput = {
  status: "REQUESTED" | "RECEIVED" | "VERIFIED" | "REJECTED";
};

export type DocumentUploadInput = {
  checklistItemId: string;
  title: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | "JPG";
  fileSize: number;
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

export type WorkflowTemplateInput = {
  visaSubclass: string;
  name: string;
  description?: string;
};

export type AuditFilters = {
  action?: string;
  actor?: string;
  entity?: string;
  from?: string;
  to?: string;
};

export type ReportExportType = "pipeline" | "revenue" | "sla" | "deadlines" | "workload";

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

export async function createClient(input: ClientInput, demoUserId?: string) {
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
    demoUserId,
    action: "client.created",
    entityType: "Client",
    entityId: client.id,
    metadata: { name: client.name, email: client.email }
  });

  return getClientById(client.id);
}

export async function updateClient(clientId: string, input: ClientInput, demoUserId?: string) {
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
    demoUserId,
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
          updatedAt: document.updatedAt.toISOString().slice(0, 10)
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
              updatedAt: item.updatedAt.toISOString().slice(0, 10)
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
        updatedAt: document.updatedAt.toISOString().slice(0, 10)
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

export async function updateMatterStage(matterId: string, input: MatterStageInput, demoUserId?: string) {
  const matter = await prisma.matter.update({
    where: { id: matterId },
    data: { stage: input.stage }
  });

  await writeAuditEvent({
    demoUserId,
    action: "matter.stage_changed",
    entityType: "Matter",
    entityId: matter.id,
    metadata: { name: matter.title, stage: input.stage }
  });

  return getMatterById(matter.id);
}

export async function updateTaskStatus(taskId: string, input: TaskStatusInput, demoUserId?: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      completedAt: input.status === "DONE" ? new Date() : null
    }
  });

  await writeAuditEvent({
    demoUserId,
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
  demoUserId?: string
) {
  const checklistItem = await prisma.checklistItem.update({
    where: { id: checklistItemId },
    data: {
      status: input.status,
      verifiedById: input.status === "VERIFIED" ? demoUserToDbUser[demoUserId ?? "rma-demo"] : null,
      verifiedAt: input.status === "VERIFIED" ? new Date() : null
    }
  });

  await writeAuditEvent({
    demoUserId,
    action: "checklist.status_changed",
    entityType: "ChecklistItem",
    entityId: checklistItem.id,
    metadata: { name: checklistItem.title, status: input.status }
  });

  return getMatterById(checklistItem.matterId);
}

export async function uploadMatterDocument(
  matterId: string,
  input: DocumentUploadInput,
  demoUserId?: string
) {
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, tenantId: defaultTenantId }
  });

  if (!matter) {
    throw new Error("Matter not found");
  }

  const checklistItem = await prisma.checklistItem.findFirst({
    where: {
      id: input.checklistItemId,
      matterId,
      tenantId: defaultTenantId
    }
  });

  if (!checklistItem) {
    throw new Error("Checklist item not found");
  }

  const document = await prisma.document.create({
    data: {
      tenantId: defaultTenantId,
      matterId,
      checklistItemId: checklistItem.id,
      title: input.title,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      storageKey: `demo/${matterId}/${input.fileName}`,
      status: "RECEIVED",
      uploadedById: demoUserId ? demoUserToDbUser[demoUserId] : undefined
    }
  });

  await prisma.checklistItem.update({
    where: { id: checklistItem.id },
    data: { status: "RECEIVED" }
  });

  await writeAuditEvent({
    demoUserId,
    action: "document.uploaded",
    entityType: "Document",
    entityId: document.id,
    metadata: { name: document.title, fileName: document.fileName }
  });

  return getMatterById(matterId);
}

export async function reviewDocument(documentId: string, input: DocumentReviewInput, demoUserId?: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId: defaultTenantId }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const reviewedDocument = await prisma.document.update({
    where: { id: document.id },
    data: {
      status: input.status,
      verifiedById: input.status === "VERIFIED" ? demoUserToDbUser[demoUserId ?? "rma-demo"] : null
    }
  });

  if (reviewedDocument.checklistItemId) {
    await prisma.checklistItem.update({
      where: { id: reviewedDocument.checklistItemId },
      data: {
        status: input.status,
        verifiedById: input.status === "VERIFIED" ? demoUserToDbUser[demoUserId ?? "rma-demo"] : null,
        verifiedAt: input.status === "VERIFIED" ? new Date() : null
      }
    });
  }

  await writeAuditEvent({
    demoUserId,
    action: input.status === "VERIFIED" ? "document.verified" : "document.rejected",
    entityType: "Document",
    entityId: reviewedDocument.id,
    metadata: { name: reviewedDocument.title, status: input.status }
  });

  return getMatterById(reviewedDocument.matterId);
}

export async function createMatterInvoice(matterId: string, input: InvoiceInput, demoUserId?: string) {
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
    demoUserId,
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

export async function payInvoice(invoiceId: string, demoUserId?: string) {
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
    demoUserId,
    action: "payment.succeeded",
    entityType: "Payment",
    entityId: invoice.id,
    metadata: {
      number: invoice.number,
      amount: String(invoice.total)
    }
  });

  await writeAuditEvent({
    demoUserId,
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

export async function createMatterMessage(matterId: string, input: MessageInput, demoUserId?: string) {
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
      senderId: demoUserId ? demoUserToDbUser[demoUserId] : undefined,
      visibility: input.visibility,
      body: input.body
    }
  });

  await writeAuditEvent({
    demoUserId,
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

export async function exportReportCsv(type: ReportExportType, demoUserId?: string) {
  const reports = await getReports();
  const rowsByType: Record<ReportExportType, Array<Record<string, string | number>>> = {
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
  };

  await writeAuditEvent({
    demoUserId,
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

export async function createWorkflowTemplate(input: WorkflowTemplateInput, demoUserId?: string) {
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
    demoUserId,
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

export async function createMatterFromTemplate(input: MatterFromTemplateInput, demoUserId?: string) {
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
    demoUserId,
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
  return withFallback(fallbackAuditEvents as unknown, async () => {
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

export async function getPortalSummary() {
  return withFallback(fallbackPortalSummary as unknown, async () => {
    const matter = await prisma.matter.findFirst({
      where: { tenantId: defaultTenantId, clientId: "client-john-smith" },
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
      return fallbackPortalSummary;
    }

    const invoice = matter.invoices[0];

    return {
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
        : fallbackPortalSummary.invoice,
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

async function writeAuditEvent({
  demoUserId,
  action,
  entityType,
  entityId,
  metadata
}: {
  demoUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
}) {
  await prisma.auditEvent.create({
    data: {
      tenantId: defaultTenantId,
      actorUserId: demoUserId ? demoUserToDbUser[demoUserId] : undefined,
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

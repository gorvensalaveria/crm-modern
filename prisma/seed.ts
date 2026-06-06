import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tenantId = "tenant-asun-primary";
const users = {
  asunAdmin: "user-asun-admin",
  agencyAdmin: "user-agency-admin",
  rma: "user-rma",
  caseOfficer: "user-case-officer",
  finance: "user-finance",
  client: "user-client"
};
const clients = {
  john: "client-john-smith",
  priya: "client-priya-shah",
  miguel: "client-miguel-santos",
  johnDependant: "client-emma-smith"
};
const matters = {
  john482: "matter-john-482",
  priya186: "matter-priya-186",
  miguel485: "matter-miguel-485"
};

async function main() {
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: "ASUN Migrations Agency",
      slug: "asun-primary",
      brandColor: "#47624f",
      retentionYears: 7
    }
  });

  await Promise.all([
    upsertUser(users.asunAdmin, "Ava Reyes", "ava.reyes@asun.test", "ASUN_ADMIN"),
    upsertUser(users.agencyAdmin, "Mina Patel", "mina.patel@asun.test", "AGENCY_ADMIN"),
    upsertUser(users.rma, "Daniel Cho", "daniel.cho@asun.test", "RMA"),
    upsertUser(users.caseOfficer, "Sophie Nguyen", "sophie.nguyen@asun.test", "CASE_OFFICER"),
    upsertUser(users.finance, "Oliver Stone", "oliver.stone@asun.test", "FINANCE"),
    upsertUser(users.client, "John Smith", "john.smith@example.com", "CLIENT")
  ]);

  await Promise.all([
    upsertClient(
      clients.john,
      "John Smith",
      "john.smith@example.com",
      "1990-04-12T00:00:00.000Z",
      "United Kingdom",
      "X12****7",
      "SIGNED",
      "CLEAR",
      true
    ),
    upsertClient(
      clients.priya,
      "Priya Shah",
      "priya.shah@example.com",
      "1987-09-03T00:00:00.000Z",
      "India",
      "P45****1",
      "SIGNED",
      "CLEAR",
      true
    ),
    upsertClient(
      clients.miguel,
      "Miguel Santos",
      "miguel.santos@example.com",
      "1994-01-21T00:00:00.000Z",
      "Philippines",
      "M78****4",
      "PENDING",
      "ESCALATE",
      false
    ),
    upsertClient(
      clients.johnDependant,
      "Emma Smith",
      "emma.smith@example.com",
      "2018-11-07T00:00:00.000Z",
      "United Kingdom",
      "E11****9",
      "SIGNED",
      "CLEAR",
      false
    )
  ]);

  await prisma.familyLink.upsert({
    where: {
      primaryClientId_dependantClientId: {
        primaryClientId: clients.john,
        dependantClientId: clients.johnDependant
      }
    },
    update: {},
    create: {
      tenantId,
      primaryClientId: clients.john,
      dependantClientId: clients.johnDependant,
      relationship: "Child"
    }
  });

  await Promise.all([
    upsertMatter(
      matters.john482,
      clients.john,
      "482",
      "482 Temporary Skill Shortage",
      "DOCUMENTS",
      "ABC1234567",
      "2026-06-06T00:00:00.000Z"
    ),
    upsertMatter(
      matters.priya186,
      clients.priya,
      "186",
      "186 Employer Nomination Scheme",
      "LODGEMENT",
      "DEF4455667",
      "2026-06-12T00:00:00.000Z"
    ),
    upsertMatter(
      matters.miguel485,
      clients.miguel,
      "485",
      "485 Temporary Graduate",
      "INTAKE",
      null,
      "2026-05-31T00:00:00.000Z"
    )
  ]);

  await seedWorkflowTemplates();
  await seedMatterWork();
  await seedInvoices();
  await seedMessages();
  await seedIntegrationLogs();
  await seedAuditEvents();
}

async function upsertUser(id: string, name: string, email: string, role: any) {
  return prisma.user.upsert({
    where: { id },
    update: { name, email, role },
    create: {
      id,
      tenantId,
      name,
      email,
      role,
      status: "ACTIVE"
    }
  });
}

async function upsertClient(
  id: string,
  name: string,
  email: string,
  dateOfBirth: string,
  nationality: string,
  passportMasked: string,
  consentStatus: any,
  conflictCheckStatus: any,
  portalActive: boolean
) {
  return prisma.client.upsert({
    where: { id },
    update: {
      name,
      email,
      dateOfBirth,
      nationality,
      passportMasked,
      consentStatus,
      conflictCheckStatus,
      portalActive
    },
    create: {
      id,
      tenantId,
      name,
      email,
      dateOfBirth,
      nationality,
      passportEncrypted: `encrypted:${passportMasked}`,
      passportMasked,
      consentStatus,
      conflictCheckStatus,
      portalActive
    }
  });
}

async function upsertMatter(
  id: string,
  clientId: string,
  visaSubclass: string,
  title: string,
  stage: any,
  trn: string | null,
  keyDate: string
) {
  await prisma.matterKeyDate.deleteMany({ where: { matterId: id } });

  await prisma.matter.upsert({
    where: { id },
    update: {
      clientId,
      visaSubclass,
      title,
      stage,
      trn,
      primaryAgentId: users.rma,
      caseOfficerId: id === matters.miguel485 ? null : users.caseOfficer
    },
    create: {
      id,
      tenantId,
      clientId,
      visaSubclass,
      title,
      stage,
      trn,
      primaryAgentId: id === matters.miguel485 ? users.agencyAdmin : users.rma,
      caseOfficerId: id === matters.miguel485 ? null : users.caseOfficer
    }
  });

  await prisma.matterKeyDate.create({
    data: {
      tenantId,
      matterId: id,
      type: "visa_expiry",
      label: "Next critical date",
      date: keyDate,
      alertBeforeDays: 30
    }
  });
}

async function seedWorkflowTemplates() {
  const template = await prisma.workflowTemplate.upsert({
    where: {
      tenantId_visaSubclass_name: {
        tenantId,
        visaSubclass: "482",
        name: "482 TSS Standard Workflow"
      }
    },
    update: {},
    create: {
      tenantId,
      visaSubclass: "482",
      name: "482 TSS Standard Workflow",
      description: "Default checklist and tasks for a Temporary Skill Shortage matter."
    }
  });

  await prisma.workflowTemplateItem.deleteMany({ where: { templateId: template.id } });
  await prisma.workflowTemplateItem.createMany({
    data: [
      {
        templateId: template.id,
        type: "CHECKLIST",
        title: "Passport bio page",
        description: "Identity document required for lodgement.",
        stage: "DOCUMENTS",
        dueOffsetDays: 2,
        required: true
      },
      {
        templateId: template.id,
        type: "CHECKLIST",
        title: "Health check certificate",
        description: "Health evidence requested for subclass 482.",
        stage: "DOCUMENTS",
        dueOffsetDays: 7,
        required: true
      },
      {
        templateId: template.id,
        type: "TASK",
        title: "Prepare lodgement review",
        description: "RMA review before submission.",
        stage: "LODGEMENT",
        dueOffsetDays: 14,
        required: true
      }
    ]
  });
}

async function seedMatterWork() {
  await prisma.task.deleteMany({ where: { tenantId } });
  await prisma.document.deleteMany({ where: { tenantId } });
  await prisma.checklistItem.deleteMany({ where: { tenantId } });

  await prisma.task.createMany({
    data: [
      task(matters.john482, users.caseOfficer, "Verify health check certificate", "OPEN", "2026-05-27T00:00:00.000Z"),
      task(matters.priya186, users.rma, "Prepare 186 lodgement review", "OPEN", "2026-05-29T00:00:00.000Z"),
      task(matters.miguel485, users.agencyAdmin, "Resolve conflict check escalation", "BLOCKED", "2026-05-28T00:00:00.000Z")
    ]
  });

  const passport = await prisma.checklistItem.create({
    data: checklist(matters.john482, "Passport bio page", "Identity", "VERIFIED", "2026-05-24T00:00:00.000Z")
  });
  const health = await prisma.checklistItem.create({
    data: checklist(matters.john482, "Health check certificate", "Health", "RECEIVED", "2026-05-27T00:00:00.000Z")
  });
  const police = await prisma.checklistItem.create({
    data: checklist(matters.john482, "Police clearance", "Character", "REQUESTED", "2026-05-31T00:00:00.000Z")
  });

  await prisma.document.createMany({
    data: [
      document(matters.john482, passport.id, "Passport bio page", "passport-bio-page.pdf", "PDF", "VERIFIED", users.client, users.rma),
      document(matters.john482, health.id, "Health check certificate", "health-check.pdf", "PDF", "RECEIVED", users.client, null),
      document(matters.john482, police.id, "Police clearance", "police-clearance.pdf", "PDF", "REQUESTED", null, null)
    ]
  });
}

async function seedInvoices() {
  await prisma.payment.deleteMany({ where: { tenantId } });
  await prisma.invoice.deleteMany({ where: { tenantId } });

  const paidInvoice = await prisma.invoice.create({
    data: {
      id: "invoice-priya-186",
      tenantId,
      matterId: matters.priya186,
      clientId: clients.priya,
      number: "INV-2026-1002",
      status: "PAID",
      subtotal: 3818.18,
      tax: 381.82,
      total: 4200,
      dueOn: "2026-05-19T00:00:00.000Z",
      sentAt: "2026-05-10T00:00:00.000Z",
      paidAt: "2026-05-18T00:00:00.000Z"
    }
  });

  await prisma.invoice.create({
    data: {
      id: "invoice-john-482",
      tenantId,
      matterId: matters.john482,
      clientId: clients.john,
      number: "INV-2026-1001",
      status: "SENT",
      subtotal: 2500,
      tax: 250,
      total: 2750,
      dueOn: "2026-06-02T00:00:00.000Z",
      sentAt: "2026-05-26T00:00:00.000Z"
    }
  });

  await prisma.payment.create({
    data: {
      tenantId,
      invoiceId: paidInvoice.id,
      provider: "stripe",
      providerPaymentId: "pi_asun_186",
      amount: 4200,
      status: "SUCCEEDED",
      paidAt: "2026-05-18T00:00:00.000Z"
    }
  });
}

async function seedMessages() {
  await prisma.message.deleteMany({ where: { tenantId } });
  await prisma.message.createMany({
    data: [
      {
        tenantId,
        matterId: matters.john482,
        senderId: users.client,
        visibility: "EXTERNAL",
        body: "I uploaded the health check certificate this morning.",
        createdAt: "2026-05-27T08:35:00.000Z"
      },
      {
        tenantId,
        matterId: matters.priya186,
        senderId: users.rma,
        visibility: "EXTERNAL",
        body: "Can you confirm if the nomination documents are complete?",
        createdAt: "2026-05-26T17:10:00.000Z"
      }
    ]
  });
}

async function seedAuditEvents() {
  await prisma.auditEvent.deleteMany({ where: { tenantId } });
  await prisma.auditEvent.createMany({
    data: [
      {
        tenantId,
        actorUserId: users.rma,
        entityType: "Document",
        entityId: "passport-bio-page.pdf",
        action: "document.verified",
        metadata: { title: "Passport bio page" },
        createdAt: "2026-05-24T11:04:00.000Z"
      },
      {
        tenantId,
        actorUserId: users.caseOfficer,
        entityType: "Matter",
        entityId: matters.john482,
        action: "matter.stage_changed",
        metadata: { stage: "DOCUMENTS" },
        createdAt: "2026-05-25T09:22:00.000Z"
      },
      {
        tenantId,
        actorUserId: users.finance,
        entityType: "Invoice",
        entityId: "INV-2026-1001",
        action: "invoice.sent",
        metadata: { number: "INV-2026-1001" },
        createdAt: "2026-05-26T14:45:00.000Z"
      }
    ]
  });
}

function task(matterId: string, assigneeId: string, title: string, status: any, dueOn: string) {
  return {
    tenantId,
    matterId,
    assigneeId,
    title,
    status,
    dueOn
  };
}

function checklist(matterId: string, title: string, category: string, status: any, dueOn: string) {
  return {
    tenantId,
    matterId,
    title,
    category,
    status,
    required: true,
    dueOn,
    verifiedById: status === "VERIFIED" ? users.rma : null,
    verifiedAt: status === "VERIFIED" ? "2026-05-24T10:30:00.000Z" : null
  };
}

function document(
  matterId: string,
  checklistItemId: string,
  title: string,
  fileName: string,
  fileType: string,
  status: any,
  uploadedById: string | null,
  verifiedById: string | null
) {
  return {
    tenantId,
    matterId,
    checklistItemId,
    title,
    fileName,
    fileType,
    fileSize: 512000,
    storageKey: `uploads/${fileName}`,
    storageProvider: "local",
    checksum: `sha256-asun-${fileName.replaceAll(/[^a-z0-9]/gi, "").toLowerCase()}`,
    scanStatus: "CLEAN",
    scanProvider: "mock-av",
    scanMessage: "No threats detected.",
    scannedAt: "2026-05-24T10:00:00.000Z",
    status,
    uploadedById,
    verifiedById,
    verifiedAt: verifiedById ? "2026-05-24T10:30:00.000Z" : null
  };
}

async function seedIntegrationLogs() {
  await prisma.notification.deleteMany({ where: { tenantId } });
  await prisma.integrationEvent.deleteMany({ where: { tenantId } });
  await prisma.retentionRequest.deleteMany({ where: { tenantId } });

  await prisma.notification.createMany({
    data: [
      {
        tenantId,
        recipient: "john.smith@example.com",
        channel: "email",
        subject: "Document verified",
        body: "Your passport bio page was verified.",
        status: "SENT",
        provider: "mock",
        sentAt: "2026-05-24T11:05:00.000Z"
      },
      {
        tenantId,
        recipient: "oliver.stone@asun.test",
        channel: "email",
        subject: "Invoice payment received",
        body: "Payment was received for INV-2026-1002.",
        status: "SENT",
        provider: "mock",
        sentAt: "2026-05-18T13:00:00.000Z"
      }
    ]
  });

  await prisma.integrationEvent.createMany({
    data: [
      {
        tenantId,
        provider: "EMAIL",
        eventType: "notification.sent",
        status: "sent",
        payload: { subject: "Document verified" }
      },
      {
        tenantId,
        provider: "STRIPE",
        eventType: "payment_intent.succeeded",
        externalId: "pi_seed_priya_186",
        status: "succeeded",
        payload: { invoiceId: "invoice-priya-186" }
      }
    ]
  });

  await prisma.retentionRequest.create({
    data: {
      tenantId,
      clientId: clients.miguel,
      requestedById: users.agencyAdmin,
      action: "ARCHIVE_REVIEW",
      reason: "Review retention status for inactive intake matter.",
      status: "REQUESTED"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

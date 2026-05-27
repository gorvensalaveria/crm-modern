import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const tenantId = "tenant-asun-demo";
const integrationEmailPrefix = "integration";
const createdEntityIds = new Set<string>();

async function ensureIntegrationSeed() {
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: "ASUN Migrations Demo Agency",
      slug: "asun-demo",
      brandColor: "#47624f",
      retentionYears: 7
    }
  });

  await Promise.all([
    upsertUser("user-rma", "Daniel Cho", "daniel.cho@asun.test", "RMA"),
    upsertUser("user-case-officer", "Sophie Nguyen", "sophie.nguyen@asun.test", "CASE_OFFICER"),
    upsertUser("user-finance", "Oliver Stone", "oliver.stone@asun.test", "FINANCE")
  ]);

  const template = await prisma.workflowTemplate.upsert({
    where: {
      tenantId_visaSubclass_name: {
        tenantId,
        visaSubclass: "482",
        name: "482 TSS Standard Workflow"
      }
    },
    update: { active: true },
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

async function upsertUser(id: string, name: string, email: string, role: "RMA" | "CASE_OFFICER" | "FINANCE") {
  await prisma.user.upsert({
    where: { id },
    update: { name, email, role, status: "ACTIVE" },
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

async function cleanupIntegrationData() {
  const clients = await prisma.client.findMany({
    where: {
      tenantId,
      email: {
        startsWith: integrationEmailPrefix,
        endsWith: "@asun.integration.test"
      }
    },
    select: {
      id: true,
      matters: {
        select: {
          id: true,
          documents: { select: { id: true } },
          invoices: { select: { id: true } }
        }
      }
    }
  });

  for (const client of clients) {
    createdEntityIds.add(client.id);
    for (const matter of client.matters) {
      createdEntityIds.add(matter.id);
      matter.documents.forEach((document) => createdEntityIds.add(document.id));
      matter.invoices.forEach((invoice) => createdEntityIds.add(invoice.id));
    }
  }

  if (createdEntityIds.size) {
    await prisma.auditEvent.deleteMany({
      where: {
        tenantId,
        entityId: { in: [...createdEntityIds] }
      }
    });
  }

  await prisma.client.deleteMany({
    where: {
      tenantId,
      email: {
        startsWith: integrationEmailPrefix,
        endsWith: "@asun.integration.test"
      }
    }
  });

  createdEntityIds.clear();
}

beforeAll(async () => {
  await ensureIntegrationSeed();
  await cleanupIntegrationData();
});

afterAll(async () => {
  await cleanupIntegrationData();
  await prisma.$disconnect();
});

describe("ASUN Migrations API", () => {
  it("returns the service health payload", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toEqual({
      data: {
        status: "ok",
        service: "asun-migrations-api"
      }
    });
  });

  it("creates a demo session for a known presentation user", async () => {
    const response = await request(app)
      .post("/api/demo-session")
      .send({ userId: "rma-demo" })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: "rma-demo",
      role: "RMA"
    });
  });

  it("returns a typed 404 for an unknown demo user", async () => {
    const response = await request(app)
      .post("/api/demo-session")
      .send({ userId: "missing-demo" })
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: "DEMO_404",
        message: "Demo user not found"
      }
    });
  });

  it("blocks client demo users from staff-only billing APIs before repository access", async () => {
    const response = await request(app)
      .get("/api/invoices")
      .set("x-demo-user-id", "client-demo")
      .expect(403);

    expect(response.body).toEqual({
      error: {
        code: "RBAC_403",
        message: "Role CLIENT cannot access this API endpoint"
      }
    });
  });

  it("validates client creation payloads consistently", async () => {
    const response = await request(app)
      .post("/api/clients")
      .set("x-demo-user-id", "rma-demo")
      .send({})
      .expect(400);

    expect(response.body.error).toMatchObject({
      code: "VALIDATION_400"
    });
    expect(response.body.error.message).toContain("expected string");
  });

  it("returns a consistent validation error for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/clients")
      .set("x-demo-user-id", "rma-demo")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_400",
        message: "Malformed JSON request body"
      }
    });
  });

  it("returns a typed 404 for unknown API routes", async () => {
    const response = await request(app).get("/api/not-a-real-route").expect(404);

    expect(response.body).toEqual({
      error: {
        code: "API_404",
        message: "API route not found: GET /not-a-real-route"
      }
    });
  });

  it("runs the core CRM workflow from client intake to paid invoice", async () => {
    const unique = Date.now();
    const clientResponse = await request(app)
      .post("/api/clients")
      .set("x-demo-user-id", "rma-demo")
      .send({
        name: "Integration Client",
        email: `${integrationEmailPrefix}-${unique}@asun.integration.test`,
        dateOfBirth: "1991-03-18",
        nationality: "United Kingdom",
        passportNumber: "T1234567",
        consentStatus: "SIGNED",
        conflictCheckStatus: "CLEAR",
        portalActive: true
      })
      .expect(201);

    const clientId = clientResponse.body.data.id as string;
    createdEntityIds.add(clientId);
    expect(clientResponse.body.data).toMatchObject({
      id: clientId,
      name: "Integration Client",
      passportMasked: "T12****7"
    });

    const templatesResponse = await request(app)
      .get("/api/workflow-templates")
      .set("x-demo-user-id", "rma-demo")
      .expect(200);
    const template = templatesResponse.body.data.find((item: { visaSubclass: string }) => item.visaSubclass === "482");
    expect(template).toBeDefined();

    const matterResponse = await request(app)
      .post("/api/matters/from-template")
      .set("x-demo-user-id", "rma-demo")
      .send({
        clientId,
        templateId: template.id,
        keyDate: "2099-07-01"
      })
      .expect(201);

    const matterId = matterResponse.body.data.id as string;
    createdEntityIds.add(matterId);
    expect(matterResponse.body.data).toMatchObject({
      id: matterId,
      clientId,
      visaSubclass: "482",
      stage: "INTAKE"
    });

    const matterDetailResponse = await request(app)
      .get(`/api/matters/${matterId}`)
      .set("x-demo-user-id", "rma-demo")
      .expect(200);
    const checklistItem = matterDetailResponse.body.data.checklistItems[0];
    expect(checklistItem).toMatchObject({
      title: "Passport bio page",
      status: "REQUESTED"
    });

    const uploadResponse = await request(app)
      .post(`/api/matters/${matterId}/documents`)
      .set("x-demo-user-id", "case-officer-demo")
      .send({
        checklistItemId: checklistItem.id,
        title: "Passport bio page",
        fileName: "passport.pdf",
        fileType: "PDF",
        fileSize: 128000
      })
      .expect(201);

    const document = uploadResponse.body.data.documents.find((item: { title: string }) => item.title === "Passport bio page");
    createdEntityIds.add(document.id);
    expect(document).toMatchObject({
      status: "RECEIVED",
      uploadedBy: "Sophie Nguyen"
    });

    const reviewResponse = await request(app)
      .patch(`/api/documents/${document.id}/review`)
      .set("x-demo-user-id", "rma-demo")
      .send({ status: "VERIFIED" })
      .expect(200);

    expect(reviewResponse.body.data.documents.find((item: { id: string }) => item.id === document.id)).toMatchObject({
      status: "VERIFIED",
      verifiedBy: "Daniel Cho"
    });

    const invoiceResponse = await request(app)
      .post(`/api/matters/${matterId}/invoices`)
      .set("x-demo-user-id", "finance-demo")
      .send({
        description: "Professional service fee",
        subtotal: 1000,
        tax: 100,
        dueOn: "2099-07-15",
        status: "SENT"
      })
      .expect(201);

    const invoice = invoiceResponse.body.data.invoices[0];
    createdEntityIds.add(invoice.id);
    expect(invoice).toMatchObject({
      amount: 1100,
      status: "SENT"
    });

    const paymentResponse = await request(app)
      .post(`/api/invoices/${invoice.id}/pay`)
      .set("x-demo-user-id", "client-demo")
      .expect(200);

    expect(paymentResponse.body.data.invoices.find((item: { id: string }) => item.id === invoice.id)).toMatchObject({
      status: "PAID"
    });

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        tenantId,
        entityId: { in: [clientId, matterId, document.id, invoice.id] }
      },
      select: { action: true }
    });

    expect(auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "client.created",
        "matter.created_from_template",
        "document.uploaded",
        "document.verified",
        "invoice.created",
        "invoice.paid"
      ])
    );
  });
});

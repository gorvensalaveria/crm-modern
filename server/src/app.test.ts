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
      OR: [
        {
          email: {
            startsWith: integrationEmailPrefix,
            endsWith: "@asun.integration.test"
          }
        },
        {
          id: {
            in: [...createdEntityIds]
          }
        }
      ]
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

    const intakePlanResponse = await request(app)
      .post("/api/matters/ai-intake-plan")
      .set("x-demo-user-id", "rma-demo")
      .send({
        clientId,
        templateId: template.id,
        keyDate: "2099-07-01"
      })
      .expect(200);

    expect(intakePlanResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      recommendedVisaSubclass: "482",
      intakeRisk: expect.any(String),
      summary: expect.stringContaining("Integration Client")
    });
    expect(intakePlanResponse.body.data.suggestedTasks.length).toBeGreaterThan(0);
    expect(intakePlanResponse.body.data.suggestedChecklistItems.length).toBeGreaterThan(0);

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

    const taskCreateResponse = await request(app)
      .post(`/api/matters/${matterId}/tasks`)
      .set("x-demo-user-id", "rma-demo")
      .send({
        title: "Call client about new evidence",
        description: "Confirm whether additional identity evidence is available.",
        dueOn: "2099-07-05"
      })
      .expect(201);

    expect(taskCreateResponse.body.data.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Call client about new evidence",
          status: "OPEN"
        })
      ])
    );
    const createdTask = taskCreateResponse.body.data.tasks.find(
      (item: { title: string }) => item.title === "Call client about new evidence"
    );

    const checklistCreateResponse = await request(app)
      .post(`/api/matters/${matterId}/checklist-items`)
      .set("x-demo-user-id", "rma-demo")
      .send({
        title: "Updated passport scan",
        category: "IDENTITY",
        dueOn: "2099-07-05",
        required: true
      })
      .expect(201);

    expect(checklistCreateResponse.body.data.checklistItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Updated passport scan",
          status: "REQUESTED"
        })
      ])
    );
    const createdChecklist = checklistCreateResponse.body.data.checklistItems.find(
      (item: { title: string }) => item.title === "Updated passport scan"
    );

    const uploadResponse = await request(app)
      .post(`/api/matters/${matterId}/documents`)
      .set("x-demo-user-id", "case-officer-demo")
      .send({
        checklistItemId: checklistItem.id,
        title: "Passport bio page",
        fileName: "passport.pdf",
        fileType: "PDF",
        fileSize: 128000,
        fileContentBase64: Buffer.from("Integration PDF content").toString("base64")
      })
      .expect(201);

    const document = uploadResponse.body.data.documents.find((item: { title: string }) => item.title === "Passport bio page");
    createdEntityIds.add(document.id);
    expect(document).toMatchObject({
      status: "RECEIVED",
      uploadedBy: "Sophie Nguyen",
      storageProvider: "local",
      scanStatus: "CLEAN"
    });
    expect(document.storageKey).toContain(matterId);
    expect(document.checksum).toHaveLength(64);

    const generalUploadResponse = await request(app)
      .post(`/api/matters/${matterId}/documents`)
      .set("x-demo-user-id", "case-officer-demo")
      .send({
        title: "General identity note",
        fileName: "general-note.pdf",
        fileType: "PDF",
        fileSize: 64000,
        fileContentBase64: Buffer.from("General matter document").toString("base64")
      })
      .expect(201);

    const generalDocument = generalUploadResponse.body.data.documents.find(
      (item: { title: string }) => item.title === "General identity note"
    );
    createdEntityIds.add(generalDocument.id);
    expect(generalDocument).toMatchObject({
      status: "RECEIVED",
      scanStatus: "CLEAN"
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

    const documentAiReviewResponse = await request(app)
      .post(`/api/documents/${document.id}/ai-review`)
      .set("x-demo-user-id", "rma-demo")
      .expect(200);

    expect(documentAiReviewResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      recommendation: expect.any(String),
      summary: expect.stringContaining("Passport bio page")
    });

    const invoiceResponse = await request(app)
      .post(`/api/matters/${matterId}/invoices`)
      .set("x-demo-user-id", "rma-demo")
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

    const aiBriefResponse = await request(app)
      .post(`/api/matters/${matterId}/ai-brief`)
      .set("x-demo-user-id", "rma-demo")
      .expect(200);

    expect(aiBriefResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      riskLevel: expect.any(String),
      summary: expect.stringContaining("Integration Client")
    });
    expect(aiBriefResponse.body.data.nextActions.length).toBeGreaterThan(0);
    expect(aiBriefResponse.body.data.clientMessageDraft).toContain("Hi Integration");

    const workflowSuggestionsResponse = await request(app)
      .post(`/api/matters/${matterId}/ai-workflow-suggestions`)
      .set("x-demo-user-id", "rma-demo")
      .expect(200);

    expect(workflowSuggestionsResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      recommendedStage: expect.any(String),
      stageRationale: expect.any(String)
    });
    expect(workflowSuggestionsResponse.body.data.suggestedTasks.length).toBeGreaterThan(0);
    expect(workflowSuggestionsResponse.body.data.suggestedChecklistItems.length).toBeGreaterThan(0);

    const messageDraftResponse = await request(app)
      .post(`/api/matters/${matterId}/ai-message-draft`)
      .set("x-demo-user-id", "rma-demo")
      .send({ intent: "DOCUMENT_REQUEST" })
      .expect(200);

    expect(messageDraftResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      intent: "DOCUMENT_REQUEST",
      draft: expect.stringContaining("Hi Integration")
    });

    const receiptResponse = await request(app)
      .get(`/api/invoices/${invoice.id}/receipt.pdf`)
      .set("x-demo-user-id", "finance-demo")
      .expect(200);

    expect(receiptResponse.headers["content-type"]).toContain("application/pdf");
    expect(receiptResponse.headers["content-disposition"]).toContain(`${invoice.number}-receipt.pdf`);

    const xlsxResponse = await request(app)
      .get("/api/reports/export-xlsx?type=pipeline")
      .set("x-demo-user-id", "rma-demo")
      .expect(200);

    expect(xlsxResponse.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const reportInsightsResponse = await request(app)
      .post("/api/reports/ai-insights")
      .set("x-demo-user-id", "rma-demo")
      .expect(200);

    expect(reportInsightsResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      overallHealth: expect.any(String),
      executiveSummary: expect.any(String)
    });
    expect(reportInsightsResponse.body.data.recommendedActions.length).toBeGreaterThan(0);

    const complianceReviewResponse = await request(app)
      .post("/api/compliance/ai-review")
      .set("x-demo-user-id", "agency-admin-demo")
      .expect(200);

    expect(complianceReviewResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      compliancePosture: expect.any(String),
      summary: expect.any(String)
    });
    expect(complianceReviewResponse.body.data.recommendedActions.length).toBeGreaterThan(0);

    const portalGuidanceResponse = await request(app)
      .post("/api/portal/ai-guidance")
      .set("x-demo-user-id", "client-demo")
      .expect(200);

    expect(portalGuidanceResponse.body.data).toMatchObject({
      provider: "local-demo-ai",
      model: "rules-v1",
      tone: expect.any(String),
      statusSummary: expect.any(String),
      messageDraft: expect.any(String)
    });
    expect(portalGuidanceResponse.body.data.importantNotes.length).toBeGreaterThan(0);

    const retentionResponse = await request(app)
      .post("/api/compliance/retention-requests")
      .set("x-demo-user-id", "agency-admin-demo")
      .send({
        clientId,
        action: "ERASURE",
        reason: "Integration test erasure completion"
      })
      .expect(201);

    await request(app)
      .patch(`/api/compliance/retention-requests/${retentionResponse.body.data.retentionRequests[0].id}`)
      .set("x-demo-user-id", "agency-admin-demo")
      .send({ status: "COMPLETED" })
      .expect(200);

    const erasedClient = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    expect(erasedClient.name).toMatch(/^Erased Client/);
    expect(erasedClient.portalActive).toBe(false);

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        tenantId,
        entityId: { in: [clientId, matterId, createdTask.id, createdChecklist.id, document.id, invoice.id] }
      },
      select: { action: true }
    });

    expect(auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "client.created",
        "ai.matter_intake_plan_generated",
        "matter.created_from_template",
        "task.created",
        "checklist.created",
        "document.uploaded",
        "document.verified",
        "ai.document_review_generated",
        "invoice.created",
        "invoice.paid",
        "ai.matter_brief_generated",
        "ai.workflow_suggestions_generated",
        "ai.message_draft_generated",
        "receipt.generated",
        "client.erased"
      ])
    );

    const reportInsightAudit = await prisma.auditEvent.findFirst({
      where: { tenantId, action: "ai.report_insights_generated" }
    });
    expect(reportInsightAudit).toBeTruthy();

    const complianceReviewAudit = await prisma.auditEvent.findFirst({
      where: { tenantId, action: "ai.compliance_review_generated" }
    });
    expect(complianceReviewAudit).toBeTruthy();

    const portalGuidanceAudit = await prisma.auditEvent.findFirst({
      where: { tenantId, action: "ai.portal_guidance_generated" }
    });
    expect(portalGuidanceAudit).toBeTruthy();
  });
});

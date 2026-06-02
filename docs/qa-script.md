# Browser QA Script

Use this script to manually QA the ASUN Migrations CRM in your browser after local setup.

## Preconditions

Run the app locally:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:5173
```

Optional automated checks:

```bash
npm run typecheck
npm run test
npm run build
```

Local document uploads are stored under `server/uploads/` during QA. This folder is intentionally ignored by git.

AI mode:

- With `OPENAI_API_KEY` and `AI_PROVIDER="openai"`, AI intake plans, briefs, workflow suggestions, message drafts, document reviews, report insights, compliance reviews, and portal guidance use OpenAI.
- Without a key, or with `AI_PROVIDER="local"`, AI features use deterministic local generation.

## 1. Landing Page And Product Roles

1. Open `http://localhost:5173`.
2. Confirm the page title area shows `ASUN Migrations`.
3. Open the `Role` dropdown.
4. Confirm these roles are available:
   - ASUN Platform Admin
   - Agency Admin
   - Registered Migration Agent
   - Case Officer
   - Finance Officer
   - Client Portal User
5. Choose `Registered Migration Agent`.
6. Click `Enter workspace`.

Expected result:

- You land on the staff dashboard.
- The sidebar shows staff navigation.
- The header shows the chosen role.

## 2. Dashboard

Role: `Registered Migration Agent`

1. Confirm metric cards render:
   - Active matters
   - Overdue tasks
   - Upcoming deadlines
   - Monthly revenue
   - Portal adoption
2. Confirm `Priority Tasks` renders.
3. Confirm `Pipeline Snapshot` renders.
4. Confirm `Alerts` and `Recent Client Messages` render.

Expected result:

- Dashboard data loads without errors.
- Charts and cards do not overlap.

## 3. Clients

Role: `Registered Migration Agent`

1. Go to `Clients`.
2. Confirm existing clients appear.
3. Open `John Smith`.
4. Confirm profile details, dependants, consent status, conflict status, and matters render.
5. Click edit.
6. Update a safe field, such as portal active or nationality.
7. Save.

Expected result:

- Client update succeeds.
- You return to or can view updated client details.
- Audit log later shows a `client.updated` event.

## 4. Create Client

Role: `Registered Migration Agent` or `Agency Admin`

1. Go to `Clients`.
2. Create a new client.
3. Use a unique email.
4. Use passport format like `Z1234567`.
5. Save.

Expected result:

- Client is created.
- Passport is masked in the UI.
- Duplicate email validation appears if the email already exists.

## 5. Matters And Workflow Templates

Role: `Registered Migration Agent`

1. Go to `Matters`.
2. Click to create a matter from template.
3. Select a client, workflow template, and target lodgement date.
4. Click `Generate Intake Plan`.
5. Review the AI intake plan.
6. Create the matter.
7. Open an existing matter, such as `482 Temporary Skill Shortage`.
8. Confirm the matter detail page renders:
   - stage
   - progress
   - tasks
   - checklist
   - document review
   - invoices
   - messages and notes
9. Change the stage.
10. Update a task status.
11. Update a checklist status.

Expected result:

- AI intake plan shows readiness checks, suggested tasks, suggested checklist items, client questions, compliance notes, and automation suggestions.
- Matter data refreshes.
- Status badges update.
- Audit events are written, including `ai.matter_intake_plan_generated` when the intake plan is generated.

## 6. Existing Matter Workspace

Role: `Registered Migration Agent`

1. Go to `Matters`.
2. Open an existing matter, such as `482 Temporary Skill Shortage`.
3. Confirm the matter detail page renders:
   - stage
   - progress
   - tasks
   - checklist
   - document review
   - invoices
   - messages and notes
4. Change the stage.
5. Update a task status.
6. Update a checklist status.

Expected result:

- Matter data refreshes.
- Status badges update.
- Audit events are written.

## 7. AI Matter Assistant

Role: `Registered Migration Agent`

1. Open a matter.
2. Click `Generate AI Brief`.
3. Review the generated case brief.

Expected result:

- AI summary appears without leaving the matter page.
- Provider metadata shows either `openai` plus the configured model, or `Local AI`.
- Risk level renders as `LOW`, `MEDIUM`, or `HIGH`.
- Blockers, next actions, compliance notes, automation suggestions, and a client message draft appear.
- Audit log records `ai.matter_brief_generated`.

## 8. AI Workflow Suggestions

Role: `Registered Migration Agent`

1. Open a matter with at least one task, checklist item, document, or invoice.
2. Click `Suggest Workflow Actions`.
3. Review the recommendation panel.

Expected result:

- A recommended stage appears with provider/model metadata.
- Stage rationale is based on the current matter data.
- Suggested tasks show title, priority, due-in-days, and description.
- Suggested checklist items show category, required/optional status, and reason.
- Automation suggestions and risk flags appear.
- No task, checklist item, or stage is changed automatically.
- Audit log records `ai.workflow_suggestions_generated`.

## 9. Document Upload, Local Storage, And Mock Virus Scan

Role: `Registered Migration Agent` or `Case Officer`

1. Open a matter.
2. In `Upload Document`, select a checklist item.
3. Enter a title such as `Updated passport scan`.
4. Choose a small local PDF, DOCX, JPG, or JPEG file.
5. Confirm the file name and type auto-fill.
6. Click `Upload`.

Expected result:

- The document appears in `Document Review`.
- Scan status shows `CLEAN`.
- Storage provider shows `local`.
- A storage key and checksum are visible in the document detail data/API response.
- Checklist status becomes `RECEIVED`.
- A notification log is created.

Negative test:

1. Upload a document with a suspicious filename such as `virus-passport.pdf`.

Expected result:

- Upload is blocked with a virus scan failure.
- A quarantine audit event is recorded.

## 10. Document Review

Role: `Registered Migration Agent`

1. Open a matter with a clean uploaded document.
2. Click `AI Review`.
3. Review the recommendation, findings, risks, compliance notes, and next steps.
4. Click `Verify`.

Expected result:

- AI document review appears inline.
- Document status becomes `VERIFIED`.
- Verified-by user appears.
- Checklist status syncs to `VERIFIED`.
- Notification and audit records are created.

Negative test:

1. Try to verify a document that did not pass scan.

Expected result:

- Verification is blocked.

## 11. Mock DocuSign E-Signature

Role: `Registered Migration Agent`

1. Open a matter.
2. Find a document with scan status `CLEAN`.
3. Click `Send E-Sign`.

Expected result:

- A mock envelope is created.
- A success message appears with an envelope ID.
- Document status moves into signing flow.
- Integration log records a `DOCUSIGN` event.
- Notification log records a signature request.

API callback check, optional:

```bash
curl -s -X POST http://localhost:4000/api/webhook/docusign/status \
  -H 'Content-Type: application/json' \
  -d '{"envelopeId":"env_mock_example","status":"completed"}'
```

Use a real envelope ID from the UI/API response if testing this callback directly.

## 12. Billing, Mock Stripe, And PDF Receipts

Role: `Finance Officer`

1. Click `Change role`.
2. Choose `Finance Officer`.
3. Go to `Billing`.
4. Confirm invoices render.
5. Pay a sent invoice if one is available.
6. For a paid invoice, click `Receipt PDF`.

Expected result:

- Invoice status changes to `PAID`.
- Latest payment details appear.
- A PDF receipt downloads for paid invoices.
- Audit log records payment events.

Optional checkout API check:

```bash
curl -s -X POST http://localhost:4000/api/checkout/session/create \
  -H 'Content-Type: application/json' \
  -H 'x-user-id: <finance-user-id>' \
  -d '{"invoiceId":"invoice-john-482"}'
```

Expected result:

- A mock Stripe checkout URL is returned.
- A `STRIPE` integration event is recorded.

## 13. Reports, CSV Export, And XLSX Export

Role: `Registered Migration Agent`, `Finance Officer`, or `Agency Admin`

1. Go to `Reports`.
2. Confirm these sections render:
   - pipeline
   - revenue
   - SLA breaches
   - upcoming deadlines
   - workload
3. Click `Generate Report Insights`.
4. Review the AI report insights panel.
5. Click CSV export buttons.
6. Click XLSX export buttons.

Expected result:

- AI report insights show overall health, executive summary, pipeline insights, revenue insights, deadline/SLA risks, workload risks, and recommended actions.
- CSV files download.
- XLSX files download and can be opened in a spreadsheet app.
- Audit log records `ai.report_insights_generated` and `report.exported`.

## 14. Workflow Admin

Role: `Agency Admin`

1. Switch to `Agency Admin`.
2. Go to `Workflows`.
3. Create a new workflow template.

Expected result:

- Template appears in the workflow list.
- Audit log records `workflow_template.created`.

## 15. Compliance Centre

Role: `Agency Admin` or `ASUN Platform Admin`

1. Go to `Compliance`.
2. Confirm these areas render:
   - Tenant & Compliance Settings
   - AI Compliance Review
   - Document Security
   - Retention & Erasure Requests
   - Integration & Notification Logs
3. Click `Generate Compliance Review`.
4. Review the AI compliance review panel.
5. Update tenant settings:
   - retention years
   - tax rate
   - privacy contact
   - provider modes
6. Save settings.

Expected result:

- AI compliance review shows posture, privacy notes, retention notes, document security notes, integration notes, audit findings, and recommended actions.
- Settings save.
- Audit log records `ai.compliance_review_generated` and `tenant.settings_updated`.

## 16. Retention And Erasure Requests

Role: `Agency Admin` or `ASUN Platform Admin`

1. Go to `Compliance`.
2. Create a request:
   - `Archive review`
   - or `Access/export request`
   - or `Erasure request`
3. Enter a reason.
4. Click `Create`.
5. Click `APPROVED`.
6. Click `COMPLETED`.

Expected result:

- Request status changes.
- Audit log records retention events:
  - `retention.requested`
  - `retention.approved`
  - `retention.completed`
- If the request type is `Erasure request` and has a client selected, the client record is safely anonymized instead of physically deleted.

## 17. Notification And Integration Logs

Role: `Agency Admin` or `ASUN Platform Admin`

1. Go to `Compliance`.
2. Review integration logs.
3. Confirm provider events appear for:
   - `EMAIL`
   - `STRIPE`
   - `DOCUSIGN`, after sending an e-sign envelope
4. Review notification logs.

Expected result:

- Logs show recent notification/integration activity.
- Events match actions performed during QA.

## 18. Audit Logs

Role: `Agency Admin`

1. Go to `Audit Logs`.
2. Filter by action.
3. Try actions such as:
   - `client.updated`
   - `document.uploaded`
   - `document.verified`
   - `ai.matter_brief_generated`
   - `signature.envelope_sent`
   - `stripe.checkout_created`
   - `tenant.settings_updated`
   - `retention.requested`
4. Filter by actor, such as `Daniel Cho` or `Mina Patel`.

Expected result:

- Audit results update correctly.

## 19. Client Portal

Role: `Client Portal User`

1. Click `Change role`.
2. Choose `Client Portal User`.
3. Confirm only portal navigation is available.
4. Confirm matter progress, requested documents, invoice, and secure message panel render.
5. Click `Generate Portal Guidance`.
6. Review the AI portal guidance panel.
7. Upload a requested document file.
8. Send a secure message.
9. Pay invoice if unpaid.

Expected result:

- AI portal guidance shows tone, status summary, next step, outstanding items, payment reminder, message draft, and important notes.
- Client can complete portal workflows.
- Staff-only pages are not visible.
- Audit log records `ai.portal_guidance_generated`.

## 20. AI Client Message Drafting

Role: `Registered Migration Agent`

1. Open a matter.
2. Scroll to `Messages & Notes`.
3. Click `Document request`, `Invoice follow-up`, or `Status update`.
4. Confirm the text area is populated with an editable draft.
5. Confirm visibility switches to `Client message`.
6. Save the message.
7. Change visibility to `Internal note`, type a manual note, and save it.

Expected result:

- Draft metadata shows either `openai` plus the configured model, or `Local AI`.
- AI client drafts save as `EXTERNAL`.
- Manual internal notes save as `INTERNAL`.
- Audit log records `ai.message_draft_generated`.
- Saved message appears in the matter message list.

## 21. RBAC Negative Tests

Role: `Client Portal User`

Manually visit:

```text
http://localhost:5173/app/billing
http://localhost:5173/app/audit
http://localhost:5173/app/compliance
http://localhost:5173/app/workflows
```

Expected result:

- Access denied page appears.

API negative check:

```bash
curl -s http://localhost:4000/api/compliance \
  -H 'x-user-id: <client-user-id>'
```

Expected result:

```json
{
  "error": {
    "code": "RBAC_403",
    "message": "Role CLIENT cannot access this API endpoint"
  }
}
```

## 22. Final Pass Criteria

The QA pass is successful when:

- all major pages load
- role navigation is correct
- client and matter workflows work
- AI Matter Assistant generates a useful case brief
- AI message drafting fills an editable message
- clean documents can be reviewed
- suspicious uploads are blocked
- mock e-sign envelope can be sent
- mock Stripe payment/checkout can be triggered
- paid invoice receipt PDF downloads
- CSV and XLSX report exports work
- compliance settings can be saved
- retention request lifecycle works and erasure anonymizes client data
- notifications and integration logs show activity
- audit logs capture important actions
- client role cannot access staff/admin areas

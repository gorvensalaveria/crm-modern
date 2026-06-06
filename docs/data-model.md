# Data Model

## Core Entities

### Tenant

Represents one migration agency using the SaaS platform.

Important fields:

- `id`
- `name`
- `slug`
- `brandColor`
- `retentionYears`
- `taxRate`
- `dataRegion`
- `privacyContactEmail`
- `deletionApproverRole`
- `stripeMode`
- `docusignMode`
- `emailProvider`
- `createdAt`
- `updatedAt`

### User

Represents staff users and client portal users.

Important fields:

- `id`
- `tenantId`
- `name`
- `email`
- `role`
- `status`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Roles:

- `ASUN_ADMIN`
- `AGENCY_ADMIN`
- `RMA`
- `CASE_OFFICER`
- `FINANCE`
- `CLIENT`

### Client

Represents a migration client.

Important fields:

- `id`
- `tenantId`
- `name`
- `email`
- `dateOfBirth`
- `nationality`
- `passportEncrypted`
- `passportMasked`
- `consentStatus`
- `conflictCheckStatus`
- `portalActive`
- `createdAt`
- `updatedAt`

### FamilyLink

Links clients and dependants.

Important fields:

- `id`
- `tenantId`
- `primaryClientId`
- `dependantClientId`
- `relationship`

### Matter

Represents a visa application or case.

Important fields:

- `id`
- `tenantId`
- `clientId`
- `visaSubclass`
- `title`
- `stage`
- `trn`
- `primaryAgentId`
- `caseOfficerId`
- `openedAt`
- `closedAt`
- `updatedAt`

Stages:

- `INTAKE`
- `DOCUMENTS`
- `LODGEMENT`
- `CASE_OFFICER_REQUEST`
- `DECISION`
- `ARCHIVED`

### MatterKeyDate

Tracks important matter dates.

Important fields:

- `id`
- `tenantId`
- `matterId`
- `type`
- `label`
- `date`
- `alertBeforeDays`

### Task

Represents work assigned to staff.

Important fields:

- `id`
- `tenantId`
- `matterId`
- `assigneeId`
- `title`
- `description`
- `status`
- `dueOn`
- `completedAt`
- `createdAt`
- `updatedAt`

Statuses:

- `OPEN`
- `BLOCKED`
- `DONE`
- `SNOOZED`

### ChecklistItem

Represents required steps or documents for a matter.

Important fields:

- `id`
- `tenantId`
- `matterId`
- `title`
- `category`
- `status`
- `required`
- `dueOn`
- `verifiedById`
- `verifiedAt`
- `createdAt`
- `updatedAt`

Statuses:

- `REQUESTED`
- `RECEIVED`
- `VERIFIED`
- `REJECTED`

### Document

Represents uploaded document metadata and local storage state.

Important fields:

- `id`
- `tenantId`
- `matterId`
- `checklistItemId`
- `title`
- `fileName`
- `fileType`
- `fileSize`
- `storageKey`
- `storageProvider`
- `checksum`
- `scanStatus`
- `scanProvider`
- `scanMessage`
- `scannedAt`
- `status`
- `uploadedById`
- `verifiedById`
- `verifiedAt`
- `createdAt`
- `updatedAt`

Statuses:

- `REQUESTED`
- `RECEIVED`
- `VERIFIED`
- `REJECTED`
- `SIGNING`

Scan statuses:

- `PENDING`
- `CLEAN`
- `INFECTED`
- `FAILED`

### SignatureEnvelope

Tracks e-signature requests.

Important fields:

- `id`
- `tenantId`
- `documentId`
- `provider`
- `providerEnvelopeId`
- `status`
- `signerEmail`
- `signingUrl`
- `certificateStorageKey`
- `sentAt`
- `completedAt`

### Invoice

Represents billing sent to a client.

Important fields:

- `id`
- `tenantId`
- `matterId`
- `clientId`
- `number`
- `status`
- `subtotal`
- `tax`
- `total`
- `dueOn`
- `sentAt`
- `paidAt`
- `createdAt`
- `updatedAt`

Statuses:

- `DRAFT`
- `SENT`
- `OVERDUE`
- `PAID`

### Payment

Represents payment records.

Important fields:

- `id`
- `tenantId`
- `invoiceId`
- `provider`
- `providerPaymentId`
- `amount`
- `status`
- `paidAt`
- `createdAt`

Statuses:

- `PENDING`
- `SUCCEEDED`
- `FAILED`

### Message

Represents secure communication.

Important fields:

- `id`
- `tenantId`
- `matterId`
- `senderId`
- `visibility`
- `body`
- `createdAt`

Visibility:

- `INTERNAL`
- `EXTERNAL`

### WorkflowTemplate

Defines visa subclass workflow templates.

Important fields:

- `id`
- `tenantId`
- `visaSubclass`
- `name`
- `description`
- `active`
- `createdAt`
- `updatedAt`

### WorkflowTemplateItem

Defines generated tasks and checklist items within a workflow template.

Important fields:

- `id`
- `templateId`
- `type`
- `title`
- `description`
- `stage`
- `dueOffsetDays`
- `required`

Types:

- `TASK`
- `CHECKLIST`

### Notification

Records outbound operational notifications.

Important fields:

- `id`
- `tenantId`
- `recipient`
- `channel`
- `subject`
- `body`
- `status`
- `provider`
- `sentAt`
- `createdAt`

### RetentionRequest

Tracks privacy, retention, and erasure workflows.

Important fields:

- `id`
- `tenantId`
- `clientId`
- `requestedById`
- `approvedById`
- `action`
- `reason`
- `status`
- `requestedAt`
- `approvedAt`
- `completedAt`

Statuses:

- `REQUESTED`
- `APPROVED`
- `REJECTED`
- `COMPLETED`

### IntegrationEvent

Records external provider activity.

Important fields:

- `id`
- `tenantId`
- `provider`
- `eventType`
- `externalId`
- `status`
- `payload`
- `receivedAt`

Providers:

- `STRIPE`
- `DOCUSIGN`
- `EMAIL`
- `VEVO`

### AuditEvent

Records material product actions.

Important fields:

- `id`
- `tenantId`
- `actorUserId`
- `entityType`
- `entityId`
- `action`
- `metadata`
- `ipAddress`
- `createdAt`

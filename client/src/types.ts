export type AppRole =
  | "ASUN_ADMIN"
  | "AGENCY_ADMIN"
  | "RMA"
  | "CASE_OFFICER"
  | "FINANCE"
  | "CLIENT";

export type AppUser = {
  id: string;
  name: string;
  role: AppRole;
  title: string;
  description: string;
  clientId?: string;
};

export type Matter = {
  id: string;
  clientName: string;
  visaSubclass: string;
  title: string;
  stage: string;
  progress: number;
  primaryAgent: string;
  caseOfficer: string;
  trn: string | null;
  keyDate: string;
  tasksOpen: number;
  tasksTotal: number;
  documents: DocumentRecord[];
  invoices: Invoice[];
};

export type MatterDetail = Matter & {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: "OPEN" | "BLOCKED" | "DONE" | "SNOOZED";
    dueOn: string;
    assignee: string;
    completedAt: string | null;
  }>;
  checklistItems: Array<{
    id: string;
    title: string;
    category: string;
    status: "REQUESTED" | "RECEIVED" | "VERIFIED" | "REJECTED";
    required: boolean;
    dueOn: string | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
    documentCount: number;
  }>;
  messages: Array<{
    id: string;
    sender: string;
    body: string;
    visibility: string;
    createdAt: string;
  }>;
};

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

export type AiMessageDraftIntent = "DOCUMENT_REQUEST" | "INVOICE_FOLLOW_UP" | "STATUS_UPDATE";

export type AiMessageDraft = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  intent: AiMessageDraftIntent;
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

export type MatterStage = "INTAKE" | "DOCUMENTS" | "LODGEMENT" | "CASE_OFFICER_REQUEST" | "DECISION" | "ARCHIVED";

export type AiWorkflowSuggestion = {
  generatedAt: string;
  provider: "openai" | "local-ai";
  model: string;
  recommendedStage: MatterStage;
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

export type WorkflowTemplate = {
  id: string;
  visaSubclass: string;
  name: string;
  description: string | null;
  itemCount: number;
  taskCount: number;
  checklistCount: number;
  items?: Array<{
    id: string;
    type: "TASK" | "CHECKLIST";
    title: string;
    description: string | null;
    stage: string;
    dueOffsetDays: number;
    required: boolean;
  }>;
};

export type WorkflowTemplatePayload = {
  visaSubclass: string;
  name: string;
  description: string;
};

export type MatterFromTemplatePayload = {
  clientId: string;
  templateId: string;
  keyDate: string;
};

export type DocumentUploadPayload = {
  checklistItemId?: string;
  title: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | "JPG";
  fileSize: number;
  fileContentBase64?: string;
};

export type InvoicePayload = {
  description: string;
  subtotal: number;
  tax: number;
  dueOn: string;
  status: "DRAFT" | "SENT";
};

export type MatterTaskPayload = {
  title: string;
  description?: string;
  dueOn: string;
};

export type MatterChecklistPayload = {
  title: string;
  category: string;
  dueOn?: string;
  required: boolean;
};

export type MessagePayload = {
  body: string;
  visibility: "INTERNAL" | "EXTERNAL";
};

export type DocumentRecord = {
  id: string;
  title: string;
  status: string;
  fileType: string;
  uploadedBy: string;
  verifiedBy: string | null;
  updatedAt: string;
  scanStatus?: string;
  scanMessage?: string | null;
  storageProvider?: string;
  storageKey?: string;
  checksum?: string | null;
  verifiedAt?: string | null;
};

export type Invoice = {
  id: string;
  number: string;
  clientName: string;
  matterId: string;
  amount: number;
  status: string;
  dueOn: string;
};

export type InvoiceRecord = Invoice & {
  matterTitle: string;
  visaSubclass: string;
  subtotal: number;
  tax: number;
  paidAt: string | null;
  latestPayment: {
    id: string;
    provider: string;
    status: string;
    amount: number;
    paidAt: string | null;
  } | null;
};

export type ClientRecord = {
  id: string;
  name: string;
  email: string;
  dob: string;
  nationality: string;
  passportMasked: string;
  consentStatus: string;
  conflictCheck: string;
  dependants: number;
  portalActive: boolean;
};

export type ClientPayload = {
  name: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  consentStatus: "SIGNED" | "PENDING" | "EXPIRED";
  conflictCheckStatus: "CLEAR" | "ESCALATE" | "DECLINED";
  portalActive: boolean;
};

export type ClientDetail = ClientRecord & {
  dependantList: Array<{
    id: string;
    name: string;
    relationship: string;
  }>;
  matters: Array<{
    id: string;
    title: string;
    visaSubclass: string;
    stage: string;
    primaryAgent: string;
    caseOfficer: string;
    tasksOpen: number;
    invoicesTotal: number;
  }>;
};

export type Dashboard = {
  metrics: {
    activeMatters: number;
    overdueTasks: number;
    upcomingDeadlines: number;
    monthlyRevenue: number;
    clientPortalAdoption: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueOn: string;
    assignee: string;
    matterId: string;
  }>;
  matters: Matter[];
  recentMessages: Array<{
    id: string;
    from: string;
    preview: string;
    matterTitle: string;
    receivedAt: string;
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    dueOn: string;
  }>;
};

export type Report = {
  pipelineByStage: Array<{ stage: string; count: number }>;
  revenueBySubclass: Array<{ subclass: string; revenue: number }>;
  slaBreaches: Array<{
    matterTitle: string;
    owner: string;
    daysOverdue: number;
    taskTitle: string;
  }>;
  upcomingDeadlines: Array<{
    matterTitle: string;
    clientName: string;
    label: string;
    date: string;
    daysAway: number;
  }>;
  workloadByOwner: Array<{
    owner: string;
    openTasks: number;
  }>;
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

export type PortalSummary = {
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

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityType: string;
  timestamp: string;
};

export type AuditFilters = {
  action?: string;
  actor?: string;
  entity?: string;
  from?: string;
  to?: string;
};

export type AuditResponse = {
  events: AuditEvent[];
  meta: {
    total: number;
    actions: string[];
    actors: string[];
  };
};

export type TenantSettingsPayload = {
  brandColor: string;
  retentionYears: number;
  taxRate: number;
  privacyContactEmail?: string;
  stripeMode: "mock" | "live";
  docusignMode: "mock" | "live";
  emailProvider: "mock" | "sendgrid" | "ses";
};

export type RetentionRequestPayload = {
  clientId?: string;
  action: "EXPORT" | "ERASURE" | "ARCHIVE_REVIEW";
  reason: string;
};

export type ComplianceCenter = {
  settings: TenantSettingsPayload & {
    tenantName: string;
    dataRegion: string;
    deletionApproverRole: string;
  };
  documentSecurity: {
    total: number;
    clean: number;
    pending: number;
    blocked: number;
    recent: Array<{
      id: string;
      title: string;
      status: string;
      scanStatus: string;
      storageProvider: string;
      scannedAt: string | null;
    }>;
  };
  notifications: Array<{
    id: string;
    recipient: string;
    subject: string;
    status: string;
    provider: string;
    sentAt: string | null;
    createdAt: string;
  }>;
  retentionRequests: Array<{
    id: string;
    clientName: string;
    action: string;
    reason: string;
    status: string;
    requestedBy: string;
    approvedBy: string | null;
    requestedAt: string;
    completedAt: string | null;
  }>;
  integrationEvents: Array<{
    id: string;
    provider: string;
    eventType: string;
    status: string;
    externalId: string | null;
    receivedAt: string;
  }>;
};

export type SignatureEnvelope = {
  id: string;
  envelopeId: string;
  documentId?: string;
  status: string;
  signingUrl?: string | null;
  completedAt?: string | null;
  certificateStorageKey?: string | null;
};

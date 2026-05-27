export type DemoRole =
  | "ASUN_ADMIN"
  | "AGENCY_ADMIN"
  | "RMA"
  | "CASE_OFFICER"
  | "FINANCE"
  | "CLIENT";

export type DemoUser = {
  id: string;
  name: string;
  role: DemoRole;
  title: string;
  description: string;
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

export type WorkflowTemplate = {
  id: string;
  visaSubclass: string;
  name: string;
  description: string | null;
  itemCount: number;
  taskCount: number;
  checklistCount: number;
};

export type MatterFromTemplatePayload = {
  clientId: string;
  templateId: string;
  keyDate: string;
};

export type DocumentUploadPayload = {
  checklistItemId: string;
  title: string;
  fileName: string;
  fileType: "PDF" | "DOCX" | "JPG";
  fileSize: number;
};

export type InvoicePayload = {
  description: string;
  subtotal: number;
  tax: number;
  dueOn: string;
  status: "DRAFT" | "SENT";
};

export type DocumentRecord = {
  id: string;
  title: string;
  status: string;
  fileType: string;
  uploadedBy: string;
  verifiedBy: string | null;
  updatedAt: string;
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

export type PortalSummary = {
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

export const demoUsers = [
  {
    id: "asun-admin-demo",
    name: "Ava Reyes",
    role: "ASUN_ADMIN",
    title: "ASUN Platform Admin",
    description: "Global SaaS administration, tenancy setup, templates, and audit visibility."
  },
  {
    id: "agency-admin-demo",
    name: "Mina Patel",
    role: "AGENCY_ADMIN",
    title: "Agency Admin",
    description: "Agency configuration, team management, workflows, reports, and audit controls."
  },
  {
    id: "rma-demo",
    name: "Daniel Cho",
    role: "RMA",
    title: "Registered Migration Agent",
    description: "Matter ownership, client advice, document approvals, and lodgement decisions."
  },
  {
    id: "case-officer-demo",
    name: "Sophie Nguyen",
    role: "CASE_OFFICER",
    title: "Case Officer",
    description: "Daily task execution, checklist tracking, document review, and client follow-up."
  },
  {
    id: "finance-demo",
    name: "Oliver Stone",
    role: "FINANCE",
    title: "Finance Officer",
    description: "Quotes, invoices, Stripe payment status, receipts, and revenue reporting."
  },
  {
    id: "client-demo",
    name: "John Smith",
    role: "CLIENT",
    title: "Client Portal User",
    description: "Matter progress, document uploads, invoices, and secure messages."
  }
] as const;

export const clients = [
  {
    id: "client-001",
    name: "John Smith",
    email: "john.smith@example.com",
    dob: "1990-04-12",
    nationality: "United Kingdom",
    passportMasked: "X12****7",
    consentStatus: "SIGNED",
    conflictCheck: "CLEAR",
    dependants: 2,
    portalActive: true
  },
  {
    id: "client-002",
    name: "Priya Shah",
    email: "priya.shah@example.com",
    dob: "1987-09-03",
    nationality: "India",
    passportMasked: "P45****1",
    consentStatus: "SIGNED",
    conflictCheck: "CLEAR",
    dependants: 0,
    portalActive: true
  },
  {
    id: "client-003",
    name: "Miguel Santos",
    email: "miguel.santos@example.com",
    dob: "1994-01-21",
    nationality: "Philippines",
    passportMasked: "M78****4",
    consentStatus: "PENDING",
    conflictCheck: "ESCALATE",
    dependants: 1,
    portalActive: false
  }
];

const documents = [
  {
    id: "doc-001",
    title: "Passport bio page",
    status: "VERIFIED",
    fileType: "PDF",
    uploadedBy: "John Smith",
    verifiedBy: "Daniel Cho",
    updatedAt: "2026-05-24"
  },
  {
    id: "doc-002",
    title: "Health check certificate",
    status: "RECEIVED",
    fileType: "PDF",
    uploadedBy: "John Smith",
    verifiedBy: null,
    updatedAt: "2026-05-26"
  },
  {
    id: "doc-003",
    title: "Police clearance",
    status: "REQUESTED",
    fileType: "PDF",
    uploadedBy: "Pending",
    verifiedBy: null,
    updatedAt: "2026-05-27"
  }
];

const invoices = [
  {
    id: "inv-1001",
    number: "INV-2026-1001",
    clientName: "John Smith",
    matterId: "matter-001",
    amount: 2750,
    status: "SENT",
    dueOn: "2026-06-02"
  },
  {
    id: "inv-1002",
    number: "INV-2026-1002",
    clientName: "Priya Shah",
    matterId: "matter-002",
    amount: 4200,
    status: "PAID",
    dueOn: "2026-05-19"
  }
];

export const matters = [
  {
    id: "matter-001",
    clientId: "client-001",
    clientName: "John Smith",
    visaSubclass: "482",
    title: "482 Temporary Skill Shortage",
    stage: "DOCUMENTS",
    progress: 46,
    primaryAgent: "Daniel Cho",
    caseOfficer: "Sophie Nguyen",
    trn: "ABC1234567",
    keyDate: "2026-06-06",
    tasksOpen: 7,
    tasksTotal: 15,
    documents,
    invoices: [invoices[0]]
  },
  {
    id: "matter-002",
    clientId: "client-002",
    clientName: "Priya Shah",
    visaSubclass: "186",
    title: "186 Employer Nomination Scheme",
    stage: "LODGEMENT",
    progress: 72,
    primaryAgent: "Daniel Cho",
    caseOfficer: "Sophie Nguyen",
    trn: "DEF4455667",
    keyDate: "2026-06-12",
    tasksOpen: 4,
    tasksTotal: 18,
    documents: documents.slice(0, 2),
    invoices: [invoices[1]]
  },
  {
    id: "matter-003",
    clientId: "client-003",
    clientName: "Miguel Santos",
    visaSubclass: "485",
    title: "485 Temporary Graduate",
    stage: "INTAKE",
    progress: 18,
    primaryAgent: "Mina Patel",
    caseOfficer: "Unassigned",
    trn: null,
    keyDate: "2026-05-31",
    tasksOpen: 9,
    tasksTotal: 11,
    documents: [documents[2]],
    invoices: []
  }
];

export const dashboard = {
  metrics: {
    activeMatters: 42,
    overdueTasks: 9,
    upcomingDeadlines: 16,
    monthlyRevenue: 68400,
    clientPortalAdoption: 74
  },
  tasks: [
    {
      id: "task-001",
      title: "Verify health check certificate",
      status: "OPEN",
      dueOn: "2026-05-27",
      assignee: "Sophie Nguyen",
      matterId: "matter-001"
    },
    {
      id: "task-002",
      title: "Prepare 186 lodgement review",
      status: "OPEN",
      dueOn: "2026-05-29",
      assignee: "Daniel Cho",
      matterId: "matter-002"
    },
    {
      id: "task-003",
      title: "Resolve conflict check escalation",
      status: "BLOCKED",
      dueOn: "2026-05-28",
      assignee: "Mina Patel",
      matterId: "matter-003"
    }
  ],
  matters,
  recentMessages: [
    {
      id: "msg-001",
      from: "John Smith",
      preview: "I uploaded the health check certificate this morning.",
      matterTitle: "482 Temporary Skill Shortage",
      receivedAt: "2026-05-27T08:35:00.000Z"
    },
    {
      id: "msg-002",
      from: "Priya Shah",
      preview: "Can you confirm if the nomination documents are complete?",
      matterTitle: "186 Employer Nomination Scheme",
      receivedAt: "2026-05-26T17:10:00.000Z"
    }
  ],
  alerts: [
    {
      id: "alert-001",
      severity: "HIGH",
      title: "Visa expiry inside 30 days",
      description: "Miguel Santos needs immediate intake completion.",
      dueOn: "2026-05-31"
    },
    {
      id: "alert-002",
      severity: "MEDIUM",
      title: "Document verification pending",
      description: "Health check certificate is received but unverified.",
      dueOn: "2026-05-27"
    }
  ]
};

export const reports = {
  pipelineByStage: [
    { stage: "INTAKE", count: 8 },
    { stage: "DOCUMENTS", count: 14 },
    { stage: "LODGEMENT", count: 9 },
    { stage: "CASE_OFFICER_REQUEST", count: 5 },
    { stage: "DECISION", count: 6 }
  ],
  revenueBySubclass: [
    { subclass: "482", revenue: 28600 },
    { subclass: "186", revenue: 21400 },
    { subclass: "485", revenue: 8900 },
    { subclass: "Partner", revenue: 9500 }
  ],
  slaBreaches: [
    { matterTitle: "485 Temporary Graduate", owner: "Mina Patel", daysOverdue: 3 },
    { matterTitle: "482 Temporary Skill Shortage", owner: "Sophie Nguyen", daysOverdue: 1 }
  ]
};

export const auditEvents = [
  {
    id: "audit-001",
    actor: "Daniel Cho",
    action: "document.verified",
    entity: "Passport bio page",
    timestamp: "2026-05-24T11:04:00.000Z"
  },
  {
    id: "audit-002",
    actor: "Sophie Nguyen",
    action: "matter.stage_changed",
    entity: "482 Temporary Skill Shortage",
    timestamp: "2026-05-25T09:22:00.000Z"
  },
  {
    id: "audit-003",
    actor: "Oliver Stone",
    action: "invoice.sent",
    entity: "INV-2026-1001",
    timestamp: "2026-05-26T14:45:00.000Z"
  }
];

export const portalSummary = {
  clientName: "John Smith",
  matterTitle: "482 Temporary Skill Shortage",
  stage: "Awaiting Health Check",
  progress: 46,
  outstandingDocuments: 3,
  nextStep: "Upload police clearance and wait for health check verification.",
  invoice: invoices[0],
  documents
};


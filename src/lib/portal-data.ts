import type {
  DashboardConfig,
  JobRecord,
  Role,
  VendorRecord,
} from "@/lib/portal-types";
import { roles } from "@/lib/portal-types";
import {
  canSubmitInvoice,
  getDocumentProgress,
  getJobSummary,
  getVendorStatusSummary,
  isApproved,
} from "@/lib/workflows";

export const vendors: VendorRecord[] = [
  {
    id: "VND-1001",
    companyName: "Blue Ridge Systems",
    contactEmail: "contact@blueridgesystems.com",
    categories: ["Networking Jobs", "CCTV Jobs"],
    createdAt: "2026-03-10",
    onboardingDeadline: "2026-03-24",
    status: "verified",
    documents: [
      {
        name: "Vendor Registration Form",
        uploadedAt: "2026-03-11",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Bank Details Form",
        uploadedAt: "2026-03-11",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Tax Clearance Certificate",
        uploadedAt: "2026-03-12",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Compliance Undertaking",
        uploadedAt: "2026-03-12",
        approval: { admin: "approved", approver: "approved" },
      },
    ],
  },
  {
    id: "VND-1002",
    companyName: "Northwind Telecoms",
    contactEmail: "northwind.vendor@gmail.com",
    categories: ["Networking Jobs"],
    createdAt: "2026-03-08",
    onboardingDeadline: "2026-03-22",
    status: "under-review",
    documents: [
      {
        name: "Vendor Registration Form",
        uploadedAt: "2026-03-09",
        approval: { admin: "approved", approver: "pending" },
      },
      {
        name: "Bank Details Form",
        uploadedAt: "2026-03-09",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Tax Clearance Certificate",
        uploadedAt: undefined,
        approval: { admin: "pending", approver: "pending" },
      },
      {
        name: "Compliance Undertaking",
        uploadedAt: "2026-03-10",
        approval: { admin: "changes-requested", approver: "pending" },
      },
    ],
  },
  {
    id: "VND-1003",
    companyName: "Sentinel Fire & Safety",
    contactEmail: "service@sentinelfs.com",
    categories: ["Maintenance", "Power & UPS"],
    createdAt: "2026-02-28",
    onboardingDeadline: "2026-03-13",
    status: "verified",
    documents: [
      {
        name: "Vendor Registration Form",
        uploadedAt: "2026-03-01",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Bank Details Form",
        uploadedAt: "2026-03-01",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Tax Clearance Certificate",
        uploadedAt: "2026-03-03",
        approval: { admin: "approved", approver: "approved" },
      },
      {
        name: "Compliance Undertaking",
        uploadedAt: "2026-03-03",
        approval: { admin: "approved", approver: "approved" },
      },
    ],
  },
];

export const jobs: JobRecord[] = [
  {
    id: "JR-2026-014",
    title: "Branch CCTV expansion",
    category: "CCTV Jobs",
    createdAt: "2026-03-10",
    status: "open-for-quotes",
    assignmentApproval: { admin: "pending", approver: "pending" },
    completionApproval: { admin: "pending", approver: "pending" },
    quotes: [
      {
        vendorName: "Blue Ridge Systems",
        amount: "NGN 5,200,000",
        submittedAt: "2026-03-10",
      },
    ],
  },
  {
    id: "JR-2026-011",
    title: "HQ network recabling",
    category: "Networking Jobs",
    createdAt: "2026-03-06",
    status: "assigned",
    assignmentApproval: { admin: "approved", approver: "approved" },
    completionApproval: { admin: "pending", approver: "pending" },
    assignedVendor: "Blue Ridge Systems",
    quotes: [
      {
        vendorName: "Blue Ridge Systems",
        amount: "NGN 3,480,000",
        submittedAt: "2026-03-07",
      },
      {
        vendorName: "Northwind Telecoms",
        amount: "NGN 3,620,000",
        submittedAt: "2026-03-07",
      },
    ],
  },
  {
    id: "JR-2026-009",
    title: "ATM camera maintenance",
    category: "CCTV Jobs",
    createdAt: "2026-03-04",
    status: "completion-under-review",
    assignmentApproval: { admin: "approved", approver: "approved" },
    completionApproval: { admin: "approved", approver: "pending" },
    assignedVendor: "Sentinel Fire & Safety",
    completionUploadedAt: "2026-03-09",
    quotes: [
      {
        vendorName: "Sentinel Fire & Safety",
        amount: "NGN 1,100,000",
        submittedAt: "2026-03-04",
      },
    ],
  },
  {
    id: "JR-2026-006",
    title: "Data center UPS inspection",
    category: "Power & UPS",
    createdAt: "2026-02-28",
    status: "invoice-submitted",
    assignmentApproval: { admin: "approved", approver: "approved" },
    completionApproval: { admin: "approved", approver: "approved" },
    assignedVendor: "Sentinel Fire & Safety",
    completionUploadedAt: "2026-03-06",
    invoiceUploadedAt: "2026-03-08",
    quotes: [
      {
        vendorName: "Sentinel Fire & Safety",
        amount: "NGN 880,000",
        submittedAt: "2026-03-01",
      },
    ],
  },
];

const vendorSummary = getVendorStatusSummary(vendors);

type DashboardSource = {
  vendors?: VendorRecord[];
  jobs?: JobRecord[];
};

function formatJobStatusLabel(status: JobRecord["status"]) {
  return status.replaceAll("-", " ");
}

function buildAdminRows(liveJobs: JobRecord[]) {
  if (liveJobs.length === 0) {
    return [["No jobs yet", "-", "-", "Create a job"]];
  }

  return liveJobs.slice(0, 3).map((job) => [
    job.id,
    job.assignedVendor ?? job.category,
    formatJobStatusLabel(job.status),
    job.assignedVendor ? "Open job detail" : "Assign a vendor",
  ]);
}

function buildVendorRows(liveJobs: JobRecord[]) {
  if (liveJobs.length === 0) {
    return [["No jobs yet", "-", "-", "No action"]];
  }

  return liveJobs.slice(0, 3).map((job) => [
    job.id,
    job.assignedVendor ? "Assigned job" : "Open job",
    formatJobStatusLabel(job.status),
    job.invoiceUploadedAt
      ? "View invoice trail"
      : job.completionUploadedAt
        ? "Watch review status"
        : job.assignedVendor
          ? "Open job detail"
          : "Review job detail",
  ]);
}

function buildApproverRows(liveJobs: JobRecord[]) {
  const pendingJobs = liveJobs.filter(
    (job) =>
      job.assignmentApproval.approver === "pending" ||
      job.completionApproval.approver === "pending",
  );

  if (pendingJobs.length === 0) {
    return [["No pending approvals", "-", "-", "No action"]];
  }

  return pendingJobs.slice(0, 3).map((job) => [
    job.id,
    job.completionUploadedAt ? "Completion review" : "Assignment review",
    formatJobStatusLabel(job.status),
    "Open job detail",
  ]);
}

function buildControlRows(liveJobs: JobRecord[]) {
  if (liveJobs.length === 0) {
    return [["No tracked records", "-", "-", "No action"]];
  }

  return liveJobs.slice(0, 3).map((job) => [
    job.id,
    job.completionUploadedAt ? "Completion" : "Job",
    formatJobStatusLabel(job.status),
    "Open job detail",
  ]);
}

export const portalHighlights = [
  {
    label: "Verified vendors",
    value: `${vendorSummary.verified}`,
    description: "Approved by admin and approver and ready to receive work.",
  },
  {
    label: "Active job requests",
    value: `${jobs.length}`,
    description: "Including requests open for quotes, assigned jobs, and invoice-ready work.",
  },
  {
    label: "Automation touchpoints",
    value: "8",
    description: "Email reminders and approval alerts built into the workflow design.",
  },
];

export const lifecycleModules = [
  {
    badge: "01",
    title: "Vendor Onboarding",
    description:
      "Admins upload the blank onboarding templates vendors must download, complete, and reupload; the portal then tracks every submission and approval.",
    outcome: "Verified vendors are the only vendors that can participate in sourcing.",
  },
  {
    badge: "02",
    title: "Job Requests",
    description:
      "Admins create jobs by category, automatically notify matching verified vendors, and collect quotes in one auditable flow.",
    outcome: "Only admins can create job requests.",
  },
  {
    badge: "03",
    title: "Assignment Approval",
    description:
      "Assignment stays pending until the admin and approver both confirm the chosen vendor and award decision.",
    outcome: "No vendor starts work without explicit dual approval.",
  },
  {
    badge: "04",
    title: "Completion Evidence",
    description:
      "Assigned vendors upload job completion forms per job. Approval records are captured per submission for full traceability.",
    outcome: "Invoices unlock only after completion is approved.",
  },
  {
    badge: "05",
    title: "Invoice Submission",
    description:
      "Once the completion form is verified, the assigned vendor uploads the invoice against the same job record.",
    outcome: "Finance-ready job records stay connected to the original work order.",
  },
];

export const processSteps = [
  {
    title: "Vendor invitation and sign-in",
    description:
      "A vendor account is created and the vendor signs in with Google, Microsoft, or a regular email-based flow.",
    gate: "Invite starts a 14-day onboarding clock",
  },
  {
    title: "Document download, upload, and tracking",
    description:
      "Admins upload the blank forms first, then vendors download them, complete them offline, and reupload the finished copies. Every file keeps upload and approval status.",
    gate: "Admin and approver both review required documents",
  },
  {
    title: "Vendor verification",
    description:
      "The vendor becomes verified only when all required onboarding documents pass the two-step approval process.",
    gate: "All required documents must be dual approved",
  },
  {
    title: "Category-based job sourcing",
    description:
      "Admins create job requests by category and only verified vendors in matching categories receive quote alerts.",
    gate: "Admin-only job creation",
  },
  {
    title: "Assignment and job execution",
    description:
      "Quotes are reviewed, a vendor is selected, and the assignment remains blocked until admin and approver both sign off.",
    gate: "Dual approval before assigned status",
  },
  {
    title: "Completion verification and invoice submission",
    description:
      "The vendor uploads the completion form, receives approval, and then the invoice upload is unlocked for that job.",
    gate: "Invoice allowed only after completion is dual approved",
  },
];

export const roleCards = [
  {
    eyebrow: "Admin",
    title: "Create vendors and job requests",
    description:
      "Own vendor setup, category-based job publishing, first-line approvals, and operational visibility across the portal.",
    href: "/dashboard/admin",
  },
  {
    eyebrow: "Vendor",
    title: "Upload documents, quotes, completion forms, and invoices",
    description:
      "Use a clean self-service workspace to complete onboarding and manage assigned jobs.",
    href: "/dashboard/vendor",
  },
  {
    eyebrow: "Approver",
    title: "Provide the second approval",
    description:
      "Confirm vendor verification, vendor assignment, and completion evidence before the workflow can advance.",
    href: "/dashboard/approver",
  },
  {
    eyebrow: "Internal Control",
    title: "Track deadlines and evidence completeness",
    description:
      "Monitor exceptions, ageing items, SLA performance, and audit readiness without breaking the core approval chain.",
    href: "/dashboard/internal-control-reviewer",
  },
];

export const recommendedStack = [
  {
    title: "Frontend + backend",
    choice: "Next.js App Router with TypeScript",
    reason:
      "One codebase handles the website, API routes, admin tooling, and modular pages in a way that works well with Codex.",
  },
  {
    title: "Database",
    choice: "PostgreSQL with Prisma ORM",
    reason:
      "Fast, scalable, widely supported, and easy to keep maintainable with readable schema files and migrations.",
  },
  {
    title: "Authentication",
    choice: "Auth.js with Microsoft, Google, and email magic links",
    reason:
      "Supports your Microsoft 365 users while still allowing outside vendors to sign in with regular email addresses.",
  },
  {
    title: "Files + email",
    choice: "Blob storage plus Resend or Microsoft Graph mail",
    reason:
      "Separates document storage from the app and gives a clean path for reminders, approval alerts, and future escalation emails.",
  },
];

export const dashboardRoutes = [
  { label: "Admin", href: "/dashboard/admin" },
  { label: "Vendor", href: "/dashboard/vendor" },
  { label: "Approver", href: "/dashboard/approver" },
  { label: "Internal Control", href: "/dashboard/internal-control-reviewer" },
];

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}

export function getDashboardConfig(role: Role, source?: DashboardSource): DashboardConfig {
  const liveVendors = source?.vendors ?? vendors;
  const liveJobs = source?.jobs ?? jobs;
  const liveVendorSummary = getVendorStatusSummary(liveVendors);
  const liveJobSummary = getJobSummary(liveJobs);
  const liveNorthwind =
    liveVendors.find((vendor) => vendor.companyName === "Northwind Telecoms") ?? liveVendors[0];
  const liveNorthwindProgress = liveNorthwind
    ? getDocumentProgress(liveNorthwind.documents)
    : { total: 0, uploaded: 0, approved: 0 };
  const liveVendorFocusedJobs = liveJobs.filter(
    (job) => job.assignedVendor === "Blue Ridge Systems" || job.status === "open-for-quotes",
  );

  if (role === "admin") {
    return {
      eyebrow: "Admin",
      title: "Vendors and jobs",
      description: "Current queue and open actions.",
      metrics: [
        {
          label: "Vendors awaiting action",
          value: `${liveVendorSummary.collecting}`,
          description: "Invited or under-review vendors still in onboarding.",
        },
        {
          label: "Jobs open for quotes",
          value: `${liveJobSummary.open}`,
          description: "Requests currently visible to verified vendors.",
        },
        {
          label: "Assignment approvals pending",
          value: `${liveJobSummary.assignmentPending}`,
          description: "Award decisions waiting for approval.",
        },
        {
          label: "Completion forms under review",
          value: `${liveJobSummary.completionPending}`,
          description: "Completion files submitted but not yet cleared.",
        },
      ],
      priorityQueue: [
        {
          title: `${liveNorthwind?.companyName ?? "Vendor"} onboarding`,
          detail: `Deadline ${liveNorthwind?.onboardingDeadline ?? "TBD"}. ${liveNorthwindProgress.uploaded}/${liveNorthwindProgress.total} files uploaded. ${liveNorthwindProgress.approved} approved.`,
          status: "Review today",
        },
        {
          title: "JR-2026-014 quote window",
          detail: "Review incoming quotes and shortlist a vendor after the deadline.",
          status: "Monitor quotes",
        },
        {
          title: "JR-2026-009 completion approval",
          detail: "Uploaded 2026-03-09. One approver decision is outstanding.",
          status: "Awaiting second sign-off",
        },
      ],
      actions: [
        {
          title: "Add new vendors",
          detail: "Create vendor accounts and set deadlines for the next onboarding batch.",
        },
        {
          title: "Check open quote windows",
          detail: "Review active job requests and close out shortlisting when quotes are in.",
        },
        {
          title: "Clear pending reviews",
          detail: "Move document and completion submissions to the next approval step.",
        },
      ],
      alerts: [
        {
          title: "Deadline watch",
          detail: "Vendors nearing onboarding deadline.",
        },
        {
          title: "Award approvals",
          detail: "Assignments waiting on approval.",
        },
        {
          title: "Completion status",
          detail: "Completion files still in review.",
        },
      ],
      table: {
        title: "Records",
        description: "Items needing admin action.",
        columns: ["Record", "Owner", "Current stage", "Next step"],
        rows: buildAdminRows(liveJobs),
      },
    };
  }

  if (role === "vendor") {
    const invoiceReadyCount = liveVendorFocusedJobs.filter(canSubmitInvoice).length;

    return {
      eyebrow: "Vendor",
      title: "Files and jobs",
      description: "Missing items, review status, and open jobs.",
      metrics: [
        {
          label: "Onboarding deadline",
          value: liveNorthwind?.onboardingDeadline ?? "TBD",
          description: "Next date to complete required onboarding items.",
        },
        {
          label: "Documents uploaded",
          value: `${liveNorthwindProgress.uploaded}/${liveNorthwindProgress.total}`,
          description: "Required onboarding files received so far.",
        },
        {
          label: "Jobs in view",
          value: `${liveVendorFocusedJobs.length}`,
          description: "Open requests and active assignments.",
        },
        {
          label: "Invoices unlocked",
          value: `${invoiceReadyCount}`,
          description: "Jobs ready for invoice submission.",
        },
      ],
      priorityQueue: [
        {
          title: "Upload missing tax certificate",
          detail: `${liveNorthwind?.companyName ?? "Vendor"} still needs the Tax Clearance Certificate.`,
          status: "Vendor action",
        },
        {
          title: "Respond to JR-2026-014",
          detail: "Open for quote submission.",
          status: "Submit quote",
        },
        {
          title: "HQ network recabling",
          detail: "Upload completion file when work is finished.",
          status: "Execution in progress",
        },
      ],
      actions: [
        {
          title: "Upload missing documents",
          detail: "Complete the required onboarding files that are still outstanding.",
        },
        {
          title: "Follow review outcomes",
          detail: "Check which submissions are pending, approved, or returned for updates.",
        },
        {
          title: "Watch invoice readiness",
          detail: "Submit invoices only after completion evidence has cleared approval.",
        },
      ],
      alerts: [
        {
          title: "Deadline status",
          detail: "Prioritize onboarding items due soon.",
        },
        {
          title: "Job opportunities",
          detail: "Respond to open requests in your approved categories.",
        },
        {
          title: "Completion approvals",
          detail: "Jobs cleared for invoicing.",
        },
      ],
      table: {
        title: "Records",
        description: "Current vendor items.",
        columns: ["Item", "Type", "Status", "What the vendor can do"],
        rows: buildVendorRows(liveVendorFocusedJobs),
      },
    };
  }

  if (role === "approver") {
    const pendingApprovals = liveJobs.filter(
      (job) =>
        job.assignmentApproval.approver === "pending" ||
        job.completionApproval.approver === "pending",
    ).length;

    return {
      eyebrow: "Approver",
      title: "Review pending approvals",
      description: "Current approvals waiting on review.",
      metrics: [
        {
          label: "Pending second approvals",
          value: `${pendingApprovals + 1}`,
          description: "Open approval workload across active records.",
        },
        {
          label: "Vendors awaiting approval",
          value: "1",
          description: "Vendor submissions still waiting on approver review.",
        },
        {
          label: "Completion reviews",
          value: `${liveJobSummary.completionPending}`,
          description: "Completion evidence waiting on approver sign-off.",
        },
        {
          label: "Award decisions",
          value: `${liveJobSummary.assignmentPending}`,
          description: "Assignments blocked until you record a decision.",
        },
      ],
      priorityQueue: [
        {
          title: "Northwind Telecoms registration form",
          detail: "Admin approved. Final approver decision pending.",
          status: "Review now",
        },
        {
          title: "JR-2026-009 completion form",
          detail: "Approver decision pending.",
          status: "Final check",
        },
        {
          title: "JR-2026-014 assignment",
          detail: "Awaiting shortlist completion.",
          status: "Pending",
        },
      ],
      actions: [
        {
          title: "Review onboarding files",
          detail: "Approve clean submissions and return incomplete files for correction.",
        },
        {
          title: "Confirm award decisions",
          detail: "Finalize assignments once the supporting details are complete.",
        },
        {
          title: "Clear completion evidence",
          detail: "Approve job evidence so invoice submission can move forward.",
        },
      ],
      alerts: [
        {
          title: "New review items",
          detail: "Watch for submissions that have reached the second approval step.",
        },
        {
          title: "Aging approvals",
          detail: "Prioritize older records to keep the queue moving.",
        },
        {
          title: "Returned submissions",
          detail: "Records returned for updates.",
        },
      ],
      table: {
        title: "Records",
        description: "Items waiting on approver action.",
        columns: ["Record", "Area", "Current state", "Decision needed"],
        rows: buildApproverRows(liveJobs),
      },
    };
  }

  const overdueVendor = liveVendors.find((vendor) => vendor.status !== "verified");
  const fullyApprovedJobs = liveJobs.filter((job) => isApproved(job.completionApproval)).length;

  return {
    eyebrow: "Internal Control",
    title: "Monitor deadlines and exceptions",
    description: "Overdue items, missing evidence, and exceptions.",
    metrics: [
      {
        label: "Open exceptions",
        value: "3",
        description: "Items with missing evidence or pending approvals.",
      },
      {
        label: "Vendors nearing deadline",
        value: overdueVendor ? "1" : "0",
        description: "Onboarding cases approaching deadline.",
      },
      {
        label: "Dual-approved completions",
        value: `${fullyApprovedJobs}`,
        description: "Jobs cleared for invoice submission.",
      },
      {
        label: "Audit trail coverage",
        value: "100%",
        description: "Records are tied to dated workflow states.",
      },
    ],
    priorityQueue: [
        {
          title: `${liveNorthwind?.companyName ?? "Vendor"} nearing SLA threshold`,
          detail: `Created ${liveNorthwind?.createdAt ?? "TBD"}. Deadline ${liveNorthwind?.onboardingDeadline ?? "TBD"}.`,
          status: "Watchlist",
        },
      {
        title: "JR-2026-009 pending completion approval",
        detail: "Outstanding approver decision.",
        status: "SLA monitor",
      },
      {
        title: "JR-2026-006 invoice record",
        detail: "Completion approved. Invoice submitted.",
        status: "Filed",
      },
    ],
    actions: [
      {
        title: "Watch overdue approvals",
        detail: "Flag records stalled in review.",
      },
      {
        title: "Check missing evidence",
        detail: "Follow items with missing files.",
      },
      {
        title: "Prepare reports",
        detail: "Keep the watchlist current.",
      },
    ],
    alerts: [
      {
        title: "Deadline breaches",
        detail: "Records close to SLA breach.",
      },
      {
        title: "Approval delays",
        detail: "Queues with slow turnaround.",
      },
      {
        title: "Invoice blockers",
        detail: "Jobs blocked by incomplete approvals.",
      },
    ],
    table: {
      title: "Records",
      description: "Watchlist of records that need control follow-up.",
      columns: ["Record", "Risk", "Current observation", "Control response"],
      rows: buildControlRows(liveJobs),
    },
  };
}

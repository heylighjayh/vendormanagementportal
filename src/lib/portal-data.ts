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
const jobSummary = getJobSummary(jobs);
const northwind = vendors[1];
const northwindProgress = getDocumentProgress(northwind.documents);
const vendorFocusedJobs = jobs.filter(
  (job) => job.assignedVendor === "Blue Ridge Systems" || job.status === "open-for-quotes",
);

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
      "Invite vendors with any email address, issue document templates, track uploads, and apply the dual approval rule before verification.",
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
      "Vendors download forms, complete them offline, and reupload them. Every file keeps upload and approval status.",
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

export function getDashboardConfig(role: Role): DashboardConfig {
  if (role === "admin") {
    return {
      eyebrow: "Admin Dashboard",
      title: "Operational control across onboarding, sourcing, and approvals",
      description:
        "Create vendor accounts, publish job requests, review uploads, and keep the workflow moving without losing audit visibility.",
      metrics: [
        {
          label: "Vendors awaiting action",
          value: `${vendorSummary.collecting}`,
          description: "Invited or under-review vendors still inside the onboarding process.",
        },
        {
          label: "Jobs open for quotes",
          value: `${jobSummary.open}`,
          description: "Category-based requests currently visible to verified vendors.",
        },
        {
          label: "Assignment approvals pending",
          value: `${jobSummary.assignmentPending}`,
          description: "Award decisions waiting for a full approval chain.",
        },
        {
          label: "Completion forms under review",
          value: `${jobSummary.completionPending}`,
          description: "Job evidence submitted but not fully approved yet.",
        },
      ],
      priorityQueue: [
        {
          title: `${northwind.companyName} onboarding`,
          detail: `Deadline ${northwind.onboardingDeadline}. ${northwindProgress.uploaded}/${northwindProgress.total} documents uploaded and ${northwindProgress.approved} fully approved.`,
          status: "Review today",
        },
        {
          title: "JR-2026-014 quote window",
          detail: "A new CCTV job is live. Review incoming quotes and shortlist a vendor after the deadline.",
          status: "Monitor quotes",
        },
        {
          title: "JR-2026-009 completion approval",
          detail: "The vendor uploaded the completion form on 2026-03-09. One approver decision is still outstanding.",
          status: "Awaiting second sign-off",
        },
      ],
      actions: [
        {
          title: "Create vendor accounts with a 14-day SLA",
          detail: "Each invitation should immediately schedule day 0, day 7, day 12, and deadline reminders.",
        },
        {
          title: "Restrict job creation to admins",
          detail: "This keeps sourcing governance centralized and aligns with your requested control model.",
        },
        {
          title: "Publish category-targeted email alerts",
          detail: "Only verified vendors in the job category should receive quote invitation notifications.",
        },
      ],
      alerts: [
        {
          title: "Reminder cadence",
          detail: "Onboarding reminders fire at account creation, mid-way, 48 hours before deadline, and on the deadline date.",
        },
        {
          title: "Assignment notices",
          detail: "Selected vendors receive assignment alerts only after admin and approver both approve the award.",
        },
        {
          title: "Invoice unlock",
          detail: "Completion approval automatically triggers an email telling the vendor the invoice lane is now open.",
        },
      ],
      table: {
        title: "Live vendor and job queue",
        description:
          "A combined view of the items the admin role needs to touch most often.",
        columns: ["Record", "Owner", "Current stage", "Next step"],
        rows: [
          [
            "VND-1002",
            "Northwind Telecoms",
            "Under review",
            "Approver to review registration form and vendor to upload tax certificate",
          ],
          [
            "JR-2026-014",
            "CCTV Jobs",
            "Open for quotes",
            "Wait for more vendor quotes before award recommendation",
          ],
          [
            "JR-2026-009",
            "Sentinel Fire & Safety",
            "Completion under review",
            "Approver to record second approval decision",
          ],
        ],
      },
    };
  }

  if (role === "vendor") {
    const invoiceReadyCount = vendorFocusedJobs.filter(canSubmitInvoice).length;

    return {
      eyebrow: "Vendor Workspace",
      title: "Self-service onboarding and job delivery for external vendors",
      description:
        "A vendor can sign in with Google, Microsoft, or a regular email flow, complete onboarding, respond to jobs, and upload completion evidence and invoices.",
      metrics: [
        {
          label: "Onboarding deadline",
          value: northwind.onboardingDeadline,
          description: "Example 14-day deadline shown with reminder automation.",
        },
        {
          label: "Documents uploaded",
          value: `${northwindProgress.uploaded}/${northwindProgress.total}`,
          description: "The portal tracks every required onboarding file individually.",
        },
        {
          label: "Jobs in view",
          value: `${vendorFocusedJobs.length}`,
          description: "Open opportunities plus jobs already assigned to the vendor.",
        },
        {
          label: "Invoices unlocked",
          value: `${invoiceReadyCount}`,
          description: "Jobs where the completion form has been fully approved.",
        },
      ],
      priorityQueue: [
        {
          title: "Upload missing tax certificate",
          detail: "Northwind Telecoms still needs to upload the Tax Clearance Certificate before verification can complete.",
          status: "Vendor action",
        },
        {
          title: "Respond to JR-2026-014",
          detail: "A new CCTV job matches the vendor category list and is open for quote submission.",
          status: "Submit quote",
        },
        {
          title: "HQ network recabling",
          detail: "The assignment is approved and the vendor can upload the job completion form once work is finished.",
          status: "Execution in progress",
        },
      ],
      actions: [
        {
          title: "Download, complete, and reupload templates",
          detail: "The onboarding module expects structured document templates that can be reused for every vendor.",
        },
        {
          title: "Track approval status per file",
          detail: "Vendors can see exactly which file is pending admin review, approver review, or changes requested.",
        },
        {
          title: "Submit invoice only when unlocked",
          detail: "The invoice action should remain hidden until the completion form reaches dual approval.",
        },
      ],
      alerts: [
        {
          title: "Onboarding reminders",
          detail: "The vendor receives reminder emails before the two-week deadline expires.",
        },
        {
          title: "Category quote alerts",
          detail: "New job requests trigger an email only if the vendor is verified and matched to the job category.",
        },
        {
          title: "Completion approved notification",
          detail: "Once the completion form passes both approvals, the vendor gets an alert to upload the invoice.",
        },
      ],
      table: {
        title: "Vendor activity view",
        description:
          "A single vendor workspace can show onboarding status, open quotes, active jobs, and invoice readiness.",
        columns: ["Item", "Type", "Status", "What the vendor can do"],
        rows: [
          [
            "Tax Clearance Certificate",
            "Onboarding document",
            "Missing upload",
            "Upload the file before 2026-03-22",
          ],
          [
            "JR-2026-014",
            "Quote opportunity",
            "Open for quotes",
            "Submit a quote before the sourcing window closes",
          ],
          [
            "JR-2026-011",
            "Assigned job",
            "Assigned",
            "Upload completion form after execution",
          ],
        ],
      },
    };
  }

  if (role === "approver") {
    const pendingApprovals = jobs.filter(
      (job) =>
        job.assignmentApproval.approver === "pending" ||
        job.completionApproval.approver === "pending",
    ).length;

    return {
      eyebrow: "Approver Dashboard",
      title: "Second-line approvals with fast access to the highest-risk items",
      description:
        "The approver role confirms vendor verification, assignment decisions, and completion evidence so the workflow cannot move ahead on a single-person decision.",
      metrics: [
        {
          label: "Pending second approvals",
          value: `${pendingApprovals + 1}`,
          description: "Combined workload across onboarding, assignment, and completion checks.",
        },
        {
          label: "Vendors awaiting approval",
          value: "1",
          description: "Northwind Telecoms still needs approver review on a submitted document.",
        },
        {
          label: "Completion reviews",
          value: `${jobSummary.completionPending}`,
          description: "Completion evidence that needs a second sign-off.",
        },
        {
          label: "Award decisions",
          value: `${jobSummary.assignmentPending}`,
          description: "Assignments blocked until the approver records a decision.",
        },
      ],
      priorityQueue: [
        {
          title: "Northwind Telecoms registration form",
          detail: "Admin approval is already complete. The approver decision is the final step before that document clears.",
          status: "Review now",
        },
        {
          title: "JR-2026-009 completion form",
          detail: "Vendor completion evidence is waiting on the approver before invoice submission is unlocked.",
          status: "Final check",
        },
        {
          title: "Future assignment approvals",
          detail: "Every award decision created by admin lands here as a second-line approval task.",
          status: "Workflow guardrail",
        },
      ],
      actions: [
        {
          title: "Keep evidence quality high",
          detail: "Use changes-requested outcomes for incorrect or incomplete vendor documents and completion submissions.",
        },
        {
          title: "Separate sourcing from approval",
          detail: "Admins create and recommend, but the approver role keeps an independent confirmation layer.",
        },
        {
          title: "Unlock invoicing only after completion approval",
          detail: "This ensures the vendor cannot invoice against unverified work.",
        },
      ],
      alerts: [
        {
          title: "Approval assignment emails",
          detail: "Every new review task should notify the approver with a direct deep link into the record.",
        },
        {
          title: "Escalation reminders",
          detail: "Pending approvals can be escalated to internal control when SLA thresholds are breached.",
        },
        {
          title: "Changes requested feedback",
          detail: "When approvers reject or request corrections, the vendor and admin both receive the outcome.",
        },
      ],
      table: {
        title: "Approver queue",
        description:
          "This queue is intentionally small and focused, making second-line review manageable.",
        columns: ["Record", "Area", "Current state", "Decision needed"],
        rows: [
          [
            "VND-1002 / Registration Form",
            "Onboarding",
            "Admin approved",
            "Approve or request changes",
          ],
          [
            "JR-2026-009",
            "Completion verification",
            "Vendor uploaded form on 2026-03-09",
            "Approve completion or request correction",
          ],
          [
            "JR-2026-014",
            "Assignment",
            "Awaiting shortlist completion",
            "Approve the final vendor selection when submitted",
          ],
        ],
      },
    };
  }

  const overdueVendor = vendors.find((vendor) => vendor.status !== "verified");
  const fullyApprovedJobs = jobs.filter((job) => isApproved(job.completionApproval)).length;

  return {
    eyebrow: "Internal Control Dashboard",
    title: "Oversight for SLA, compliance, and audit readiness",
    description:
      "Internal control stays informed across deadlines, approval latency, and evidence completeness without becoming a bottleneck in the main approval chain.",
    metrics: [
      {
        label: "Open exceptions",
        value: "3",
        description: "Items with missed documents, pending approvals, or nearing SLA breach.",
      },
      {
        label: "Vendors nearing deadline",
        value: overdueVendor ? "1" : "0",
        description: "Onboarding cases that need monitoring before the deadline is missed.",
      },
      {
        label: "Dual-approved completions",
        value: `${fullyApprovedJobs}`,
        description: "Jobs with evidence strong enough to support invoice submission.",
      },
      {
        label: "Audit trail coverage",
        value: "100%",
        description: "Every sample workflow event is tied to a dated record and approval state.",
      },
    ],
    priorityQueue: [
      {
        title: `${northwind.companyName} nearing SLA threshold`,
        detail: `Created on ${northwind.createdAt} with deadline ${northwind.onboardingDeadline}. Missing evidence should be escalated if no response arrives.`,
        status: "Watchlist",
      },
      {
        title: "JR-2026-009 pending completion approval",
        detail: "One outstanding approver decision is delaying invoice readiness and should be monitored for turnaround time.",
        status: "SLA monitor",
      },
      {
        title: "Evidence retention design",
        detail: "Uploaded documents, completion forms, and invoices should retain immutable metadata for audit review.",
        status: "Control design",
      },
    ],
    actions: [
      {
        title: "Track approval latency by role",
        detail: "Time between submission and approval should feed an exception dashboard for overdue tasks.",
      },
      {
        title: "Monitor reminder delivery outcomes",
        detail: "Email success, bounce rates, and unopened reminders should support escalation logic.",
      },
      {
        title: "Prepare for SAP integration later",
        detail: "Keep invoices and job references clean so the later SAP ByDesign sync is straightforward.",
      },
    ],
    alerts: [
      {
        title: "SLA breach notifications",
        detail: "Internal control should be copied when onboarding or approval deadlines are approaching breach.",
      },
      {
        title: "Audit-ready exports",
        detail: "A later phase can add downloadable evidence packs per vendor and per job request.",
      },
      {
        title: "Exception digest",
        detail: "A daily summary email can bundle overdue vendor onboarding, pending approvals, and invoice blockers.",
      },
    ],
    table: {
      title: "Control watchlist",
      description:
        "Oversight is most useful when it highlights ageing items and incomplete evidence clearly.",
      columns: ["Record", "Risk", "Current observation", "Control response"],
      rows: [
        [
          "VND-1002",
          "Missed onboarding evidence",
          "Tax certificate still missing",
          "Escalate if still missing by 2026-03-22",
        ],
        [
          "JR-2026-009",
          "Approval delay",
          "Completion awaiting approver",
          "Monitor for turnaround breach",
        ],
        [
          "JR-2026-006",
          "Invoice readiness",
          "Completion fully approved and invoice uploaded",
          "Keep record available for later ERP sync",
        ],
      ],
    },
  };
}

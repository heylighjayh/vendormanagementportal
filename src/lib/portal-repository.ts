import type {
  ApprovalDecision,
  ApprovalState as PrismaApprovalState,
  JobStatus as PrismaJobStatus,
  Role as PrismaRole,
  VendorStatus as PrismaVendorStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { jobs as sampleJobs, vendors as sampleVendors } from "@/lib/portal-data";
import { getPrismaClient } from "@/lib/prisma";
import type {
  ApprovalState,
  DualApproval,
  JobRecord,
  JobStatus,
  VendorRecord,
  VerificationStatus,
} from "@/lib/portal-types";

const vendorInclude = Prisma.validator<Prisma.VendorDefaultArgs>()({
  include: {
    documents: {
      include: {
        template: true,
        approvals: {
          include: {
            reviewer: true,
          },
        },
      },
    },
  },
});

const jobInclude = Prisma.validator<Prisma.JobRequestDefaultArgs>()({
  include: {
    quotes: {
      include: {
        vendor: true,
      },
    },
    assignment: {
      include: {
        vendor: true,
        approvals: {
          include: {
            reviewer: true,
          },
        },
      },
    },
    completionSubmission: {
      include: {
        approvals: {
          include: {
            reviewer: true,
          },
        },
      },
    },
    invoiceSubmission: true,
  },
});

type VendorWithRelations = Prisma.VendorGetPayload<typeof vendorInclude>;
type JobWithRelations = Prisma.JobRequestGetPayload<typeof jobInclude>;
type ApprovalDecisionWithReviewer = ApprovalDecision & {
  reviewer: {
    role: PrismaRole;
  };
};

export type PortalSnapshot = {
  vendors: VendorRecord[];
  jobs: JobRecord[];
  source: "database" | "sample";
  error?: string;
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapApprovalState(state: PrismaApprovalState): ApprovalState {
  switch (state) {
    case "APPROVED":
      return "approved";
    case "CHANGES_REQUESTED":
      return "changes-requested";
    default:
      return "pending";
  }
}

function mapVendorStatus(status: PrismaVendorStatus): VerificationStatus {
  switch (status) {
    case "COLLECTING_DOCUMENTS":
      return "collecting-documents";
    case "UNDER_REVIEW":
      return "under-review";
    case "VERIFIED":
      return "verified";
    default:
      return "invited";
  }
}

function mapJobStatus(status: PrismaJobStatus): JobStatus {
  switch (status) {
    case "PENDING_ASSIGNMENT_APPROVAL":
      return "pending-assignment-approval";
    case "ASSIGNED":
      return "assigned";
    case "COMPLETION_UNDER_REVIEW":
      return "completion-under-review";
    case "COMPLETION_APPROVED":
      return "completion-approved";
    case "INVOICE_SUBMITTED":
      return "invoice-submitted";
    default:
      return "open-for-quotes";
  }
}

function mapDualApproval(approvals: ApprovalDecisionWithReviewer[] | undefined): DualApproval {
  const state: DualApproval = {
    admin: "pending",
    approver: "pending",
  };

  for (const approval of approvals ?? []) {
    if (approval.reviewer.role === "ADMIN") {
      state.admin = mapApprovalState(approval.state);
    }

    if (approval.reviewer.role === "APPROVER") {
      state.approver = mapApprovalState(approval.state);
    }
  }

  return state;
}

function formatCurrency(amount: Prisma.Decimal) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function mapVendor(vendor: VendorWithRelations, templateNames: string[]): VendorRecord {
  const documentsByTemplate = new Map(
    vendor.documents.map((document) => [document.template.name, document] as const),
  );

  return {
    id: vendor.reference,
    companyName: vendor.companyName,
    contactEmail: vendor.contactEmail,
    categories: vendor.categories,
    createdAt: toIsoDate(vendor.createdAt),
    onboardingDeadline: toIsoDate(vendor.onboardingDeadline),
    status: mapVendorStatus(vendor.status),
    documents: templateNames.map((templateName) => {
      const document = documentsByTemplate.get(templateName);

      return {
        name: templateName,
        templatePath: document?.template.templateStoragePath,
        uploadedAt: document ? toIsoDate(document.uploadedAt) : undefined,
        approval: mapDualApproval(document?.approvals),
      };
    }),
  };
}

function mapJob(job: JobWithRelations): JobRecord {
  return {
    id: job.reference,
    title: job.title,
    category: job.category,
    createdAt: toIsoDate(job.createdAt),
    status: mapJobStatus(job.status),
    assignmentApproval: mapDualApproval(job.assignment?.approvals),
    completionApproval: mapDualApproval(job.completionSubmission?.approvals),
    assignedVendor: job.assignment?.vendor.companyName,
    completionUploadedAt: job.completionSubmission
      ? toIsoDate(job.completionSubmission.uploadedAt)
      : undefined,
    invoiceUploadedAt: job.invoiceSubmission ? toIsoDate(job.invoiceSubmission.uploadedAt) : undefined,
    quotes: job.quotes.map((quote) => ({
      vendorName: quote.vendor.companyName,
      amount: formatCurrency(quote.amount),
      submittedAt: toIsoDate(quote.submittedAt),
    })).sort((left, right) => left.submittedAt.localeCompare(right.submittedAt)),
  };
}

function sampleSnapshot(error?: string): PortalSnapshot {
  return {
    vendors: sampleVendors,
    jobs: sampleJobs,
    source: "sample",
    error,
  };
}

export async function getPortalSnapshot(): Promise<PortalSnapshot> {
  try {
    const prisma = getPrismaClient();

    const [vendors, jobs, templates] = await Promise.all([
      prisma.vendor.findMany({
        ...vendorInclude,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.jobRequest.findMany({
        ...jobInclude,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.onboardingDocumentTemplate.findMany({
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);

    if (vendors.length === 0 && jobs.length === 0) {
      return sampleSnapshot("Database is reachable but has no portal records yet.");
    }

    const templateNames = templates.map((template) => template.name);

    return {
      vendors: vendors.map((vendor) => mapVendor(vendor, templateNames)),
      jobs: jobs.map(mapJob),
      source: "database",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to read portal records from the database.";

    return sampleSnapshot(message);
  }
}

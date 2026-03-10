import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ApprovalState,
  JobStatus,
  PrismaClient,
  Role,
  VendorStatus,
} from "@prisma/client";
import { jobs, vendors } from "../src/lib/portal-data";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before running the seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseAmount(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function toVendorStatus(status: (typeof vendors)[number]["status"]): VendorStatus {
  switch (status) {
    case "collecting-documents":
      return "COLLECTING_DOCUMENTS";
    case "under-review":
      return "UNDER_REVIEW";
    case "verified":
      return "VERIFIED";
    default:
      return "INVITED";
  }
}

function toJobStatus(status: (typeof jobs)[number]["status"]): JobStatus {
  switch (status) {
    case "pending-assignment-approval":
      return "PENDING_ASSIGNMENT_APPROVAL";
    case "assigned":
      return "ASSIGNED";
    case "completion-under-review":
      return "COMPLETION_UNDER_REVIEW";
    case "completion-approved":
      return "COMPLETION_APPROVED";
    case "invoice-submitted":
      return "INVOICE_SUBMITTED";
    default:
      return "OPEN_FOR_QUOTES";
  }
}

function toApprovalState(
  state: (typeof vendors)[number]["documents"][number]["approval"]["admin"],
): ApprovalState {
  switch (state) {
    case "approved":
      return "APPROVED";
    case "changes-requested":
      return "CHANGES_REQUESTED";
    default:
      return "PENDING";
  }
}

async function seedUsers() {
  const [admin, approver, internalControl] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Portal Admin",
        email: "admin@vendorportal.local",
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Portal Approver",
        email: "approver@vendorportal.local",
        role: Role.APPROVER,
      },
    }),
    prisma.user.create({
      data: {
        name: "Internal Control",
        email: "internal.control@vendorportal.local",
        role: Role.INTERNAL_CONTROL_REVIEWER,
      },
    }),
  ]);

  const vendorUsers = new Map<string, { id: string; email: string }>();

  for (const vendor of vendors) {
    const user = await prisma.user.create({
      data: {
        name: vendor.companyName,
        email: vendor.contactEmail,
        role: Role.VENDOR,
      },
    });

    vendorUsers.set(vendor.companyName, {
      id: user.id,
      email: user.email,
    });
  }

  return { admin, approver, internalControl, vendorUsers };
}

async function main() {
  await prisma.notificationEvent.deleteMany();
  await prisma.approvalDecision.deleteMany();
  await prisma.invoiceSubmission.deleteMany();
  await prisma.jobCompletionSubmission.deleteMany();
  await prisma.jobAssignment.deleteMany();
  await prisma.jobQuote.deleteMany();
  await prisma.jobRequest.deleteMany();
  await prisma.vendorDocument.deleteMany();
  await prisma.onboardingDocumentTemplate.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  const users = await seedUsers();

  const templates = new Map<string, { id: string }>();

  for (const templateName of vendors[0].documents.map((document) => document.name)) {
    const template = await prisma.onboardingDocumentTemplate.create({
      data: {
        name: templateName,
        description: `Admin-managed onboarding template for ${templateName}. Vendors download it, complete it offline, and reupload the finished copy.`,
        templateStoragePath: `seed/templates/${templateName.toLowerCase().replaceAll(" ", "-")}.docx`,
        uploadedById: users.admin.id,
      },
    });

    templates.set(templateName, { id: template.id });
  }

  const vendorIdByCompany = new Map<string, string>();

  for (const vendor of vendors) {
    const accountOwner = users.vendorUsers.get(vendor.companyName);

    const createdVendor = await prisma.vendor.create({
      data: {
        reference: vendor.id,
        companyName: vendor.companyName,
        contactEmail: vendor.contactEmail,
        status: toVendorStatus(vendor.status),
        onboardingDeadline: parseDate(vendor.onboardingDeadline),
        categories: vendor.categories,
        createdAt: parseDate(vendor.createdAt),
        accountOwnerId: accountOwner?.id,
      },
    });

    vendorIdByCompany.set(vendor.companyName, createdVendor.id);

    for (const document of vendor.documents) {
      if (!document.uploadedAt) {
        continue;
      }

      const submission = await prisma.vendorDocument.create({
        data: {
          vendorId: createdVendor.id,
          templateId: templates.get(document.name)!.id,
          storagePath: `seed/onboarding/${vendor.id}/${document.name.toLowerCase().replaceAll(" ", "-")}.pdf`,
          uploadedAt: parseDate(document.uploadedAt),
        },
      });

      await prisma.approvalDecision.createMany({
        data: [
          {
            reviewerId: users.admin.id,
            state: toApprovalState(document.approval.admin),
            decidedAt:
              document.approval.admin === "pending" ? null : parseDate(document.uploadedAt),
            vendorDocumentId: submission.id,
          },
          {
            reviewerId: users.approver.id,
            state: toApprovalState(document.approval.approver),
            decidedAt:
              document.approval.approver === "pending" ? null : parseDate(document.uploadedAt),
            vendorDocumentId: submission.id,
          },
        ],
      });
    }
  }

  for (const job of jobs) {
    const createdJob = await prisma.jobRequest.create({
      data: {
        reference: job.id,
        title: job.title,
        category: job.category,
        description: `${job.title} for ${job.category}.`,
        createdById: users.admin.id,
        status: toJobStatus(job.status),
        createdAt: parseDate(job.createdAt),
      },
    });

    for (const quote of job.quotes) {
      const vendorId = vendorIdByCompany.get(quote.vendorName);

      if (!vendorId) {
        continue;
      }

      await prisma.jobQuote.create({
        data: {
          jobRequestId: createdJob.id,
          vendorId,
          amount: parseAmount(quote.amount),
          submittedAt: parseDate(quote.submittedAt),
        },
      });
    }

    if (job.assignedVendor) {
      const assignment = await prisma.jobAssignment.create({
        data: {
          jobRequestId: createdJob.id,
          vendorId: vendorIdByCompany.get(job.assignedVendor)!,
          assignedAt: parseDate(job.createdAt),
        },
      });

      await prisma.approvalDecision.createMany({
        data: [
          {
            reviewerId: users.admin.id,
            state: toApprovalState(job.assignmentApproval.admin),
            decidedAt:
              job.assignmentApproval.admin === "pending" ? null : parseDate(job.createdAt),
            jobAssignmentId: assignment.id,
          },
          {
            reviewerId: users.approver.id,
            state: toApprovalState(job.assignmentApproval.approver),
            decidedAt:
              job.assignmentApproval.approver === "pending" ? null : parseDate(job.createdAt),
            jobAssignmentId: assignment.id,
          },
        ],
      });
    }

    if (job.completionUploadedAt) {
      const completionSubmission = await prisma.jobCompletionSubmission.create({
        data: {
          jobRequestId: createdJob.id,
          storagePath: `seed/completions/${job.id}/completion-form.pdf`,
          uploadedAt: parseDate(job.completionUploadedAt),
        },
      });

      await prisma.approvalDecision.createMany({
        data: [
          {
            reviewerId: users.admin.id,
            state: toApprovalState(job.completionApproval.admin),
            decidedAt:
              job.completionApproval.admin === "pending"
                ? null
                : parseDate(job.completionUploadedAt),
            completionSubmissionId: completionSubmission.id,
          },
          {
            reviewerId: users.approver.id,
            state: toApprovalState(job.completionApproval.approver),
            decidedAt:
              job.completionApproval.approver === "pending"
                ? null
                : parseDate(job.completionUploadedAt),
            completionSubmissionId: completionSubmission.id,
          },
        ],
      });
    }

    if (job.invoiceUploadedAt) {
      await prisma.invoiceSubmission.create({
        data: {
          jobRequestId: createdJob.id,
          storagePath: `seed/invoices/${job.id}/invoice.pdf`,
          uploadedAt: parseDate(job.invoiceUploadedAt),
        },
      });
    }
  }

  await prisma.notificationEvent.createMany({
    data: [
      {
        recipientId: users.admin.id,
        type: "seed.portal.initialized",
        payload: { vendors: vendors.length, jobs: jobs.length },
      },
      {
        recipientId: users.internalControl.id,
        type: "seed.portal.watchlist",
        payload: { openExceptions: 3 },
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getStorageBackendLabel,
  resolveStorageDownloadUrl,
  uploadPortalFile,
} from "@/lib/file-storage";
import { getPrismaClient } from "@/lib/prisma";

async function submitOnboardingDocumentAction(formData: FormData) {
  "use server";

  const session = await auth();

  if (session?.user?.role !== "vendor") {
    throw new Error("Only vendors can submit onboarding documents.");
  }

  const templateId = String(formData.get("templateId") ?? "").trim();
  const documentFile = formData.get("documentFile");

  if (!templateId || !(documentFile instanceof File) || !session.user.email) {
    throw new Error("Template and uploaded document file are required.");
  }

  const prisma = getPrismaClient();
  const vendor = await prisma.vendor.findFirst({
    where: {
      OR: [
        { accountOwnerId: session.user.id },
        { contactEmail: session.user.email },
      ],
    },
  });

  if (!vendor) {
    throw new Error("Vendor account not found for the signed-in user.");
  }

  const template = await prisma.onboardingDocumentTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error("Template not found.");
  }
  const storagePath = await uploadPortalFile({
    area: "vendor-submissions",
    entityKey: `${vendor.reference}-${template.name}`,
    file: documentFile,
  });

  const [admin, approver] = await Promise.all([
    prisma.user.findFirst({ where: { role: "ADMIN" } }),
    prisma.user.findFirst({ where: { role: "APPROVER" } }),
  ]);

  if (!admin || !approver) {
    throw new Error("Approval users are missing.");
  }

  const existingDocument = await prisma.vendorDocument.findFirst({
    where: {
      vendorId: vendor.id,
      templateId: template.id,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });

  const uploadedAt = new Date();

  const vendorDocument = existingDocument
    ? await prisma.vendorDocument.update({
        where: {
          id: existingDocument.id,
        },
        data: {
          storagePath,
          uploadedAt,
        },
      })
    : await prisma.vendorDocument.create({
        data: {
          vendorId: vendor.id,
          templateId: template.id,
          storagePath,
          uploadedAt,
        },
      });

  await prisma.approvalDecision.deleteMany({
    where: {
      vendorDocumentId: vendorDocument.id,
    },
  });

  await prisma.approvalDecision.createMany({
    data: [
      {
        reviewerId: admin.id,
        state: "PENDING",
        vendorDocumentId: vendorDocument.id,
      },
      {
        reviewerId: approver.id,
        state: "PENDING",
        vendorDocumentId: vendorDocument.id,
      },
    ],
  });

  const requiredTemplateIds = (
    await prisma.onboardingDocumentTemplate.findMany({
      where: { isRequired: true },
      select: { id: true },
    })
  ).map((item) => item.id);

  const uploadedRequiredCount = await prisma.vendorDocument.count({
    where: {
      vendorId: vendor.id,
      templateId: {
        in: requiredTemplateIds,
      },
    },
  });

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      status:
        uploadedRequiredCount >= requiredTemplateIds.length && requiredTemplateIds.length > 0
          ? "UNDER_REVIEW"
          : "COLLECTING_DOCUMENTS",
    },
  });

  revalidatePath("/dashboard/vendor");
}

export async function VendorOnboardingPanel({
  userId,
  email,
}: {
  userId: string;
  email?: string | null;
}) {
  const prisma = getPrismaClient();
  const vendor = await prisma.vendor.findFirst({
    where: {
      OR: [{ accountOwnerId: userId }, ...(email ? [{ contactEmail: email }] : [])],
    },
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

  if (!vendor) {
    return (
      <article className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        No vendor account is linked to this login yet. Ask an admin to create your vendor record.
      </article>
    );
  }

  const templates = await prisma.onboardingDocumentTemplate.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });
  const documentsByTemplateId = new Map(
    vendor.documents.map((document) => [document.templateId, document] as const),
  );
  const storageBackendLabel = getStorageBackendLabel();
  const templateEntries = await Promise.all(
    templates.map(async (template) => {
      const submission = documentsByTemplateId.get(template.id);

      return {
        template,
        submission,
        templateDownloadUrl: await resolveStorageDownloadUrl(template.templateStoragePath),
        submissionDownloadUrl: submission
          ? await resolveStorageDownloadUrl(submission.storagePath)
          : null,
      };
    }),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
          Submit completed onboarding file
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Download the admin template, complete it offline, and reupload the finished copy.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Files are stored using <span className="font-semibold">{storageBackendLabel}</span>.
        </p>
        <form action={submitOnboardingDocumentAction} className="mt-6 grid gap-4">
          <select
            required
            name="templateId"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
            defaultValue=""
          >
            <option value="" disabled>
              Select onboarding template
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <label className="grid gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Completed document file</span>
            <input
              required
              type="file"
              name="documentFile"
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--portal-blue)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#184ca8]"
            />
            <span className="text-xs text-slate-500">
              Upload the completed copy. Each file should stay under 20 MB.
            </span>
          </label>
          <button
            type="submit"
            className="rounded-full bg-[var(--portal-blue)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#184ca8]"
          >
            Submit onboarding document
          </button>
        </form>
      </article>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-red)]">
          My onboarding pack
        </p>
        <div className="mt-5 space-y-4">
          {templateEntries.map(({ template, submission, templateDownloadUrl, submissionDownloadUrl }) => {
            const adminApproval =
              submission?.approvals.find((approval) => approval.reviewer.role === "ADMIN")?.state ??
              "PENDING";
            const approverApproval =
              submission?.approvals.find((approval) => approval.reviewer.role === "APPROVER")
                ?.state ?? "PENDING";

            return (
              <div
                key={template.id}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{template.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {template.description ?? "No additional instructions yet."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {template.isRequired ? "Required" : "Optional"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {templateDownloadUrl ? (
                    <a
                      href={templateDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 px-3 py-2 font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
                    >
                      Download template
                    </a>
                  ) : null}
                  {submissionDownloadUrl ? (
                    <a
                      href={submissionDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 px-3 py-2 font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
                    >
                      Open uploaded copy
                    </a>
                  ) : null}
                  <span className="rounded-full bg-white px-3 py-2 text-slate-700">
                    Submission: {submission ? "Uploaded" : "Pending"}
                  </span>
                </div>
                <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                  Submitted file: {submission?.storagePath ?? "No uploaded copy yet."}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Admin review: {adminApproval.toLowerCase().replaceAll("_", " ")}. Approver review:{" "}
                  {approverApproval.toLowerCase().replaceAll("_", " ")}.
                </p>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

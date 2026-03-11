import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getStorageBackendLabel,
  resolveStorageDownloadUrl,
  uploadPortalFile,
} from "@/lib/file-storage";
import { getPrismaClient } from "@/lib/prisma";

type PanelStatusMessage = {
  type: "error" | "success";
  text: string;
};

function buildDashboardRedirectUrl(message: PanelStatusMessage) {
  const params = new URLSearchParams({
    [message.type]: message.text,
  });

  return `/dashboard/vendor?${params.toString()}`;
}

async function submitOnboardingDocumentAction(formData: FormData) {
  "use server";

  const statusMessage = await (async (): Promise<PanelStatusMessage> => {
    try {
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
          OR: [{ accountOwnerId: session.user.id }, { contactEmail: session.user.email }],
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

      return {
        type: "success",
        text: "Document uploaded successfully.",
      };
    } catch (error) {
      return {
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "We couldn't upload that document right now.",
      };
    }
  })();

  redirect(buildDashboardRedirectUrl(statusMessage));
}

export async function VendorOnboardingPanel({
  userId,
  email,
  statusMessage,
}: {
  userId: string;
  email?: string | null;
  statusMessage?: PanelStatusMessage | null;
}) {
  let vendor;
  let templates;
  try {
    const prisma = getPrismaClient();
    [vendor, templates] = await Promise.all([
      prisma.vendor.findFirst({
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
      }),
      prisma.onboardingDocumentTemplate.findMany({
        orderBy: {
          createdAt: "asc",
        },
      }),
    ]);
  } catch (error) {
    const loadError =
      error instanceof Error ? error.message : "Vendor records are unavailable right now.";
    return (
      <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Vendor records are unavailable. {loadError}
      </article>
    );
  }

  if (!vendor) {
    return (
      <article className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No vendor record is linked to this login.
      </article>
    );
  }
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
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[0.92fr_1.08fr]">
      {statusMessage ? (
        <article
          className={`lg:col-span-2 rounded-[1.5rem] border px-5 py-4 text-sm shadow-sm ${
            statusMessage.type === "error"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {statusMessage.text}
        </article>
      ) : null}
      <article className="rounded-[1.35rem] border border-slate-200 bg-white p-3.5 shadow-[0_24px_60px_-55px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
          Upload file
        </p>
        <h2 className="mt-1.5 text-base font-semibold text-slate-950">
          Submit onboarding document
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          Files are stored using <span className="font-semibold">{storageBackendLabel}</span>.
        </p>
        <form action={submitOnboardingDocumentAction} className="mt-3 grid gap-2.5">
          <select
            required
            name="templateId"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--portal-blue)]"
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
          <label className="grid gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Completed document file</span>
            <input
              required
              type="file"
              name="documentFile"
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[var(--portal-blue)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#184ca8]"
            />
            <span className="text-[11px] text-slate-500">Max file size: 20 MB.</span>
          </label>
          <button
            type="submit"
            className="rounded-full bg-[var(--portal-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#184ca8]"
          >
            Submit onboarding document
          </button>
        </form>
      </article>

      <article className="flex min-h-0 flex-col rounded-[1.35rem] border border-slate-200 bg-white p-3.5 shadow-[0_24px_60px_-55px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--portal-red)]">
          Files
        </p>
        <div className="portal-scroll mt-2.5 space-y-2.5 pr-1">
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
                className="rounded-[1rem] border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{template.name}</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {template.description ?? "No additional instructions yet."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {template.isRequired ? "Required" : "Optional"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {templateDownloadUrl ? (
                    <a
                      href={templateDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
                    >
                      Download template
                    </a>
                  ) : null}
                  {submissionDownloadUrl ? (
                    <a
                      href={submissionDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
                    >
                      Open submission
                    </a>
                  ) : null}
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-700">
                    Submission: {submission ? "Uploaded" : "Pending"}
                  </span>
                </div>
                <p className="mt-2 break-all text-xs leading-5 text-slate-600">
                  Submitted file: {submission?.storagePath ?? "No uploaded copy yet."}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">
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

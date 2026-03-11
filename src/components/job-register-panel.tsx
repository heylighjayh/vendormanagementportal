import Link from "next/link";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolveStorageDownloadUrl } from "@/lib/file-storage";
import { getPrismaClient } from "@/lib/prisma";
import type { Role } from "@/lib/portal-types";

type PanelStatusMessage = {
  type: "error" | "success";
  text: string;
};

type JobTimelineEvent = {
  label: string;
  detail: string;
  occurredAt: Date;
};

function buildDashboardUrl(
  role: Role,
  message: PanelStatusMessage,
  jobReference?: string,
) {
  const params = new URLSearchParams({
    [message.type]: message.text,
  });

  if (jobReference) {
    params.set("job", jobReference);
  }

  return `/dashboard/${role}?${params.toString()}`;
}

function buildJobViewUrl(role: Role, jobReference: string) {
  return `/dashboard/${role}?job=${encodeURIComponent(jobReference)}`;
}

function formatDateOnly(value?: Date | null) {
  if (!value) {
    return "Not set";
  }

  return value.toISOString().slice(0, 10);
}

function formatDateTime(value?: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(value);
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").toLowerCase();
}

function buildJobReference(nextNumber: number, date = new Date()) {
  return `JR-${date.getUTCFullYear()}-${String(nextNumber).padStart(3, "0")}`;
}

async function createJobAction(formData: FormData) {
  "use server";

  const result = await (async () => {
    try {
      const session = await auth();

      if (session?.user?.role !== "admin") {
        throw new Error("Only admins can create jobs.");
      }

      const title = String(formData.get("title") ?? "").trim();
      const category = String(formData.get("category") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();

      if (!title || !category || !description) {
        throw new Error("Job title, category, and description are required.");
      }

      const prisma = getPrismaClient();
      const jobCount = await prisma.jobRequest.count();
      const reference = buildJobReference(jobCount + 1);

      await prisma.jobRequest.create({
        data: {
          reference,
          title,
          category,
          description,
          createdById: session.user.id,
          status: "OPEN_FOR_QUOTES",
        },
      });

      revalidatePath("/dashboard/admin");
      revalidatePath("/dashboard/vendor");
      revalidatePath("/dashboard/approver");
      revalidatePath("/dashboard/internal-control-reviewer");

      return {
        message: {
          type: "success" as const,
          text: "Job created successfully.",
        },
        jobReference: reference,
      };
    } catch (error) {
      return {
        message: {
          type: "error" as const,
          text:
            error instanceof Error ? error.message : "We couldn't create that job right now.",
        },
        jobReference: undefined,
      };
    }
  })();

  redirect(buildDashboardUrl("admin", result.message, result.jobReference));
}

async function assignJobAction(formData: FormData) {
  "use server";

  const fallbackJobReference = String(formData.get("jobReference") ?? "").trim();

  const result = await (async () => {
    try {
      const session = await auth();

      if (session?.user?.role !== "admin") {
        throw new Error("Only admins can assign jobs.");
      }

      const jobId = String(formData.get("jobId") ?? "").trim();
      const vendorId = String(formData.get("vendorId") ?? "").trim();

      if (!jobId || !vendorId) {
        throw new Error("Job and vendor are required.");
      }

      const prisma = getPrismaClient();
      const [job, vendor, admin, approver] = await Promise.all([
        prisma.jobRequest.findUnique({
          where: { id: jobId },
          include: {
            assignment: true,
            completionSubmission: true,
            invoiceSubmission: true,
          },
        }),
        prisma.vendor.findUnique({
          where: { id: vendorId },
        }),
        prisma.user.findFirst({ where: { role: "ADMIN" } }),
        prisma.user.findFirst({ where: { role: "APPROVER" } }),
      ]);

      if (!job) {
        throw new Error("Job not found.");
      }

      if (!vendor || vendor.status !== "VERIFIED") {
        throw new Error("Only verified vendors can be assigned.");
      }

      if (!admin || !approver) {
        throw new Error("Approval users are missing.");
      }

      if (job.invoiceSubmission || job.completionSubmission) {
        throw new Error("This job can no longer be reassigned because downstream files exist.");
      }

      await prisma.$transaction(async (tx) => {
        let assignmentId = job.assignment?.id;

        if (job.assignment) {
          await tx.jobAssignment.update({
            where: {
              id: job.assignment.id,
            },
            data: {
              vendorId: vendor.id,
              assignedAt: new Date(),
            },
          });
        } else {
          const assignment = await tx.jobAssignment.create({
            data: {
              jobRequestId: job.id,
              vendorId: vendor.id,
            },
          });

          assignmentId = assignment.id;
        }

        if (!assignmentId) {
          throw new Error("Unable to assign this job.");
        }

        await tx.approvalDecision.deleteMany({
          where: {
            jobAssignmentId: assignmentId,
          },
        });

        await tx.approvalDecision.createMany({
          data: [
            {
              reviewerId: admin.id,
              state: "PENDING",
              jobAssignmentId: assignmentId,
            },
            {
              reviewerId: approver.id,
              state: "PENDING",
              jobAssignmentId: assignmentId,
            },
          ],
        });

        await tx.jobRequest.update({
          where: {
            id: job.id,
          },
          data: {
            status: "PENDING_ASSIGNMENT_APPROVAL",
          },
        });
      });

      revalidatePath("/dashboard/admin");
      revalidatePath("/dashboard/vendor");
      revalidatePath("/dashboard/approver");
      revalidatePath("/dashboard/internal-control-reviewer");

      return {
        message: {
          type: "success" as const,
          text: `Job assigned to ${vendor.companyName}.`,
        },
        jobReference: job.reference,
      };
    } catch (error) {
      return {
        message: {
          type: "error" as const,
          text:
            error instanceof Error ? error.message : "We couldn't assign that job right now.",
        },
        jobReference: fallbackJobReference || undefined,
      };
    }
  })();

  redirect(buildDashboardUrl("admin", result.message, result.jobReference));
}

async function reviewAssignmentAction(formData: FormData) {
  "use server";

  const role = String(formData.get("role") ?? "").trim() as Role;
  const fallbackJobReference = String(formData.get("jobReference") ?? "").trim();

  const result = await (async () => {
    try {
      const session = await auth();

      if (session?.user?.role !== "admin" && session?.user?.role !== "approver") {
        throw new Error("Only admins and approvers can review assignments.");
      }

      const jobAssignmentId = String(formData.get("jobAssignmentId") ?? "").trim();
      const decision = String(formData.get("decision") ?? "").trim();

      if (!jobAssignmentId || !decision) {
        throw new Error("Assignment review data is incomplete.");
      }

      if (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED") {
        throw new Error("Invalid assignment decision.");
      }

      const prisma = getPrismaClient();
      const approval = await prisma.approvalDecision.findFirst({
        where: {
          jobAssignmentId,
          reviewerId: session.user.id,
        },
        include: {
          jobAssignment: {
            include: {
              jobRequest: true,
            },
          },
        },
      });

      if (!approval?.jobAssignment) {
        throw new Error("Assignment review record not found.");
      }

      await prisma.approvalDecision.update({
        where: {
          id: approval.id,
        },
        data: {
          state: decision,
          decidedAt: new Date(),
        },
      });

      const approvals = await prisma.approvalDecision.findMany({
        where: {
          jobAssignmentId,
        },
      });

      const hasChangesRequested = approvals.some(
        (item) => item.state === "CHANGES_REQUESTED",
      );
      const allApproved = approvals.length > 0 && approvals.every((item) => item.state === "APPROVED");

      await prisma.jobRequest.update({
        where: {
          id: approval.jobAssignment.jobRequestId,
        },
        data: {
          status: hasChangesRequested
            ? "OPEN_FOR_QUOTES"
            : allApproved
              ? "ASSIGNED"
              : "PENDING_ASSIGNMENT_APPROVAL",
        },
      });

      revalidatePath("/dashboard/admin");
      revalidatePath("/dashboard/vendor");
      revalidatePath("/dashboard/approver");
      revalidatePath("/dashboard/internal-control-reviewer");

      return {
        message: {
          type: "success" as const,
          text: "Assignment review updated.",
        },
        jobReference: approval.jobAssignment.jobRequest.reference,
      };
    } catch (error) {
      return {
        message: {
          type: "error" as const,
          text:
            error instanceof Error
              ? error.message
              : "We couldn't update that assignment review right now.",
        },
        jobReference: fallbackJobReference || undefined,
      };
    }
  })();

  redirect(buildDashboardUrl(role, result.message, result.jobReference));
}

async function reviewCompletionAction(formData: FormData) {
  "use server";

  const role = String(formData.get("role") ?? "").trim() as Role;
  const fallbackJobReference = String(formData.get("jobReference") ?? "").trim();

  const result = await (async () => {
    try {
      const session = await auth();

      if (session?.user?.role !== "admin" && session?.user?.role !== "approver") {
        throw new Error("Only admins and approvers can review completion files.");
      }

      const completionSubmissionId = String(formData.get("completionSubmissionId") ?? "").trim();
      const decision = String(formData.get("decision") ?? "").trim();

      if (!completionSubmissionId || !decision) {
        throw new Error("Completion review data is incomplete.");
      }

      if (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED") {
        throw new Error("Invalid completion decision.");
      }

      const prisma = getPrismaClient();
      const approval = await prisma.approvalDecision.findFirst({
        where: {
          completionSubmissionId,
          reviewerId: session.user.id,
        },
        include: {
          completionSubmission: {
            include: {
              jobRequest: true,
            },
          },
        },
      });

      if (!approval?.completionSubmission) {
        throw new Error("Completion review record not found.");
      }

      await prisma.approvalDecision.update({
        where: {
          id: approval.id,
        },
        data: {
          state: decision,
          decidedAt: new Date(),
        },
      });

      const approvals = await prisma.approvalDecision.findMany({
        where: {
          completionSubmissionId,
        },
      });

      const hasChangesRequested = approvals.some(
        (item) => item.state === "CHANGES_REQUESTED",
      );
      const allApproved = approvals.length > 0 && approvals.every((item) => item.state === "APPROVED");

      await prisma.jobRequest.update({
        where: {
          id: approval.completionSubmission.jobRequestId,
        },
        data: {
          status: hasChangesRequested
            ? "ASSIGNED"
            : allApproved
              ? "COMPLETION_APPROVED"
              : "COMPLETION_UNDER_REVIEW",
        },
      });

      revalidatePath("/dashboard/admin");
      revalidatePath("/dashboard/vendor");
      revalidatePath("/dashboard/approver");
      revalidatePath("/dashboard/internal-control-reviewer");

      return {
        message: {
          type: "success" as const,
          text: "Completion review updated.",
        },
        jobReference: approval.completionSubmission.jobRequest.reference,
      };
    } catch (error) {
      return {
        message: {
          type: "error" as const,
          text:
            error instanceof Error
              ? error.message
              : "We couldn't update that completion review right now.",
        },
        jobReference: fallbackJobReference || undefined,
      };
    }
  })();

  redirect(buildDashboardUrl(role, result.message, result.jobReference));
}

export async function JobRegisterPanel({
  role,
  userId,
  email,
  selectedJobReference,
  statusMessage,
}: {
  role: Role;
  userId?: string;
  email?: string | null;
  selectedJobReference?: string | null;
  statusMessage?: PanelStatusMessage | null;
}) {
  try {
    const prisma = getPrismaClient();

    const vendorRecord =
      role === "vendor" && userId
        ? await prisma.vendor.findFirst({
            where: {
              OR: [{ accountOwnerId: userId }, ...(email ? [{ contactEmail: email }] : [])],
            },
          })
        : null;

    if (role === "vendor" && !vendorRecord) {
      return null;
    }

    const jobWhere =
      role === "vendor" && vendorRecord
        ? ({
            OR: [
              {
                assignment: {
                  is: {
                    vendorId: vendorRecord.id,
                  },
                },
              },
              ...(vendorRecord.status === "VERIFIED"
                ? [
                    {
                      status: "OPEN_FOR_QUOTES" as const,
                      category: {
                        in: vendorRecord.categories,
                      },
                    },
                  ]
                : []),
            ],
          } satisfies Prisma.JobRequestWhereInput)
        : undefined;

    const [jobs, verifiedVendors] = await Promise.all([
      prisma.jobRequest.findMany({
        where: jobWhere,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdBy: true,
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
      }),
      role === "admin"
        ? prisma.vendor.findMany({
            where: {
              status: "VERIFIED",
            },
            orderBy: {
              companyName: "asc",
            },
          })
        : Promise.resolve([]),
    ]);

    const selectedJob =
      jobs.find((job) => job.reference === selectedJobReference) ?? jobs[0] ?? null;
    const [completionDownloadUrl, invoiceDownloadUrl] = await Promise.all([
      selectedJob?.completionSubmission
        ? resolveStorageDownloadUrl(selectedJob.completionSubmission.storagePath)
        : Promise.resolve(null),
      selectedJob?.invoiceSubmission
        ? resolveStorageDownloadUrl(selectedJob.invoiceSubmission.storagePath)
        : Promise.resolve(null),
    ]);
    const jobTimeline: JobTimelineEvent[] = selectedJob
      ? [
          {
            label: "Created",
            detail: `Created by ${selectedJob.createdBy.name ?? selectedJob.createdBy.email}.`,
            occurredAt: selectedJob.createdAt,
          },
          selectedJob.assignment
            ? {
                label: "Assigned",
                detail: `Assigned to ${selectedJob.assignment.vendor.companyName}.`,
                occurredAt: selectedJob.assignment.assignedAt,
              }
            : null,
          selectedJob.completionSubmission
            ? {
                label: "Completion file attached",
                detail: "Completion form uploaded.",
                occurredAt: selectedJob.completionSubmission.uploadedAt,
              }
            : null,
          selectedJob.invoiceSubmission
            ? {
                label: "Invoice attached",
                detail: "Invoice uploaded.",
                occurredAt: selectedJob.invoiceSubmission.uploadedAt,
              }
            : null,
        ].filter((event): event is JobTimelineEvent => event !== null)
      : [];
    const assignmentAdminState =
      selectedJob?.assignment?.approvals.find((approval) => approval.reviewer.role === "ADMIN")
        ?.state ?? "PENDING";
    const assignmentApproverState =
      selectedJob?.assignment?.approvals.find((approval) => approval.reviewer.role === "APPROVER")
        ?.state ?? "PENDING";
    const completionAdminState =
      selectedJob?.completionSubmission?.approvals.find(
        (approval) => approval.reviewer.role === "ADMIN",
      )?.state ?? "PENDING";
    const completionApproverState =
      selectedJob?.completionSubmission?.approvals.find(
        (approval) => approval.reviewer.role === "APPROVER",
      )?.state ?? "PENDING";

    return (
      <div className="grid h-full min-h-0 gap-4">
        {statusMessage ? (
          <article
            className={`rounded-[1.5rem] border px-5 py-4 text-sm shadow-sm ${
              statusMessage.type === "error"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {statusMessage.text}
          </article>
        ) : null}
        <article className="flex min-h-0 flex-col rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="grid min-h-0 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
                Jobs
              </p>
              <h2 className="mt-1.5 text-lg font-semibold text-slate-950">
                {role === "admin" ? "Create and manage jobs" : "Open jobs"}
              </h2>
            </div>

            {role === "admin" ? (
              <>
                <form action={createJobAction} className="grid gap-2.5 xl:grid-cols-2">
                  <input
                    required
                    name="title"
                    placeholder="Job title"
                    className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--portal-blue)]"
                  />
                  <input
                    required
                    name="category"
                    placeholder="Category"
                    className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--portal-blue)]"
                  />
                  <textarea
                    required
                    name="description"
                    rows={3}
                    placeholder="Job description"
                    className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--portal-blue)] xl:col-span-2"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--portal-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#184ca8] xl:justify-self-start"
                  >
                    Create job
                  </button>
                </form>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-red)]">
                    Assign vendor
                  </p>
                  {selectedJob ? (
                    <form action={assignJobAction} className="mt-2.5 grid gap-2.5">
                      <input type="hidden" name="jobId" value={selectedJob.id} />
                      <input type="hidden" name="jobReference" value={selectedJob.reference} />
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                        {selectedJob.reference} · {selectedJob.title}
                      </div>
                      <select
                        required
                        name="vendorId"
                        defaultValue={selectedJob.assignment?.vendorId ?? ""}
                        className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[var(--portal-blue)]"
                      >
                        <option value="" disabled>
                          Select verified vendor
                        </option>
                        {verifiedVendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.companyName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        {selectedJob.assignment ? "Reassign job" : "Assign job"}
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Create a job or open one from the list to assign it.
                    </p>
                  )}
                </div>
              </>
            ) : null}

            <div className="flex min-h-0 flex-col rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-red)]">
                  Job register
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {jobs.length} jobs
                </span>
              </div>
              <div className="portal-scroll mt-2.5 space-y-2.5 pr-1">
                {jobs.length === 0 ? (
                  <p className="text-sm text-slate-600">No jobs available.</p>
                ) : (
                  jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={buildJobViewUrl(role, job.reference)}
                      className={`block rounded-[1rem] border px-3 py-3 transition ${
                        selectedJob?.id === job.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                            {job.reference}
                          </p>
                          <h3 className="mt-1 truncate text-sm font-semibold">{job.title}</h3>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                            selectedJob?.id === job.id
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {formatStatusLabel(job.status)}
                        </span>
                      </div>
                      <p
                        className={`mt-1.5 text-xs leading-5 ${
                          selectedJob?.id === job.id ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        {job.assignment?.vendor.companyName ?? "Not assigned"} ·{" "}
                        {formatDateOnly(job.createdAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="portal-scroll min-h-0 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
            {selectedJob ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-blue)]">
                      Job detail
                    </p>
                    <h3 className="mt-1.5 text-xl font-semibold text-slate-950">
                      {selectedJob.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{selectedJob.reference}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {formatStatusLabel(selectedJob.status)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Category</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-950">
                      {selectedJob.category}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Assigned vendor</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-950">
                      {selectedJob.assignment?.vendor.companyName ?? "Not assigned"}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Assignment approval</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-700">
                      Admin: {formatStatusLabel(assignmentAdminState)}. Approver:{" "}
                      {formatStatusLabel(assignmentApproverState)}.
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-slate-200 bg-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Files</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-700">
                      Completion: {selectedJob.completionSubmission ? "Attached" : "Pending"}.
                      Invoice: {selectedJob.invoiceSubmission ? "Attached" : "Pending"}.
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-[1rem] border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Description</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-700">
                    {selectedJob.description}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {completionDownloadUrl ? (
                    <a
                      href={completionDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-slate-400"
                    >
                      Open completion file
                    </a>
                  ) : null}
                  {invoiceDownloadUrl ? (
                    <a
                      href={invoiceDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:border-slate-400"
                    >
                      Open invoice
                    </a>
                  ) : null}
                </div>

                {(role === "admin" || role === "approver") && selectedJob.assignment ? (
                  <div className="mt-3 rounded-[1rem] border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--portal-red)]">
                      Assignment review
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      Admin: {formatStatusLabel(assignmentAdminState)}. Approver:{" "}
                      {formatStatusLabel(assignmentApproverState)}.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <form action={reviewAssignmentAction}>
                        <input type="hidden" name="role" value={role} />
                        <input type="hidden" name="jobReference" value={selectedJob.reference} />
                        <input
                          type="hidden"
                          name="jobAssignmentId"
                          value={selectedJob.assignment.id}
                        />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--portal-blue)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#184ca8]"
                        >
                          Approve assignment
                        </button>
                      </form>
                      <form action={reviewAssignmentAction}>
                        <input type="hidden" name="role" value={role} />
                        <input type="hidden" name="jobReference" value={selectedJob.reference} />
                        <input
                          type="hidden"
                          name="jobAssignmentId"
                          value={selectedJob.assignment.id}
                        />
                        <input type="hidden" name="decision" value="CHANGES_REQUESTED" />
                        <button
                          type="submit"
                          className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
                        >
                          Request changes
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}

                {(role === "admin" || role === "approver") && selectedJob.completionSubmission ? (
                  <div className="mt-3 rounded-[1rem] border border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--portal-red)]">
                      Completion review
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      Admin: {formatStatusLabel(completionAdminState)}. Approver:{" "}
                      {formatStatusLabel(completionApproverState)}.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <form action={reviewCompletionAction}>
                        <input type="hidden" name="role" value={role} />
                        <input type="hidden" name="jobReference" value={selectedJob.reference} />
                        <input
                          type="hidden"
                          name="completionSubmissionId"
                          value={selectedJob.completionSubmission.id}
                        />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--portal-blue)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#184ca8]"
                        >
                          Approve completion
                        </button>
                      </form>
                      <form action={reviewCompletionAction}>
                        <input type="hidden" name="role" value={role} />
                        <input type="hidden" name="jobReference" value={selectedJob.reference} />
                        <input
                          type="hidden"
                          name="completionSubmissionId"
                          value={selectedJob.completionSubmission.id}
                        />
                        <input type="hidden" name="decision" value="CHANGES_REQUESTED" />
                        <button
                          type="submit"
                          className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
                        >
                          Request changes
                        </button>
                      </form>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-red)]">
                    Timeline
                  </p>
                  <div className="mt-2.5 space-y-2.5">
                    {jobTimeline.map((event) => (
                      <div
                        key={`${event.label}-${event.occurredAt?.toISOString() ?? "none"}`}
                        className="rounded-[1rem] border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-950">{event.label}</p>
                          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                            {formatDateTime(event.occurredAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{event.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Select a job to view its status, assignment, approval state, and file trail.
              </p>
            )}
          </div>
        </div>
        </article>
      </div>
    );
  } catch (error) {
    const loadError = error instanceof Error ? error.message : "Job records are unavailable right now.";

    return (
      <article className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Job records are unavailable. {loadError}
      </article>
    );
  }
}

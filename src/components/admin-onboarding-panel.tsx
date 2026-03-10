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

  return `/dashboard/admin?${params.toString()}`;
}

async function createTemplateAction(formData: FormData) {
  "use server";

  const statusMessage = await (async (): Promise<PanelStatusMessage> => {
    try {
      const session = await auth();

      if (session?.user?.role !== "admin") {
        throw new Error("Only admins can create onboarding templates.");
      }

      const name = String(formData.get("name") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      const isRequired = formData.get("isRequired") === "on";
      const templateFile = formData.get("templateFile");

      if (!name || !(templateFile instanceof File)) {
        throw new Error("Template name and file are required.");
      }

      const prisma = getPrismaClient();
      const templateStoragePath = await uploadPortalFile({
        area: "templates",
        entityKey: name,
        file: templateFile,
      });

      await prisma.onboardingDocumentTemplate.create({
        data: {
          name,
          description: description || null,
          templateStoragePath,
          isRequired,
          uploadedById: session.user.id,
        },
      });

      revalidatePath("/dashboard/admin");

      return {
        type: "success",
        text: "Template uploaded successfully.",
      };
    } catch (error) {
      return {
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "We couldn't upload that template right now.",
      };
    }
  })();

  redirect(buildDashboardRedirectUrl(statusMessage));
}

async function inviteVendorAction(formData: FormData) {
  "use server";

  const statusMessage = await (async (): Promise<PanelStatusMessage> => {
    try {
      const session = await auth();

      if (session?.user?.role !== "admin") {
        throw new Error("Only admins can create vendor accounts.");
      }

      const companyName = String(formData.get("companyName") ?? "").trim();
      const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
      const categories = String(formData.get("categories") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const onboardingDeadline = String(formData.get("onboardingDeadline") ?? "").trim();

      if (!companyName || !contactEmail || !onboardingDeadline || categories.length === 0) {
        throw new Error("Company, email, deadline, and at least one category are required.");
      }

      const prisma = getPrismaClient();
      const vendorCount = await prisma.vendor.count();
      const reference = `VND-${String(1000 + vendorCount + 1).padStart(4, "0")}`;

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: companyName,
            email: contactEmail,
            role: "VENDOR",
          },
        });

        await tx.vendor.create({
          data: {
            reference,
            companyName,
            contactEmail,
            categories,
            onboardingDeadline: new Date(`${onboardingDeadline}T00:00:00.000Z`),
            status: "INVITED",
            accountOwnerId: user.id,
          },
        });
      });

      revalidatePath("/dashboard/admin");

      return {
        type: "success",
        text: "Vendor account created successfully.",
      };
    } catch (error) {
      return {
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "We couldn't create that vendor account right now.",
      };
    }
  })();

  redirect(buildDashboardRedirectUrl(statusMessage));
}

export async function AdminOnboardingPanel({
  statusMessage,
}: {
  statusMessage?: PanelStatusMessage | null;
}) {
  const prisma = getPrismaClient();
  const [templates, vendors] = await Promise.all([
    prisma.onboardingDocumentTemplate.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        uploadedBy: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    }),
    prisma.vendor.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        accountOwner: true,
        _count: {
          select: {
            documents: true,
          },
        },
      },
    }),
  ]);
  const storageBackendLabel = getStorageBackendLabel();
  const templateDownloadUrls = await Promise.all(
    templates.map(async (template) => ({
      id: template.id,
      downloadUrl: await resolveStorageDownloadUrl(template.templateStoragePath),
    })),
  );
  const downloadUrlByTemplateId = new Map(
    templateDownloadUrls.map((entry) => [entry.id, entry.downloadUrl] as const),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
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
      <div className="space-y-6">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
            Invite vendor
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Create a vendor account and start the onboarding SLA.
          </h2>
          <form action={inviteVendorAction} className="mt-6 grid gap-4">
            <input
              required
              name="companyName"
              placeholder="Vendor company name"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
            />
            <input
              required
              type="email"
              name="contactEmail"
              placeholder="vendor@example.com"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
            />
            <input
              required
              name="categories"
              placeholder="Networking Jobs, CCTV Jobs"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
            />
            <input
              required
              type="date"
              name="onboardingDeadline"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--portal-blue)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#184ca8]"
            >
              Create vendor account
            </button>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-red)]">
            Vendor intake queue
          </p>
          <div className="mt-5 space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {vendor.companyName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{vendor.contactEmail}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {vendor.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Reference {vendor.reference}. Deadline {vendor.onboardingDeadline
                    .toISOString()
                    .slice(0, 10)}. Categories: {vendor.categories.join(", ")}.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Assigned login: {vendor.accountOwner?.email ?? "Not linked"}.
                  Uploaded files: {vendor._count.documents}.
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--portal-blue)]">
          Onboarding template pack
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Upload the blank forms vendors must download and reupload.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Files are stored using <span className="font-semibold">{storageBackendLabel}</span>.
        </p>
        <form action={createTemplateAction} className="mt-6 grid gap-4">
          <input
            required
            name="name"
            placeholder="Vendor Registration Form"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
          />
          <textarea
            name="description"
            rows={3}
            placeholder="Explain what the vendor should complete in this document."
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[var(--portal-blue)]"
          />
          <label className="grid gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-700">
            <span className="font-medium text-slate-900">Template file</span>
            <input
              required
              type="file"
              name="templateFile"
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800"
            />
            <span className="text-xs text-slate-500">
              Supported by your browser upload flow. Keep each file under 20 MB.
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" name="isRequired" defaultChecked />
            Mark as required for vendor verification
          </label>
          <button
            type="submit"
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add template to onboarding pack
          </button>
        </form>

        <div className="mt-8 space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">{template.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {template.description ?? "No instructions added yet."}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {template.isRequired ? "Required" : "Optional"}
                </span>
              </div>
              <p className="mt-3 break-all text-sm leading-6 text-slate-600">
                Template path: {template.templateStoragePath}
              </p>
              {downloadUrlByTemplateId.get(template.id) ? (
                <a
                  href={downloadUrlByTemplateId.get(template.id) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white"
                >
                  Download uploaded template
                </a>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Uploaded by {template.uploadedBy?.email ?? "system"}.
                Vendor submissions linked: {template._count.submissions}.
              </p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

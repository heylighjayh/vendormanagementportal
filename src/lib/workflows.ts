import type {
  DualApproval,
  JobRecord,
  OnboardingDocument,
  VendorRecord,
} from "@/lib/portal-types";

export function isApproved(approval: DualApproval) {
  return approval.admin === "approved" && approval.approver === "approved";
}

export function getDocumentProgress(documents: OnboardingDocument[]) {
  const uploaded = documents.filter((document) => document.uploadedAt).length;
  const approved = documents.filter((document) => isApproved(document.approval)).length;

  return {
    total: documents.length,
    uploaded,
    approved,
  };
}

export function getVendorStatusSummary(vendors: VendorRecord[]) {
  const verified = vendors.filter((vendor) => vendor.status === "verified").length;
  const collecting = vendors.filter(
    (vendor) =>
      vendor.status === "collecting-documents" || vendor.status === "under-review",
  ).length;

  return {
    total: vendors.length,
    verified,
    collecting,
  };
}

export function getJobSummary(jobs: JobRecord[]) {
  return {
    open: jobs.filter((job) => job.status === "open-for-quotes").length,
    assignmentPending: jobs.filter(
      (job) => job.status === "pending-assignment-approval",
    ).length,
    completionPending: jobs.filter(
      (job) => job.status === "completion-under-review",
    ).length,
    invoiceReady: jobs.filter((job) => isApproved(job.completionApproval)).length,
  };
}

export function canSubmitInvoice(job: JobRecord) {
  return isApproved(job.completionApproval);
}

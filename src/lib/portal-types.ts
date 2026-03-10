export const roles = [
  "admin",
  "vendor",
  "approver",
  "internal-control-reviewer",
] as const;

export type Role = (typeof roles)[number];

export type ApprovalState = "pending" | "approved" | "changes-requested";

export type VerificationStatus =
  | "invited"
  | "collecting-documents"
  | "under-review"
  | "verified";

export type JobStatus =
  | "open-for-quotes"
  | "pending-assignment-approval"
  | "assigned"
  | "completion-under-review"
  | "completion-approved"
  | "invoice-submitted";

export type DualApproval = {
  admin: ApprovalState;
  approver: ApprovalState;
};

export type OnboardingDocument = {
  name: string;
  uploadedAt?: string;
  approval: DualApproval;
};

export type VendorRecord = {
  id: string;
  companyName: string;
  contactEmail: string;
  categories: string[];
  createdAt: string;
  onboardingDeadline: string;
  status: VerificationStatus;
  documents: OnboardingDocument[];
};

export type QuoteRecord = {
  vendorName: string;
  amount: string;
  submittedAt: string;
};

export type JobRecord = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  status: JobStatus;
  assignmentApproval: DualApproval;
  completionApproval: DualApproval;
  assignedVendor?: string;
  completionUploadedAt?: string;
  invoiceUploadedAt?: string;
  quotes: QuoteRecord[];
};

export type DashboardCard = {
  label: string;
  value: string;
  description: string;
};

export type DashboardItem = {
  title: string;
  detail: string;
  status: string;
};

export type ActionItem = {
  title: string;
  detail: string;
};

export type AlertItem = {
  title: string;
  detail: string;
};

export type DashboardTable = {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
};

export type DashboardConfig = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: DashboardCard[];
  priorityQueue: DashboardItem[];
  actions: ActionItem[];
  alerts: AlertItem[];
  table: DashboardTable;
};

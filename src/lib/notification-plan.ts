import { jobs, vendors } from "@/lib/portal-data";

export const onboardingReminderOffsets = [
  { label: "Invitation", dayOffset: 0 },
  { label: "Week 1 reminder", dayOffset: 7 },
  { label: "48-hour reminder", dayOffset: 12 },
  { label: "Deadline day reminder", dayOffset: 14 },
];

export const notificationBlueprint = [
  {
    event: "Vendor account created",
    recipients: "Vendor, admin",
    message: "Send onboarding instructions and the exact deadline date.",
  },
  {
    event: "New job request posted",
    recipients: "Verified vendors in the matching category",
    message: "Share the job summary and quote submission window.",
  },
  {
    event: "Vendor assigned",
    recipients: "Assigned vendor, admin, approver",
    message: "Confirm the award only after the two approval decisions are complete.",
  },
  {
    event: "Completion form approved",
    recipients: "Assigned vendor, admin, internal control reviewer",
    message: "Tell the vendor the invoice action is now unlocked.",
  },
  {
    event: "Invoice submitted",
    recipients: "Admin, approver, internal control reviewer",
    message: "Alert operations that the invoice is ready for downstream processing.",
  },
];

export function buildNotificationPreview(data?: {
  vendors?: typeof vendors;
  jobs?: typeof jobs;
}) {
  const liveVendors = data?.vendors ?? vendors;
  const liveJobs = data?.jobs ?? jobs;

  return {
    reminders: onboardingReminderOffsets,
    vendors: liveVendors.map((vendor) => ({
      vendor: vendor.companyName,
      deadline: vendor.onboardingDeadline,
    })),
    jobAlerts: liveJobs.map((job) => ({
      jobId: job.id,
      category: job.category,
      status: job.status,
    })),
  };
}

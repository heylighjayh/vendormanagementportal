export const authProviders = [
  {
    name: "Microsoft Entra ID",
    audience: "Internal users on Microsoft 365",
    purpose: "Single sign-on for admins, approvers, and internal control reviewers.",
  },
  {
    name: "Google",
    audience: "External vendors with Gmail or Google Workspace",
    purpose: "Fast vendor sign-up and sign-in without creating local passwords.",
  },
  {
    name: "Email magic link",
    audience: "External vendors on Yahoo or other email providers",
    purpose: "Fallback sign-in for vendors that do not use Google or Microsoft accounts.",
  },
];

export const authImplementationNotes = [
  "Use Auth.js for a single authentication layer across Microsoft, Google, and email magic links.",
  "Map Microsoft roles to admin, approver, and internal control reviewer groups in Microsoft 365.",
  "Allow vendors to self-complete onboarding only after an invited account exists in the system.",
];

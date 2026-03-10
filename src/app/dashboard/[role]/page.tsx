import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminOnboardingPanel } from "@/components/admin-onboarding-panel";
import { DashboardView } from "@/components/dashboard-view";
import { VendorOnboardingPanel } from "@/components/vendor-onboarding-panel";
import { getPortalSnapshot } from "@/lib/portal-repository";
import { getDashboardConfig, isRole } from "@/lib/portal-data";
import { getDashboardHref } from "@/lib/role-utils";
import { roles } from "@/lib/portal-types";

type PageProps = {
  params: Promise<{ role: string }>;
};

export function generateStaticParams() {
  return roles.map((role) => ({ role }));
}

export default async function RoleDashboardPage({ params }: PageProps) {
  const { role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.role) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/dashboard/${role}`)}`);
  }

  if (session.user.role !== role) {
    redirect(getDashboardHref(session.user.role));
  }

  const snapshot = await getPortalSnapshot();
  const dashboard = getDashboardConfig(role, snapshot);

  return (
    <DashboardView dashboard={dashboard} currentUser={session.user}>
      {role === "admin" ? <AdminOnboardingPanel /> : null}
      {role === "vendor" ? (
        <VendorOnboardingPanel userId={session.user.id} email={session.user.email} />
      ) : null}
    </DashboardView>
  );
}

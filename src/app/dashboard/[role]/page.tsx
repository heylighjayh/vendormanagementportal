import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { getDashboardConfig, isRole } from "@/lib/portal-data";
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

  const dashboard = getDashboardConfig(role);

  return <DashboardView dashboard={dashboard} />;
}

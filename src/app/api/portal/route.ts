import { NextResponse } from "next/server";
import { buildNotificationPreview } from "@/lib/notification-plan";
import { getPortalSnapshot } from "@/lib/portal-repository";

export async function GET() {
  const snapshot = await getPortalSnapshot();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source: snapshot.source,
    error: snapshot.error,
    vendors: snapshot.vendors,
    jobs: snapshot.jobs,
    notifications: buildNotificationPreview(snapshot),
  });
}

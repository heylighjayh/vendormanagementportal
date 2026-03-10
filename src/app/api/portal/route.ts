import { NextResponse } from "next/server";
import { jobs, vendors } from "@/lib/portal-data";
import { buildNotificationPreview } from "@/lib/notification-plan";

export async function GET() {
  return NextResponse.json({
    generatedAt: "2026-03-10T00:00:00.000Z",
    vendors,
    jobs,
    notifications: buildNotificationPreview(),
  });
}

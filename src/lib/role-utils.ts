import type { Role as PrismaRole } from "@prisma/client";
import type { Role } from "@/lib/portal-types";

export function mapPrismaRole(role: PrismaRole): Role {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "APPROVER":
      return "approver";
    case "INTERNAL_CONTROL_REVIEWER":
      return "internal-control-reviewer";
    default:
      return "vendor";
  }
}

export function getDashboardHref(role: Role) {
  return `/dashboard/${role}`;
}

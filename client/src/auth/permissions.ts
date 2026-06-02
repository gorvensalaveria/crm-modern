import type { AppRole } from "../types";

export const routePermissions = {
  dashboard: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "FINANCE"],
  clients: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER"],
  matters: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER"],
  workflows: ["ASUN_ADMIN", "AGENCY_ADMIN"],
  billing: ["ASUN_ADMIN", "AGENCY_ADMIN", "FINANCE"],
  reports: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "FINANCE"],
  audit: ["ASUN_ADMIN", "AGENCY_ADMIN"],
  compliance: ["ASUN_ADMIN", "AGENCY_ADMIN"],
  portal: ["CLIENT"]
} as const satisfies Record<string, readonly AppRole[]>;

export type PermissionKey = keyof typeof routePermissions;

export function canAccess(role: AppRole | undefined, permission: PermissionKey) {
  const allowedRoles: readonly AppRole[] = routePermissions[permission];
  return role ? allowedRoles.includes(role) : false;
}

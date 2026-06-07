import type { NextFunction, Request, Response } from "express";
import { roleUsers } from "../data/role-data.js";
import { ApiError } from "../errors/api-error.js";

export type AppRole = "ASUN_ADMIN" | "AGENCY_ADMIN" | "RMA" | "CASE_OFFICER" | "FINANCE" | "CLIENT";

export const roles = {
  staff: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "FINANCE"],
  clientOps: ["CLIENT"],
  clientAndFinance: ["ASUN_ADMIN", "AGENCY_ADMIN", "FINANCE", "CLIENT"],
  clientMatterUpload: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "CLIENT"],
  clientMessaging: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER", "CLIENT"],
  clientRecords: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER"],
  matterOps: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "CASE_OFFICER"],
  finance: ["ASUN_ADMIN", "AGENCY_ADMIN", "FINANCE"],
  matterBilling: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "FINANCE"],
  reports: ["ASUN_ADMIN", "AGENCY_ADMIN", "RMA", "FINANCE"],
  admin: ["ASUN_ADMIN", "AGENCY_ADMIN"]
} satisfies Record<string, AppRole[]>;

export function requestUserId(req: Request) {
  return req.header("x-user-id") ?? undefined;
}

export function getRequestRole(req: Request): AppRole {
  const userId = requestUserId(req) ?? roleUsers.find((item) => item.role === "RMA")?.id;
  if (userId?.startsWith("client-portal:")) {
    return "CLIENT";
  }
  const user = roleUsers.find((item) => item.id === userId);
  return (user?.role ?? "RMA") as AppRole;
}

export function requireRoles(allowedRoles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = getRequestRole(req);

    if (!allowedRoles.includes(role)) {
      next(new ApiError(403, "RBAC_403", `Role ${role.replaceAll("_", " ")} cannot access this API endpoint`));
      return;
    }

    next();
  };
}

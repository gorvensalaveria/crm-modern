import type { Request, Response } from "express";
import { getProductRoleUsers } from "../services/crm-repository.js";
import { notFound } from "../errors/api-error.js";

export function getHealth(_req: Request, res: Response) {
  res.json({ data: { status: "ok", service: "asun-migrations-api" } });
}

export async function getRoleUsers(_req: Request, res: Response) {
  res.json({ data: await getProductRoleUsers() });
}

export async function createRoleSession(req: Request, res: Response) {
  const roleUsers = await getProductRoleUsers();
  const selectedUser = roleUsers.find((user) => user.id === req.body?.userId);

  if (!selectedUser) {
    notFound("User not found", "USER_404");
  }

  res.json({ data: selectedUser });
}

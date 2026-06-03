import type { Request, Response } from "express";
import { roleUsers } from "../data/role-data.js";
import { notFound } from "../errors/api-error.js";

export function getHealth(_req: Request, res: Response) {
  res.json({ data: { status: "ok", service: "asun-migrations-api" } });
}

export function getRoleUsers(_req: Request, res: Response) {
  res.json({ data: roleUsers });
}

export function createRoleSession(req: Request, res: Response) {
  const selectedUser = roleUsers.find((user) => user.id === req.body?.userId);

  if (!selectedUser) {
    notFound("User not found", "USER_404");
  }

  res.json({ data: selectedUser });
}

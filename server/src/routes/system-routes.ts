import { Router } from "express";
import { createRoleSession, getHealth, getRoleUsers } from "../controllers/system-controller.js";

export const systemRoutes = Router();

systemRoutes.get("/health", getHealth);
systemRoutes.get("/role-users", getRoleUsers);
systemRoutes.post("/role-session", createRoleSession);

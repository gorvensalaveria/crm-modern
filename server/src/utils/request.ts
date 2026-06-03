import type { Request } from "express";
import { z } from "zod";
import { ApiError } from "../errors/api-error.js";

export function routeParam(req: Request, name: string) {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseRequest<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  fallbackMessage: string
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_400", parsed.error.issues[0]?.message ?? fallbackMessage);
  }

  return parsed.data;
}

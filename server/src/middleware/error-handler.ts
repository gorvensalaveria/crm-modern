import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error.js";

export function apiNotFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, "API_404", `API route not found: ${req.method} ${req.path}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_400",
        message: "Malformed JSON request body"
      }
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      code: "API_500",
      message: "Unexpected API error"
    }
  });
}

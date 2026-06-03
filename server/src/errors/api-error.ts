export type ApiErrorCode =
  | "API_500"
  | "API_404"
  | "CHECKLIST_404"
  | "CLIENT_404"
  | "CLIENT_409"
  | "USER_404"
  | "DOC_400"
  | "DOC_404"
  | "INVOICE_400"
  | "MATTER_400"
  | "MATTER_404"
  | "MESSAGE_404"
  | "PAY_404"
  | "RBAC_403"
  | "RETENTION_404"
  | "TASK_404"
  | "VALIDATION_400"
  | "WORKFLOW_409";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string
  ) {
    super(message);
  }
}

export function notFound(message: string, code: ApiErrorCode = "API_404"): never {
  throw new ApiError(404, code, message);
}

export function requestFailed(
  error: unknown,
  statusCode: number,
  code: ApiErrorCode,
  fallbackMessage: string
): never {
  throw new ApiError(statusCode, code, error instanceof Error ? error.message : fallbackMessage);
}

import type { ErrorCode } from "../shared/types";

/** An error that is safe to show to the visitor. Never carries request data. */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status = 400,
    public platform?: string,
  ) {
    super(message);
  }
}

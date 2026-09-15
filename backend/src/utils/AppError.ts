/**
 * Operational error carrying an HTTP status code. Throw this from services
 * for any expected failure (not found, forbidden, conflict, validation...)
 * and the central error middleware will turn it into a clean JSON response.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational = true;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

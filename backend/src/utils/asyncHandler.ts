import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async controller so rejected promises are forwarded to next(),
 * instead of every controller needing its own try/catch.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

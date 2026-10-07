import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { sendError } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

// Centralized error handler — every route funnels its failures here via
// asyncHandler/next(err), so the JSON error shape stays consistent everywhere.
export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof MulterError) {
    // Each upload route uses its own multer instance with its own size
    // limit (see upload.middleware.ts) — err.field is the form field name,
    // which is distinct per route ("avatar" / "image" / "media"), so it
    // doubles as a way to report the limit that actually applied instead
    // of a single hardcoded figure that's wrong for at least one route.
    const limitMbByField: Record<string, number> = { avatar: 5, image: 10, media: 10 };
    const limitMb = limitMbByField[err.field ?? ""] ?? 5;
    const message = err.code === "LIMIT_FILE_SIZE" ? `File is too large (max ${limitMb}MB)` : err.message;
    return sendError(res, message, 400);
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join(", ");
    return sendError(res, message, 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, "A record with this value already exists", 409);
    }
    if (err.code === "P2025") {
      return sendError(res, "Record not found", 404);
    }
  }

  console.error("Unexpected error:", err);
  return sendError(res, "Internal server error", 500);
};

import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyToken } from "../utils/jwt";

/**
 * Like requireAuth, but never rejects the request — a missing or invalid
 * token just leaves req.user undefined. Used on public GET endpoints (post
 * list/detail) that adapt slightly when the caller happens to be
 * authenticated (e.g. a "likedByViewer" flag), without requiring login.
 */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, email: true },
    });
    if (user) req.user = user;
  } catch {
    // Invalid/expired token on an optional-auth route — treat as anonymous
    // rather than failing the request.
  }

  next();
});

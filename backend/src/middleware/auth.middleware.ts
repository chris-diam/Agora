import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

/**
 * Requires a valid `Authorization: Bearer <token>` header. Attaches the
 * authenticated user (id/username/email only) to req.user. We look the user
 * up on every request (rather than trusting the JWT payload alone) so a
 * deleted/deactivated account is rejected immediately instead of staying
 * valid until the token expires.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = header.slice("Bearer ".length).trim();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, email: true },
  });

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  req.user = user;
  next();
});

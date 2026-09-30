import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { findOrProvisionUser, verifyAccessToken } from "../services/keycloak.service";

/**
 * Requires a valid `Authorization: Bearer <token>` header — a Keycloak
 * access token, verified against the realm's JWKS. Attaches the linked
 * local user (creating/linking it on first sight, see keycloak.service.ts)
 * to req.user.
 */
export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = header.slice("Bearer ".length).trim();

  let claims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await findOrProvisionUser(claims);

  req.user = { id: user.id, username: user.username, email: user.email };
  next();
});

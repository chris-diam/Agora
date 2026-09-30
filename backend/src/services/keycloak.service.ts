import { createRemoteJWKSet, jwtVerify } from "jose";
import { Prisma } from "@prisma/client";
import { env } from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

const issuer = `${env.KEYCLOAK_URL}/realms/${env.KEYCLOAK_REALM}`;

// Cached across requests — fetches/rotates Keycloak's signing keys lazily,
// not on every verification.
const jwks = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));

export interface KeycloakClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

export const verifyAccessToken = async (token: string): Promise<KeycloakClaims> => {
  const { payload } = await jwtVerify(token, jwks, { issuer });
  if (!payload.sub) throw new Error("token has no subject");
  return payload as KeycloakClaims;
};

// Same shape as the old generateUniqueUsername (auth.service.ts, pre-Keycloak) —
// prefers Keycloak's preferred_username/name claims over the email prefix.
const generateUniqueUsername = async (claims: KeycloakClaims): Promise<string> => {
  const seed = claims.preferred_username ?? claims.name ?? claims.email?.split("@")[0] ?? "user";
  const base =
    seed
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || "user";

  let candidate = base;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
};

/**
 * Finds the local User linked to this Keycloak account, linking or
 * provisioning one if this is the first time we've seen it. Shared by both
 * the REST middleware and the Socket.io handshake — a brand-new user's
 * first page load fires both almost simultaneously, so the "not found by
 * email, so create" branch is written to tolerate losing that race rather
 * than assuming it never happens.
 */
export const findOrProvisionUser = async (claims: KeycloakClaims) => {
  const byKeycloakId = await prisma.user.findUnique({ where: { keycloakId: claims.sub } });
  if (byKeycloakId) return byKeycloakId;

  if (!claims.email) {
    throw new AppError("Keycloak account did not provide an email", 400);
  }

  // Pre-existing local account (created before the Keycloak migration, or
  // already linked by the other concurrent auth path) — link it by email,
  // same pattern the old loginWithGoogle used for googleId.
  const byEmail = await prisma.user.findUnique({ where: { email: claims.email } });
  if (byEmail) {
    // Idempotent — a concurrent request may have already set this.
    return byEmail.keycloakId === claims.sub
      ? byEmail
      : await prisma.user.update({ where: { id: byEmail.id }, data: { keycloakId: claims.sub } });
  }

  const username = await generateUniqueUsername(claims);
  const fullName = [claims.given_name, claims.family_name].filter(Boolean).join(" ");
  const displayName = claims.name || fullName || claims.email.split("@")[0];

  try {
    return await prisma.user.create({
      data: { keycloakId: claims.sub, email: claims.email, username, displayName },
    });
  } catch (err) {
    // Lost the create race (REST + Socket.io both provisioning the same
    // brand-new user at once) — the winner's row now exists, fetch it
    // instead of failing this request.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winner = await prisma.user.findUnique({ where: { keycloakId: claims.sub } });
      if (winner) return winner;
    }
    throw err;
  }
};

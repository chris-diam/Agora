import { OAuth2Client } from "google-auth-library";
import { env } from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import { toPublicUser } from "../utils/serializers";
import { LoginInput, RegisterInput } from "../validators/auth.validators";
import { createMediaAssetFromUrl } from "./media.service";

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    if (existing.email === input.email) throw new AppError("Email is already registered", 409);
    throw new AppError("Username is already taken", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    },
  });

  const token = signToken({ sub: user.id, username: user.username, email: user.email });

  return { user: toPublicUser(user), token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Deliberately the same error for "no such user" and "wrong password" —
  // don't leak which emails are registered.
  if (!user) throw new AppError("Invalid email or password", 401);

  if (!user.passwordHash) {
    throw new AppError("This account signs in with Google — use the Google sign-in button instead", 400);
  }

  const validPassword = await comparePassword(input.password, user.passwordHash);
  if (!validPassword) throw new AppError("Invalid email or password", 401);

  const token = signToken({ sub: user.id, username: user.username, email: user.email });

  return { user: toPublicUser(user), token };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { interests: { include: { interest: true } } },
  });

  if (!user) throw new AppError("User not found", 404);

  const { interests, ...rest } = user;

  return {
    ...toPublicUser(rest),
    interests: interests.map((userInterest) => userInterest.interest),
  };
};

// Lazily constructed — a missing GOOGLE_CLIENT_ID shouldn't crash the whole
// server at boot, only fail the one feature that needs it (with a clear
// message) when someone actually tries to use it.
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

// Google gives us no username, so derive one from the profile and make it
// unique by appending a numeric suffix on collision.
const generateUniqueUsername = async (email: string, name?: string | null): Promise<string> => {
  const base =
    (name ?? email.split("@")[0])
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
 * Verifies a Google Identity Services ID token server-side and either:
 *  - logs in the user already linked to this Google account, or
 *  - links this Google account to an existing email/password account that
 *    shares the same (Google-verified) email, or
 *  - creates a brand-new, password-less account.
 * Returns the same { user, token } shape as register/login so the frontend
 * can treat all three as interchangeable.
 */
export const loginWithGoogle = async (idToken: string) => {
  if (!googleClient) {
    throw new AppError("Google sign-in is not configured on this server", 503);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new AppError("Invalid Google credential", 401);
  }

  if (!payload?.sub || !payload.email) {
    throw new AppError("Google account did not provide the required profile info", 400);
  }

  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: payload.email } });
    user = existingByEmail
      ? await prisma.user.update({ where: { id: existingByEmail.id }, data: { googleId: payload.sub } })
      : await prisma.user.create({
          data: {
            username: await generateUniqueUsername(payload.email, payload.name),
            email: payload.email,
            googleId: payload.sub,
            displayName: payload.name ?? payload.email.split("@")[0],
            // Re-hosted as our own MediaAsset rather than the raw Google URL
            // — see createMediaAssetFromUrl for why (rate limiting, URL
            // rotation). null if there's no picture or the fetch fails;
            // the UI already falls back to an initial-letter avatar.
            profileImageUrl: payload.picture ? await createMediaAssetFromUrl(payload.picture) : null,
          },
        });
  }

  const token = signToken({ sub: user.id, username: user.username, email: user.email });

  return { user: toPublicUser(user), token };
};

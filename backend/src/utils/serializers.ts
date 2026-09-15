import { User } from "@prisma/client";

/**
 * Strips sensitive fields (passwordHash) before a User row ever reaches a
 * response. Every service that returns a full User row should go through
 * this rather than returning the Prisma row directly.
 */
export const toPublicUser = <T extends User>(user: T) => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};

import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { toPublicUser } from "../utils/serializers";
import { createKeycloakUser } from "./keycloak-admin.service";
import { RegisterInput } from "../validators/auth.validators";

// Only creates the Keycloak account — the local User row gets created by
// the same just-in-time provisioning every other login path already uses
// (keycloak.service.ts's findOrProvisionUser), the first time this new
// account's token hits requireAuth/optionalAuth. Keeps "how a local User
// gets created" in exactly one place instead of duplicating it here.
export const registerUser = async (input: RegisterInput): Promise<void> => {
  await createKeycloakUser(input);
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

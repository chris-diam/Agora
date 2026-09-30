import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { toPublicUser } from "../utils/serializers";

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

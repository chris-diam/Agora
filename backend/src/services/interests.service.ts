import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export const listInterests = () => prisma.interest.findMany({ orderBy: { name: "asc" } });

export const setUserInterests = async (userId: string, interestIds: string[]) => {
  const uniqueIds = [...new Set(interestIds)];

  if (uniqueIds.length > 0) {
    const matchCount = await prisma.interest.count({ where: { id: { in: uniqueIds } } });
    if (matchCount !== uniqueIds.length) {
      throw new AppError("One or more interests do not exist", 400);
    }
  }

  // Replace the full set atomically rather than diffing add/remove —
  // simpler and this endpoint is a low-frequency "set my interests" action.
  await prisma.$transaction([
    prisma.userInterest.deleteMany({ where: { userId } }),
    prisma.userInterest.createMany({
      data: uniqueIds.map((interestId) => ({ userId, interestId })),
    }),
  ]);

  return prisma.interest.findMany({
    where: { users: { some: { userId } } },
    orderBy: { name: "asc" },
  });
};

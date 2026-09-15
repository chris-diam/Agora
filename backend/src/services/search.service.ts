import { prisma } from "../lib/prisma";
import { publicUserSelect } from "./users.service";

const RESULT_LIMIT = 8;

export const search = async (q: string) => {
  const [users, communities] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: publicUserSelect,
      take: RESULT_LIMIT,
      orderBy: { username: "asc" },
    }),
    prisma.community.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      include: { _count: { select: { members: true } } },
      take: RESULT_LIMIT,
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    users,
    communities: communities.map(({ _count, ...rest }) => ({ ...rest, membersCount: _count.members })),
  };
};

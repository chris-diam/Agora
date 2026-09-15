import { prisma } from "../lib/prisma";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { publicUserSelect } from "./users.service";

/**
 * "Friends" are not a stored relationship — they're anyone in a mutual
 * Follow (A follows B and B follows A). Reuses the existing Follow system
 * instead of adding a parallel friend-request/accept flow, since none was
 * asked for.
 */
export const getMutualFriendIds = async (userId: string): Promise<string[]> => {
  const [following, followers] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } }),
  ]);

  const followerIds = new Set(followers.map((row) => row.followerId));
  return following.map((row) => row.followingId).filter((id) => followerIds.has(id));
};

export const areFriends = async (userId: string, otherId: string): Promise<boolean> => {
  if (userId === otherId) return false;

  const [followsThem, followedByThem] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: otherId } } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: otherId, followingId: userId } } }),
  ]);

  return Boolean(followsThem) && Boolean(followedByThem);
};

export const listFriends = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const friendIds = await getMutualFriendIds(userId);

  if (friendIds.length === 0) {
    return { items: [], pagination: buildPaginationMeta(page, limit, 0) };
  }

  const [items, totalItems] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: publicUserSelect,
      orderBy: { username: "asc" },
      skip,
      take: limit,
    }),
    Promise.resolve(friendIds.length),
  ]);

  return { items, pagination: buildPaginationMeta(page, limit, totalItems) };
};

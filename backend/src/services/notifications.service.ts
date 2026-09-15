import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { emitToUser } from "../lib/socket";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";

const actorSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

export const createFollowNotification = async (recipientId: string, actorId: string) => {
  // Defensive — self-follow is already blocked at the follow() call site,
  // but a notification-to-self would be a silent no-op UI-wise anyway.
  if (recipientId === actorId) return;

  const notification = await prisma.notification.create({
    data: { userId: recipientId, actorId, type: "FOLLOW" },
    include: { actor: { select: actorSelect } },
  });

  // followingBack tells the frontend whether to show "Follow back" — at
  // creation time that just means "does the recipient already follow the
  // new follower back" (independent of this event).
  const reciprocal = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: recipientId, followingId: actorId } },
  });

  emitToUser(recipientId, "notification:new", { ...notification, followingBack: Boolean(reciprocal) });
};

export const listNotifications = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const [rows, totalItems] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      include: { actor: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  // "Follow back" affordance: does the recipient already follow each actor?
  // Batched (one query for the whole page) rather than per-row.
  const actorIds = rows.map((row) => row.actorId);
  const alreadyFollowing = actorIds.length
    ? await prisma.follow.findMany({
        where: { followerId: userId, followingId: { in: actorIds } },
        select: { followingId: true },
      })
    : [];
  const followingBackSet = new Set(alreadyFollowing.map((row) => row.followingId));

  return {
    items: rows.map((row) => ({ ...row, followingBack: followingBackSet.has(row.actorId) })),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getUnreadCount = (userId: string) => prisma.notification.count({ where: { userId, isRead: false } });

export const markAllRead = async (userId: string) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
};

export const markOneRead = async (userId: string, notificationId: string) => {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  if (result.count === 0) throw new AppError("Notification not found", 404);
};

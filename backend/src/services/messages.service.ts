import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { emitToUser } from "../lib/socket";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { areFriends, getMutualFriendIds } from "./friends.service";

const participantSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

export const sendMessage = async (senderId: string, recipientId: string, content: string) => {
  if (senderId === recipientId) throw new AppError("You cannot message yourself", 400);

  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) throw new AppError("User not found", 404);

  const mutual = await areFriends(senderId, recipientId);
  if (!mutual) throw new AppError("You can only message mutual friends", 403);

  const message = await prisma.message.create({
    data: { senderId, recipientId, content },
    include: { sender: { select: participantSelect } },
  });

  emitToUser(recipientId, "message:new", message);

  return message;
};

export const getConversation = async (
  userId: string,
  otherUserId: string,
  { page, limit, skip }: PaginationParams
) => {
  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) throw new AppError("User not found", 404);

  const where: Prisma.MessageWhereInput = {
    OR: [
      { senderId: userId, recipientId: otherUserId },
      { senderId: otherUserId, recipientId: userId },
    ],
  };

  const [rows, totalItems] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { sender: { select: participantSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  // Opening a conversation marks the other person's messages as read.
  await prisma.message.updateMany({
    where: { senderId: otherUserId, recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  return { items: rows, pagination: buildPaginationMeta(page, limit, totalItems) };
};

export interface ConversationSummary {
  partner: Prisma.UserGetPayload<{ select: typeof participantSelect }>;
  lastMessage: Prisma.MessageGetPayload<{ include: { sender: { select: typeof participantSelect } } }> | null;
  unreadCount: number;
}

// One row per friend (not per Message) — DMs only happen between friends,
// so the friends list IS the set of possible conversations, whether or not
// anything's been sent yet. Small N (friend count), so N+1 queries here are
// fine rather than a heavier single query over the whole Message table.
export const listConversations = async (userId: string): Promise<ConversationSummary[]> => {
  const friendIds = await getMutualFriendIds(userId);
  if (friendIds.length === 0) return [];

  const friends = await prisma.user.findMany({
    where: { id: { in: friendIds } },
    select: participantSelect,
  });

  const conversations = await Promise.all(
    friends.map(async (friend): Promise<ConversationSummary> => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, recipientId: friend.id },
              { senderId: friend.id, recipientId: userId },
            ],
          },
          include: { sender: { select: participantSelect } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.message.count({ where: { senderId: friend.id, recipientId: userId, isRead: false } }),
      ]);
      return { partner: friend, lastMessage, unreadCount };
    })
  );

  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt.getTime() ?? 0;
    const bTime = b.lastMessage?.createdAt.getTime() ?? 0;
    return bTime - aTime;
  });

  return conversations;
};

export const getUnreadMessageCount = (userId: string) =>
  prisma.message.count({ where: { recipientId: userId, isRead: false } });

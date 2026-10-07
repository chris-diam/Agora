import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { emitToUser } from "../lib/socket";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { getMutualFriendIds } from "./friends.service";
import { CreateGroupChatInput } from "../validators/groupChats.validators";

const participantSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

const groupChatInclude = {
  members: { include: { user: { select: participantSelect } } },
} satisfies Prisma.GroupChatInclude;

const assertMember = async (groupChatId: string, userId: string) => {
  const membership = await prisma.groupChatMember.findUnique({
    where: { groupChatId_userId: { groupChatId, userId } },
  });
  if (!membership) throw new AppError("You are not a member of this group chat", 403);
};

export const createGroupChat = async (creatorId: string, input: CreateGroupChatInput) => {
  // Same trust boundary as 1:1 DMs — every invited member must already be
  // a mutual friend of the creator, not an arbitrary user id.
  const friendIds = new Set(await getMutualFriendIds(creatorId));
  const invalidIds = input.memberIds.filter((id) => id !== creatorId && !friendIds.has(id));
  if (invalidIds.length > 0) {
    throw new AppError("You can only add mutual friends to a group chat", 403);
  }

  const memberIds = Array.from(new Set([creatorId, ...input.memberIds]));

  const groupChat = await prisma.groupChat.create({
    data: {
      name: input.name,
      creatorId,
      members: { createMany: { data: memberIds.map((userId) => ({ userId })) } },
    },
    include: groupChatInclude,
  });

  return groupChat;
};

export const listGroupChats = async (userId: string) => {
  const memberships = await prisma.groupChatMember.findMany({
    where: { userId },
    select: { groupChatId: true },
  });
  const groupChatIds = memberships.map((row) => row.groupChatId);
  if (groupChatIds.length === 0) return [];

  const groupChats = await prisma.groupChat.findMany({
    where: { id: { in: groupChatIds } },
    include: {
      ...groupChatInclude,
      messages: {
        include: { sender: { select: participantSelect } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return groupChats
    .map((chat) => {
      const { messages, ...rest } = chat;
      return { ...rest, lastMessage: messages[0] ?? null };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt.getTime() ?? a.createdAt.getTime();
      const bTime = b.lastMessage?.createdAt.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
};

export const getGroupChat = async (groupChatId: string, userId: string) => {
  await assertMember(groupChatId, userId);
  const groupChat = await prisma.groupChat.findUnique({
    where: { id: groupChatId },
    include: groupChatInclude,
  });
  if (!groupChat) throw new AppError("Group chat not found", 404);
  return groupChat;
};

export const getGroupMessages = async (
  groupChatId: string,
  userId: string,
  { page, limit, skip }: PaginationParams,
) => {
  await assertMember(groupChatId, userId);

  const [rows, totalItems] = await Promise.all([
    prisma.groupMessage.findMany({
      where: { groupChatId },
      include: { sender: { select: participantSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.groupMessage.count({ where: { groupChatId } }),
  ]);

  return { items: rows, pagination: buildPaginationMeta(page, limit, totalItems) };
};

export const sendGroupMessage = async (groupChatId: string, senderId: string, content: string) => {
  await assertMember(groupChatId, senderId);

  const message = await prisma.groupMessage.create({
    data: { groupChatId, senderId, content },
    include: { sender: { select: participantSelect } },
  });

  const members = await prisma.groupChatMember.findMany({
    where: { groupChatId, userId: { not: senderId } },
    select: { userId: true },
  });
  for (const member of members) {
    emitToUser(member.userId, "group-message:new", { ...message, groupChatId });
  }

  return message;
};

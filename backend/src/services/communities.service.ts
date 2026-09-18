import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { CreateCommunityInput } from "../validators/communities.validators";

const creatorSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

const communityInclude = {
  creator: { select: creatorSelect },
  _count: { select: { members: true } },
} satisfies Prisma.CommunityInclude;

type CommunityWithRelations = Prisma.CommunityGetPayload<{ include: typeof communityInclude }>;

// Same batching pattern as posts/events: one extra query per page rather
// than a per-row relation check, and keeps the include shape static.
const getMembershipSet = async (viewerId: string | undefined, communityIds: string[]) => {
  if (!viewerId || communityIds.length === 0) return undefined;

  const rows = await prisma.communityMember.findMany({
    where: { userId: viewerId, communityId: { in: communityIds } },
    select: { communityId: true },
  });

  return new Set(rows.map((row) => row.communityId));
};

const formatCommunity = (community: CommunityWithRelations, memberSet?: Set<string>) => {
  const { _count, ...rest } = community;
  return {
    ...rest,
    membersCount: _count.members,
    ...(memberSet ? { isMember: memberSet.has(rest.id) } : {}),
  };
};

export interface ListCommunitiesFilters {
  city?: string;
  country?: string;
  category?: string;
  memberId?: string;
}

export const listCommunities = async (
  filters: ListCommunitiesFilters,
  { page, limit, skip }: PaginationParams,
  viewerId?: string
) => {
  const where: Prisma.CommunityWhereInput = {
    ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
    ...(filters.country ? { country: { equals: filters.country, mode: "insensitive" } } : {}),
    ...(filters.category ? { category: { equals: filters.category, mode: "insensitive" } } : {}),
    ...(filters.memberId ? { members: { some: { userId: filters.memberId } } } : {}),
  };

  const [rows, totalItems] = await Promise.all([
    prisma.community.findMany({
      where,
      include: communityInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.community.count({ where }),
  ]);

  const memberSet = await getMembershipSet(
    viewerId,
    rows.map((row) => row.id)
  );

  return {
    items: rows.map((row) => formatCommunity(row, memberSet)),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getCommunityById = async (id: string, viewerId?: string) => {
  const community = await prisma.community.findUnique({ where: { id }, include: communityInclude });
  if (!community) throw new AppError("Community not found", 404);

  const memberSet = await getMembershipSet(viewerId, [community.id]);
  return formatCommunity(community, memberSet);
};

export const createCommunity = async (creatorId: string, input: CreateCommunityInput) => {
  const community = await prisma.community.create({
    data: {
      creatorId,
      name: input.name,
      description: input.description,
      category: input.category,
      city: input.city,
      country: input.country,
      // The creator becomes a member immediately — joining your own
      // community shouldn't require a separate manual step.
      members: { create: { userId: creatorId } },
    },
    include: communityInclude,
  });

  return formatCommunity(community);
};

export const joinCommunity = async (communityId: string, userId: string) => {
  const community = await prisma.community.findUnique({ where: { id: communityId }, select: { id: true } });
  if (!community) throw new AppError("Community not found", 404);

  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (existing) throw new AppError("You are already a member of this community", 409);

  await prisma.communityMember.create({ data: { communityId, userId } });
};

export const leaveCommunity = async (communityId: string, userId: string) => {
  const existing = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!existing) throw new AppError("You are not a member of this community", 404);

  await prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
};

// Shared by posts.service and events.service — publishing a discussion post
// or organizing an event "as" a community requires membership in it.
export const assertCommunityMember = async (communityId: string, userId: string) => {
  const membership = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
    select: { communityId: true },
  });
  if (!membership) throw new AppError("You must be a member of this community to post here", 403);
};

export const listCommunityMembers = async (communityId: string, { page, limit, skip }: PaginationParams) => {
  const community = await prisma.community.findUnique({ where: { id: communityId }, select: { id: true } });
  if (!community) throw new AppError("Community not found", 404);

  const [rows, totalItems] = await Promise.all([
    prisma.communityMember.findMany({
      where: { communityId },
      include: { user: { select: creatorSelect } },
      orderBy: { joinedAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.communityMember.count({ where: { communityId } }),
  ]);

  return {
    items: rows.map((row) => row.user),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

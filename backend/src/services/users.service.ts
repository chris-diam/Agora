import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { UpdateProfileInput } from "../validators/users.validators";
import { areFriends } from "./friends.service";
import { createMediaAsset, deleteMediaAssetByUrl } from "./media.service";
import * as notificationsService from "./notifications.service";

// Public-safe projection — never select passwordHash here. Exported for
// reuse by search.service.ts.
export const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  bio: true,
  profession: true,
  portfolioLinks: true,
  city: true,
  country: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

// Users who've opted into the "artist page" fields on their profile —
// backs the Artists directory. No separate profile/page entity: anyone can
// set a profession and show up here.
export const listArtists = async ({ page, limit, skip }: PaginationParams) => {
  const where: Prisma.UserWhereInput = { profession: { not: null } };

  const [rows, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { displayName: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: rows,
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getUserById = async (id: string, viewerId?: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...publicUserSelect,
      _count: { select: { followedBy: true, following: true, posts: true } },
    },
  });

  if (!user) throw new AppError("User not found", 404);

  const { _count, ...rest } = user;

  // Same optionalAuth-viewer pattern as posts/events/communities
  // (likedByViewer, viewerAttendanceStatus, isMember) — lets the frontend
  // render a correct Follow/Unfollow button without a second request.
  let isFollowedByViewer: boolean | undefined;
  let isMutualFriend: boolean | undefined;
  if (viewerId && viewerId !== id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: id } },
      select: { id: true },
    });
    isFollowedByViewer = Boolean(follow);
    isMutualFriend = await areFriends(viewerId, id);
  }

  return {
    ...rest,
    followersCount: _count.followedBy,
    followingCount: _count.following,
    postsCount: _count.posts,
    ...(isFollowedByViewer !== undefined ? { isFollowedByViewer } : {}),
    ...(isMutualFriend !== undefined ? { isMutualFriend } : {}),
  };
};

export const updateAvatar = async (userId: string, file: Express.Multer.File) => {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { profileImageUrl: true } });

  const mediaUrl = await createMediaAsset(file.buffer, file.mimetype);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: mediaUrl },
    select: publicUserSelect,
  });

  // Best-effort cleanup of the previous avatar — only if it was one we
  // stored ourselves (not, say, a Google-provided URL) — so repeated
  // re-uploads don't leak rows indefinitely. Done after the swap so a
  // failure here never leaves the user without an avatar.
  await deleteMediaAssetByUrl(existing?.profileImageUrl);

  return user;
};

export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  return prisma.user.update({
    where: { id: userId },
    // An empty string means "cleared" — store null so the Artists
    // directory's `profession: { not: null }` filter behaves correctly.
    data: { ...data, profession: data.profession === "" ? null : data.profession },
    select: publicUserSelect,
  });
};

export const followUser = async (followerId: string, targetUserId: string) => {
  if (followerId === targetUserId) {
    throw new AppError("You cannot follow yourself", 400);
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) throw new AppError("User not found", 404);

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetUserId } },
  });
  if (existing) throw new AppError("You are already following this user", 409);

  await prisma.follow.create({ data: { followerId, followingId: targetUserId } });
  await notificationsService.createFollowNotification(targetUserId, followerId);
};

export const unfollowUser = async (followerId: string, targetUserId: string) => {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetUserId } },
  });
  if (!existing) throw new AppError("You are not following this user", 404);

  await prisma.follow.delete({ where: { id: existing.id } });
};

export const getFollowers = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new AppError("User not found", 404);

  const [rows, totalItems] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  return {
    items: rows.map((row) => row.follower),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getFollowing = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new AppError("User not found", 404);

  const [rows, totalItems] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return {
    items: rows.map((row) => row.following),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

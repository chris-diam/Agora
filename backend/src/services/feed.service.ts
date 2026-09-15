import { PostCategory, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { formatPost, getLikedPostIds, postInclude, PostWithRelations } from "./posts.service";

// Every feed returns { post, reason } pairs — the core transparency
// requirement: nothing is ranked by an opaque score, and every item can say
// in plain language why it's showing up. No engagement signals (likes/
// comments) ever factor into ordering anywhere in this file.
export interface FeedItem {
  post: ReturnType<typeof formatPost>;
  reason: string;
}

// ────────────────────────────────
// FOLLOWING FEED — posts from users you follow, newest first.
// ────────────────────────────────
export const getFollowingFeed = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = follows.map((follow) => follow.followingId);

  if (followingIds.length === 0) {
    return { items: [] as FeedItem[], pagination: buildPaginationMeta(page, limit, 0) };
  }

  const where: Prisma.PostWhereInput = { authorId: { in: followingIds } };

  const [rows, totalItems] = await Promise.all([
    prisma.post.findMany({ where, include: postInclude, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = await getLikedPostIds(
    userId,
    rows.map((row) => row.id)
  );

  const items: FeedItem[] = rows.map((row) => ({
    post: formatPost(row, likedPostIds),
    reason: `You follow ${row.author.displayName}`,
  }));

  return { items, pagination: buildPaginationMeta(page, limit, totalItems) };
};

// ────────────────────────────────
// CHRONOLOGICAL FEED — all public posts, newest first. No personalization,
// no ranking by likes/comments/anything else.
// ────────────────────────────────
export const getChronologicalFeed = async ({ page, limit, skip }: PaginationParams, viewerId?: string) => {
  const [rows, totalItems] = await Promise.all([
    prisma.post.findMany({ include: postInclude, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.post.count(),
  ]);

  const likedPostIds = await getLikedPostIds(
    viewerId,
    rows.map((row) => row.id)
  );

  const items: FeedItem[] = rows.map((row) => ({
    post: formatPost(row, likedPostIds),
    reason: "Shown in chronological order — no ranking algorithm applied",
  }));

  return { items, pagination: buildPaginationMeta(page, limit, totalItems) };
};

// ────────────────────────────────
// INTEREST FEED — posts whose category matches one of the user's selected
// interests (via Interest.relatedCategory), newest first within that match.
// ────────────────────────────────
export const getInterestFeed = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const userInterests = await prisma.userInterest.findMany({
    where: { userId },
    include: { interest: true },
  });

  const categoryToInterestNames = new Map<PostCategory, string[]>();
  for (const userInterest of userInterests) {
    const category = userInterest.interest.relatedCategory;
    if (!category) continue;
    const names = categoryToInterestNames.get(category) ?? [];
    names.push(userInterest.interest.name);
    categoryToInterestNames.set(category, names);
  }

  const matchedCategories = Array.from(categoryToInterestNames.keys());

  if (matchedCategories.length === 0) {
    return { items: [] as FeedItem[], pagination: buildPaginationMeta(page, limit, 0) };
  }

  const where: Prisma.PostWhereInput = { category: { in: matchedCategories } };

  const [rows, totalItems] = await Promise.all([
    prisma.post.findMany({ where, include: postInclude, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = await getLikedPostIds(
    userId,
    rows.map((row) => row.id)
  );

  const items: FeedItem[] = rows.map((row) => {
    const matchingNames = categoryToInterestNames.get(row.category) ?? [];
    return {
      post: formatPost(row, likedPostIds),
      reason: `Matches your interest in ${matchingNames.join(", ")}`,
    };
  });

  return { items, pagination: buildPaginationMeta(page, limit, totalItems) };
};

// ────────────────────────────────
// LOCAL FEED — same city first, then same country, newest first within each
// tier. Requires the viewer to have both city and country set on their
// profile; there's no meaningful "local" feed without a location to compare
// against, and failing loudly here is more transparent than silently
// returning an empty (or worse, unrelated) feed.
// ────────────────────────────────
export const getLocalFeed = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { city: true, country: true } });
  if (!user) throw new AppError("User not found", 404);

  if (!user.city || !user.country) {
    throw new AppError("Set your city and country in your profile to use the local feed", 400);
  }

  const { city, country } = user;

  const sameCityWhere: Prisma.PostWhereInput = {
    city: { equals: city, mode: "insensitive" },
    country: { equals: country, mode: "insensitive" },
  };
  const sameCountryWhere: Prisma.PostWhereInput = {
    country: { equals: country, mode: "insensitive" },
    NOT: { city: { equals: city, mode: "insensitive" } },
  };

  const [sameCityCount, sameCountryCount] = await Promise.all([
    prisma.post.count({ where: sameCityWhere }),
    prisma.post.count({ where: sameCountryWhere }),
  ]);
  const totalItems = sameCityCount + sameCountryCount;

  // Two priority tiers concatenated (same-city, then same-country), each
  // newest-first internally. Pagination walks across the concatenation by
  // figuring out which tier(s) the current page falls into, so we only ever
  // fetch one page's worth of rows — never the whole feed.
  let cityRows: PostWithRelations[] = [];
  let countryRows: PostWithRelations[] = [];

  if (skip < sameCityCount) {
    cityRows = await prisma.post.findMany({
      where: sameCityWhere,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const remaining = limit - cityRows.length;
    if (remaining > 0) {
      countryRows = await prisma.post.findMany({
        where: sameCountryWhere,
        include: postInclude,
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: remaining,
      });
    }
  } else {
    countryRows = await prisma.post.findMany({
      where: sameCountryWhere,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      skip: skip - sameCityCount,
      take: limit,
    });
  }

  const likedPostIds = await getLikedPostIds(
    userId,
    [...cityRows, ...countryRows].map((row) => row.id)
  );

  const items: FeedItem[] = [
    ...cityRows.map((row) => ({ post: formatPost(row, likedPostIds), reason: `From your city (${city})` })),
    ...countryRows.map((row) => ({ post: formatPost(row, likedPostIds), reason: `From your country (${country})` })),
  ];

  return { items, pagination: buildPaginationMeta(page, limit, totalItems) };
};

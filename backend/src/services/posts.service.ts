import { Prisma, PostCategory, PostMediaType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { CreatePostInput, UpdatePostInput } from "../validators/posts.validators";

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

// Exported — the feed service (Phase 7) reuses this exact shape so posts
// look identical whether returned from /posts or from any /feed/* endpoint.
export const postInclude = {
  author: { select: authorSelect },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

// Batch-fetches which of the given posts the viewer has liked, rather than
// embedding a per-post relation query — one extra query per page instead of
// N, and keeps the Prisma include/select shape static (easier to type).
export const getLikedPostIds = async (viewerId: string | undefined, postIds: string[]) => {
  if (!viewerId || postIds.length === 0) return undefined;

  const likes = await prisma.like.findMany({
    where: { userId: viewerId, postId: { in: postIds } },
    select: { postId: true },
  });

  return new Set(likes.map((like) => like.postId));
};

// Same batching approach as getLikedPostIds, for the bookmark/"Save" feature.
export const getSavedPostIds = async (viewerId: string | undefined, postIds: string[]) => {
  if (!viewerId || postIds.length === 0) return undefined;

  const saved = await prisma.savedPost.findMany({
    where: { userId: viewerId, postId: { in: postIds } },
    select: { postId: true },
  });

  return new Set(saved.map((row) => row.postId));
};

export const formatPost = (post: PostWithRelations, likedPostIds?: Set<string>, savedPostIds?: Set<string>) => {
  const { _count, ...rest } = post;
  return {
    ...rest,
    likesCount: _count.likes,
    commentsCount: _count.comments,
    ...(likedPostIds ? { likedByViewer: likedPostIds.has(rest.id) } : {}),
    ...(savedPostIds ? { savedByViewer: savedPostIds.has(rest.id) } : {}),
  };
};

export interface ListPostsFilters {
  // A single category (existing callers) or a list — e.g. the "Arts &
  // culture" section groups several categories into one feed.
  category?: PostCategory | PostCategory[];
  authorId?: string;
}

export const listPosts = async (
  filters: ListPostsFilters,
  { page, limit, skip }: PaginationParams,
  viewerId?: string
) => {
  const categories = Array.isArray(filters.category)
    ? filters.category
    : filters.category
      ? [filters.category]
      : undefined;

  const where: Prisma.PostWhereInput = {
    ...(categories ? { category: { in: categories } } : {}),
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
  };

  const [rows, totalItems] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const postIds = rows.map((row) => row.id);
  const [likedPostIds, savedPostIds] = await Promise.all([
    getLikedPostIds(viewerId, postIds),
    getSavedPostIds(viewerId, postIds),
  ]);

  return {
    items: rows.map((row) => formatPost(row, likedPostIds, savedPostIds)),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getPostById = async (id: string, viewerId?: string) => {
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!post) throw new AppError("Post not found", 404);

  const [likedPostIds, savedPostIds] = await Promise.all([
    getLikedPostIds(viewerId, [post.id]),
    getSavedPostIds(viewerId, [post.id]),
  ]);
  return formatPost(post, likedPostIds, savedPostIds);
};

export const createPost = async (
  authorId: string,
  input: CreatePostInput,
  media?: { mediaUrl: string; mediaType: PostMediaType }
) => {
  // The composer no longer asks for city/country directly — fall back to
  // the author's own profile location so the Local feed still has something
  // to group by.
  const author = await prisma.user.findUniqueOrThrow({
    where: { id: authorId },
    select: { city: true, country: true },
  });

  const post = await prisma.post.create({
    data: {
      authorId,
      content: input.content,
      category: input.category,
      city: input.city ?? author.city,
      country: input.country ?? author.country,
      mediaUrl: media?.mediaUrl,
      mediaType: media?.mediaType,
    },
    include: postInclude,
  });

  return formatPost(post);
};

const assertPostOwner = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });

  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== userId) {
    throw new AppError("You do not have permission to modify this post", 403);
  }

  return post;
};

export const updatePost = async (postId: string, userId: string, input: UpdatePostInput) => {
  await assertPostOwner(postId, userId);

  const post = await prisma.post.update({
    where: { id: postId },
    data: input,
    include: postInclude,
  });

  return formatPost(post);
};

export const deletePost = async (postId: string, userId: string) => {
  await assertPostOwner(postId, userId);
  await prisma.post.delete({ where: { id: postId } });
};

export const likePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError("Post not found", 404);

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) throw new AppError("You already liked this post", 409);

  await prisma.like.create({ data: { postId, userId } });
};

export const unlikePost = async (postId: string, userId: string) => {
  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (!existing) throw new AppError("You have not liked this post", 404);

  await prisma.like.delete({ where: { id: existing.id } });
};

export const savePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError("Post not found", 404);

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) throw new AppError("You already saved this post", 409);

  await prisma.savedPost.create({ data: { postId, userId } });
};

export const unsavePost = async (postId: string, userId: string) => {
  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (!existing) throw new AppError("You have not saved this post", 404);

  await prisma.savedPost.delete({ where: { id: existing.id } });
};

export const listSavedPosts = async (userId: string, { page, limit, skip }: PaginationParams) => {
  const [saved, totalItems] = await Promise.all([
    prisma.savedPost.findMany({
      where: { userId },
      include: { post: { include: postInclude } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.savedPost.count({ where: { userId } }),
  ]);

  const rows = saved.map((row) => row.post);
  const [likedPostIds, savedPostIds] = await Promise.all([
    getLikedPostIds(userId, rows.map((row) => row.id)),
    getSavedPostIds(userId, rows.map((row) => row.id)),
  ]);

  return {
    items: rows.map((row) => formatPost(row, likedPostIds, savedPostIds)),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

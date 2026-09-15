import { Prisma, PostCategory } from "@prisma/client";
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

export const formatPost = (post: PostWithRelations, likedPostIds?: Set<string>) => {
  const { _count, ...rest } = post;
  return {
    ...rest,
    likesCount: _count.likes,
    commentsCount: _count.comments,
    ...(likedPostIds ? { likedByViewer: likedPostIds.has(rest.id) } : {}),
  };
};

export interface ListPostsFilters {
  category?: PostCategory;
  authorId?: string;
}

export const listPosts = async (
  filters: ListPostsFilters,
  { page, limit, skip }: PaginationParams,
  viewerId?: string
) => {
  const where: Prisma.PostWhereInput = {
    ...(filters.category ? { category: filters.category } : {}),
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

  const likedPostIds = await getLikedPostIds(
    viewerId,
    rows.map((row) => row.id)
  );

  return {
    items: rows.map((row) => formatPost(row, likedPostIds)),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getPostById = async (id: string, viewerId?: string) => {
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!post) throw new AppError("Post not found", 404);

  const likedPostIds = await getLikedPostIds(viewerId, [post.id]);
  return formatPost(post, likedPostIds);
};

export const createPost = async (authorId: string, input: CreatePostInput) => {
  const post = await prisma.post.create({
    data: {
      authorId,
      content: input.content,
      category: input.category,
      city: input.city,
      country: input.country,
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

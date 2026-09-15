import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { CreateCommentInput } from "../validators/comments.validators";

const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

export const getCommentsForPost = async (postId: string, { page, limit, skip }: PaginationParams) => {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError("Post not found", 404);

  const [items, totalItems] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      include: { author: { select: authorSelect } },
      orderBy: { createdAt: "asc" }, // oldest first — reads like a conversation
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  return { items, pagination: buildPaginationMeta(page, limit, totalItems) };
};

export const createComment = async (postId: string, authorId: string, input: CreateCommentInput) => {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new AppError("Post not found", 404);

  return prisma.comment.create({
    data: { postId, authorId, content: input.content },
    include: { author: { select: authorSelect } },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true },
  });

  if (!comment) throw new AppError("Comment not found", 404);
  if (comment.authorId !== userId) {
    throw new AppError("You do not have permission to delete this comment", 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });
};

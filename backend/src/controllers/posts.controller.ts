import { PostCategory, PostMediaType } from "@prisma/client";
import { Request, Response } from "express";
import { createMediaAsset } from "../services/media.service";
import * as postsService from "../services/posts.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const listPosts = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  // validate() only checks req.query against the schema (comma-separated,
  // one-or-more PostCategory values) — it doesn't mutate req.query, so the
  // split into an array happens here.
  const filters = {
    category:
      typeof req.query.category === "string"
        ? (req.query.category.split(",").map((c) => c.trim()) as PostCategory[])
        : undefined,
    authorId: typeof req.query.authorId === "string" ? req.query.authorId : undefined,
  };

  const { items, pagination: meta } = await postsService.listPosts(filters, pagination, req.user?.id);
  return sendSuccess(res, items, 200, meta);
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.getPostById(req.params.id, req.user?.id);
  return sendSuccess(res, post);
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  let media: { mediaUrl: string; mediaType: PostMediaType } | undefined;
  if (req.file) {
    const mediaUrl = await createMediaAsset(req.file.buffer, req.file.mimetype);
    media = { mediaUrl, mediaType: req.file.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE" };
  } else if (req.body.linkUrl) {
    media = { mediaUrl: req.body.linkUrl, mediaType: "LINK" };
  }

  const post = await postsService.createPost(req.user!.id, req.body, media);
  return sendSuccess(res, post, 201);
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.updatePost(req.params.id, req.user!.id, req.body);
  return sendSuccess(res, post);
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await postsService.deletePost(req.params.id, req.user!.id);
  return sendSuccess(res, null);
});

export const likePost = asyncHandler(async (req: Request, res: Response) => {
  await postsService.likePost(req.params.id, req.user!.id);
  return sendSuccess(res, { liked: true }, 201);
});

export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
  await postsService.unlikePost(req.params.id, req.user!.id);
  return sendSuccess(res, { liked: false });
});

export const listSavedPosts = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await postsService.listSavedPosts(req.user!.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const savePost = asyncHandler(async (req: Request, res: Response) => {
  await postsService.savePost(req.params.id, req.user!.id);
  return sendSuccess(res, { saved: true }, 201);
});

export const unsavePost = asyncHandler(async (req: Request, res: Response) => {
  await postsService.unsavePost(req.params.id, req.user!.id);
  return sendSuccess(res, { saved: false });
});

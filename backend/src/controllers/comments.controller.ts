import { Request, Response } from "express";
import * as commentsService from "../services/comments.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await commentsService.getCommentsForPost(req.params.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await commentsService.createComment(req.params.id, req.user!.id, req.body);
  return sendSuccess(res, comment, 201);
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  await commentsService.deleteComment(req.params.id, req.user!.id);
  return sendSuccess(res, null);
});

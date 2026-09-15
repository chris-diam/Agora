import { Request, Response } from "express";
import * as feedService from "../services/feed.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const getFollowingFeed = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await feedService.getFollowingFeed(req.user!.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const getChronologicalFeed = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await feedService.getChronologicalFeed(pagination, req.user?.id);
  return sendSuccess(res, items, 200, meta);
});

export const getInterestFeed = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await feedService.getInterestFeed(req.user!.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const getLocalFeed = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await feedService.getLocalFeed(req.user!.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

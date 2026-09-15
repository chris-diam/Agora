import { Request, Response } from "express";
import * as friendsService from "../services/friends.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await friendsService.listFriends(req.user!.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

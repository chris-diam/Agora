import { Request, Response } from "express";
import * as interestsService from "../services/interests.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const getInterests = asyncHandler(async (_req: Request, res: Response) => {
  const interests = await interestsService.listInterests();
  return sendSuccess(res, interests);
});

export const updateMyInterests = asyncHandler(async (req: Request, res: Response) => {
  const interests = await interestsService.setUserInterests(req.user!.id, req.body.interestIds);
  return sendSuccess(res, interests);
});

import { Request, Response } from "express";
import * as searchService from "../services/search.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const search = asyncHandler(async (req: Request, res: Response) => {
  const results = await searchService.search(String(req.query.q));
  return sendSuccess(res, results);
});

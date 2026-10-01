import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getCurrentUser(req.user!.id);
  return sendSuccess(res, profile);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  await authService.registerUser(req.body);
  return sendSuccess(res, null, 201);
});

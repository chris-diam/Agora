import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  return sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  return sendSuccess(res, result, 200);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getCurrentUser(req.user!.id);
  return sendSuccess(res, profile);
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginWithGoogle(req.body.credential);
  return sendSuccess(res, result, 200);
});

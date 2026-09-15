import { Request, Response } from "express";
import * as usersService from "../services/users.service";
import { AppError } from "../utils/AppError";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id, req.user?.id);
  return sendSuccess(res, user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  return sendSuccess(res, user);
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError("No file uploaded", 400);
  const user = await usersService.updateAvatar(req.user!.id, req.file.filename);
  return sendSuccess(res, user);
});

export const follow = asyncHandler(async (req: Request, res: Response) => {
  await usersService.followUser(req.user!.id, req.params.id);
  return sendSuccess(res, { following: true }, 201);
});

export const unfollow = asyncHandler(async (req: Request, res: Response) => {
  await usersService.unfollowUser(req.user!.id, req.params.id);
  return sendSuccess(res, { following: false });
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await usersService.getFollowers(req.params.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await usersService.getFollowing(req.params.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

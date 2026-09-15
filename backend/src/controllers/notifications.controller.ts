import { Request, Response } from "express";
import * as notificationsService from "../services/notifications.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await notificationsService.listNotifications(req.user!.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.getUnreadCount(req.user!.id);
  return sendSuccess(res, { count });
});

export const readAll = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllRead(req.user!.id);
  return sendSuccess(res, null);
});

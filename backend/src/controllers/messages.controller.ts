import { Request, Response } from "express";
import * as messagesService from "../services/messages.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await messagesService.listConversations(req.user!.id);
  return sendSuccess(res, conversations);
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await messagesService.getUnreadMessageCount(req.user!.id);
  return sendSuccess(res, { count });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await messagesService.getConversation(
    req.user!.id,
    req.params.userId,
    pagination
  );
  return sendSuccess(res, items, 200, meta);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesService.sendMessage(req.user!.id, req.params.userId, req.body.content);
  return sendSuccess(res, message, 201);
});

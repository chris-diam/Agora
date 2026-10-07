import { Request, Response } from "express";
import * as groupChatsService from "../services/groupChats.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const createGroupChat = asyncHandler(async (req: Request, res: Response) => {
  const groupChat = await groupChatsService.createGroupChat(req.user!.id, req.body);
  return sendSuccess(res, groupChat, 201);
});

export const listGroupChats = asyncHandler(async (req: Request, res: Response) => {
  const groupChats = await groupChatsService.listGroupChats(req.user!.id);
  return sendSuccess(res, groupChats);
});

export const getGroupChat = asyncHandler(async (req: Request, res: Response) => {
  const groupChat = await groupChatsService.getGroupChat(req.params.id, req.user!.id);
  return sendSuccess(res, groupChat);
});

export const getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await groupChatsService.getGroupMessages(
    req.params.id,
    req.user!.id,
    pagination,
  );
  return sendSuccess(res, items, 200, meta);
});

export const sendGroupMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await groupChatsService.sendGroupMessage(req.params.id, req.user!.id, req.body.content);
  return sendSuccess(res, message, 201);
});

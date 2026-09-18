import { Request, Response } from "express";
import * as communitiesService from "../services/communities.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const listCommunities = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const filters = {
    city: typeof req.query.city === "string" ? req.query.city : undefined,
    country: typeof req.query.country === "string" ? req.query.country : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    memberId: typeof req.query.memberId === "string" ? req.query.memberId : undefined,
  };

  const { items, pagination: meta } = await communitiesService.listCommunities(
    filters,
    pagination,
    req.user?.id
  );
  return sendSuccess(res, items, 200, meta);
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const { items, pagination: meta } = await communitiesService.listCommunityMembers(req.params.id, pagination);
  return sendSuccess(res, items, 200, meta);
});

export const getCommunity = asyncHandler(async (req: Request, res: Response) => {
  const community = await communitiesService.getCommunityById(req.params.id, req.user?.id);
  return sendSuccess(res, community);
});

export const createCommunity = asyncHandler(async (req: Request, res: Response) => {
  const community = await communitiesService.createCommunity(req.user!.id, req.body);
  return sendSuccess(res, community, 201);
});

export const joinCommunity = asyncHandler(async (req: Request, res: Response) => {
  await communitiesService.joinCommunity(req.params.id, req.user!.id);
  return sendSuccess(res, { joined: true }, 201);
});

export const leaveCommunity = asyncHandler(async (req: Request, res: Response) => {
  await communitiesService.leaveCommunity(req.params.id, req.user!.id);
  return sendSuccess(res, { joined: false });
});

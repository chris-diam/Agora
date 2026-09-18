import { AttendanceStatus, EventCategory } from "@prisma/client";
import { Request, Response } from "express";
import { createMediaAsset } from "../services/media.service";
import * as eventsService from "../services/events.service";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getPaginationParams } from "../utils/pagination";

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req.query);
  const filters = {
    city: typeof req.query.city === "string" ? req.query.city : undefined,
    country: typeof req.query.country === "string" ? req.query.country : undefined,
    category:
      typeof req.query.category === "string"
        ? (req.query.category.split(",").map((c) => c.trim()) as EventCategory[])
        : undefined,
    date: typeof req.query.date === "string" ? req.query.date : undefined,
  };

  const { items, pagination: meta } = await eventsService.listEvents(filters, pagination, req.user?.id);
  return sendSuccess(res, items, 200, meta);
});

export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.getEventById(req.params.id, req.user?.id);
  return sendSuccess(res, event);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const imageUrl = req.file ? await createMediaAsset(req.file.buffer, req.file.mimetype) : undefined;
  const event = await eventsService.createEvent(req.user!.id, req.body, imageUrl);
  return sendSuccess(res, event, 201);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.updateEvent(req.params.id, req.user!.id, req.body);
  return sendSuccess(res, event);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await eventsService.deleteEvent(req.params.id, req.user!.id);
  return sendSuccess(res, null);
});

export const setAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await eventsService.setAttendance(
    req.params.id,
    req.user!.id,
    req.body.status as AttendanceStatus
  );
  return sendSuccess(res, attendance, 201);
});

export const removeAttendance = asyncHandler(async (req: Request, res: Response) => {
  await eventsService.removeAttendance(req.params.id, req.user!.id);
  return sendSuccess(res, null);
});

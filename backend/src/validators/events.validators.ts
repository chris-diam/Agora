import { AttendanceStatus, EventCategory } from "@prisma/client";
import { z } from "zod";

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(5000),
    category: z.nativeEnum(EventCategory),
    city: z.string().min(1, "City is required").max(100),
    country: z.string().min(1, "Country is required").max(100),
    venueName: z.string().max(200).optional(),
    address: z.string().max(300).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    startDate: z.string().datetime({ message: "startDate must be a valid ISO 8601 datetime" }),
    endDate: z.string().datetime({ message: "endDate must be a valid ISO 8601 datetime" }).optional(),
  }),
});

export const updateEventSchema = z.object({
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(5000).optional(),
      category: z.nativeEnum(EventCategory).optional(),
      city: z.string().min(1).max(100).optional(),
      country: z.string().min(1).max(100).optional(),
      venueName: z.string().max(200).optional(),
      address: z.string().max(300).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const listEventsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    category: z.nativeEnum(EventCategory).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
      .optional(),
  }),
});

export const setAttendanceSchema = z.object({
  body: z.object({
    status: z.nativeEnum(AttendanceStatus),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>["body"];
export type UpdateEventInput = z.infer<typeof updateEventSchema>["body"];

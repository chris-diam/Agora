import { apiFetch, buildQuery } from "./client";
import type { AttendanceStatus, EventCategory, EventItem } from "../types";

export interface ListEventsParams {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  category?: EventCategory | EventCategory[];
  date?: string;
  organizerId?: string;
  communityId?: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  country: string;
  venueName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate?: string;
  imageFile?: File;
  // Set to organize this event under a community — the organizer must
  // already be a member.
  communityId?: string;
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, "imageFile">>;

export const listEvents = (params: ListEventsParams = {}) => apiFetch<EventItem[]>(`/events${buildQuery(params)}`);

export const getEvent = (id: string) => apiFetch<EventItem>(`/events/${id}`);

export const createEvent = (input: CreateEventInput) => {
  const { imageFile, ...fields } = input;
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, String(value));
  });
  if (imageFile) formData.append("image", imageFile);

  return apiFetch<EventItem>("/events", { method: "POST", body: formData });
};

export const updateEvent = (id: string, input: UpdateEventInput) =>
  apiFetch<EventItem>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteEvent = (id: string) => apiFetch<null>(`/events/${id}`, { method: "DELETE" });

export const setAttendance = (id: string, status: AttendanceStatus) =>
  apiFetch<{ status: AttendanceStatus }>(`/events/${id}/attendance`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });

export const removeAttendance = (id: string) => apiFetch<null>(`/events/${id}/attendance`, { method: "DELETE" });

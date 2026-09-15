import { apiFetch, buildQuery } from "./client";
import type { AttendanceStatus, EventCategory, EventItem } from "../types";

export interface ListEventsParams {
  page?: number;
  limit?: number;
  city?: string;
  country?: string;
  category?: EventCategory;
  date?: string;
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
}

export type UpdateEventInput = Partial<CreateEventInput>;

export const listEvents = (params: ListEventsParams = {}) => apiFetch<EventItem[]>(`/events${buildQuery(params)}`);

export const getEvent = (id: string) => apiFetch<EventItem>(`/events/${id}`);

export const createEvent = (input: CreateEventInput) =>
  apiFetch<EventItem>("/events", { method: "POST", body: JSON.stringify(input) });

export const updateEvent = (id: string, input: UpdateEventInput) =>
  apiFetch<EventItem>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(input) });

export const deleteEvent = (id: string) => apiFetch<null>(`/events/${id}`, { method: "DELETE" });

export const setAttendance = (id: string, status: AttendanceStatus) =>
  apiFetch<{ status: AttendanceStatus }>(`/events/${id}/attendance`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });

export const removeAttendance = (id: string) => apiFetch<null>(`/events/${id}/attendance`, { method: "DELETE" });

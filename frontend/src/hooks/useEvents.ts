import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import * as eventsApi from "../api/events";
import type { AttendanceStatus } from "../types";

export const useEvents = (params: eventsApi.ListEventsParams) =>
  useQuery({ queryKey: ["events", params], queryFn: () => eventsApi.listEvents(params) });

export const useEvent = (id: string) =>
  useQuery({ queryKey: ["events", id], queryFn: () => eventsApi.getEvent(id), enabled: Boolean(id) });

const invalidateEvent = (queryClient: QueryClient, id: string) => {
  queryClient.invalidateQueries({ queryKey: ["events"] });
  queryClient.invalidateQueries({ queryKey: ["events", id] });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: eventsApi.CreateEventInput) => eventsApi.createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });
};

export const useSetAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AttendanceStatus }) => eventsApi.setAttendance(id, status),
    onSuccess: (_result, { id }) => invalidateEvent(queryClient, id),
  });
};

export const useRemoveAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.removeAttendance(id),
    onSuccess: (_result, id) => invalidateEvent(queryClient, id),
  });
};

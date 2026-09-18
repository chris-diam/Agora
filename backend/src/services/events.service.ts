import { AttendanceStatus, EventCategory, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { buildPaginationMeta, PaginationParams } from "../utils/pagination";
import { CreateEventInput, UpdateEventInput } from "../validators/events.validators";

const organizerSelect = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

const eventInclude = {
  organizer: { select: organizerSelect },
  _count: { select: { attendances: true } },
} satisfies Prisma.EventInclude;

type EventWithRelations = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

// Batch fetch, same reasoning as posts.service's getLikedPostIds — one extra
// query per page instead of one per event, and keeps the include shape static.
const getAttendanceStatusMap = async (viewerId: string | undefined, eventIds: string[]) => {
  if (!viewerId || eventIds.length === 0) return undefined;

  const rows = await prisma.eventAttendance.findMany({
    where: { userId: viewerId, eventId: { in: eventIds } },
    select: { eventId: true, status: true },
  });

  return new Map(rows.map((row) => [row.eventId, row.status]));
};

const formatEvent = (event: EventWithRelations, attendanceMap?: Map<string, AttendanceStatus>) => {
  const { _count, ...rest } = event;
  return {
    ...rest,
    attendeesCount: _count.attendances,
    ...(attendanceMap ? { viewerAttendanceStatus: attendanceMap.get(rest.id) ?? null } : {}),
  };
};

const validateDateRange = (startDate: Date, endDate?: Date | null) => {
  if (endDate && endDate < startDate) {
    throw new AppError("endDate must be after startDate", 400);
  }
};

export interface ListEventsFilters {
  city?: string;
  country?: string;
  // A single category or a list — e.g. the "Arts & culture" section groups
  // several categories into one feed.
  category?: EventCategory | EventCategory[];
  date?: string; // YYYY-MM-DD
}

export const listEvents = async (
  filters: ListEventsFilters,
  { page, limit, skip }: PaginationParams,
  viewerId?: string
) => {
  const categories = Array.isArray(filters.category)
    ? filters.category
    : filters.category
      ? [filters.category]
      : undefined;

  const where: Prisma.EventWhereInput = {
    ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
    ...(filters.country ? { country: { equals: filters.country, mode: "insensitive" } } : {}),
    ...(categories ? { category: { in: categories } } : {}),
  };

  if (filters.date) {
    const dayStart = new Date(`${filters.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${filters.date}T23:59:59.999Z`);
    where.startDate = { gte: dayStart, lte: dayEnd };
  } else {
    // No explicit date filter: default to upcoming events only. A discovery
    // feed showing already-finished events isn't useful, and there's no
    // "browse past events" requirement in the MVP yet.
    where.startDate = { gte: new Date() };
  }

  const [rows, totalItems] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: { startDate: "asc" }, // soonest first — this is a discovery feed
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  const attendanceMap = await getAttendanceStatusMap(
    viewerId,
    rows.map((row) => row.id)
  );

  return {
    items: rows.map((row) => formatEvent(row, attendanceMap)),
    pagination: buildPaginationMeta(page, limit, totalItems),
  };
};

export const getEventById = async (id: string, viewerId?: string) => {
  const event = await prisma.event.findUnique({ where: { id }, include: eventInclude });
  if (!event) throw new AppError("Event not found", 404);

  const attendanceMap = await getAttendanceStatusMap(viewerId, [event.id]);
  return formatEvent(event, attendanceMap);
};

export const createEvent = async (organizerId: string, input: CreateEventInput, imageUrl?: string) => {
  const startDate = new Date(input.startDate);
  const endDate = input.endDate ? new Date(input.endDate) : undefined;
  validateDateRange(startDate, endDate);

  const event = await prisma.event.create({
    data: {
      organizerId,
      title: input.title,
      description: input.description,
      category: input.category,
      city: input.city,
      country: input.country,
      venueName: input.venueName,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      imageUrl,
      startDate,
      endDate,
    },
    include: eventInclude,
  });

  return formatEvent(event);
};

const assertEventOwner = async (eventId: string, userId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true, startDate: true, endDate: true },
  });

  if (!event) throw new AppError("Event not found", 404);
  if (event.organizerId !== userId) {
    throw new AppError("You do not have permission to modify this event", 403);
  }

  return event;
};

export const updateEvent = async (eventId: string, userId: string, input: UpdateEventInput) => {
  const existing = await assertEventOwner(eventId, userId);

  const { startDate: rawStartDate, endDate: rawEndDate, ...otherFields } = input;

  const nextStartDate = rawStartDate ? new Date(rawStartDate) : existing.startDate;
  const nextEndDate = rawEndDate ? new Date(rawEndDate) : existing.endDate;
  validateDateRange(nextStartDate, nextEndDate);

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...otherFields,
      ...(rawStartDate ? { startDate: nextStartDate } : {}),
      ...(rawEndDate ? { endDate: nextEndDate } : {}),
    },
    include: eventInclude,
  });

  return formatEvent(event);
};

export const deleteEvent = async (eventId: string, userId: string) => {
  await assertEventOwner(eventId, userId);
  await prisma.event.delete({ where: { id: eventId } });
};

export const setAttendance = async (eventId: string, userId: string, status: AttendanceStatus) => {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) throw new AppError("Event not found", 404);

  return prisma.eventAttendance.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: { status },
    create: { eventId, userId, status },
  });
};

export const removeAttendance = async (eventId: string, userId: string) => {
  const existing = await prisma.eventAttendance.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!existing) throw new AppError("You have no attendance status for this event", 404);

  await prisma.eventAttendance.delete({ where: { id: existing.id } });
};

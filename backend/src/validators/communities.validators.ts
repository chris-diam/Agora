import { z } from "zod";

export const createCommunitySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(150),
    description: z.string().max(2000).optional(),
    category: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  }),
});

export const listCommunitiesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    category: z.string().optional(),
  }),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>["body"];

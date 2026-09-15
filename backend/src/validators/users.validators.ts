import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .object({
      displayName: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),
      profileImageUrl: z.string().url().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const listQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];

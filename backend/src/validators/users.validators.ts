import { z } from "zod";

const portfolioLinkSchema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().url(),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      displayName: z.string().min(1).max(100).optional(),
      bio: z.string().max(500).optional(),
      // Opt-in artist/creator fields — see the User model's comment.
      profession: z.string().max(100).optional(),
      portfolioLinks: z.array(portfolioLinkSchema).max(10).optional(),
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

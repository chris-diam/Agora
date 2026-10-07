import { PostCategory } from "@prisma/client";
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
      emailDigestOptIn: z.boolean().optional(),
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

export const listArtistsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    // Filters by the post-category of the artist's selected interests
    // (vibes) — e.g. "MUSIC" matches anyone who picked an interest like
    // "Jazz" that maps to MUSIC. Comma-separated for a multi-category tab
    // like "Arts & culture", same convention as posts/events listing.
    category: z
      .string()
      .transform((value) => value.split(",").map((v) => v.trim()))
      .pipe(z.array(z.nativeEnum(PostCategory)).min(1))
      .optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];

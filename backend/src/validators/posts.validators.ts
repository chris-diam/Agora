import { PostCategory } from "@prisma/client";
import { z } from "zod";

// z.nativeEnum (rather than z.enum(Object.values(...))) keeps the inferred
// type as the real PostCategory enum, not a widened string union — that
// keeps Prisma's create/update calls fully typed downstream.
export const createPostSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Content is required").max(5000, "Content must be at most 5000 characters"),
    category: z.nativeEnum(PostCategory).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    // Only used when no file is attached — an external link (YouTube, etc.)
    // to render as the post's media instead of an uploaded file.
    linkUrl: z.string().url("Must be a valid URL").max(2000).optional(),
    // Set when posting into a community's Discussions tab rather than the
    // general feed — requires membership, checked in posts.service.
    communityId: z.string().optional(),
  }),
});

export const updatePostSchema = z.object({
  body: z
    .object({
      content: z.string().min(1).max(5000).optional(),
      category: z.nativeEnum(PostCategory).optional(),
      city: z.string().max(100).optional(),
      country: z.string().max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const listPostsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    // Comma-separated for multi-category sections (e.g. "Arts & culture"
    // groups ART,CULTURE,THEATRE,CINEMA into one feed).
    category: z
      .string()
      .transform((value) => value.split(",").map((v) => v.trim()))
      .pipe(z.array(z.nativeEnum(PostCategory)).min(1))
      .optional(),
    authorId: z.string().optional(),
    communityId: z.string().optional(),
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>["body"];
export type UpdatePostInput = z.infer<typeof updatePostSchema>["body"];

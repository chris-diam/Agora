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
    category: z.nativeEnum(PostCategory).optional(),
    authorId: z.string().optional(),
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>["body"];
export type UpdatePostInput = z.infer<typeof updatePostSchema>["body"];

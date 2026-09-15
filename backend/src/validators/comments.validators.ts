import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Content is required").max(1000, "Comment must be at most 1000 characters"),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>["body"];

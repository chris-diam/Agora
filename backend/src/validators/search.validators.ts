import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, "q is required").max(100),
  }),
});

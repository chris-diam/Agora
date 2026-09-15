import { z } from "zod";

export const setInterestsSchema = z.object({
  body: z.object({
    interestIds: z.array(z.string().min(1)).max(50, "Too many interests selected"),
  }),
});

export type SetInterestsInput = z.infer<typeof setInterestsSchema>["body"];

import { z } from "zod";

export const createGroupChatSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    // The creator is added automatically — this is the other members.
    memberIds: z.array(z.string()).min(1, "Add at least one other member"),
  }),
});

export const sendGroupMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Content is required").max(2000),
  }),
});

export type CreateGroupChatInput = z.infer<typeof createGroupChatSchema>["body"];
export type SendGroupMessageInput = z.infer<typeof sendGroupMessageSchema>["body"];

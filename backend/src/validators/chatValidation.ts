import { z } from "zod";

export const createChatSchema = z.object({
  roomId: z
    .number()
    .int("Room ID must be an integer"),

  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long"),

  userId: z
    .string()
    .uuid("Invalid user ID")
});
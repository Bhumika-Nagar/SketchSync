import { z } from "zod";

export const createRoomSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug too long"),

  adminId: z
    .string()
    .uuid("Invalid admin ID")
});
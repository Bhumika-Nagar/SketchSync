import { z } from "zod";

export const registerUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  name: z
    .string()
    .min(2, "Name must be at least 2 characters"),

  photo: z
    .string()
    .url("Photo must be a valid URL")
    .optional()
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
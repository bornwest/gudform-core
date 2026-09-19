import { UserRole } from "@prisma/client";
import * as z from "zod";

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
});

export const userRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const userImageSchema = z.object({
  // Empty string clears the profile photo. Only remote URLs are accepted —
  // there is no upload path for avatars.
  image: z
    .string()
    .trim()
    .max(2048, { message: "URL must be 2048 characters or less" })
    .refine((value) => value === "" || /^https:\/\//i.test(value), {
      message: "Photo URL must start with https://",
    }),
});

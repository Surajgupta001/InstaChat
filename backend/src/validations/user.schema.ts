import { z } from "zod";

// Safe regex that prevents ReDoS by only allowing simple alphanumeric patterns
const safeSearchQuery = z
    .string()
    .min(1, { message: "Search query cannot be empty" })
    .max(50, { message: "Search query too long" })
    .regex(/^[a-zA-Z0-9@._\-\s]+$/, {
        message: "Search query contains invalid characters",
    });

export const searchUsersSchema = z.object({
    query: safeSearchQuery,
});

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Name is required" })
        .max(50, { message: "Name must be 50 characters or less" })
        .trim()
        .optional(),
    handle: z
        .string()
        .min(3, { message: "Handle must be at least 3 characters" })
        .max(30, { message: "Handle must be 30 characters or less" })
        .regex(/^[a-z0-9_]+$/, {
            message: "Handle must contain only lowercase letters, numbers, and underscores",
        })
        .trim()
        .optional(),
    bio: z
        .string()
        .max(200, { message: "Bio must be 200 characters or less" })
        .trim()
        .optional(),
});

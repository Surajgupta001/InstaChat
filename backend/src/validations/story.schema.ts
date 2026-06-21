import { z } from "zod";

export const viewStorySchema = z.object({
    storyId: z.string().min(1, { message: "Invalid story ID" }),
});

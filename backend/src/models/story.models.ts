import mongoose, { Schema } from "mongoose";
import type { IStory } from "../../types";

const StorySchema = new Schema<IStory>({
    user: {
        type: String,
        ref: "User",
        required: true,
    },
    mediaUrl: {
        type: String,
        required: true,
    },
    mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true,
    },
    viewers: [{
        type: String,
        ref: "User",
        default: [],
    }],
}, {
    timestamps: true,
});

// TTL index: auto-delete stories after 24 hours
StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// Query index for getStories
StorySchema.index({ user: 1, createdAt: -1 });

const Story = mongoose.model<IStory>("Story", StorySchema);

export default Story;

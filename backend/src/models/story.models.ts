import mongoose, { Schema } from "mongoose";
import type { IStory } from "../../types";

const StorySchema = new Schema<IStory>({
    user: {
        type: Schema.Types.ObjectId,
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
}, {
    timestamps: true,
})

StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Story = mongoose.model<IStory>("Story", StorySchema);

export default Story;

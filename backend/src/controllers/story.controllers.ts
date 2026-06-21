import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middlewares";
import { uploadBuffer } from "../config/cloudinary";
import Story from "../models/story.models";

// Create a new Story
export const createStory = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded",
        });
    }

    try {
        const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';

        const result = await uploadBuffer(file.buffer, {
            folder: 'instachat_stories',
            resourceType,
        });

        const story = await Story.create({
            user: userId,
            mediaUrl: result.secure_url,
            mediaType: resourceType,
        });

        await story.populate('user', 'name avatar handle');

        return res.status(201).json({
            success: true,
            message: 'Story created successfully',
            story,
        });
    } catch (err) {
        console.error('Story upload error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload story',
        });
    }
};

// Get all recent stories (grouped by user)
export const getStories = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
        user: { $ne: userId },
        createdAt: { $gte: since },
    })
        .sort({ createdAt: -1 })
        .populate('user', 'name avatar handle')
        .lean();

    const grouped: Record<string, { user: any; stories: any[] }> = {};

    stories.forEach((s) => {
        if (!s.user) return;
        const uid = String((s.user as any)._id || (s.user as any).id);
        if (!grouped[uid]) {
            grouped[uid] = { user: s.user, stories: [] };
        }
        grouped[uid].stories.push(s);
    });

    return res.json({
        success: true,
        stories: Object.values(grouped),
    });
};

// Mark a story as viewed
export const viewStory = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { storyId } = req.params;

    try {
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }

        if (!story.viewers.includes(userId)) {
            story.viewers.push(userId);
            await story.save();
        }

        return res.json({
            success: true,
            message: "Story marked as viewed",
        });
    } catch (err) {
        console.error("View story error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to mark story as viewed",
        });
    }
};

import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middlewares";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";
import Story from "../models/story.models";

// Create a new Story
export const createStory = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
        return res
            .status(400)
            .json({ message: "No file uploaded" });
    }

    try {
        const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';

        const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'instachat_stories',
                resource_type: resourceType
            }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result as any);
                }
            })

            const readableStream = new Readable();
            readableStream.push(file.buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);
        })

        const result = await uploadPromise;

        const story = await Story.create({
            user: userId,
            mediaUrl: result.secure_url,
            mediaType: resourceType
        })

        await story.populate('user', 'name avatar handle');

        return res
            .status(201)
            .json({
                success: true,
                message: 'Story created successfully',
                story
            });
    } catch (err) {
        console.error('Story upload error:', err);
        return res
            .status(500)
            .json({
                success: false,
                message: 'Failed to story upload',
            });
    }
};

// Get all recent stories (grouped by user)
export const getStories = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    // Only fetch stories from the last 24h, excluding the current user's own
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stories = await Story.find({
        user: { $ne: userId },
        createdAt: { $gte: since },
    }).sort({ createdAt: -1 }).populate('user', 'name avatar handle');

    // Group stories by user
    const grouped: Record<string, { user: any; stories: any[] }> = {};

    stories.forEach((s) => {
        if (!s.user) return;
        const uid = String((s.user as any)._id || (s.user as any).id);
        if (!grouped[uid]) {
            grouped[uid] = {
                user: s.user,
                stories: []
            };
        }
        grouped[uid].stories.push(s);
    });

    return res.json({
        success: true,
        stories: Object.values(grouped)
    });
};
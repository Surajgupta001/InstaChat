import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middlewares";
import User from "../models/user.models";
import { uploadBuffer } from "../config/cloudinary";
import { broadcastUserUpdate } from "../socket/socketManager";

// Get all users (paginated)
export const getUsers = async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find({ _id: { $ne: req.user!.id } })
            .select('name email handle avatar bio isOnline lastSeen')
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments({ _id: { $ne: req.user!.id } }),
    ]);

    res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};

// Search users by name, email or handle (ReDoS-safe)
export const searchUsers = async (req: AuthRequest, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Query parameter is required and should be a string',
            users: [],
        });
    }

    // Escape special regex characters to prevent ReDoS
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const users = await User.find({
        _id: { $ne: req.user!.id },
        $or: [{ name: regex }, { email: regex }, { handle: regex }],
    })
        .select('name email handle avatar bio isOnline lastSeen')
        .limit(20)
        .lean();

    res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        users,
    });
};

// Get current user's profile
export const getProfile = async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id).lean();

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    res.status(200).json({
        success: true,
        message: 'Profile fetched successfully',
        user,
    });
};

// Update current user's profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
    const { name, handle, bio } = req.body;
    const file = req.file;

    if (handle) {
        const handleExists = await User.findOne({
            handle,
            _id: { $ne: req.user!.id },
        });

        if (handleExists) {
            return res.status(400).json({
                success: false,
                message: 'Handle already exists',
            });
        }
    }

    let avatarUrl = '';
    if (file) {
        try {
            const result = await uploadBuffer(file.buffer, {
                folder: 'instachat/avatars',
                transformation: [
                    { width: 400, height: 400, crop: 'fill' },
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            });
            avatarUrl = result.secure_url;
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload avatar',
            });
        }
    }

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (handle) updateData.handle = handle.toLowerCase().trim();
    if (avatarUrl) updateData.avatar = avatarUrl;

    const updated = await User.findByIdAndUpdate(
        req.user!.id,
        updateData,
        { new: true }
    );

    if (updated) {
        broadcastUserUpdate(updated);
    }

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updated,
    });
};

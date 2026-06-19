import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middlewares";
import User from "../models/user.models";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

// Get all users
export const getUsers = async (req: AuthRequest, res: Response) => {
    const users = await User.find({
        _id: {
            $ne: req.user!.id
        }
    })
        .select('name email handle avatar bio isOnline lastSeen')

    res
        .status(200)
        .json({
            success: true,
            message: 'Users fetched successfully',
            users
        });
};

// Search users by name, email or handle
export const searchUsers = async (req: AuthRequest, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Query parameter is required and should be a string',
                users: []
            });
    }

    const regex = new RegExp(query, 'i'); // Case-insensitive search

    const users = await User.find({
        _id: {
            $ne: req.user!.id
        },
        $or: [
            { name: regex },
            { email: regex },
            { handle: regex }
        ]
    })
        .select('name email handle avatar bio isOnline lastSeen')
        .limit(20); // Limit results for performance

    res
        .status(200)
        .json({
            success: true,
            message: 'Users fetched successfully',
            users
        });
};

// Get current user's profile
export const getProfile = async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id)

    if (!user) {
        return res
            .status(404)
            .json({
                success: false,
                message: 'User not found'
            });
    }

    res
        .status(200)
        .json({
            success: true,
            message: 'Profile fetched successfully',
            user
        });
};

// Update current user's profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
    const { name, handle, bio } = req.body;

    const file = req.file;

    if (handle) {
        const handleExists = await User.findOne({
            handle,
            _id: {
                $ne: req.user!.id
            }
        })

        if (handleExists) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Handle already exists'
                });
        }
    }

    let avatarUrl = '';
    if (file) {
        try {
            const uploadPromise = new Promise<{ string_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'instachat/avatars',
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
            avatarUrl = result.string_url;
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            return res
                .status(500)
                .json({
                    success: false,
                    message: 'Failed to upload avatar'
                });
        }
    }

    const uploadData: any = {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(handle && { handle: handle.toLowerCase().trim() }),
    }

    if (avatarUrl) {
        uploadData.avatar = avatarUrl;
    }

    const updated = await User.findByIdAndUpdate(
        req.user!.id,
        uploadData,
        { returnDocument: 'after' }
    );

    res
        .status(200)
        .json({
            success: true,
            message: 'Profile updated successfully',
            user: updated
        });
};
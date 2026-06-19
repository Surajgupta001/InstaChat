import type { NextFunction, Request, Response } from "express";
import { clerkClient, getAuth } from '@clerk/express'
import User from "../models/user.models";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
    };
}

export const authMiddlewares = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: 'Unauthenticated'
                });
            return;
        }

        // Check if user exits locally in our database, if not create a new user
        let localUser = await User.findById(userId);

        if (!localUser) {
            // Lazy sync: Fetch details from clerk API
            const clerkUser = await clerkClient.users.getUser(userId);
            const email = clerkUser.emailAddresses[0]?.emailAddress || '';
            const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || 'Unknown User';

            // Create Fallback handle
            const handle = clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || userId;

            // Ensure unique handle in database by appending random suffix if needed
            let finalHandle = handle.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

            let handleExists = await User.findOne({
                handle: finalHandle
            });

            let counter = 1;
            while (handleExists) {
                const testHandle = `${finalHandle}${counter}`;

                handleExists = await User.findOne({
                    handle: testHandle
                });

                if (!handleExists) {
                    finalHandle = testHandle;
                    break;
                }
                counter++;
            }

            localUser = await User.create({
                _id: userId,
                name,
                email,
                handle: finalHandle,
                avatar: clerkUser.imageUrl || '',
                bio: 'Hey there! I am using InstaChat.',
                isOnline: true,
                lastSeen: new Date(),
            })
        }

        // Attach user info to request for compatibility with existing code
        req.user = {
            id: localUser._id,
            name: localUser.name,
            email: localUser.email,
        }

        next();
    } catch (error) {
        return res
            .status(500)
            .json({
                success: false,
                message: 'Failed to authenticate user',
            });
    }
};
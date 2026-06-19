export interface IUser {
    _id: string;
    name: string;
    email: string;
    handle: string;
    avatar?: string;
    bio?: string;
    isOnline: boolean;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
};
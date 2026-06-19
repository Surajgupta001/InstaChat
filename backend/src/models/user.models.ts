import mongoose, { Schema } from "mongoose";
import type { IUser } from "../../types";

const UserSchema = new Schema<IUser>({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    handle: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    avatar: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
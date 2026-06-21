import { create } from 'zustand';
import type { User, UserStory } from '../types';

interface UiSlice {
    users: User[];
    userStories: UserStory[];

    setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
    setUserStories: (stories: UserStory[] | ((prev: UserStory[]) => UserStory[])) => void;
    updateUserOnlineStatus: (userId: string, isOnline: boolean) => void;
    updateUser: (user: User) => void;
    reset: () => void;
}

const initialUi = {
    users: [],
    userStories: [],
};

export const useUiStore = create<UiSlice>((set) => ({
    ...initialUi,

    setUsers: (usersOrFn) =>
        set((state) => ({
            users:
                typeof usersOrFn === 'function'
                    ? usersOrFn(state.users)
                    : usersOrFn,
        })),

    setUserStories: (storiesOrFn) =>
        set((state) => ({
            userStories:
                typeof storiesOrFn === 'function'
                    ? storiesOrFn(state.userStories)
                    : storiesOrFn,
        })),

    updateUserOnlineStatus: (userId, isOnline) =>
        set((state) => ({
            users: state.users.map((u) =>
                u._id === userId ? { ...u, isOnline } : u
            ),
        })),

    updateUser: (user) =>
        set((state) => ({
            users: state.users.map((u) => (u._id === user._id ? user : u)),
            userStories: state.userStories.map((s) =>
                s.user._id === user._id ? { ...s, user } : s
            ),
        })),

    reset: () => set(initialUi),
}));

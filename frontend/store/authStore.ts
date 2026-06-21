import { create } from 'zustand';
import type { User } from '../types';

interface AuthSlice {
    user: User | null;
    token: string | null;
    loading: boolean;
    setAuth: (auth: { user: User | null; token: string | null; loading: boolean }) => void;
    setUser: (user: User) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

const initialAuth = { user: null, token: null, loading: true };

export const useAuthStore = create<AuthSlice>((set) => ({
    ...initialAuth,
    setAuth: (auth) => set(auth),
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    setLoading: (loading) => set({ loading }),
    reset: () => set(initialAuth),
}));

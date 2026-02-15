import { create } from 'zustand';
import { User } from '@firebase/auth';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setIsLoading: (isLoading) => set({ isLoading }),
    isAuthenticated: () => !!get().user,
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    username: string; // Add username if it wasn't there
    first_name?: string;
    last_name?: string;
    organizations?: any[];
    is_superuser: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    currentOrgId: string | null;
    isAuthenticated: boolean;
    setAuth: (access: string, refresh: string, user: User) => void;
    setOrg: (orgId: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            currentOrgId: null,
            isAuthenticated: false,
            setAuth: (access, refresh, user) => {
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);
                set({
                    accessToken: access,
                    refreshToken: refresh,
                    user: user || null,
                    isAuthenticated: true,
                    currentOrgId: user?.organizations?.[0]?.id || null
                });
            },
            setOrg: (orgId) => set({ currentOrgId: orgId }),
            logout: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                set({ user: null, accessToken: null, refreshToken: null, currentOrgId: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

import { create } from 'zustand';
import type { Role } from '../types';

interface AuthState {
    isAuthenticated: boolean;
    role: Role | null;
    username: string | null;
    teamId: string | null;
    token: string | null;
    login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    role: null,
    username: null,
    teamId: null,
    token: null,

    login: async (credentials) => {
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
            const response = await fetch(`${BACKEND_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.error || 'Invalid Credentials' };
            }

            const data = await response.json();

            // Persist
            localStorage.setItem('auc_token', data.token);
            localStorage.setItem('auc_user', JSON.stringify({
                role: data.role,
                username: data.username,
                teamId: data.teamId
            }));

            set({
                isAuthenticated: true,
                token: data.token,
                role: data.role,
                username: data.username,
                teamId: data.teamId
            });
            return { success: true };
        } catch (err) {
            console.error('Login failed', err);
            return { success: false, error: 'Network Error: Cannot connect to server' };
        }
    },

    logout: () => {
        localStorage.removeItem('auc_token');
        localStorage.removeItem('auc_user');
        set({ isAuthenticated: false, role: null, username: null, teamId: null, token: null });
        window.location.href = '/'; // Hard reload to clear socket state
    },

    checkAuth: () => {
        const token = localStorage.getItem('auc_token');
        const userStr = localStorage.getItem('auc_user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({
                    isAuthenticated: true,
                    token,
                    role: user.role,
                    username: user.username,
                    teamId: user.teamId
                });
            } catch (e) {
                localStorage.clear();
            }
        }
    }
}));

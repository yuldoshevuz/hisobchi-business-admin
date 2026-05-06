import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AdminRole = 'superadmin' | 'support' | 'billing';

export interface AdminProfile {
  id: number;
  fullName: string;
  role: AdminRole;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  admin: AdminProfile | null;
  setSession: (
    accessToken: string,
    refreshToken: string,
    admin: AdminProfile,
  ) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAdmin: (admin: AdminProfile) => void;
  clear: () => void;
}

const STORAGE_KEY = 'hisobchi-admin-auth';

/**
 * Persistent admin session. Tokens live in localStorage — this is an
 * internal tool exposed only to platform operators on managed networks,
 * not a public-facing app, so the cookie/HttpOnly debate doesn't apply.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      admin: null,
      setSession: (accessToken, refreshToken, admin) =>
        set({ accessToken, refreshToken, admin }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setAdmin: (admin) => set({ admin }),
      clear: () => set({ accessToken: null, refreshToken: null, admin: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        admin: state.admin,
      }),
    },
  ),
);

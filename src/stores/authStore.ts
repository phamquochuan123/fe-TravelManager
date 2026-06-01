import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginTime: number | null;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  loginTime: null,

  login: (user) => set({ user, isLoggedIn: true, isLoading: false, loginTime: Date.now() }),

  logout: () => set({ user: null, isLoggedIn: false, isLoading: false, loginTime: null }),

  setUser: (user) => set({ user, isLoggedIn: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));

// Convenience selectors
export const selectUser      = (s: AuthState) => s.user;
export const selectIsLoggedIn = (s: AuthState) => s.isLoggedIn;
export const selectRole      = (s: AuthState) => s.user?.roleName ?? null;
export const selectIsAdmin   = (s: AuthState) => s.user?.roleName === 'ADMIN';
export const selectIsStaff   = (s: AuthState) =>
  s.user?.roleName === 'ADMIN' || s.user?.roleName === 'STAFF';
export const selectIsSessionExpiring = (s: AuthState) =>
  s.loginTime ? (Date.now() - s.loginTime) > 23 * 60 * 60 * 1000 : false;

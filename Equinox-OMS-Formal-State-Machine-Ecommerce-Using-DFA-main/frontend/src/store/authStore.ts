import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  token: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'techstore-auth',
    }
  )
);

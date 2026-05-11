import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

interface UserState {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  setCurrentUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  loading: false,
  error: null,

  setCurrentUser: (currentUser) => set({ currentUser }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

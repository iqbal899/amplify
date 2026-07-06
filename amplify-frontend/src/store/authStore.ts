import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  instagramToken: string | null;
  instagramUsername: string | null;
  instagramUserId: string | null;
  user: UserProfile | null;
  kycCompleted: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  setKYC: (data: Partial<UserProfile>) => void;
  setInstagram: (token: string, username: string, userId: string) => void;
  clearInstagram: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      instagramToken: null,
      instagramUsername: null,
      instagramUserId: null,
      user: null,
      kycCompleted: false,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () =>
        set({
          isAuthenticated: false,
          instagramToken: null,
          instagramUsername: null,
          instagramUserId: null,
          user: null,
          kycCompleted: false,
        }),
      setKYC: (data) =>
        set((state) => ({
          kycCompleted: true,
          user: state.user ? { ...state.user, ...data } : (data as UserProfile),
        })),
      setInstagram: (token, username, userId) =>
        set({
          instagramToken: token,
          instagramUsername: username,
          instagramUserId: userId,
        }),
      clearInstagram: () =>
        set({ instagramToken: null, instagramUsername: null, instagramUserId: null }),
    }),
    {
      name: 'doorbeen-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

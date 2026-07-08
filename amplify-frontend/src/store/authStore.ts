import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Creator {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface AuthState {
  isAuthenticated: boolean;

  token: string | null;

  creator: Creator | null;

  login: (creator: Creator, token: string) => void;

  logout: () => void;

  updateCreator: (data: Partial<Creator>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      token: null,

      creator: null,

      login: (creator, token) =>
        set({
          isAuthenticated: true,
          creator,
          token,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          creator: null,
          token: null,
        }),

      updateCreator: (data) =>
        set((state) => ({
          creator: state.creator
            ? {
                ...state.creator,
                ...data,
              }
            : null,
        })),
    }),
    {
      name: "doorbeen-auth",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
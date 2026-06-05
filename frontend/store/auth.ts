"use client";

import { create } from "zustand";
import type { AuthResponse, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: (auth) => set({ user: auth.user, accessToken: auth.accessToken, refreshToken: auth.refreshToken }),
  logout: () => set({ user: null, accessToken: null, refreshToken: null })
}));

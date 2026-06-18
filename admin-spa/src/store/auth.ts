import { create } from "zustand";

export type AuthUser = {
  id: string;
  login: string;
  fullName: string;
  role: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;

  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  user: null,

  setToken: (token) => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    set({ token, user: token ? undefined as any : null }); // token null thì clear user
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
}));

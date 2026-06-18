import { create } from "zustand";

export type CustomerAuthUser = {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: string;
};

type CustomerAuthState = {
  token: string | null;
  user: CustomerAuthUser | null;
  setSession: (token: string, user: CustomerAuthUser) => void;
  logout: () => void;
};

const TOKEN_KEY = "customer_token";
const USER_KEY = "customer_user";

function readUser(): CustomerAuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: readUser(),

  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));

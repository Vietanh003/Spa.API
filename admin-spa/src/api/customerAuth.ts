import { api } from "../lib/api";
import { useCustomerAuthStore, type CustomerAuthUser } from "../customer/store/auth";

type AuthResponse = {
  token: string;
  user: CustomerAuthUser;
};

export const customerAuthApi = {
  google: async (credential: string) => {
    const res = await api.post<AuthResponse>("/api/customer/auth/google", { idToken: credential });
    useCustomerAuthStore.getState().setSession(res.data.token, res.data.user);
    return res.data;
  },

  sendEmailCode: async (email: string) => {
    const res = await api.post<{ message: string }>("/api/customer/auth/email/send-code", { email });
    return res.data;
  },

  verifyEmailCode: async (email: string, code: string) => {
    const res = await api.post<AuthResponse>("/api/customer/auth/email/verify-code", { email, code });
    useCustomerAuthStore.getState().setSession(res.data.token, res.data.user);
    return res.data;
  },

  me: async () => {
    const token = useCustomerAuthStore.getState().token;
    const res = await api.get<CustomerAuthUser>("/api/customer/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },
};

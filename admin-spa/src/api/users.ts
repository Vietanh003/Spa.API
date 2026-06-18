import { api } from "../lib/api";

export type UserRole = "Admin" | "ContentManager" | "ServiceManager" | "Receptionist";

export type AdminUserRow = {
  id: number;
  hoTen: string;
  gioiTinh: string;
  dienThoai: string;
  diaChi: string | null;
  dbLoginName: string;
  chucVu: UserRole;
  isActive: boolean;
};

export type CreateAdminUserPayload = {
  hoTen: string;
  gioiTinh: string;
  dienThoai: string;
  diaChi: string | null;
  dbLoginName: string;
  password: string;
  chucVu: UserRole;
  isActive: boolean;
};

export type UpdateAdminUserPayload = {
  hoTen: string;
  gioiTinh: string;
  dienThoai: string;
  diaChi: string | null;
  chucVu: UserRole;
  isActive: boolean;
};

export const usersApi = {
  list: async () => (await api.get<AdminUserRow[]>("/api/admin/users")).data,
  roles: async () => (await api.get<UserRole[]>("/api/admin/users/roles")).data,
  create: async (payload: CreateAdminUserPayload) =>
    (await api.post("/api/admin/users", payload)).data,
  update: async (id: number, payload: UpdateAdminUserPayload) =>
    (await api.put(`/api/admin/users/${id}`, payload)).data,
};

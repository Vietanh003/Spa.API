// src/app/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { useAuthStore } from "../store/auth";
import type { ReactNode } from "react";
import DanhMucDichVuPage from "../pages/DanhMucDichVu";
import DichVuPage from "../pages/DichVu";


function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore.getState().token;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
       { path: "danh-muc-dich-vu", element: <DanhMucDichVuPage /> },
       { path: "dich-vu", element: <DichVuPage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

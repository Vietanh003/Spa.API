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
import LichHenPage from "../pages/LichHen";

import CustomerLayout from "../customer/layouts/CustomerLayout";
import CustomerHome from "../customer/pages/Home";
import CustomerServices from "../customer/pages/Services";
import CustomerServiceDetail from "../customer/pages/ServiceDetail";
import CustomerCart from "../customer/pages/Cart";
import CustomerBooking from "../customer/pages/Booking";
import CustomerLienHe from "../customer/pages/LienHe";
import CustomerGioiThieu from "../customer/pages/GioiThieu";
import CustomerBlog from "../customer/pages/Blog";
import CustomerBlogDetail from "../customer/pages/BlogDetail";
import CustomerLogin from "../customer/pages/Login";
import CustomerProfile from "../customer/pages/Profile";
import LienHeAdminPage from "../pages/LienHe";
import BlogAdminPage from "../pages/Blog";


function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore.getState().token;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <CustomerLayout />,
    children: [
      { index: true, element: <CustomerHome /> },
      { path: "services", element: <CustomerServices /> },
      { path: "services/:id", element: <CustomerServiceDetail /> },
      { path: "cart", element: <CustomerCart /> },
      { path: "booking", element: <CustomerBooking /> },
      { path: "lien-he", element: <CustomerLienHe /> },
      { path: "gioi-thieu", element: <CustomerGioiThieu /> },
      { path: "blog", element: <CustomerBlog /> },
      { path: "blog/:slug", element: <CustomerBlogDetail /> },
      { path: "customer-login", element: <CustomerLogin /> },
      { path: "profile", element: <CustomerProfile /> },
    ],
  },

  { path: "/login", element: <Login /> },

  {
    path: "/admin",
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
      { path: "lich-hen", element: <LichHenPage /> },
      { path: "lien-he", element: <LienHeAdminPage /> },
      { path: "blog", element: <BlogAdminPage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

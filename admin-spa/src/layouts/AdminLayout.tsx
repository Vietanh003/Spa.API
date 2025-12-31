import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export default function AdminLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;
    if (user) return;

    api.get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => logout());
  }, [token, user, setUser, logout]);

  return (
    <div className="h-full flex bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function Topbar() {
  const nav = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4">
      <div className="text-sm text-slate-600">Admin Panel</div>
      <button
        className="text-sm px-3 py-1.5 rounded-md border hover:bg-slate-50"
        onClick={() => {
          logout();
          nav("/login", { replace: true });
        }}
      >
        Logout
      </button>
    </header>
  );
}

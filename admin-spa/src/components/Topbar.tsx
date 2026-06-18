import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuthStore } from "../store/auth";

type TopbarProps = {
  onOpenMenu?: () => void;
};

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export default function Topbar({ onOpenMenu }: TopbarProps) {
  const nav = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-white flex items-center justify-between gap-2 px-3 sm:px-4">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Mở menu"
          className="rounded-lg p-2 -ml-1 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="text-sm text-slate-600 truncate">Admin Panel</div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials(user.fullName || user.login)}
            </div>
            <div className="hidden text-right text-xs leading-tight md:block">
              <div className="font-semibold text-slate-800 max-w-[140px] truncate">{user.fullName || user.login}</div>
              <div className="text-slate-500">{user.role ?? "—"}</div>
            </div>
          </div>
        )}

        <button
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50"
          onClick={() => {
            logout();
            nav("/login", { replace: true });
          }}
          aria-label="Đăng xuất"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

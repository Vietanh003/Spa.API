import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Folder,
  Settings,
} from "lucide-react";

const baseLink =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";

const activeLink =
  "bg-slate-100 text-slate-900 border-l-4 border-slate-900 pl-2";

const inactiveLink =
  "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(-2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white">
      {/* Logo / Title */}
      <div className="px-4 py-4 border-b">
        <div className="text-lg font-bold tracking-tight">
          Admin<span className="text-slate-500">SPA</span>
        </div>
        <div className="text-xs text-slate-500">Management System</div>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-slate-900 text-white grid place-items-center font-semibold">
            {initials(user?.fullName || user?.login)}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {user?.fullName || "Đang tải..."}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {user?.role ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem to="/" end icon={<LayoutDashboard size={18} />}>
          Dashboard
        </NavItem>

        <NavItem to="/dich-vu" icon={<Briefcase size={18} />}>
          Dịch vụ
        </NavItem>

        <NavItem to="/danh-muc-dich-vu" icon={<Folder size={18} />}>
          Danh mục dịch vụ
        </NavItem>

        <NavItem to="/users" icon={<Users size={18} />}>
          Users
        </NavItem>

        <NavItem to="/settings" icon={<Settings size={18} />}>
          Settings
        </NavItem>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 text-xs text-slate-400 border-t">
        © 2025 Admin SPA
      </div>
    </aside>
  );
}

/* ===== Component menu item ===== */
function NavItem({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `${baseLink} ${isActive ? activeLink : inactiveLink}`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

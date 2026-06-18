import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Folder,
  Settings,
  CalendarDays,
  MessageSquare,
  Newspaper,
  X,
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

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

function SidebarBody({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {/* Logo / Title */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div>
          <div className="text-lg font-bold tracking-tight">
            Admin<span className="text-slate-500">SPA</span>
          </div>
          <div className="text-xs text-slate-500">Management System</div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <X size={18} />
          </button>
        )}
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        <NavItem to="/admin" end icon={<LayoutDashboard size={18} />}>
          Dashboard
        </NavItem>

        <NavItem to="/admin/dich-vu" icon={<Briefcase size={18} />}>
          Dịch vụ
        </NavItem>

        <NavItem to="/admin/danh-muc-dich-vu" icon={<Folder size={18} />}>
          Danh mục dịch vụ
        </NavItem>

        <NavItem to="/admin/lich-hen" icon={<CalendarDays size={18} />}>
          Lịch hẹn
        </NavItem>

        <NavItem to="/admin/lien-he" icon={<MessageSquare size={18} />}>
          Tin nhắn liên hệ
        </NavItem>

        <NavItem to="/admin/blog" icon={<Newspaper size={18} />}>
          Blog / Bài viết
        </NavItem>

        <NavItem to="/admin/users" icon={<Users size={18} />}>
          Users
        </NavItem>

        <NavItem to="/admin/settings" icon={<Settings size={18} />}>
          Settings
        </NavItem>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 text-xs text-slate-400 border-t">
        © 2025 Admin SPA
      </div>
    </>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Static rail on desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white">
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <SidebarBody onCloseMobile={onClose} />
          </aside>
        </div>
      )}
    </>
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

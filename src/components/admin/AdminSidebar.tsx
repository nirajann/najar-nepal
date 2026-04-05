import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MapPinned,
  FolderKanban,
  MessageSquareWarning,
  ShieldUser,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Leaders", to: "/admin/leaders", icon: Users },
  { label: "Districts", to: "/admin/districts", icon: MapPinned },
  { label: "Projects", to: "/admin/projects", icon: FolderKanban },
  { label: "Complaints", to: "/admin/complaints", icon: MessageSquareWarning },
  { label: "Users", to: "/admin/users", icon: ShieldUser },
];

function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:border-r lg:border-slate-200 lg:bg-[#0b1220] lg:text-white">
      <div className="flex h-[76px] items-center border-b border-white/10 px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Najar Nepal</h1>
          <p className="mt-1 text-xs text-slate-400">Admin Console</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5">
        <div className="mb-6 rounded-2xl bg-white/5 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <p className="mt-2 text-sm font-semibold text-white">Website management</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Monitor content, leaders, districts, complaints, and user activity.
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={isActive ? "text-slate-950" : "text-slate-400 group-hover:text-white"}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-2xl bg-white/5 px-4 py-4">
          <p className="text-sm font-semibold text-white">Admin</p>
          <p className="mt-1 text-xs text-slate-400">Secure dashboard access</p>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
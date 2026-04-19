import { Bell, LogOut, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export type AdminNotificationItem = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "danger";
};

type Props = {
  pageTitle?: string;
  pageSubtitle?: string;
  notifications?: AdminNotificationItem[];
};

function AdminTopbar({
  pageTitle = "Dashboard",
  pageSubtitle = "Overview of your platform activity",
  notifications = [],
}: Props) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [openNotifications, setOpenNotifications] = useState(false);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div className="flex min-h-[78px] flex-col gap-3 px-3 py-3 sm:px-4 lg:min-h-[86px] lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold tracking-tight text-slate-950 sm:text-[18px]">
            {pageTitle}
          </h1>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 lg:w-[300px] lg:flex-none">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search dashboard..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenNotifications((prev) => !prev)}
              className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {openNotifications && (
              <div className="absolute right-0 z-40 mt-2 w-[280px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:w-[340px]">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <button
                    type="button"
                    onClick={() => setOpenNotifications(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No important alerts right now.
                  </div>
                ) : (
                  <div className="max-h-[320px] space-y-2 overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border px-3 py-3 ${
                          item.tone === "danger"
                            ? "border-red-200 bg-red-50"
                            : item.tone === "warning"
                            ? "border-amber-200 bg-amber-50"
                            : "border-blue-200 bg-blue-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:bg-slate-100"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-slate-500">Platform Manager</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:px-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
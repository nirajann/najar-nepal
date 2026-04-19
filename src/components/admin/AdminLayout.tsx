import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

type Props = {
  children: ReactNode;
};

function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 lg:block">
          <AdminSidebar />
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="h-full w-[280px] max-w-[82vw] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AdminSidebar />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Menu
              </button>

              <div className="truncate text-sm font-semibold text-slate-900">
                Admin Panel
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <AdminTopbar />
          </div>

          <main className="flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:p-6">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
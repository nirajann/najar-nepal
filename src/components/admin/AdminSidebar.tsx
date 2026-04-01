import { Link, useLocation } from "react-router-dom";

const items = [
  { name: "Dashboard", path: "/admin" },
  { name: "Leaders", path: "/admin/leaders" },
  { name: "Districts", path: "/admin/districts" },
  { name: "Projects", path: "/admin/projects" },
  { name: "Complaints", path: "/admin/complaints" },
  { name: "Users", path: "/admin/users" },
];

function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm p-4 md:p-5">
      <div className="mb-5">
        <h2 className="text-2xl font-extrabold text-slate-900">Admin Panel</h2>
        <p className="text-slate-500 mt-1">Manage website data and monitor activity</p>
      </div>

      <nav className="space-y-3">
        {items.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-2xl px-4 py-3 font-semibold transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
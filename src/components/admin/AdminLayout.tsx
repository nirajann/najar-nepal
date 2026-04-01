import type { ReactNode } from "react";
import Navbar from "../Navbar";
import AdminSidebar from "./AdminSidebar";

function AdminLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="w-full px-3 md:px-4 xl:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-4 xl:gap-5 items-start">
          <div className="xl:sticky xl:top-24 self-start">
            <AdminSidebar />
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6 xl:p-7 min-w-0">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-extrabold text-slate-900">
                {title}
              </h1>
              {description && (
                <p className="text-slate-500 mt-2 text-base md:text-lg">{description}</p>
              )}
            </div>

            {children}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
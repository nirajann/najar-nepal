import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

function AdminFormCard({ title, subtitle, children, actions }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>

        {actions ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default AdminFormCard;
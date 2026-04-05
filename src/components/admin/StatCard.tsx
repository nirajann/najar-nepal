import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
};

function StatCard({ title, value, helper, icon: Icon }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
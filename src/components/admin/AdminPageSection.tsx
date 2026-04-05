type Props = {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
};

function AdminPageSection({ title, description, rightSlot, children }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>

        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export default AdminPageSection;
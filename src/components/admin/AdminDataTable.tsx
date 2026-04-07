import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
};

function AdminDataTable<T>({
  title,
  subtitle,
  columns,
  rows,
  emptyMessage = "No records found.",
}: Props<T>) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5 ${column.className || ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-slate-100 align-top transition hover:bg-slate-50/70"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-4 text-sm text-slate-700 sm:px-5 ${column.className || ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminDataTable;
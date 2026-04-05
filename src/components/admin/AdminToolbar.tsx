type Props = {
  searchText?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondarySlot?: React.ReactNode;
};

function AdminToolbar({
  searchText = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  primaryActionLabel,
  onPrimaryAction,
  secondarySlot,
}: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
        {onSearchChange ? (
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-300 focus:bg-white"
          />
        ) : null}

        {secondarySlot}
      </div>

      {primaryActionLabel && onPrimaryAction ? (
        <button
          onClick={onPrimaryAction}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {primaryActionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default AdminToolbar;
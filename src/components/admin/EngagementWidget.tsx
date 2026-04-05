type Props = {
  likes: number;
  dislikes: number;
  votes: number;
};

function ProgressRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = max > 0 ? Math.max((value / max) * 100, 8) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-slate-950"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function EngagementWidget({ likes, dislikes, votes }: Props) {
  const max = Math.max(likes, dislikes, votes, 1);

  return (
    <div className="space-y-5">
      <ProgressRow label="Likes" value={likes} max={max} />
      <ProgressRow label="Dislikes" value={dislikes} max={max} />
      <ProgressRow label="Votes" value={votes} max={max} />
    </div>
  );
}

export default EngagementWidget;
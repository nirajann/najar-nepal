import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { To } from "react-router-dom";

type StripProps = {
  className?: string;
};

type NepalButtonTone = "primary" | "secondary";

function getNepalButtonClipPath() {
  return "inset(0 round 18px)";
}

function getNepalButtonClassName(tone: NepalButtonTone, className = "") {
  const base =
    tone === "primary"
      ? "group relative inline-flex min-h-[52px] items-center overflow-hidden rounded-[18px] px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.16)]"
      : "group relative inline-flex min-h-[52px] items-center overflow-hidden rounded-[18px] px-6 py-3 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]";

  return `${base} ${className}`.trim();
}

function NepalButtonInner({
  children,
  tone,
}: {
  children: ReactNode;
  tone: NepalButtonTone;
}) {
  const clipPath = getNepalButtonClipPath();

  return (
    <>
      <span
        className={`absolute inset-0 ${
          tone === "primary"
            ? "bg-[linear-gradient(135deg,#0f172a_0%,#172554_100%)]"
            : "border border-slate-200 bg-white"
        }`}
        style={{ clipPath }}
      />
      <span
        className={`absolute inset-[1px] ${
          tone === "primary"
            ? "bg-[linear-gradient(135deg,rgba(220,38,38,0.2),rgba(15,23,42,0) 34%,rgba(29,78,216,0.18) 100%)]"
            : "bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94) 42%,rgba(239,246,255,0.98) 100%)]"
        }`}
        style={{ clipPath }}
      />
      <span
        className="absolute left-0 top-0 h-full w-[7px] bg-[linear-gradient(180deg,#dc2626_0%,#1d4ed8_100%)] opacity-95"
        style={{ clipPath: "inset(0 round 18px 0 0 18px)" }}
      />
      <span
        className="absolute left-[11px] top-[8px] bottom-[8px] w-[3px] opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.95) 0 2px, transparent 2px 4px)",
        }}
      />
      <span
        className={`absolute inset-y-0 -left-[8%] w-[42%] ${
          tone === "primary" ? "bg-white/10" : "bg-red-50/70"
        } opacity-0 blur-[2px] transition duration-500 group-hover:translate-x-5 group-hover:opacity-100`}
        style={{ clipPath: "polygon(0 0, 26% 0, 100% 100%, 74% 100%)" }}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-90">
        <NepalFlagPennant compact className="h-3.5 w-3" />
      </span>
      <span
        className={`absolute inset-[1px] ${
          tone === "primary" ? "border border-white/10" : "border border-slate-200/80"
        }`}
        style={{ clipPath }}
      />
      <span className="relative z-10 pl-3 pr-6">{children}</span>
    </>
  );
}

export function NepalActionLink({
  to,
  children,
  tone = "primary",
  className = "",
}: {
  to: To;
  children: ReactNode;
  tone?: NepalButtonTone;
  className?: string;
}) {
  const clipPath = getNepalButtonClipPath();

  return (
    <Link to={to} className={getNepalButtonClassName(tone, className)} style={{ clipPath }}>
      <NepalButtonInner tone={tone}>{children}</NepalButtonInner>
    </Link>
  );
}

export function NepalAnchorButton({
  href,
  children,
  tone = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: NepalButtonTone;
  className?: string;
}) {
  const clipPath = getNepalButtonClipPath();

  return (
    <a href={href} className={getNepalButtonClassName(tone, className)} style={{ clipPath }}>
      <NepalButtonInner tone={tone}>{children}</NepalButtonInner>
    </a>
  );
}

export function NepalActionButton({
  children,
  tone = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: NepalButtonTone;
}) {
  const clipPath = getNepalButtonClipPath();

  return (
    <button
      {...props}
      type={type}
      className={getNepalButtonClassName(tone, className)}
      style={{ clipPath, ...props.style }}
    >
      <NepalButtonInner tone={tone}>{children}</NepalButtonInner>
    </button>
  );
}

export function NepalFlagPennant({
  className = "",
  compact = false,
}: StripProps & { compact?: boolean }) {
  return (
    <div
      className={`pointer-events-none relative overflow-hidden rounded-[10px] border border-blue-700/80 bg-[#dc2626] ${compact ? "h-6 w-4" : "h-10 w-6"} ${className}`}
      aria-hidden="true"
      style={{
        clipPath: compact
          ? "polygon(0 0, 100% 0, 100% 46%, 82% 50%, 100% 54%, 100% 100%, 0 100%)"
          : "polygon(0 0, 100% 0, 100% 44%, 78% 50%, 100% 56%, 100% 100%, 0 100%)",
      }}
    >
      <div className="absolute inset-[1.5px] rounded-[8px] bg-[#dc2626]" />
      <div
        className="absolute inset-[1.5px] rounded-[8px] border border-white/95"
        style={{
          clipPath: compact
            ? "polygon(0 0, 100% 0, 100% 46%, 82% 50%, 100% 54%, 100% 100%, 0 100%)"
            : "polygon(0 0, 100% 0, 100% 44%, 78% 50%, 100% 56%, 100% 100%, 0 100%)",
        }}
      />
      <div className="absolute left-[28%] top-[20%] h-[18%] w-[18%] rounded-full border border-white/90" />
      <div className="absolute left-[26%] top-[56%] h-[22%] w-[22%] rotate-45 border border-white/90" />
    </div>
  );
}

export function DhakaBorderStrip({ className = "" }: StripProps) {
  return (
    <div
      className={`h-2 w-full bg-[linear-gradient(90deg,#dc2626_0%,#dc2626_12%,#1d4ed8_12%,#1d4ed8_24%,#f8fafc_24%,#f8fafc_28%,#dc2626_28%,#dc2626_40%,#1d4ed8_40%,#1d4ed8_52%,#f8fafc_52%,#f8fafc_56%,#dc2626_56%,#dc2626_68%,#1d4ed8_68%,#1d4ed8_80%,#f8fafc_80%,#f8fafc_84%,#dc2626_84%,#dc2626_100%)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function CarvedCornerAccent({ className = "" }: StripProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-[22px] border-l border-t border-red-200/80" />
      <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-[22px] border-r border-t border-blue-200/80" />
      <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[22px] border-b border-l border-blue-200/70" />
      <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[22px] border-b border-r border-red-200/70" />
    </div>
  );
}

export function CivicPulseRing({
  className = "",
  tone = "red",
}: StripProps & { tone?: "red" | "blue" | "slate" }) {
  const ringTone =
    tone === "blue"
      ? "border-blue-200/70"
      : tone === "slate"
      ? "border-slate-300/60"
      : "border-red-200/70";

  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <div className={`h-24 w-24 rounded-full border ${ringTone}`} />
      <div className={`absolute inset-[10px] rounded-full border ${ringTone}`} />
      <div className={`absolute inset-[20px] rounded-full border ${ringTone}`} />
    </div>
  );
}

export function SiteShellBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes shellDrift {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -8px, 0) rotate(1deg); }
        }
        @keyframes shellRibbon {
          0%, 100% { transform: translateX(0); opacity: 0.05; }
          50% { transform: translateX(12px); opacity: 0.09; }
        }
      `}</style>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#fcfcfd_0%,#f8fafc_38%,#f8fafc_100%)]" />
      <div className="absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(29,78,216,0.08),transparent_38%)]" />
      <div className="absolute left-[-8%] top-[84px] h-[420px] w-[420px] rounded-full border border-red-100/70 opacity-60 blur-[1px]" />
      <div className="absolute right-[-10%] top-[160px] h-[520px] w-[520px] rounded-full border border-blue-100/80 opacity-60 blur-[1px]" />

      <svg viewBox="0 0 1600 1400" className="absolute inset-0 h-full w-full opacity-[0.14]" fill="none">
        <path d="M0 132C178 102 340 84 499 64C654 45 816 41 987 58C1147 74 1296 107 1458 90C1512 84 1562 75 1600 66" stroke="#1d4ed8" strokeWidth="2" />
        <path d="M0 214C152 186 323 164 510 158C705 151 865 166 1075 192C1277 217 1430 236 1600 224" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 10" />
        <path d="M0 1124C227 1062 427 1028 636 1019C860 1008 1034 1031 1242 1061C1385 1081 1507 1117 1600 1150" stroke="#0f172a" strokeWidth="1.5" opacity="0.55" />
      </svg>

      <div
        className="absolute inset-x-0 top-[72px] h-2 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(220,38,38,0.95) 0 18px, rgba(248,250,252,0) 18px 28px, rgba(29,78,216,0.95) 28px 46px, rgba(248,250,252,0) 46px 58px)",
        }}
      />
      <div
        className="absolute inset-x-0 top-[190px] h-8 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(220,38,38,0.8) 0 12%, transparent 12% 24%, rgba(29,78,216,0.8) 24% 36%, transparent 36% 48%, rgba(220,38,38,0.8) 48% 60%, transparent 60% 72%, rgba(29,78,216,0.8) 72% 84%, transparent 84% 100%)",
          animation: "shellRibbon 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[-6%] top-[44%] h-24 w-[38%] opacity-[0.06] blur-[1px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(220,38,38,0.18), rgba(220,38,38,0.02) 42%, rgba(29,78,216,0.14) 78%, transparent)",
          clipPath: "polygon(0 44%, 18% 26%, 38% 50%, 62% 34%, 100% 52%, 100% 66%, 64% 48%, 39% 68%, 16% 44%, 0 60%)",
          animation: "shellRibbon 24s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[-8%] top-[68%] h-20 w-[34%] opacity-[0.05] blur-[1px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(29,78,216,0.16), rgba(29,78,216,0.02) 40%, rgba(220,38,38,0.14) 82%, transparent)",
          clipPath: "polygon(0 48%, 20% 34%, 44% 56%, 67% 38%, 100% 54%, 100% 70%, 68% 52%, 43% 72%, 18% 48%, 0 64%)",
          animation: "shellRibbon 28s ease-in-out infinite",
        }}
      />

      <div className="absolute left-[4%] top-[300px] grid grid-cols-4 gap-2 opacity-[0.08]">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className="h-5 w-5 rounded-sm border border-slate-500"
            style={{ transform: index % 2 === 0 ? "rotate(45deg)" : "rotate(0deg)" }}
          />
        ))}
      </div>

      <div className="absolute right-[6%] top-[520px] h-40 w-40 rounded-full border border-red-100/70 opacity-40" />
      <div className="absolute right-[8%] top-[540px] h-28 w-28 rounded-full border border-blue-100/70 opacity-40" />
      <div
        className="absolute left-[7%] top-[150px] h-14 w-10 rotate-[-8deg] opacity-[0.08]"
        style={{ animation: "shellDrift 22s ease-in-out infinite" }}
      >
        <NepalFlagPennant />
      </div>
      <div
        className="absolute right-[9%] top-[410px] h-14 w-10 rotate-[10deg] opacity-[0.07]"
        style={{ animation: "shellDrift 26s ease-in-out infinite", animationDelay: "-8s" }}
      >
        <NepalFlagPennant />
      </div>
      <div
        className="absolute left-[12%] top-[66%] h-10 w-7 rotate-[6deg] opacity-[0.05] blur-[0.5px]"
        style={{ animation: "shellDrift 24s ease-in-out infinite", animationDelay: "-12s" }}
      >
        <NepalFlagPennant compact={false} />
      </div>
    </div>
  );
}

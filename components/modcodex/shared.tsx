"use client";

export function Row({
  title,
  subtitle,
  tag,
  onClick,
}: {
  title: string;
  subtitle?: string | null;
  tag?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-start justify-between gap-4 border-b border-accent/8 px-1 py-2.75 text-left transition-colors duration-150 last:border-b-0 hover:bg-accent-deep/18"
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 text-[11px] leading-[1.55] text-text/50">{subtitle}</div>}
      </div>
      <span className="flex flex-none items-center gap-2">
        {tag && (
          <span className="clip-corner-sm border border-accent/18 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-accent/70 uppercase">
            {tag}
          </span>
        )}
        <span className="text-[13px] text-text/25">›</span>
      </span>
    </button>
  );
}

export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-accent/70 uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}

export function BackButton({ onClick, label = "Voltar" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3.5 flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-accent/80 uppercase transition-colors hover:text-accent"
    >
      <span aria-hidden="true">‹</span> {label}
    </button>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="clip-corner-sm border border-accent/22 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-accent/70 uppercase">
      {children}
    </span>
  );
}

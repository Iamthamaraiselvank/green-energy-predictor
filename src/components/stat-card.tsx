import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  unit,
  icon,
  accent,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  icon: ReactNode;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in oklab, ${accent} 22%, transparent)`, color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">
        {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

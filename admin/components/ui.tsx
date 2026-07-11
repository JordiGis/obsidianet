export function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-notion-border rounded-xl p-4">
      <div className="text-xs text-notion-muted">{label}</div>
      <div className="text-2xl font-semibold text-notion-text mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-notion-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-notion-border rounded-xl p-4">
      <div className="text-sm font-medium text-notion-text mb-3">{title}</div>
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-notion-text">{title}</h1>
        {subtitle && <p className="text-sm text-notion-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

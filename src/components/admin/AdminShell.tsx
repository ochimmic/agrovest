import { Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { ChevronLeft, Search, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

export type AdminStatus =
  | "Pending"
  | "Under review"
  | "More info"
  | "Submitted"
  | "Approved"
  | "Issued"
  | "Resolved"
  | "Open"
  | "Rejected"
  | "Director approval"
  | "Pending director"
  | "Pending review";

export type AdminItem = {
  id?: string;
  name: string;
  meta: string;
  state: AdminStatus | string;
  initials?: string;
};

const stateTone: Record<string, string> = {
  Approved: "bg-agro-soft text-agro",
  Issued: "bg-agro-soft text-agro",
  Resolved: "bg-agro-soft text-agro",
  Pending: "bg-warn/15 text-warn",
  "Under review": "bg-warn/15 text-warn",
  "More info": "bg-warn/15 text-warn",
  Submitted: "bg-violet-soft text-violet",
  "Pending review": "bg-warn/15 text-warn",
  "Pending director": "bg-violet-soft text-violet",
  "Director approval": "bg-violet-soft text-violet",
  Open: "bg-destructive/15 text-destructive",
  Rejected: "bg-destructive/15 text-destructive",
};

export function StateBadge({ state }: { state: string }) {
  const tone = stateTone[state] ?? "bg-secondary text-secondary-foreground";
  return (
    <span className={`shrink-0 rounded-full ${tone} text-[10px] font-semibold px-2 py-1 h-fit whitespace-nowrap`}>
      {state}
    </span>
  );
}

export function AdminPage({
  title,
  subtitle,
  icon: Icon,
  items,
  filters = ["All"],
  actions,
  emptyText = "Nothing here yet.",
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  items: AdminItem[];
  filters?: string[];
  actions?: (item: AdminItem) => ReactNode;
  emptyText?: string;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(filters[0]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchesQ =
        !q ||
        it.name.toLowerCase().includes(q.toLowerCase()) ||
        it.meta.toLowerCase().includes(q.toLowerCase());
      const matchesF =
        filter === "All" ||
        it.state.toLowerCase().includes(filter.toLowerCase());
      return matchesQ && matchesF;
    });
  }, [items, q, filter]);

  return (
    <MobileFrame>
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 gradient-navy text-white">
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
            aria-label="Back to admin"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Operations</p>
            <h1 className="font-semibold flex items-center gap-1.5 truncate">
              {Icon ? <Icon size={14} /> : null}
              {title}
            </h1>
          </div>
        </div>
        {subtitle ? <p className="mt-2 text-[11px] text-white/70">{subtitle}</p> : null}

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-3 h-10">
          <Search size={14} className="text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or meta"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/50 text-white"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {filters.length > 1 && (
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur px-4 py-3 border-b border-border">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full px-3 h-8 text-[11px] font-medium transition ${
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {q || filter !== filters[0] ? "No matches." : emptyText}
            </p>
          ) : (
            filtered.map((it, i) => (
              <article
                key={it.id ?? i}
                className="rounded-2xl bg-card border border-border p-3 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-violet-soft text-violet flex items-center justify-center text-sm font-semibold shrink-0">
                    {it.initials ?? initialsOf(it.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-navy truncate">{it.name}</p>
                      <StateBadge state={it.state} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{it.meta}</p>
                  </div>
                </div>
                {actions ? (
                  <div className="mt-3 flex gap-2">{actions(it)}</div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <ActionBtn variant="primary">Approve</ActionBtn>
                    <ActionBtn variant="ghost">Reject</ActionBtn>
                    <ActionBtn variant="ghost">View</ActionBtn>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </MobileFrame>
  );
}

export function ActionBtn({
  variant = "ghost",
  children,
  onClick,
}: {
  variant?: "primary" | "ghost" | "danger";
  children: ReactNode;
  onClick?: () => void;
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : variant === "danger"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary text-secondary-foreground";
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl h-9 text-[12px] font-semibold transition active:scale-[0.98] ${styles}`}
    >
      {children}
    </button>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Chrome for admin pages that render custom content instead of a list. */
export function AdminShell({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <MobileFrame>
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 gradient-navy text-white">
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
            aria-label="Back to admin"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Operations</p>
            <h1 className="font-semibold flex items-center gap-1.5 truncate">
              {Icon ? <Icon size={14} /> : null}
              {title}
            </h1>
          </div>
        </div>
        {subtitle ? <p className="mt-2 text-[11px] text-white/70">{subtitle}</p> : null}
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">{children}</div>
    </MobileFrame>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { ChevronLeft, ScrollText, FileCheck, Store, FileText, Gift, AlertTriangle, Shield } from "lucide-react";
import { useMemo, useState, type ComponentType } from "react";

export const Route = createFileRoute("/_authenticated/_admin/_authenticated/_admin/admin/audit")({ component: Page });

type LogKind = "kyc" | "vendor" | "doc" | "reward" | "dispute" | "system";

const logs: { kind: LogKind; t: string; by: string; at: string; day: string }[] = [
  { kind: "kyc", t: "KYC approved — user_4421", by: "ops@agrovest", at: "10:42 AM", day: "Today" },
  { kind: "vendor", t: "Vendor approved — PrimeAuto", by: "ops@agrovest", at: "09:18 AM", day: "Today" },
  { kind: "doc", t: "Document issued — Custody Receipt #d213", by: "system", at: "08:55 AM", day: "Today" },
  { kind: "reward", t: "Reward issued — Broker BR-9012 ($400)", by: "director@agrovest", at: "04:11 PM", day: "Yesterday" },
  { kind: "dispute", t: "Dispute resolved — Order #o5", by: "ops@agrovest", at: "02:30 PM", day: "Yesterday" },
  { kind: "system", t: "Policy update — KYC v3.2 published", by: "system", at: "11:02 AM", day: "Yesterday" },
];

const iconFor: Record<LogKind, ComponentType<{ size?: number }>> = {
  kyc: FileCheck,
  vendor: Store,
  doc: FileText,
  reward: Gift,
  dispute: AlertTriangle,
  system: Shield,
};

const toneFor: Record<LogKind, string> = {
  kyc: "bg-violet-soft text-violet",
  vendor: "bg-agro-soft text-agro",
  doc: "bg-secondary text-secondary-foreground",
  reward: "bg-agro-soft text-agro",
  dispute: "bg-destructive/15 text-destructive",
  system: "bg-warn/15 text-warn",
};

function Page() {
  const [filter, setFilter] = useState<"All" | LogKind>("All");
  const filters: ("All" | LogKind)[] = ["All", "kyc", "vendor", "doc", "reward", "dispute", "system"];

  const grouped = useMemo(() => {
    const f = logs.filter((l) => filter === "All" || l.kind === filter);
    return f.reduce<Record<string, typeof logs>>((acc, l) => {
      (acc[l.day] ??= []).push(l);
      return acc;
    }, {});
  }, [filter]);

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
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Operations</p>
            <h1 className="font-semibold flex items-center gap-1.5">
              <ScrollText size={14} /> Audit logs
            </h1>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-white/70">Immutable operations activity trail</p>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur px-4 py-3 border-b border-border">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3 h-8 text-[11px] font-medium capitalize transition ${
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

        <div className="p-4 space-y-5">
          {Object.entries(grouped).map(([day, items]) => (
            <section key={day}>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-1 mb-2">
                {day}
              </h2>
              <ol className="relative space-y-2 pl-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
                {items.map((l, i) => {
                  const I = iconFor[l.kind];
                  return (
                    <li key={i} className="relative">
                      <span
                        className={`absolute -left-[14px] top-3 h-2.5 w-2.5 rounded-full ${toneFor[l.kind]} ring-2 ring-background`}
                      />
                      <div className="flex items-start gap-3 rounded-2xl bg-card border border-border p-3">
                        <span className={`h-9 w-9 rounded-xl ${toneFor[l.kind]} flex items-center justify-center shrink-0`}>
                          <I size={16} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-navy">{l.t}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {l.by} · {l.at}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}

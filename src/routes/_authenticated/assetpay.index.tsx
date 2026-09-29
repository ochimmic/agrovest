import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, ChevronRight } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroBadge } from "@/components/ui/agro-badge";
import { Money } from "@/components/ui/money";
import { LocalTime } from "@/components/ui/local-time";
import { amountDue, installmentStatus, nextInstallment, paidUsd, useAssetPay } from "@/lib/assetpay";

export const Route = createFileRoute("/_authenticated/assetpay/")({
  head: () => ({
    meta: [
      { title: "AssetPay installment plans | AgroVest" },
      { name: "description", content: "Own farmland and assets small-small with AgroVest AssetPay installment plans." },
      { property: "og:title", content: "AssetPay installment plans | AgroVest" },
      { property: "og:description", content: "Pay from 10% down and spread the balance over 3, 6 or 12 months." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssetPayHome,
});

const TONE = { active: "violet", completed: "agro", cancelled: "danger" } as const;

function AssetPayHome() {
  const plans = useAssetPay((s) => s.plans);
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><ArrowLeft size={18} /></Link>
        <h1 className="text-base font-semibold text-foreground">AssetPay</h1>
      </header>
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop">
          <CalendarClock size={22} />
          <p className="mt-2 text-lg font-semibold">Own it small-small</p>
          <p className="mt-1 text-xs text-white/70">
            Start with as little as 10% down and spread the rest over 3, 6 or 12 months. Your holding and
            documents are issued once the plan is fully paid.
          </p>
          <Link to="/invest/farmvest" className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-medium">
            Start a plan on a farm
          </Link>
        </section>

        <h2 className="text-sm font-semibold text-foreground">Your plans</h2>
        {plans.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No plans yet. Pick a farm, go to checkout and choose "Use AssetPay".
          </p>
        ) : (
          plans.map((p) => {
            const next = nextInstallment(p);
            const paid = paidUsd(p);
            const pct = Math.round((paid / p.totalUsd) * 100);
            const st = next ? installmentStatus(next) : null;
            return (
              <Link key={p.id} to="/assetpay/$planId" params={{ planId: p.id }} className="block rounded-3xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground truncate">{p.purpose.assetName}</p>
                  <AgroBadge size="xs" tone={TONE[p.status]}>{p.status}</AgroBadge>
                </div>
                <p className="text-xs text-muted-foreground">{p.purpose.qty} × {p.purpose.unit} · {p.months} months</p>
                <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-agro" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">${paid.toLocaleString()} of ${p.totalUsd.toLocaleString()} · {pct}%</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
                {p.status === "active" && next && (
                  <div className="mt-2 flex items-center justify-between rounded-2xl bg-secondary px-3 py-2 text-xs">
                    <span className={st === "late" || st === "grace" ? "text-destructive" : "text-muted-foreground"}>
                      {st === "processing" ? "Payment being confirmed" : <>Next due <LocalTime at={next.dueAt} /></>}
                    </span>
                    <Money usd={amountDue(next)} layout="inline" size="sm" />
                  </div>
                )}
              </Link>
            );
          })
        )}
      </main>
    </MobileFrame>
  );
}

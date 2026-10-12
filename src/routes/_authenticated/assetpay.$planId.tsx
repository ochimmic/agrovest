import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroBadge } from "@/components/ui/agro-badge";
import { AgroButton } from "@/components/ui/agro-button";
import { LocalTime } from "@/components/ui/local-time";
import {
  CANCEL_FEE_PCT, amountDue, cancelPlan, installmentLabel, installmentStatus, nextInstallment, paidUsd, useAssetPay,
  type InstallmentStatus,
} from "@/lib/assetpay";

export const Route = createFileRoute("/_authenticated/assetpay/$planId")({
  head: () => ({
    meta: [
      { title: "Buy By Bit plan details | AgroVest" },
      { name: "description", content: "Track your AgroVest installment plan, due dates and payments." },
      { property: "og:title", content: "Buy By Bit plan details | AgroVest" },
      { property: "og:description", content: "See what's paid, what's next and pay your next installment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanDetail,
});

const ST: Record<InstallmentStatus, { label: string; tone: "neutral" | "warn" | "danger" | "violet" | "agro" }> = {
  upcoming: { label: "Upcoming", tone: "neutral" },
  due: { label: "Due soon", tone: "warn" },
  grace: { label: "Grace period", tone: "warn" },
  late: { label: "Late · +5%", tone: "danger" },
  processing: { label: "Confirming", tone: "violet" },
  paid: { label: "Paid", tone: "agro" },
};

function PlanDetail() {
  const { planId } = Route.useParams();
  const plan = useAssetPay((s) => s.plans.find((p) => p.id === planId));

  if (!plan) {
    return (
      <MobileFrame>
        <p className="m-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">This plan isn't on this device.</p>
      </MobileFrame>
    );
  }

  const paid = paidUsd(plan);
  const pct = Math.round((paid / plan.totalUsd) * 100);
  const next = nextInstallment(plan);
  const nextSt = next ? installmentStatus(next) : null;
  const canPay = plan.status === "active" && next && nextSt !== "processing";

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/assetpay" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><ArrowLeft size={18} /></Link>
        <h1 className="text-base font-semibold text-foreground">Plan details</h1>
      </header>
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop">
          <p className="text-xs text-white/60">{plan.purpose.qty} × {plan.purpose.unit} · {plan.months} months · {plan.depositPct}% down</p>
          <p className="mt-1 font-semibold">{plan.purpose.assetName}</p>
          <p className="mt-3 text-2xl font-semibold tabular">${paid.toLocaleString()} <span className="text-sm text-white/60">/ ${plan.totalUsd.toLocaleString()}</span></p>
          <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full bg-agro" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-[11px] text-white/60">{pct}% paid</p>
        </section>

        {plan.status === "completed" && (
          <p className="rounded-2xl bg-agro/10 border border-agro/30 p-3 text-xs text-foreground">
            Fully paid. Your holding has been created — find it in FarmVest, with documents in Documents.
          </p>
        )}
        {plan.status === "cancelled" && (
          <p className="rounded-2xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-foreground">
            Plan cancelled. {plan.cancelReason} Refund due: ${plan.refundUsd?.toLocaleString() ?? 0} (amount paid minus {CANCEL_FEE_PCT}% forfeiture). AgroVest will contact you.
          </p>
        )}
        {(nextSt === "grace" || nextSt === "late") && plan.status === "active" && (
          <p className="flex items-start gap-2 rounded-2xl bg-warn/10 border border-warn/30 p-3 text-xs text-foreground">
            <Bell size={14} className="mt-0.5" />
            {nextSt === "grace"
              ? "Reminder: your installment is past due. Pay within the 7-day grace period to avoid a 5% late fee."
              : "Your installment is late and a 5% fee has been added. Plans over 30 days late are cancelled."}
          </p>
        )}

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Schedule</h2>
          <ul className="mt-2 divide-y divide-border">
            {plan.installments.map((i) => {
              const st = ST[installmentStatus(i)];
              return (
                <li key={i.index} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <p className="text-foreground">{installmentLabel(i.index)}</p>
                    <p className="text-[11px] text-muted-foreground"><LocalTime at={i.paidAt ?? i.dueAt} /></p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground tabular">${amountDue(i).toLocaleString()}</p>
                    {i.orderId ? (
                      <Link to="/pay/$orderId" params={{ orderId: i.orderId }}><AgroBadge size="xs" tone={st.tone}>{st.label}</AgroBadge></Link>
                    ) : (
                      <AgroBadge size="xs" tone={st.tone}>{st.label}</AgroBadge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {plan.status === "active" && (
          <button
            type="button"
            className="w-full text-center text-xs text-destructive"
            onClick={() => {
              if (!confirm(`Cancel this plan? You'll be refunded what you've paid minus a ${CANCEL_FEE_PCT}% forfeiture.`)) return;
              cancelPlan(plan.id);
              toast.success("Plan cancelled");
            }}
          >
            Cancel plan
          </button>
        )}
      </main>
      {canPay && next && (
        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            to="/invest/checkout/$id"
            params={{ id: plan.purpose.assetId }}
            search={{ unit: plan.purpose.unit === "house" ? "plot" : plan.purpose.unit, qty: plan.purpose.qty, plan: plan.id, inst: next.index }}
          >
            <AgroButton size="xl">Pay {installmentLabel(next.index).toLowerCase()} · ${amountDue(next).toLocaleString()}</AgroButton>
          </Link>
        </div>
      )}
    </MobileFrame>
  );
}

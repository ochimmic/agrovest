import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Info } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { Money } from "@/components/ui/money";
import { farmAssets, priceFor } from "@/lib/mock-data";
import {
  CANCEL_AFTER_DAYS, CANCEL_FEE_PCT, GRACE_DAYS, LATE_FEE_PCT, MIN_DEPOSIT_PCT, PLAN_MONTHS,
  buildSchedule, createPlan, installmentLabel,
} from "@/lib/assetpay";

const search = z.object({
  unit: z.enum(["plot", "acre", "hectare"]).default("plot"),
  qty: z.coerce.number().min(0.5).default(1),
});

export const Route = createFileRoute("/_authenticated/assetpay/new/$id")({
  head: () => ({
    meta: [
      { title: "Set up a BuyByBit plan | AgroVest" },
      { name: "description", content: "Choose your deposit and plan length to own AgroVest farmland in installments." },
      { property: "og:title", content: "Set up a BuyByBit plan | AgroVest" },
      { property: "og:description", content: "From 10% down, balance over 3, 6 or 12 months." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: search,
  component: NewPlan,
});

function NewPlan() {
  const { id } = Route.useParams();
  const { unit, qty } = Route.useSearch();
  const nav = useNavigate();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0]!;
  const total = priceFor(unit, qty).final;
  const [deposit, setDeposit] = useState(20);
  const [months, setMonths] = useState<number>(6);
  const [agree, setAgree] = useState(false);
  const schedule = useMemo(() => buildSchedule(total, deposit, months), [total, deposit, months]);

  function start() {
    const plan = createPlan({
      purpose: { assetId: asset.id, assetName: asset.name, category: asset.category, unit, qty },
      totalUsd: total,
      depositPct: deposit,
      months,
    });
    void nav({ to: "/invest/checkout/$id", params: { id }, search: { unit, qty, plan: plan.id, inst: 0 } });
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/invest/checkout/$id" params={{ id }} search={{ unit, qty }} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><ArrowLeft size={18} /></Link>
        <h1 className="text-base font-semibold text-foreground">BuyByBit plan</h1>
      </header>
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Paying for</p>
          <p className="font-semibold text-foreground">{asset.name}</p>
          <p className="text-xs text-muted-foreground">{qty} × {unit}</p>
          <div className="mt-2"><Money usd={total} layout="inline" size="md" /></div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Deposit</h2>
            <span className="text-sm font-semibold text-violet tabular">{deposit}%</span>
          </div>
          <input
            type="range" min={MIN_DEPOSIT_PCT} max={90} step={5} value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--violet)]"
            aria-label="Deposit percentage"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Minimum {MIN_DEPOSIT_PCT}% · pay today: ${schedule[0]!.amountUsd.toLocaleString()}</p>

          <h2 className="mt-4 text-sm font-semibold text-foreground">Plan length</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PLAN_MONTHS.map((m) => (
              <button
                key={m} type="button" onClick={() => setMonths(m)}
                className={`rounded-2xl border py-2.5 text-sm font-medium ${m === months ? "border-violet bg-violet text-white" : "border-border text-foreground"}`}
              >
                {m} months
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Schedule</h2>
          <ul className="mt-2 divide-y divide-border text-sm">
            {schedule.map((i) => (
              <li key={i.index} className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  {installmentLabel(i.index)} · {i.index === 0 ? "today" : new Date(i.dueAt).toLocaleDateString()}
                </span>
                <span className="font-medium text-foreground tabular">${i.amountUsd.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-secondary p-3 text-[11px] text-muted-foreground space-y-1">
          <p className="flex items-center gap-1 font-medium text-foreground"><Info size={12} /> Plan terms</p>
          <p>• Holding, Contract of Sale and other documents are issued after the final payment.</p>
          <p>• Missed payment: {GRACE_DAYS}-day grace period with reminders, then a {LATE_FEE_PCT}% late fee.</p>
          <p>• Over {CANCEL_AFTER_DAYS} days overdue: plan is cancelled and {CANCEL_FEE_PCT}% of what you have paid is forfeited; the rest is refunded.</p>
        </div>
        <label className="flex items-start gap-2 text-xs text-foreground">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
          I agree to the BuyByBit plan terms, including the 30% forfeiture on cancellation or default.
        </label>
      </main>
      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" disabled={!agree} onClick={start}>
          Start plan · pay ${schedule[0]!.amountUsd.toLocaleString()} deposit
        </AgroButton>
      </div>
    </MobileFrame>
  );
}

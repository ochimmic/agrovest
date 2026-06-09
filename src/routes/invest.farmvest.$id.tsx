import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, FileText, TrendingUp } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { farmAssets, priceFor } from "@/lib/mock-data";
import { getState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/invest/farmvest/$id")({ component: Detail });

type Unit = "plot" | "acre" | "hectare";

function Detail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0];
  const [unit, setUnit] = useState<Unit>("plot");
  const [qty, setQty] = useState(1);

  const p = priceFor(unit, qty);

  function proceed() {
    if (getState().kyc !== "approved") {
      toast.warning("Verify your identity to continue.");
      nav({ to: "/kyc" });
      return;
    }
    nav({ to: "/invest/checkout/$id", params: { id: asset.id }, search: { unit, qty } as any });
  }

  return (
    <MobileFrame>
      <div className={`relative h-56 bg-gradient-to-br ${asset.cover}`}>
        <Link
          to="/invest/farmvest"
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full glass text-navy"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-xs opacity-80">{asset.location}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">{asset.name}</h1>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Pill k="Yield" v={asset.expectedYield} icon={<TrendingUp size={12} />} />
          <Pill k="Appreciation" v={asset.appreciation} />
          <Pill k="Risk" v={asset.risk} />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{asset.description}</p>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Choose unit</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["plot", "acre", "hectare"] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-xl py-2.5 text-xs font-medium capitalize transition ${
                  unit === u ? "bg-navy text-white" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            6 plots = 1 acre · 15 plots = 1 hectare · 2.5 acres = 1 hectare
          </p>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary p-3">
            <span className="text-sm font-medium text-navy">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-8 w-8 rounded-full bg-white text-navy shadow-card"
              >−</button>
              <span className="w-8 text-center text-sm font-semibold tabular">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="h-8 w-8 rounded-full bg-white text-navy shadow-card"
              >+</button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Price breakdown</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row k="Base amount" v={`$${p.base.toLocaleString()}`} />
            <Row k="Platform fee (2%)" v={`$${p.platformFee.toLocaleString()}`} />
            <Row k="Network fee" v={`$${p.networkFee.toLocaleString()}`} />
            {p.discount > 0 && (
              <Row k="Bundle discount" v={`− $${p.discount.toLocaleString()}`} accent />
            )}
            <div className="border-t border-border my-2" />
            <Row k="Final payable" v={`$${p.final.toLocaleString()}`} bold />
          </dl>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <FileText size={14} className="text-violet" /> Documents you'll receive
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Custody Receipt (asset proof)</li>
            <li>• Asset Contract (terms & ownership)</li>
          </ul>
        </section>

        <section className="rounded-3xl bg-violet-soft/50 border border-violet/20 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
            <ShieldCheck size={14} className="text-violet" /> Investment timeline
          </h3>
          <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
            {["Payment confirmed", "AgroVest review", "Documents issued", "Asset active", "Returns & appreciation updates"].map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet text-white text-[10px] font-semibold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        <p className="text-[10px] text-muted-foreground text-center">
          Projected values are estimates based on available asset information and market assumptions.
          Actual results may vary.
        </p>
      </main>

      <div className="border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold text-navy tabular">${p.final.toLocaleString()}</span>
        </div>
        <AgroButton size="xl" onClick={proceed}>Continue to checkout</AgroButton>
      </div>
    </MobileFrame>
  );
}

function Pill({ k, v, icon }: { k: string; v: string; icon?: any }) {
  return (
    <div className="rounded-2xl bg-card border border-border py-2.5 px-2">
      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">{icon}{k}</p>
      <p className="mt-1 text-xs font-semibold text-navy">{v}</p>
    </div>
  );
}
function Row({ k, v, bold, accent }: { k: string; v: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular ${bold ? "font-semibold text-navy" : accent ? "text-agro font-medium" : "text-navy"}`}>{v}</span>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { farmAssets, priceFor } from "@/lib/mock-data";
import { addHolding, addTx } from "@/lib/store";
import { Money } from "@/components/ui/money";
import { toast } from "sonner";


const search = z.object({
  unit: z.enum(["plot", "acre", "hectare"]).default("plot"),
  qty: z.coerce.number().min(1).default(1),
});

export const Route = createFileRoute("/invest/checkout/$id")({
  validateSearch: search,
  component: Checkout,
});

function Checkout() {
  const { id } = Route.useParams();
  const { unit, qty } = Route.useSearch();
  const nav = useNavigate();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0];
  const p = priceFor(unit, qty);
  const [paying, setPaying] = useState(false);

  function pay() {
    setPaying(true);
    setTimeout(() => {
      addHolding({
        assetId: asset.id, name: asset.name, category: asset.category,
        units: qty, unit, invested: p.final,
      });
      addTx({ type: "invest", amount: p.final, token: "USD", status: "confirmed", meta: asset.name });
      toast.success("Investment confirmed");
      nav({ to: "/invest/success/$id", params: { id: asset.id } });
    }, 1500);
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/invest/farmvest/$id" params={{ id }} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-navy">Secure checkout</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 space-y-4">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Investing in</p>
          <p className="mt-0.5 font-semibold text-navy">{asset.name}</p>
          <p className="text-xs text-muted-foreground">{qty} × {unit}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <RowM k="Base" usd={p.base} />
          <RowM k="Platform fee (3%)" usd={p.platformFee} />
          <RowM k="Network fee" usd={p.networkFee} />
          <RowM k="Escrow reserve (20%, held)" usd={p.escrowReserve} muted />
          {p.discount > 0 && <RowM k="Discount" usd={-p.discount} accent />}
          <div className="border-t border-border my-1" />
          <RowM k="Total" usd={p.final} bold />
        </div>


        <div className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-navy">Pay with</h2>
          <div className="mt-3 space-y-2">
            <PayOption label="$CLYST Wallet" sub="On Binance Smart Chain" active />
            <PayOption label="Card / Bank transfer" sub="Connect to fiat ramp" />
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-violet-soft/40 border border-violet/20 p-3 text-xs text-navy">
          <Lock size={14} className="mt-0.5 text-violet" />
          <p>End-to-end encrypted. You'll receive a Custody Receipt and Contract after confirmation.</p>
        </div>
      </main>

      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" onClick={pay} disabled={paying}>
          {paying ? "Confirming…" : `Confirm & pay $${p.final.toLocaleString()} · ≈ ₦${(p.final * 1550).toLocaleString()}`}
        </AgroButton>

      </div>
    </MobileFrame>
  );
}

function RowM({ k, usd, bold, accent, muted }: { k: string; usd: number; bold?: boolean; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <Money usd={usd} layout="inline" size={bold ? "md" : "sm"} emphasis={accent ? "agro" : muted ? "muted" : "primary"} />
    </div>
  );
}

function PayOption({ label, sub, active }: { label: string; sub: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 ${active ? "border-violet bg-violet-soft/30" : "border-border"}`}>
      <span className={`h-9 w-9 rounded-xl ${active ? "bg-violet text-white" : "bg-secondary text-muted-foreground"} flex items-center justify-center`}>
        {active ? <Check size={16} /> : null}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-navy">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Lock, Check, Info } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { Money } from "@/components/ui/money";
import { properties, propertyFees } from "@/lib/mock-data";
import { addHolding, addTx, getState } from "@/lib/store";
import { toast } from "sonner";


export const Route = createFileRoute("/invest/property/$id")({
  head: ({ params }) => {
    const p = properties.find((x) => x.id === params.id);
    const t = `${p?.title ?? "Property"} | AgroVest Buy Assets`;
    return { meta: [
      { title: t }, { name: "description", content: "AgroVest-priced house, 1% below market, with 3% escrow protection." },
      { property: "og:title", content: t }, { property: "og:description", content: "Buy houses through AgroVest with escrow protection." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const p = properties.find((x) => x.id === id) ?? properties[0];
  const [step, setStep] = useState<"detail" | "checkout">("detail");
  const [paying, setPaying] = useState(false);

  const fees = propertyFees(p.price);
  const { agrovest, escrow, total } = fees;


  function start() {
    if (getState().kyc !== "approved") {
      toast.warning("Verify your identity to continue.");
      nav({ to: "/kyc" });
      return;
    }
    setStep("checkout");
  }

  function pay() {
    setPaying(true);
    setTimeout(() => {
      addHolding({
        assetId: p.id,
        name: p.title,
        category: p.category as any,
        units: 1,
        unit: "plot",
        invested: total,
      });
      addTx({ type: "invest", amount: total, token: "USD", status: "confirmed", meta: p.title });
      toast.success("Purchase confirmed");
      nav({ to: "/invest/success/$id", params: { id: p.id }, search: { kind: "property" } as any });
    }, 1500);
  }

  return (
    <MobileFrame>
      <div className="relative h-56 bg-gradient-to-br from-navy/80 to-violet/80">
        <img src={p.image} alt={p.title} width={1024} height={640} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <button
          onClick={() => (step === "checkout" ? setStep("detail") : nav({ to: "/invest/property" }))}
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] h-10 w-10 rounded-full glass flex items-center justify-center text-navy"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-xs opacity-80">{p.category} · {p.location}</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">{p.title}</h1>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {step === "detail" ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Actual market price <span className="line-through">${p.price.toLocaleString()}</span></p>
              <p className="mt-1 text-[11px] font-medium text-agro">AgroVest price (1% less)</p>
              <Money usd={agrovest} size="xl" emphasis="violet" layout="inline" />
              <p className="text-xs text-muted-foreground mt-1">Listed by {p.vendor}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-navy">
                <ShieldCheck size={14} className={p.verified ? "text-agro" : "text-warn"} /> {p.verified ? "Verified — AgroVest has inspected this property" : "Not verified — AgroVest has not inspected this property yet"}
              </div>
              <div className="flex items-center gap-2 text-navy">
                <FileText size={14} className="text-violet" /> Ownership documents on file
              </div>
              <div className="flex items-center gap-2 text-navy">
                <AlertTriangle size={14} className="text-warn" /> Dispute & refund policy applies
              </div>
            </div>
            <section className="rounded-3xl border border-warn/30 bg-warn/10 p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-navy"><AlertTriangle size={14} className="text-warn" /> Disclaimer</h2>
              <p className="mt-1 text-xs text-foreground leading-relaxed">{p.disclaimer}</p>
            </section>
            <section className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-navy">What you'll receive</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Bill of sale & ownership transfer documents</li>
                <li>• Vendor warranty (where applicable)</li>
                <li>• AgroVest escrow protection until delivery</li>
              </ul>
            </section>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All listings undergo AgroVest verification. Funds are held in escrow until you confirm
              delivery and document handover.
            </p>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Purchasing</p>
              <p className="mt-0.5 font-semibold text-navy">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.vendor} · {p.location}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">Price breakdown</h3>
                
              </div>
              <RowM k="Actual market price" usd={p.price} muted />
              <RowM k="AgroVest price (1% less)" usd={agrovest} />
              <RowM k="Escrow (3%)" usd={escrow} />
              <div className="border-t border-border my-1" />
              <RowM k="Total payable" usd={total} bold />
              <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed">
                <Info size={11} className="mt-0.5 shrink-0" />
                The 3% escrow charge covers AgroVest holding your funds safely until you confirm
                handover of the property and its documents.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-navy">Pay with</h2>
              <div className="mt-3 space-y-2">
                <PayOption label="$CLYST Wallet" sub="On Binance Smart Chain" active />
                <PayOption label="Card / Bank transfer" sub="Connect to fiat ramp" />
                <PayOption label="Buy By Bit installments" sub="Pay small-small over 3, 6 or 12 months" />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-2xl bg-violet-soft/40 border border-violet/20 p-3 text-xs text-navy">
              <Lock size={14} className="mt-0.5 text-violet" />
              <p>Funds held in escrow. Released to vendor only after you confirm handover.</p>
            </div>
          </>
        )}
      </main>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border">
        {step === "detail" ? (
          <AgroButton size="xl" onClick={start}>
            Buy now · ${total.toLocaleString()} · ≈ ₦{Math.round(total * 1550).toLocaleString()}
          </AgroButton>
        ) : (
          <AgroButton size="xl" onClick={pay} disabled={paying}>
            {paying ? "Confirming…" : `Confirm & pay $${total.toLocaleString()} · ≈ ₦${Math.round(total * 1550).toLocaleString()}`}
          </AgroButton>
        )}
      </div>

    </MobileFrame>
  );
}

function RowM({ k, usd, bold, muted }: { k: string; usd: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <Money usd={usd} layout="inline" size={bold ? "md" : "sm"} emphasis={muted ? "muted" : "primary"} />
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

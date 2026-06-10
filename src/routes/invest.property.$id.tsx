import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Lock, Check } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { properties } from "@/lib/mock-data";
import { addHolding, addTx, getState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/invest/property/$id")({ component: PropertyDetail });

function PropertyDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const p = properties.find((x) => x.id === id) ?? properties[0];
  const [step, setStep] = useState<"detail" | "checkout">("detail");
  const [paying, setPaying] = useState(false);

  const platformFee = Math.round(p.price * 0.02);
  const networkFee = Math.round(p.price * 0.005);
  const total = p.price + platformFee + networkFee;

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
      <div className="relative h-52 bg-gradient-to-br from-navy/80 to-violet/80">
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
              <p className="text-xl font-semibold text-violet">${p.price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Listed by {p.vendor}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-navy">
                <ShieldCheck size={14} className="text-agro" /> Vendor {p.verified ? "verified" : "pending verification"} — {p.vendor}
              </div>
              <div className="flex items-center gap-2 text-navy">
                <FileText size={14} className="text-violet" /> Ownership documents on file
              </div>
              <div className="flex items-center gap-2 text-navy">
                <AlertTriangle size={14} className="text-warn" /> Dispute & refund policy applies
              </div>
            </div>
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
              <Row k="Asset price" v={`$${p.price.toLocaleString()}`} />
              <Row k="Platform fee (2%)" v={`$${platformFee.toLocaleString()}`} />
              <Row k="Escrow fee" v={`$${networkFee.toLocaleString()}`} />
              <div className="border-t border-border my-1" />
              <Row k="Total" v={`$${total.toLocaleString()}`} bold />
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
              <p>Funds held in escrow. Released to vendor only after you confirm handover.</p>
            </div>
          </>
        )}
      </main>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border">
        {step === "detail" ? (
          <AgroButton size="xl" onClick={start}>
            Buy now · ${p.price.toLocaleString()}
          </AgroButton>
        ) : (
          <AgroButton size="xl" onClick={pay} disabled={paying}>
            {paying ? "Confirming…" : `Confirm & pay $${total.toLocaleString()}`}
          </AgroButton>
        )}
      </div>
    </MobileFrame>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular ${bold ? "font-semibold text-navy" : "text-navy"}`}>{v}</span>
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

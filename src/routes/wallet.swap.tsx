import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownUp } from "lucide-react";
import { useState } from "react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { addTx } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet/swap")({ component: Swap });

function Swap() {
  const [from, setFrom] = useState("BNB");
  const [to, setTo] = useState("CLYST");
  const [amt, setAmt] = useState("");
  const rate = 0.0024;
  const out = amt ? (parseFloat(amt) / rate).toFixed(2) : "0.00";

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vault" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">Swap</h1>
      </header>
      <div className="flex-1 p-4 space-y-3">
        <div className="rounded-3xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">From</p>
          <div className="mt-2 flex items-center gap-3">
            <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.0" className="flex-1 bg-transparent text-2xl font-semibold text-navy outline-none tabular" />
            <button className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">{from}</button>
          </div>
        </div>
        <div className="relative flex justify-center -my-2">
          <button onClick={() => { setFrom(to); setTo(from); }} className="rounded-full bg-violet text-white h-9 w-9 flex items-center justify-center shadow-glow">
            <ArrowDownUp size={14} />
          </button>
        </div>
        <div className="rounded-3xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">To</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex-1 text-2xl font-semibold text-navy tabular">{out}</span>
            <button className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">{to}</button>
          </div>
        </div>
        <div className="rounded-2xl bg-violet-soft/40 p-3 text-xs text-navy space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span>1 BNB = 416.66 $CLYST</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Network fee</span><span>~$0.12</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Slippage</span><span>0.5%</span></div>
        </div>
      </div>
      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" onClick={() => { addTx({ type: "swap", amount: parseFloat(out) || 0, token: to, status: "confirmed", hash: "0x" + Math.random().toString(16).slice(2, 10) }); toast.success("Swap confirmed"); }}>
          Swap
        </AgroButton>
      </div>
    </MobileFrame>
  );
}

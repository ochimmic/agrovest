import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Calculator } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { convertLand, landPrice, toPlots, type LandUnit } from "@/lib/pricing";
import { yieldPctForYear } from "@/lib/yield-schedule";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Land calculator — plots, acres, hectares | AgroVest" },
      { name: "description", content: "Convert plots, acres and hectares and see FarmVest prices, discounts, management fees and yearly ROI." },
      { property: "og:title", content: "AgroVest land calculator" },
      { property: "og:description", content: "6 plots = 1 acre, 2.5 acres = 1 hectare. See price and ROI instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calc,
});

const ngn = (n: number) => `₦${Math.round(n).toLocaleString()}`;
const fmt = (n: number) => Number(n.toFixed(2)).toLocaleString();

function Calc() {
  const [unit, setUnit] = useState<LandUnit>("plot");
  const [qty, setQty] = useState("1");
  const q = Math.max(0, Number(qty) || 0);
  const plots = toPlots(unit, q);
  const c = convertLand(plots);
  const p = landPrice(unit, q);
  const tooBig = c.hectares > 100;
  const roi = [3, 4, 5].map((y) => ({ y, pct: yieldPctForYear(y), amt: p.landNgn * yieldPctForYear(y) }));

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/invest/farmvest" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><ArrowLeft size={18} /></Link>
        <h1 className="flex items-center gap-2 text-base font-semibold text-foreground"><Calculator size={16} /> Land calculator</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(["plot", "acre", "hectare"] as LandUnit[]).map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)}
                className={`rounded-xl py-2.5 text-xs font-medium capitalize ${unit === u ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {u}s
              </button>
            ))}
          </div>
          <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-lg font-semibold text-foreground" />
          <p className="text-[11px] text-muted-foreground">6 plots = 1 acre · 2.5 acres = 1 hectare</p>
        </section>

        <section className="grid grid-cols-3 gap-2 text-center">
          {[["Plots", c.plots], ["Acres", c.acres], ["Hectares", c.hectares]].map(([k, v]) => (
            <div key={k as string} className="rounded-2xl border border-border bg-card p-3">
              <p className="text-lg font-semibold text-foreground tabular">{fmt(v as number)}</p>
              <p className="text-[11px] text-muted-foreground">{k}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-foreground">Price</h2>
          <Row k="Land (₦950,000 / plot)" v={ngn(p.landNgn)} />
          <Row k={`Discount (${p.discountPct}%)`} v={`−${ngn(p.discountNgn)}`} />
          <Row k="Management fee (₦200,000 / plot, non-refundable)" v={ngn(p.mgmtNgn)} />
          <div className="border-t border-border" />
          <Row k="Total" v={ngn(p.totalNgn)} bold />
          {tooBig && <p className="text-[11px] text-destructive">Maximum purchase is 100 hectares.</p>}
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-foreground">Projected annual ROI (on land value)</h2>
          {roi.map((r) => (
            <Row key={r.y} k={`Year ${r.y}${r.y === 5 ? "+" : ""} · ${r.pct * 100}%`} v={ngn(r.amt)} />
          ))}
          <p className="text-[10px] text-muted-foreground">Market projections, not guaranteed. Maturity begins between the 3rd and 4th year.</p>
        </section>

        <Link to="/invest/farmvest" className="block rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground">Explore farms</Link>
      </main>
    </MobileFrame>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular text-foreground ${bold ? "font-semibold" : ""}`}>{v}</span>
    </div>
  );
}

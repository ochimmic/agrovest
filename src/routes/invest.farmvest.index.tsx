import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { farmAssets } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { Search, Sprout, TrendingUp, Wallet, PieChart, ArrowUpRight } from "lucide-react";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/invest/farmvest/")({ component: FarmVest });

const cats = [
  { id: "all", label: "All" },
  { id: "palm", label: "Palm" },
  { id: "cocoa", label: "Cocoa" },
  { id: "latex", label: "Latex" },
] as const;

function FarmVest() {
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const holdings = useAppState((s) => s.holdings);

  const dash = useMemo(() => {
    const farmHoldings = holdings; // all holdings are farm in this prototype
    const invested = farmHoldings.reduce((sum, h) => sum + h.invested, 0);
    const plots = farmHoldings.reduce((sum, h) => {
      const factor = h.unit === "plot" ? 1 : h.unit === "acre" ? 6 : 15;
      return sum + h.units * factor;
    }, 0);
    const projected = Math.round(invested * 0.105); // ~10.5% blended yield
    const byCat = farmHoldings.reduce<Record<string, number>>((acc, h) => {
      acc[h.category] = (acc[h.category] ?? 0) + h.invested;
      return acc;
    }, {});
    return { count: farmHoldings.length, invested, plots, projected, byCat };
  }, [holdings]);

  const list = farmAssets.filter(
    (a) => (cat === "all" || a.category === cat) && a.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell>
      <div className="px-4 pt-3 pb-6">
        <h1 className="text-2xl font-semibold text-navy">FarmVest</h1>
        <p className="text-sm text-muted-foreground">
          Tokenized farm assets with custody receipt + contract.
        </p>

        {/* Portfolio dashboard */}
        <section className="mt-4 rounded-3xl bg-gradient-to-br from-navy to-[oklch(0.22_0.07_268)] text-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">FarmVest portfolio</p>
              <p className="mt-1 text-2xl font-semibold">${dash.invested.toLocaleString()}</p>
              <p className="text-[11px] text-white/70">across {dash.count} holding{dash.count === 1 ? "" : "s"}</p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-white/10 grid place-items-center">
              <PieChart size={20} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <DashStat icon={<Sprout size={14} />} k="Plots" v={dash.plots.toString()} />
            <DashStat icon={<TrendingUp size={14} />} k="Proj. /yr" v={`$${dash.projected.toLocaleString()}`} />
            <DashStat icon={<Wallet size={14} />} k="Assets" v={Object.keys(dash.byCat).length.toString()} />
          </div>

          {dash.count > 0 && (
            <Link
              to="/portfolio"
              className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-xs"
            >
              <span>View full portfolio</span>
              <ArrowUpRight size={14} />
            </Link>
          )}
        </section>

        {dash.count > 0 && (
          <section className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Your holdings</h2>
              <Link to="/portfolio" className="text-[11px] text-agro font-medium">See all</Link>
            </div>
            <div className="mt-2 space-y-2">
              {holdings.slice(0, 3).map((h) => {
                const asset = farmAssets.find((a) => a.id === h.assetId);
                return (
                  <div key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${asset?.cover ?? "from-agro to-emerald-700"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{h.name}</p>
                      <p className="text-[11px] text-muted-foreground">{h.units} {h.unit}{h.units > 1 ? "s" : ""} · {asset?.expectedYield ?? "—"}</p>
                    </div>
                    <p className="text-sm font-semibold text-navy">${h.invested.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <h2 className="mt-6 text-sm font-semibold text-navy">Explore farms</h2>



        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 h-11">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search farms"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-3.5 h-9 text-xs font-medium transition ${
                cat === c.id ? "bg-navy text-white" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.map((a) => (
            <Link
              key={a.id}
              to="/invest/farmvest/$id"
              params={{ id: a.id }}
              className="block rounded-3xl border border-border bg-card overflow-hidden shadow-card"
            >
              <div className={`h-32 bg-gradient-to-br ${a.cover} relative`}>
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[oklch(0.27_0.07_268)]">
                    {a.status}
                  </span>
                  <span className="rounded-full bg-agro/90 px-2 py-0.5 text-[10px] font-medium text-white">
                    {a.risk}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-navy">{a.name}</p>
                <p className="text-[11px] text-muted-foreground">{a.location}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <Stat k="Yield" v={a.expectedYield} accent />
                  <Stat k="Apprec." v={a.appreciation} />
                  <Stat k="Plot" v={`$${a.pricePerPlot}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-secondary py-2">
      <p className="text-muted-foreground text-[10px]">{k}</p>
      <p className={`mt-0.5 font-semibold ${accent ? "text-agro" : "text-navy"}`}>{v}</p>
    </div>
  );
}

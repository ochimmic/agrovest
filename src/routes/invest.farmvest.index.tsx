import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { farmAssets } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import {
  Search,
  Sprout,
  TrendingUp,
  Wallet,
  PieChart,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Receipt,
  FileText,
} from "lucide-react";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/invest/farmvest/")({ component: FarmVest });

const cats = [
  { id: "all", label: "All" },
  { id: "palm", label: "Palm" },
  { id: "cocoa", label: "Cocoa" },
  { id: "latex", label: "Latex" },
] as const;

const ranges = [
  { id: "1M", days: 30 },
  { id: "6M", days: 182 },
  { id: "YTD", days: ytdDays() },
  { id: "1Y", days: 365 },
] as const;

function ytdDays() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.max(1, Math.round((+now - +start) / 86400000));
}

// Deterministic pseudo-random walk for projected yield (so it doesn't jump per render)
function genSeries(principal: number, days: number, apr = 0.105) {
  const pts = Math.min(60, Math.max(12, Math.round(days / 6)));
  const daily = apr / 365;
  const arr: number[] = [];
  let v = principal;
  for (let i = 0; i < pts; i++) {
    const drift = principal * daily * (days / pts);
    const wobble = Math.sin(i * 1.7) * principal * 0.004 + Math.cos(i * 0.9) * principal * 0.003;
    v += drift + wobble;
    arr.push(v);
  }
  return arr;
}

function FarmVest() {
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [range, setRange] = useState<(typeof ranges)[number]["id"]>("6M");
  const holdings = useAppState((s) => s.holdings);

  const dash = useMemo(() => {
    const invested = holdings.reduce((s, h) => s + h.invested, 0);
    const plots = holdings.reduce((s, h) => {
      const f = h.unit === "plot" ? 1 : h.unit === "acre" ? 6 : 15;
      return s + h.units * f;
    }, 0);
    const projected = Math.round(invested * 0.105);
    const byCat = holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.category] = (acc[h.category] ?? 0) + h.invested;
      return acc;
    }, {});
    return { count: holdings.length, invested, plots, projected, byCat };
  }, [holdings]);

  const series = useMemo(() => {
    const days = ranges.find((r) => r.id === range)!.days;
    const principal = Math.max(dash.invested, 1000); // demo line if no holdings
    return genSeries(principal, days);
  }, [range, dash.invested]);

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
        <section className="mt-4 rounded-3xl bg-gradient-to-br from-[oklch(0.24_0.06_268)] to-[oklch(0.16_0.05_275)] text-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/60">FarmVest portfolio</p>
              <p className="mt-1 text-2xl font-semibold">${dash.invested.toLocaleString()}</p>
              <p className="text-[11px] text-white/70">
                across {dash.count} holding{dash.count === 1 ? "" : "s"}
              </p>
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

          {/* Yield chart */}
          <div className="mt-4 rounded-2xl bg-white/10 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/70">Projected yield · {range}</p>
              <p className="text-[11px] font-medium text-emerald-300">
                +${Math.max(0, Math.round(series[series.length - 1] - series[0])).toLocaleString()}
              </p>
            </div>
            <YieldChart data={series} />
            <div className="mt-2 flex gap-1.5">
              {ranges.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition ${
                    range === r.id ? "bg-white text-[oklch(0.27_0.07_268)]" : "bg-white/5 text-white/70"
                  }`}
                >
                  {r.id}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <QuickAction
              onClick={() => {
                document.getElementById("explore-farms")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              label="Invest"
              icon={<Plus size={16} />}
            />
            <QuickAction to="/wallet/swap" label="Swap" icon={<RefreshCw size={16} />} />
            <QuickAction to="/wallet/history" label="Txns" icon={<Receipt size={16} />} />
            <QuickAction
              to={dash.count > 0 ? "/invest/farmvest/holding/$hid" : "/invest/farmvest"}
              params={dash.count > 0 ? { hid: holdings[0].id } : undefined}
              label="Docs"
              icon={<FileText size={16} />}
            />
          </div>

        </section>

        {dash.count > 0 && (
          <section className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Your holdings</h2>
              <Link to="/wallet/history" className="text-[11px] text-agro font-medium">
                See all
              </Link>
            </div>
            <div className="mt-2 space-y-2">
              {holdings.slice(0, 4).map((h) => {
                const asset = farmAssets.find((a) => a.id === h.assetId);
                return (
                  <Link
                    key={h.id}
                    to="/invest/farmvest/holding/$hid"
                    params={{ hid: h.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <div
                      className={`h-10 w-10 rounded-xl bg-gradient-to-br ${
                        asset?.cover ?? "from-agro to-emerald-700"
                      } bg-cover bg-center`}
                      style={asset?.image ? { backgroundImage: `url(${asset.image})` } : undefined}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{h.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {h.units} {h.unit}
                        {h.units > 1 ? "s" : ""} · {asset?.expectedYield ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-navy">
                        ${h.invested.toLocaleString()}
                      </p>
                      <ArrowUpRight size={14} className="ml-auto text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <h2 className="mt-6 text-sm font-semibold text-navy">Explore farms</h2>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 h-11">
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
                cat === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.map((a) => {
            const cs = a.comingSoon;
            const Card = (
              <div className={`block rounded-3xl border border-border bg-card overflow-hidden shadow-card ${cs ? "opacity-95" : ""}`}>
                <div className={`h-32 bg-gradient-to-br ${a.cover} relative bg-cover bg-center`} style={a.image ? { backgroundImage: `url(${a.image})` } : undefined}>
                  {a.image && <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[oklch(0.27_0.07_268)]">
                      {a.status}
                    </span>
                    {!cs && (
                      <span className="rounded-full bg-agro/90 px-2 py-0.5 text-[10px] font-medium text-white">
                        {a.risk}
                      </span>
                    )}
                  </div>
                  {cs && (
                    <div className="absolute inset-0 bg-[oklch(0.16_0.05_275)]/55 backdrop-blur-[1px] grid place-items-center">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[oklch(0.27_0.07_268)]">
                        {a.launchEta ? `Coming ${a.launchEta}` : "Coming soon"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-navy">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.location}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <Stat k="Yield" v={a.expectedYield} accent />
                    <Stat k="Apprec." v={a.appreciation} />
                    <Stat k="Plot" v={`$${a.pricePerPlot}`} />
                  </div>
                  {cs && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); import("sonner").then(({ toast }) => toast.success(`We'll notify you when ${a.name} opens.`)); }}
                      className="mt-3 w-full rounded-2xl bg-violet text-white text-xs font-medium py-2.5"
                    >
                      Notify me when it launches
                    </button>
                  )}
                </div>
              </div>
            );
            return cs ? (
              <div key={a.id}>{Card}</div>
            ) : (
              <Link key={a.id} to="/invest/farmvest/$id" params={{ id: a.id }}>
                {Card}
              </Link>
            );
          })}
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

function DashStat({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-2.5">
      <div className="flex items-center gap-1 text-white/70 text-[10px]">
        {icon}
        <span>{k}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{v}</p>
    </div>
  );
}

function QuickAction({
  to,
  params,
  onClick,
  label,
  icon,
}: {
  to?: string;
  params?: Record<string, string>;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  const className =
    "flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/10 py-3 text-white text-[11px] font-medium hover:bg-white/15 transition";
  const inner = (
    <>
      <span className="h-8 w-8 grid place-items-center rounded-full bg-white/15">{icon}</span>
      {label}
    </>
  );
  if (to) {
    return (
      <Link to={to as any} params={params as any} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}


function YieldChart({ data }: { data: number[] }) {
  const w = 300;
  const h = 90;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / span) * (h - 8) - 4] as const);
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-20 w-full">
      <defs>
        <linearGradient id="yg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(110 231 183)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="rgb(110 231 183)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#yg)" />
      <path d={path} fill="none" stroke="rgb(110 231 183)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

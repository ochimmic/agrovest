import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import {
  Shield,
  FileCheck,
  Store,
  AlertTriangle,
  Award,
  Gift,
  Megaphone,
  ScrollText,
  ChevronRight,
  Users,
  TrendingUp,
  Wallet,
  Building2,
  ArrowUpRight,
  Bell,
} from "lucide-react";
import { usePayments } from "@/lib/payments";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/admin/")({ component: Admin });

const queues = [
  {
    to: "/admin/payments",
    icon: Wallet,
    label: "Payments",
    desc: "Confirm wallet purchases & bank deposits",
    count: 0,
    tone: "from-agro to-emerald-700",
  },
  {
    to: "/admin/kyc",
    icon: FileCheck,
    label: "KYC review",
    desc: "Verify investor & broker identity",
    count: 24,
    tone: "from-violet to-[oklch(0.55_0.18_295)]",
  },
  {
    to: "/admin/vendors",
    icon: Store,
    label: "Vendor approvals",
    desc: "Marketplace storefront requests",
    count: 8,
    tone: "from-agro to-emerald-700",
  },
  {
    to: "/admin/consultants",
    icon: Megaphone,
    label: "Consultant cert",
    desc: "Certify investor consultants",
    count: 3,
    tone: "from-violet to-[oklch(0.55_0.18_295)]",
  },
  {
    to: "/admin/disputes",
    icon: AlertTriangle,
    label: "Disputes",
    desc: "Open escalations & refunds",
    count: 5,
    tone: "from-[oklch(0.65_0.2_25)] to-[oklch(0.55_0.22_27)]",
  },
  {
    to: "/admin/rewards",
    icon: Gift,
    label: "Broker rewards",
    desc: "Approve milestone payouts",
    count: 12,
    tone: "from-agro to-emerald-700",
  },
  {
    to: "/admin/partners",
    icon: Award,
    label: "Partner approvals",
    desc: "Promote to partner tier",
    count: 2,
    tone: "from-violet to-[oklch(0.55_0.18_295)]",
  },
  {
    to: "/admin/audit",
    icon: ScrollText,
    label: "Audit logs",
    desc: "Operations activity trail",
    count: 0,
    tone: "from-[oklch(0.40_0.04_265)] to-[oklch(0.28_0.04_265)]",
  },
] as const;

// Mock growth series (last 12 weeks)
const usersSeries = [820, 905, 980, 1120, 1240, 1390, 1525, 1680, 1840, 2010, 2230, 2475];
const investSeries = [42, 51, 60, 58, 74, 88, 95, 110, 124, 138, 152, 171]; // $k weekly
const txSeries = [180, 220, 260, 245, 310, 360, 395, 430, 480, 540, 610, 685];

const kpis = [
  {
    icon: Users,
    label: "App users",
    value: "12,487",
    delta: "+8.4%",
    series: usersSeries,
    tone: "text-violet",
    fill: "oklch(0.55 0.18 295)",
  },
  {
    icon: TrendingUp,
    label: "Investments",
    value: "3,942",
    delta: "+12.1%",
    series: investSeries,
    tone: "text-agro",
    fill: "oklch(0.62 0.16 150)",
  },
  {
    icon: Wallet,
    label: "AUM (cUSD)",
    value: "$8.42M",
    delta: "+5.7%",
    series: investSeries.map((v) => v * 11),
    tone: "text-agro",
    fill: "oklch(0.62 0.16 150)",
  },
  {
    icon: Building2,
    label: "Active vendors",
    value: "342",
    delta: "+3.2%",
    series: [210, 218, 226, 235, 248, 261, 274, 288, 301, 315, 328, 342],
    tone: "text-violet",
    fill: "oklch(0.55 0.18 295)",
  },
] as const;

type Range = "4W" | "12W" | "YTD";

type CrosshairCtx = {
  index: number | null;
  setIndex: (i: number | null) => void;
  length: number;
};
const CrosshairContext = createContext<CrosshairCtx>({
  index: null,
  setIndex: () => {},
  length: 0,
});

function PaymentAlerts() {
  const alerts = usePayments((s) =>
    s.orders.filter((o) => o.status === "payment_notified" || o.status === "paid_onchain"),
  );
  if (alerts.length === 0) return null;
  return (
    <Link
      to="/admin/payments"
      className="block rounded-2xl border border-violet/30 bg-violet-soft/40 p-4"
    >
      <div className="flex items-center gap-2">
        <Bell size={15} className="text-violet" />
        <p className="text-sm font-semibold text-foreground">
          New payment{alerts.length > 1 ? "s" : ""} pending review ({alerts.length})
        </p>
        <ChevronRight size={14} className="ml-auto text-muted-foreground" />
      </div>
      <ul className="mt-2 space-y-1">
        {alerts.slice(0, 3).map((o) => (
          <li key={o.id} className="text-[11px] text-foreground">
            <span className="font-semibold">#{o.reference}</span> · {o.payerName ?? "AgroVest user"} · $
            {o.amountUsd.toLocaleString()}
          </li>
        ))}
      </ul>
    </Link>
  );
}

function Admin() {
  const navigate = useNavigate();
  // Auto-redirect to the wide desktop console on large viewports
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const go = () => {
      if (mq.matches) navigate({ to: "/admin/desktop", replace: true });
    };
    go();
    mq.addEventListener("change", go);
    return () => mq.removeEventListener("change", go);
  }, [navigate]);

  const totalPending = queues.reduce((s, q) => s + q.count, 0);
  const slas = queues.filter((q) => q.count > 5).length;
  const [range, setRange] = useState<Range>("12W");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  // Length of currently-displayed series (all kpis use same window length)
  const length = sliceSeries(usersSeries, range).length;

  // Simulate fetch latency on range switch + reset crosshair
  useEffect(() => {
    setLoading(true);
    setIndex(null);
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [range]);

  return (
    <MobileFrame>
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-5 gradient-navy text-white">
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="h-9 w-9 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center justify-center"
            aria-label="Back"
          >
            ←
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/60">Operations</p>
            <h1 className="font-semibold flex items-center gap-1.5">
              <Shield size={14} /> Admin dashboard
            </h1>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat k="Pending" v={totalPending.toString()} />
          <Stat k="At risk" v={slas.toString()} />
          <Stat k="Resolved 24h" v="17" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <PaymentAlerts />
        <CrosshairContext.Provider value={{ index, setIndex, length }}>
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Growth
              </h2>
              <div className="flex gap-1 rounded-full bg-secondary p-0.5">
                {(["4W", "12W", "YTD"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-[10px] font-semibold px-2 h-6 rounded-full transition ${
                      range === r
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {kpis.map((k) =>
                loading ? (
                  <KpiSkeleton key={k.label} />
                ) : (
                  <KpiCard key={k.label} {...k} range={range} />
                ),
              )}
            </div>

            {loading ? <TrendSkeleton /> : <TrendCard range={range} />}
          </section>
        </CrosshairContext.Provider>

        <section className="space-y-2.5">
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
            Queues
          </h2>
          {queues.map(({ to, icon: I, label, desc, count, tone }) => (
            <Link
              key={to}
              to={to as any}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3 shadow-card hover:border-violet/40 transition"
            >
              <span
                className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shrink-0`}
              >
                <I size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy truncate">{label}</p>
                  {count > 0 && (
                    <span className="rounded-full bg-violet text-white text-[10px] px-2 py-0.5 font-semibold">
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          ))}
        </section>
      </div>
    </MobileFrame>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-2.5">
      <p className="text-[10px] text-white/60 uppercase tracking-wide">{k}</p>
      <p className="mt-0.5 text-base font-semibold">{v}</p>
    </div>
  );
}

function sliceSeries(s: readonly number[], range: Range) {
  if (range === "4W") return s.slice(-4);
  if (range === "12W") return s.slice(-12);
  return s;
}

function formatValue(label: string, n: number) {
  if (label.includes("AUM")) return `$${(n / 1000).toFixed(2)}M`;
  return n.toLocaleString();
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  series,
  tone,
  fill,
  range,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  delta: string;
  series: readonly number[];
  tone: string;
  fill: string;
  range: Range;
}) {
  const data = sliceSeries(series, range);
  const { index } = useContext(CrosshairContext);
  const hovered = index !== null && index < data.length ? data[index] : null;

  return (
    <article className="rounded-2xl bg-card border border-border p-3 shadow-card">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={tone} />
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </p>
      </div>
      <p className="mt-1 text-lg font-bold text-navy tabular-nums">
        {hovered !== null ? formatValue(label, hovered) : value}
      </p>
      <div className="flex items-center justify-between gap-1">
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-agro">
          <ArrowUpRight size={10} />
          {delta}
        </span>
        <Sparkline values={data} stroke={fill} />
      </div>
    </article>
  );
}

function Sparkline({ values, stroke }: { values: readonly number[]; stroke: string }) {
  const { index } = useContext(CrosshairContext);
  const w = 70;
  const h = 22;
  const path = useMemo(() => {
    if (values.length === 0) return { line: "", area: "", pts: [] as [number, number][] };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = w / Math.max(1, values.length - 1);
    const pts = values.map((v, i) => [i * step, h - ((v - min) / range) * h] as [number, number]);
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${w},${h} L0,${h} Z`;
    return { line, area, pts };
  }, [values]);

  const dot = index !== null && index < path.pts.length ? path.pts[index] : null;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={path.area} fill={stroke} opacity="0.15" />
      <path d={path.line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {dot && (
        <circle cx={dot[0]} cy={dot[1]} r="2.2" fill={stroke} stroke="white" strokeWidth="1" />
      )}
    </svg>
  );
}

function KpiSkeleton() {
  return (
    <article className="rounded-2xl bg-card border border-border p-3 shadow-card">
      <div className="h-3 w-16 rounded bg-secondary animate-pulse" />
      <div className="mt-2 h-5 w-20 rounded bg-secondary animate-pulse" />
      <div className="mt-2 flex items-center justify-between">
        <div className="h-2.5 w-10 rounded bg-secondary animate-pulse" />
        <div className="h-5 w-[70px] rounded bg-secondary animate-pulse" />
      </div>
    </article>
  );
}

function TrendSkeleton() {
  return (
    <article className="rounded-2xl bg-card border border-border p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 w-40 rounded bg-secondary animate-pulse" />
          <div className="h-2.5 w-28 rounded bg-secondary animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-2.5 w-12 rounded bg-secondary animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-secondary animate-pulse" />
        </div>
      </div>
      <div className="mt-3 h-32 rounded-xl bg-secondary animate-pulse" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-10 rounded-xl bg-secondary animate-pulse" />
        <div className="h-10 rounded-xl bg-secondary animate-pulse" />
      </div>
    </article>
  );
}

function TrendCard({ range }: { range: Range }) {
  const users = sliceSeries(usersSeries, range);
  const tx = sliceSeries(txSeries, range);
  const maxU = Math.max(...users);
  const maxT = Math.max(...tx);
  const { index } = useContext(CrosshairContext);

  return (
    <article className="rounded-2xl bg-card border border-border p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">Users vs Transactions</p>
          <p className="text-[11px] text-muted-foreground">
            {index !== null
              ? `Week ${index + 1} of ${users.length}`
              : `Weekly active growth · ${range}`}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-[10px]">
          <Legend
            color="oklch(0.55 0.18 295)"
            label="Users"
            value={index !== null ? users[index]?.toLocaleString() : undefined}
          />
          <Legend
            color="oklch(0.62 0.16 150)"
            label="Tx"
            value={index !== null ? tx[index]?.toLocaleString() : undefined}
          />
        </div>
      </div>

      <div className="mt-3">
        <DualAreaChart users={users} tx={tx} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Peak users / wk" value={maxU.toLocaleString()} tone="text-violet" />
        <MiniMetric label="Peak tx / wk" value={maxT.toLocaleString()} tone="text-agro" />
      </div>
    </article>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
      {value ? <span className="font-semibold text-navy ml-0.5">{value}</span> : null}
    </span>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </p>
      <p className={`text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function DualAreaChart({ users, tx }: { users: readonly number[]; tx: readonly number[] }) {
  const w = 320;
  const h = 120;
  const pad = 4;
  const { index, setIndex } = useContext(CrosshairContext);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const build = (vals: readonly number[]) => {
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = (w - pad * 2) / Math.max(1, vals.length - 1);
    const pts = vals.map(
      (v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)] as [number, number],
    );
    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
      .join(" ");
    const area = `${line} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
    return { line, area, pts };
  };

  const u = build(users);
  const t = build(tx);
  const n = users.length;
  const step = (w - pad * 2) / Math.max(1, n - 1);

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const xInVb = ratio * w - pad;
    const i = Math.round(xInVb / step);
    setIndex(Math.max(0, Math.min(n - 1, i)));
  };

  const cx = index !== null ? pad + index * step : null;
  const tipX = cx !== null ? Math.max(40, Math.min(w - 40, cx)) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-32 touch-none select-none"
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseLeave={() => setIndex(null)}
      onTouchStart={(e) => handleMove(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={() => setIndex(null)}
    >
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={pad}
          x2={w - pad}
          y1={h * g}
          y2={h * g}
          stroke="currentColor"
          className="text-border"
          strokeWidth="0.5"
        />
      ))}
      <path d={u.area} fill="oklch(0.55 0.18 295)" opacity="0.18" />
      <path d={t.area} fill="oklch(0.62 0.16 150)" opacity="0.18" />
      <path
        d={u.line}
        fill="none"
        stroke="oklch(0.55 0.18 295)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={t.line}
        fill="none"
        stroke="oklch(0.62 0.16 150)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {cx !== null && index !== null && (
        <g>
          <line
            x1={cx}
            x2={cx}
            y1={pad}
            y2={h - pad}
            stroke="currentColor"
            className="text-muted-foreground"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <circle cx={u.pts[index][0]} cy={u.pts[index][1]} r="3" fill="oklch(0.55 0.18 295)" stroke="white" strokeWidth="1.2" />
          <circle cx={t.pts[index][0]} cy={t.pts[index][1]} r="3" fill="oklch(0.62 0.16 150)" stroke="white" strokeWidth="1.2" />
          <g transform={`translate(${tipX - 36}, 2)`}>
            <rect width="72" height="18" rx="4" className="fill-card stroke-border" strokeWidth="0.5" />
            <text x="36" y="12" textAnchor="middle" className="fill-foreground" fontSize="9" fontWeight="600">
              Wk {index + 1} / {n}
            </text>
          </g>
        </g>
      )}

      {/* invisible hit areas for keyboard-less precision on touch (improves edge hits) */}
      <rect x="0" y="0" width={w} height={h} fill="transparent" />
    </svg>
  );
}


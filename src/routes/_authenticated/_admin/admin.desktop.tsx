import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Shield,
  LayoutDashboard,
  FileCheck,
  Store,
  Megaphone,
  AlertTriangle,
  Gift,
  Award,
  ScrollText,
  Users,
  TrendingUp,
  Wallet,
  Building2,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Monitor,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  CircleDollarSign,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/_authenticated/_admin/admin/desktop")({ component: DesktopAdmin });

/* ---------------------------------------------------------- */
/* Viewport gate                                              */
/* ---------------------------------------------------------- */
function useIsDesktop(min = 1024) {
  const [ok, setOk] = useState<boolean>(() =>
    typeof window === "undefined" ? true : window.innerWidth >= min,
  );
  useEffect(() => {
    const onR = () => setOk(window.innerWidth >= min);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [min]);
  return ok;
}

/* ---------------------------------------------------------- */
/* Mock data                                                  */
/* ---------------------------------------------------------- */
const usersSeries = [820, 905, 980, 1120, 1240, 1390, 1525, 1680, 1840, 2010, 2230, 2475];
const investSeries = [42, 51, 60, 58, 74, 88, 95, 110, 124, 138, 152, 171];
const txSeries = [180, 220, 260, 245, 310, 360, 395, 430, 480, 540, 610, 685];
const aumSeries = investSeries.map((v) => v * 11);
const vendorSeries = [210, 218, 226, 235, 248, 261, 274, 288, 301, 315, 328, 342];

type Section =
  | "overview"
  | "users"
  | "kyc"
  | "investments"
  | "vendors"
  | "consultants"
  | "disputes"
  | "rewards"
  | "partners"
  | "transactions"
  | "audit";

const NAV: { id: Section; label: string; icon: LucideIcon; group: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Insights" },
  { id: "users", label: "Users", icon: Users, group: "Insights" },
  { id: "investments", label: "Investments", icon: TrendingUp, group: "Insights" },
  { id: "transactions", label: "Transactions", icon: CircleDollarSign, group: "Insights" },
  { id: "kyc", label: "KYC review", icon: FileCheck, group: "Queues" },
  { id: "vendors", label: "Vendor approvals", icon: Store, group: "Queues" },
  { id: "consultants", label: "Consultants", icon: Megaphone, group: "Queues" },
  { id: "disputes", label: "Disputes", icon: AlertTriangle, group: "Queues" },
  { id: "rewards", label: "Broker rewards", icon: Gift, group: "Queues" },
  { id: "partners", label: "Partner tier", icon: Award, group: "Queues" },
  { id: "audit", label: "Audit logs", icon: ScrollText, group: "Compliance" },
];

const queueCounts: Record<Section, number> = {
  overview: 0, users: 0, investments: 0, transactions: 0,
  kyc: 24, vendors: 8, consultants: 3, disputes: 5, rewards: 12, partners: 2,
  audit: 0,
};

/* ---------------------------------------------------------- */
/* Root                                                       */
/* ---------------------------------------------------------- */
function DesktopAdmin() {
  const isDesktop = useIsDesktop(1024);
  const [section, setSection] = useState<Section>("overview");

  if (!isDesktop) return <DesktopOnlyNotice />;

  return (
    <div className="min-h-screen w-full bg-soft text-graphite flex">
      <Sidebar section={section} setSection={setSection} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar section={section} />
        <main className="flex-1 overflow-y-auto p-6">
          {section === "overview" && <Overview onJump={setSection} />}
          {section === "users" && <UsersView />}
          {section === "investments" && <InvestmentsView />}
          {section === "transactions" && <TransactionsView />}
          {section === "kyc" && <KycView />}
          {section === "vendors" && <VendorsView />}
          {section === "consultants" && <ConsultantsView />}
          {section === "disputes" && <DisputesView />}
          {section === "rewards" && <RewardsView />}
          {section === "partners" && <PartnersView />}
          {section === "audit" && <AuditView />}
        </main>
      </div>
    </div>
  );
}

function DesktopOnlyNotice() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-navy via-[oklch(0.22_0.06_270)] to-[oklch(0.18_0.04_270)] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-pop">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
          <Monitor size={26} />
        </div>
        <h1 className="text-xl font-semibold">Open on a desktop screen</h1>
        <p className="mt-2 text-sm text-white/70">
          The full Admin Console is optimised for screens 1024px and wider. Please use a laptop or
          desktop to access operations, queues, and growth analytics.
        </p>
        <Link
          to="/admin"
          className="inline-flex mt-5 items-center gap-1.5 rounded-full bg-white text-navy text-sm font-semibold px-4 h-9"
        >
          Open mobile admin instead
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- */
/* Sidebar + topbar                                           */
/* ---------------------------------------------------------- */
function Sidebar({
  section,
  setSection,
}: {
  section: Section;
  setSection: (s: Section) => void;
}) {
  const groups = useMemo(() => {
    const g: Record<string, typeof NAV> = {};
    NAV.forEach((n) => ((g[n.group] ??= []).push(n)));
    return g;
  }, []);

  return (
    <aside className="w-64 shrink-0 bg-[oklch(0.16_0.04_265)] text-white flex flex-col border-r border-white/10">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-white/10">
        <span className="h-9 w-9 rounded-xl bg-violet/40 border border-white/20 flex items-center justify-center shadow-[0_0_0_1px_oklch(1_0_0_/_0.05)_inset]">
          <Shield size={16} className="text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-semibold">AgroVest</p>
          <p className="text-sm font-semibold leading-tight text-white">Admin console</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {Object.entries(groups).map(([gname, items]) => (
          <div key={gname}>
            <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-white/55 font-semibold mb-1.5">
              {gname}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ id, label, icon: I }) => {
                const active = section === id;
                const count = queueCounts[id];
                return (
                  <li key={id}>
                    <button
                      onClick={() => setSection(id)}
                      className={`w-full group flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-sm font-medium transition relative ${
                        active
                          ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.12)]"
                          : "text-white/85 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-violet" />
                      )}
                      <I size={15} className={active ? "text-violet" : "text-white/80"} />
                      <span className="flex-1 text-left">{label}</span>
                      {count > 0 && (
                        <span className={`rounded-full text-[10px] px-1.5 py-0.5 font-semibold ${
                          active ? "bg-violet text-white" : "bg-white/15 text-white"
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-xl px-2 h-11 hover:bg-white/8 transition"
        >
          <div className="h-8 w-8 rounded-full bg-violet text-white text-xs font-semibold flex items-center justify-center ring-1 ring-white/20">
            OP
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-white">Operations</p>
            <p className="text-[10px] text-white/65 truncate">ops@agrovest.io</p>
          </div>
          <ChevronDown size={14} className="text-white/65" />
        </Link>
      </div>
    </aside>
  );
}

function TopBar({ section }: { section: Section }) {
  const label = NAV.find((n) => n.id === section)?.label ?? "Overview";
  return (
    <header className="h-16 shrink-0 bg-card border-b border-border flex items-center px-6 gap-4">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Console</p>
        <h1 className="text-base font-semibold text-navy truncate">{label}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 rounded-full bg-secondary px-3 h-9 w-72 border border-border">
          <Search size={14} className="text-muted-foreground" />
          <input
            placeholder="Search users, vendors, txns…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
        <button className="relative h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition">
          <Bell size={15} />
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-violet text-white text-[9px] font-semibold flex items-center justify-center px-1">
            7
          </span>
        </button>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------- */
/* Overview                                                   */
/* ---------------------------------------------------------- */
function Overview({ onJump }: { onJump: (s: Section) => void }) {
  const kpis = [
    { icon: Users, label: "App users", value: "12,487", delta: "+8.4%", up: true, series: usersSeries, tone: "violet" as const },
    { icon: TrendingUp, label: "Investments", value: "3,942", delta: "+12.1%", up: true, series: investSeries, tone: "agro" as const },
    { icon: Wallet, label: "AUM (cUSD)", value: "$8.42M", delta: "+5.7%", up: true, series: aumSeries, tone: "agro" as const },
    { icon: Building2, label: "Active vendors", value: "342", delta: "+3.2%", up: true, series: vendorSeries, tone: "violet" as const },
    { icon: ShoppingBag, label: "Transactions / wk", value: "685", delta: "+9.4%", up: true, series: txSeries, tone: "violet" as const },
    { icon: AlertTriangle, label: "Open disputes", value: "5", delta: "-2", up: false, series: [9, 8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 5], tone: "warn" as const },
  ];

  return (
    <div className="space-y-6">
      <AlertsBanner onJump={onJump} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Users vs Transactions" subtitle="Last 12 weeks" className="xl:col-span-2" right={<RangeChips />}>
          <DualAreaChart users={usersSeries} tx={txSeries} />
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
            <Legend swatch="bg-violet" label="Users" />
            <Legend swatch="bg-agro" label="Transactions" />
            <span className="ml-auto">Peak users: 2,475 · Peak tx: 685</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3 pt-3 border-t border-border">
            <MiniStat label="DAU" value="2,184" delta="+4.2%" up />
            <MiniStat label="WAU" value="6,471" delta="+6.8%" up />
            <MiniStat label="Sessions / user" value="3.8" delta="+0.4" up />
            <MiniStat label="Avg session" value="6m 12s" delta="-12s" up={false} />
          </div>
        </Panel>

        <Panel title="Queue health" subtitle="SLA breaches & pending counts">
          <ul className="space-y-2">
            {NAV.filter((n) => queueCounts[n.id] > 0).map((n) => {
              const c = queueCounts[n.id];
              const risk = c > 10 ? "danger" : c > 4 ? "warn" : "ok";
              return (
                <li key={n.id}>
                  <button
                    onClick={() => onJump(n.id)}
                    className="w-full flex items-center gap-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border p-2.5 transition"
                  >
                    <span className="h-8 w-8 rounded-lg bg-violet-soft text-violet flex items-center justify-center">
                      <n.icon size={14} />
                    </span>
                    <span className="flex-1 text-left">
                      <p className="text-xs font-semibold text-navy">{n.label}</p>
                      <p className="text-[10px] text-muted-foreground">{c} pending</p>
                    </span>
                    <RiskBadge tone={risk} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Treasury & wallets" subtitle="Multi-sig custody balances"><TreasuryPanel /></Panel>
        <Panel title="Conversion funnel" subtitle="Visitor → invested · 30d"><FunnelPanel /></Panel>
        <Panel title="System status" subtitle="Uptime & service health"><SystemStatus /></Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Geographic distribution" subtitle="Active users by country"><GeoPanel /></Panel>
        <Panel title="Top brokers" subtitle="By referred volume (30d)"><BrokerLeaderboard /></Panel>
        <Panel title="Portfolio mix" subtitle="AUM by asset category"><PortfolioMix /></Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Recent activity" subtitle="Live audit feed" className="xl:col-span-2"
          right={<button className="text-[11px] text-violet font-semibold hover:underline" onClick={() => onJump("audit")}>View all</button>}>
          <RecentActivity />
        </Panel>
        <Panel title="Top investments" subtitle="By AUM (7d)"><TopInvestments /></Panel>
      </div>
    </div>
  );
}

function RangeChips() {
  const [v, setV] = useState("12W");
  return (
    <div className="inline-flex items-center rounded-full bg-secondary border border-border p-0.5 text-[10px] font-semibold">
      {["4W", "12W", "YTD"].map((x) => (
        <button key={x} onClick={() => setV(x)}
          className={`px-2.5 h-6 rounded-full transition ${v === x ? "bg-violet text-white" : "text-muted-foreground"}`}>
          {x}
        </button>
      ))}
    </div>
  );
}

function MiniStat({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy">{value}</p>
      <p className={`text-[10px] font-semibold ${up ? "text-agro" : "text-destructive"}`}>{delta}</p>
    </div>
  );
}

function AlertsBanner({ onJump }: { onJump: (s: Section) => void }) {
  return (
    <div className="rounded-2xl border border-warn/30 bg-warn/10 p-3 flex items-center gap-3">
      <span className="h-9 w-9 rounded-xl bg-warn/20 text-warn flex items-center justify-center shrink-0">
        <AlertTriangle size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy">3 SLA breaches need attention</p>
        <p className="text-[11px] text-muted-foreground">
          KYC review (24 pending · oldest 2d 4h) · Broker rewards (12 pending · director approval)
        </p>
      </div>
      <button onClick={() => onJump("kyc")} className="rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold px-3 h-8">Open KYC</button>
      <button onClick={() => onJump("rewards")} className="rounded-lg bg-secondary text-secondary-foreground text-[11px] font-semibold px-3 h-8">Open rewards</button>
    </div>
  );
}

const treasury = [
  { label: "Operations · cUSD", value: "$4.21M", chain: "Celo · 3/5 multi-sig", pct: 92, tone: "agro" as const },
  { label: "Yield reserve · cUSD", value: "$1.86M", chain: "Celo · 3/5 multi-sig", pct: 78, tone: "violet" as const },
  { label: "Broker payouts · cUSD", value: "$420k", chain: "Celo · 2/3 multi-sig", pct: 45, tone: "violet" as const },
  { label: "CLYST treasury", value: "12.4M CLYST", chain: "Celo · timelock", pct: 64, tone: "agro" as const },
];
function TreasuryPanel() {
  return (
    <ul className="space-y-3">
      {treasury.map((t) => (
        <li key={t.label}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy truncate">{t.label}</p>
              <p className="text-[10px] text-muted-foreground">{t.chain}</p>
            </div>
            <p className="text-sm font-semibold text-navy tabular-nums">{t.value}</p>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className={`h-full rounded-full ${t.tone === "agro" ? "bg-agro" : "bg-violet"}`} style={{ width: `${t.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const funnel = [
  { label: "Visitors", value: 184_220, pct: 100 },
  { label: "Sign-ups", value: 28_410, pct: 15.4 },
  { label: "KYC submitted", value: 14_902, pct: 8.1 },
  { label: "KYC approved", value: 12_487, pct: 6.8 },
  { label: "First invest", value: 3_942, pct: 2.1 },
];
function FunnelPanel() {
  return (
    <ul className="space-y-2">
      {funnel.map((f, i) => (
        <li key={f.label}>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-navy">{f.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {f.value.toLocaleString()} <span className="text-navy font-semibold ml-1">{f.pct}%</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet to-agro"
              style={{ width: `${Math.max(6, (f.pct / funnel[0].pct) * 100)}%`, opacity: 1 - i * 0.1 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const services = [
  { label: "API gateway", state: "ok", value: "99.98%" },
  { label: "Auth · KYC", state: "ok", value: "99.95%" },
  { label: "Custody node (Celo)", state: "ok", value: "99.99%" },
  { label: "Document signer", state: "warn", value: "98.2%" },
  { label: "Notifications", state: "ok", value: "99.91%" },
  { label: "Marketplace orders", state: "ok", value: "99.87%" },
];
function SystemStatus() {
  return (
    <ul className="space-y-2">
      {services.map((s) => (
        <li key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 h-10">
          <span className={`h-2 w-2 rounded-full ${s.state === "ok" ? "bg-agro shadow-[0_0_0_3px_oklch(0.62_0.16_150_/_0.18)]" : "bg-warn shadow-[0_0_0_3px_oklch(0.78_0.16_70_/_0.22)]"}`} />
          <span className="text-xs font-semibold text-navy flex-1">{s.label}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">{s.value}</span>
        </li>
      ))}
      <li className="text-[10px] text-muted-foreground pt-1">Last incident: 11d ago · MTTR 14m</li>
    </ul>
  );
}

const geo = [
  { country: "Nigeria", code: "NG", users: 5_842, pct: 46.8 },
  { country: "Kenya", code: "KE", users: 2_148, pct: 17.2 },
  { country: "Ghana", code: "GH", users: 1_530, pct: 12.3 },
  { country: "South Africa", code: "ZA", users: 1_098, pct: 8.8 },
  { country: "Egypt", code: "EG", users: 742, pct: 5.9 },
  { country: "Other", code: "—", users: 1_127, pct: 9.0 },
];
function GeoPanel() {
  return (
    <ul className="space-y-2">
      {geo.map((g) => (
        <li key={g.country} className="flex items-center gap-3">
          <span className="h-7 w-9 rounded-md bg-secondary border border-border text-[10px] font-bold text-navy flex items-center justify-center">{g.code}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-navy truncate">{g.country}</span>
              <span className="text-muted-foreground tabular-nums">{g.users.toLocaleString()} · {g.pct}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-violet rounded-full" style={{ width: `${Math.min(100, g.pct * 2)}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const brokers = [
  { name: "Tunde Adebayo", code: "BR-1042", vol: "$284k", refs: 38, tier: "Gold" },
  { name: "Adaeze Okeke", code: "BR-0911", vol: "$212k", refs: 27, tier: "Gold" },
  { name: "Samuel Mensah", code: "BR-0784", vol: "$168k", refs: 22, tier: "Silver" },
  { name: "Grace Wanjiku", code: "BR-1188", vol: "$142k", refs: 19, tier: "Silver" },
  { name: "Ibrahim Sani", code: "BR-1245", vol: "$98k", refs: 14, tier: "Bronze" },
];
function BrokerLeaderboard() {
  const tierTone = (t: string) =>
    t === "Gold" ? "bg-warn/15 text-warn" :
    t === "Silver" ? "bg-secondary text-secondary-foreground" :
    "bg-agro-soft text-agro";
  return (
    <ul className="space-y-2">
      {brokers.map((b, i) => (
        <li key={b.code} className="flex items-center gap-3 rounded-xl bg-secondary/40 border border-border p-2.5">
          <span className="h-7 w-7 rounded-lg bg-navy text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-navy truncate">{b.name}</p>
            <p className="text-[10px] text-muted-foreground">{b.code} · {b.refs} refs</p>
          </div>
          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${tierTone(b.tier)}`}>{b.tier}</span>
          <p className="text-xs font-semibold text-navy w-16 text-right tabular-nums">{b.vol}</p>
        </li>
      ))}
    </ul>
  );
}

const mix = [
  { label: "Palm", pct: 38, value: "$3.20M", color: "oklch(0.62 0.16 150)" },
  { label: "Cocoa", pct: 22, value: "$1.85M", color: "oklch(0.55 0.14 50)" },
  { label: "Latex", pct: 16, value: "$1.35M", color: "oklch(0.62 0.18 285)" },
  { label: "Property", pct: 18, value: "$1.52M", color: "oklch(0.62 0.12 240)" },
  { label: "Other", pct: 6, value: "$0.50M", color: "oklch(0.70 0.02 260)" },
];
function PortfolioMix() {
  return (
    <div className="flex items-center gap-5">
      <DonutChart data={mix} />
      <ul className="flex-1 space-y-1.5">
        {mix.map((m) => (
          <li key={m.label} className="flex items-center gap-2 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} />
            <span className="font-semibold text-navy flex-1">{m.label}</span>
            <span className="text-muted-foreground tabular-nums">{m.value}</span>
            <span className="text-navy font-semibold w-9 text-right tabular-nums">{m.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; pct: number; color: string }[] }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" className="shrink-0">
      <circle cx={60} cy={60} r={r} fill="none" stroke="oklch(0.94 0.005 260)" strokeWidth={14} />
      {data.map((d) => {
        const len = (d.pct / 100) * c;
        const el = (
          <circle key={d.label} cx={60} cy={60} r={r} fill="none" stroke={d.color} strokeWidth={14}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
            transform="rotate(-90 60 60)" />
        );
        offset += len;
        return el;
      })}
      <text x="60" y="58" textAnchor="middle" className="fill-[oklch(0.22_0.06_270)] font-semibold" style={{ fontSize: 14 }}>$8.42M</text>
      <text x="60" y="74" textAnchor="middle" className="fill-[oklch(0.55_0.02_260)]" style={{ fontSize: 9 }}>Total AUM</text>
    </svg>
  );
}

/* ---------------------------------------------------------- */
/* Reusable                                                   */
/* ---------------------------------------------------------- */
function Panel({
  title, subtitle, children, className = "", right,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-card border border-border shadow-card p-4 ${className}`}>
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-navy truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  icon: I, label, value, delta, up, series, tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  up: boolean;
  series: number[];
  tone: "violet" | "agro" | "warn";
}) {
  const stroke =
    tone === "violet" ? "oklch(0.62 0.18 285)" :
    tone === "agro" ? "oklch(0.62 0.16 150)" :
    "oklch(0.78 0.16 70)";
  const iconBg =
    tone === "violet" ? "bg-violet-soft text-violet" :
    tone === "agro" ? "bg-agro-soft text-agro" :
    "bg-warn/15 text-warn";

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-4">
      <div className="flex items-center gap-2">
        <span className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <I size={14} />
        </span>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-navy tracking-tight">{value}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-agro" : "text-destructive"}`}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </span>
        <Sparkline series={series} stroke={stroke} w={88} h={28} />
      </div>
    </div>
  );
}

function Sparkline({
  series, stroke, w = 80, h = 24,
}: {
  series: readonly number[];
  stroke: string;
  w?: number;
  h?: number;
}) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(1, max - min);
  const step = w / (series.length - 1);
  const pts = series
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polygon points={area} fill={stroke} opacity={0.12} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DualAreaChart({ users, tx }: { users: readonly number[]; tx: readonly number[] }) {
  const w = 760;
  const h = 220;
  const pad = 24;
  const n = users.length;
  const step = (w - pad * 2) / (n - 1);
  const norm = (arr: readonly number[]) => {
    const mn = Math.min(...arr);
    const mx = Math.max(...arr);
    const rng = Math.max(1, mx - mn);
    return arr.map((v, i) => [pad + i * step, h - pad - ((v - mn) / rng) * (h - pad * 2)] as const);
  };
  const uPts = norm(users);
  const tPts = norm(tx);
  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const toArea = (pts: readonly (readonly [number, number])[]) =>
    `${toPath(pts)} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]">
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={pad} x2={w - pad} y1={pad + ((h - pad * 2) / 3) * i} y2={pad + ((h - pad * 2) / 3) * i}
          stroke="oklch(0.92 0.005 260)" strokeDasharray="3 4" />
      ))}
      <path d={toArea(uPts)} fill="oklch(0.62 0.18 285)" opacity={0.14} />
      <path d={toPath(uPts)} fill="none" stroke="oklch(0.62 0.18 285)" strokeWidth={2} />
      <path d={toArea(tPts)} fill="oklch(0.62 0.16 150)" opacity={0.14} />
      <path d={toPath(tPts)} fill="none" stroke="oklch(0.62 0.16 150)" strokeWidth={2} />
    </svg>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${swatch}`} />
      {label}
    </span>
  );
}

function RiskBadge({ tone }: { tone: "ok" | "warn" | "danger" }) {
  const map = {
    ok: "bg-agro-soft text-agro",
    warn: "bg-warn/15 text-warn",
    danger: "bg-destructive/15 text-destructive",
  };
  const label = tone === "ok" ? "On track" : tone === "warn" ? "Watch" : "At risk";
  return <span className={`text-[10px] font-semibold rounded-full px-2 py-1 ${map[tone]}`}>{label}</span>;
}

/* ---------------------------------------------------------- */
/* Activity & top                                             */
/* ---------------------------------------------------------- */
type LogKind = "kyc" | "vendor" | "doc" | "reward" | "dispute" | "system";
const logs: { kind: LogKind; t: string; by: string; at: string }[] = [
  { kind: "kyc", t: "KYC approved — user_4421", by: "ops@agrovest", at: "10:42 AM" },
  { kind: "vendor", t: "Vendor approved — PrimeAuto", by: "ops@agrovest", at: "09:18 AM" },
  { kind: "doc", t: "Document issued — Custody Receipt #d213", by: "system", at: "08:55 AM" },
  { kind: "reward", t: "Reward issued — Broker BR-9012 ($400)", by: "director@agrovest", at: "Yesterday" },
  { kind: "dispute", t: "Dispute resolved — Order #o5", by: "ops@agrovest", at: "Yesterday" },
  { kind: "system", t: "Policy update — KYC v3.2 published", by: "system", at: "Yesterday" },
];
const kindMeta: Record<LogKind, { icon: ComponentType<{ size?: number }>; tone: string }> = {
  kyc: { icon: FileCheck, tone: "bg-violet-soft text-violet" },
  vendor: { icon: Store, tone: "bg-agro-soft text-agro" },
  doc: { icon: ScrollText, tone: "bg-secondary text-secondary-foreground" },
  reward: { icon: Gift, tone: "bg-agro-soft text-agro" },
  dispute: { icon: AlertTriangle, tone: "bg-destructive/15 text-destructive" },
  system: { icon: Shield, tone: "bg-warn/15 text-warn" },
};

function RecentActivity() {
  return (
    <ul className="divide-y divide-border">
      {logs.map((l, i) => {
        const M = kindMeta[l.kind];
        return (
          <li key={i} className="py-2.5 flex items-center gap-3">
            <span className={`h-8 w-8 rounded-lg ${M.tone} flex items-center justify-center`}>
              <M.icon size={14} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-navy truncate">{l.t}</p>
              <p className="text-[10px] text-muted-foreground">{l.by}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{l.at}</span>
          </li>
        );
      })}
    </ul>
  );
}

const topInv = [
  { name: "Palm Estate · Phase IV", cat: "Palm", aum: "$1.42M", chg: "+6.2%" },
  { name: "Cocoa Co-op · Ondo", cat: "Cocoa", aum: "$980k", chg: "+4.1%" },
  { name: "Latex Yield · Edo", cat: "Latex", aum: "$745k", chg: "+2.8%" },
  { name: "Lekki Residence #b12", cat: "Property", aum: "$612k", chg: "+1.4%" },
  { name: "Palm Estate · Phase II", cat: "Palm", aum: "$501k", chg: "-0.6%" },
];

function TopInvestments() {
  return (
    <ul className="space-y-2">
      {topInv.map((t) => (
        <li key={t.name} className="flex items-center gap-3 rounded-xl bg-secondary/40 border border-border p-2.5">
          <span className="h-8 w-8 rounded-lg bg-agro-soft text-agro flex items-center justify-center text-[10px] font-semibold">
            {t.cat.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-navy truncate">{t.name}</p>
            <p className="text-[10px] text-muted-foreground">{t.cat}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-navy">{t.aum}</p>
            <p className={`text-[10px] font-semibold ${t.chg.startsWith("-") ? "text-destructive" : "text-agro"}`}>{t.chg}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------- */
/* Data tables                                                */
/* ---------------------------------------------------------- */
type Col<T> = { key: keyof T | string; label: string; render?: (row: T) => ReactNode; w?: string };

function DataTable<T extends { id: string }>({
  cols, rows, filters,
}: {
  cols: Col<T>[];
  rows: T[];
  filters?: string[];
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState((filters && filters[0]) || "All");
  const filtered = rows.filter((r) => {
    const text = Object.values(r).join(" ").toLowerCase();
    const matchQ = !q || text.includes(q.toLowerCase());
    const matchF = !filters || f === "All" || text.toLowerCase().includes(f.toLowerCase());
    return matchQ && matchF;
  });
  return (
    <section className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <div className="flex items-center gap-2 rounded-full bg-secondary px-3 h-9 flex-1 max-w-sm border border-border">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {filters && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {filters.map((x) => (
              <button
                key={x}
                onClick={() => setF(x)}
                className={`shrink-0 rounded-full px-3 h-8 text-[11px] font-semibold transition ${
                  f === x ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {x}
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} of {rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/40">
              {cols.map((c) => (
                <th key={String(c.key)} className="px-4 py-2.5 font-semibold" style={{ width: c.w }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-secondary/30 transition">
                {cols.map((c) => (
                  <td key={String(c.key)} className="px-4 py-3 align-middle">
                    {c.render ? c.render(r) : String((r as any)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-sm text-muted-foreground">No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusPill({ s }: { s: string }) {
  const ok = ["Approved", "Issued", "Resolved", "Confirmed", "Active", "Verified", "Completed"];
  const warn = ["Pending", "Under review", "More info", "Pending review", "Submitted"];
  const bad = ["Rejected", "Open", "Failed"];
  const violet = ["Director approval", "Pending director", "Tier 2", "Tier 3"];
  const tone = ok.includes(s) ? "bg-agro-soft text-agro"
    : warn.includes(s) ? "bg-warn/15 text-warn"
    : bad.includes(s) ? "bg-destructive/15 text-destructive"
    : violet.includes(s) ? "bg-violet-soft text-violet"
    : "bg-secondary text-secondary-foreground";
  return <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-1 ${tone}`}>{s}</span>;
}

function RowActions({ items }: { items: { label: string; variant?: "primary" | "ghost" | "danger" }[] }) {
  return (
    <div className="flex gap-1.5 justify-end">
      {items.map((a) => {
        const cls = a.variant === "primary"
          ? "bg-primary text-primary-foreground"
          : a.variant === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-secondary text-secondary-foreground";
        return (
          <button key={a.label} className={`rounded-lg px-2.5 h-8 text-[11px] font-semibold ${cls}`}>
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const i = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <span className="h-8 w-8 rounded-full bg-violet-soft text-violet text-xs font-semibold flex items-center justify-center">{i}</span>;
}

/* ----- Section views ----- */

type UserRow = { id: string; name: string; email: string; role: string; kyc: string; country: string; joined: string };
const users: UserRow[] = [
  { id: "u1", name: "Jane Doe", email: "jane@doe.com", role: "Investor", kyc: "Approved", country: "NG", joined: "Jan 2025" },
  { id: "u2", name: "Mark Otieno", email: "mark@otieno.io", role: "Investor", kyc: "More info", country: "GH", joined: "Feb 2025" },
  { id: "u3", name: "Ada Pereira", email: "ada@p.io", role: "Broker", kyc: "Submitted", country: "NG", joined: "Mar 2025" },
  { id: "u4", name: "Tobi Kamau", email: "tobi@k.io", role: "Investor", kyc: "Under review", country: "KE", joined: "Apr 2025" },
  { id: "u5", name: "Sarah Lin", email: "sarah@lin.co", role: "Vendor", kyc: "Approved", country: "NG", joined: "May 2025" },
  { id: "u6", name: "Daniel Park", email: "daniel@p.io", role: "Investor", kyc: "Rejected", country: "ZA", joined: "Jun 2025" },
];

function UsersView() {
  return (
    <DataTable
      filters={["All", "Investor", "Broker", "Vendor"]}
      rows={users}
      cols={[
        { key: "name", label: "User", render: (r) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={r.name} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy truncate">{r.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
            </div>
          </div>
        )},
        { key: "role", label: "Role", render: (r) => <StatusPill s={r.role} /> },
        { key: "kyc", label: "KYC", render: (r) => <StatusPill s={r.kyc} /> },
        { key: "country", label: "Country" },
        { key: "joined", label: "Joined" },
        { key: "actions", label: "", w: "180px", render: () => <RowActions items={[{ label: "View" }, { label: "Suspend", variant: "danger" }]} /> },
      ]}
    />
  );
}

type InvestRow = { id: string; name: string; cat: string; aum: string; units: string; status: string; updated: string };
const invs: InvestRow[] = [
  { id: "i1", name: "Palm Estate · Phase IV", cat: "Palm", aum: "$1.42M", units: "284 plots", status: "Active", updated: "2h ago" },
  { id: "i2", name: "Cocoa Co-op · Ondo", cat: "Cocoa", aum: "$980k", units: "196 acres", status: "Active", updated: "5h ago" },
  { id: "i3", name: "Latex Yield · Edo", cat: "Latex", aum: "$745k", units: "149 hectares", status: "Active", updated: "1d ago" },
  { id: "i4", name: "Lekki Residence #b12", cat: "Property", aum: "$612k", units: "1 unit", status: "Pending", updated: "3d ago" },
];
function InvestmentsView() {
  return (
    <DataTable
      filters={["All", "Palm", "Cocoa", "Latex", "Property"]}
      rows={invs}
      cols={[
        { key: "name", label: "Asset", render: (r) => <span className="font-semibold text-navy">{r.name}</span> },
        { key: "cat", label: "Category", render: (r) => <StatusPill s={r.cat} /> },
        { key: "units", label: "Holding" },
        { key: "aum", label: "AUM" },
        { key: "status", label: "Status", render: (r) => <StatusPill s={r.status} /> },
        { key: "updated", label: "Updated" },
      ]}
    />
  );
}

type TxRow = { id: string; user: string; type: string; amount: string; token: string; status: string; date: string };
const txs: TxRow[] = [
  { id: "t1", user: "Jane Doe", type: "invest", amount: "$2,400", token: "cUSD", status: "Confirmed", date: "Today 10:24" },
  { id: "t2", user: "Mark Otieno", type: "swap", amount: "$520", token: "CLYST", status: "Pending", date: "Today 09:55" },
  { id: "t3", user: "Ada Pereira", type: "reward", amount: "$400", token: "cUSD", status: "Confirmed", date: "Yesterday" },
  { id: "t4", user: "Tobi Kamau", type: "send", amount: "$120", token: "cUSD", status: "Failed", date: "Yesterday" },
  { id: "t5", user: "Sarah Lin", type: "invest", amount: "$8,800", token: "cUSD", status: "Confirmed", date: "Mon" },
];
function TransactionsView() {
  return (
    <DataTable
      filters={["All", "invest", "swap", "reward", "send"]}
      rows={txs}
      cols={[
        { key: "user", label: "User" },
        { key: "type", label: "Type", render: (r) => <StatusPill s={r.type} /> },
        { key: "amount", label: "Amount", render: (r) => <span className="font-semibold text-navy">{r.amount}</span> },
        { key: "token", label: "Token" },
        { key: "status", label: "Status", render: (r) => <StatusPill s={r.status} /> },
        { key: "date", label: "Date" },
      ]}
    />
  );
}

type QueueRow = { id: string; name: string; meta: string; state: string };

function KycView() {
  const rows: QueueRow[] = [
    { id: "k1", name: "Jane Doe", meta: "Investor · NG · Tier 2", state: "Under review" },
    { id: "k2", name: "Mark O.", meta: "Investor · GH · Tier 1", state: "More info" },
    { id: "k3", name: "Ada P.", meta: "Broker · NG · Tier 2", state: "Submitted" },
    { id: "k4", name: "Tobi K.", meta: "Investor · KE · Tier 3", state: "Approved" },
  ];
  return queueTable(rows, ["All", "Under review", "More info", "Submitted", "Approved"]);
}
function VendorsView() {
  const rows: QueueRow[] = [
    { id: "v1", name: "GoldHaven Realty", meta: "Real estate · 12 listings", state: "Under review" },
    { id: "v2", name: "PrimeAuto", meta: "Automobile · 4 listings", state: "Approved" },
    { id: "v3", name: "Aurum Living", meta: "Household · 7 listings", state: "More info" },
  ];
  return queueTable(rows, ["All", "Under review", "More info", "Approved"]);
}
function ConsultantsView() {
  const rows: QueueRow[] = [
    { id: "c1", name: "Marie Okafor", meta: "Investor Comms · 3 yrs", state: "Pending" },
  ];
  return queueTable(rows, ["All", "Pending", "Approved"]);
}
function DisputesView() {
  const rows: QueueRow[] = [
    { id: "d1", name: "Order #o1 — Lekki Residence", meta: "Buyer escalated · 2d open", state: "Open" },
    { id: "d2", name: "Order #o5 — Camry 2022", meta: "Refund requested", state: "Resolved" },
  ];
  return queueTable(rows, ["All", "Open", "Resolved"], [
    { label: "Resolve", variant: "primary" }, { label: "Escalate", variant: "danger" }, { label: "Chat" },
  ]);
}
function RewardsView() {
  const rows: QueueRow[] = [
    { id: "r1", name: "Broker BR-7421", meta: "Land milestone · $1,200", state: "Pending director" },
    { id: "r2", name: "Broker BR-9012", meta: "Silver tier · $400", state: "Issued" },
  ];
  return queueTable(rows, ["All", "Pending director", "Issued"], [
    { label: "Issue", variant: "primary" }, { label: "Details" },
  ]);
}
function PartnersView() {
  const rows: QueueRow[] = [
    { id: "p1", name: "Adaeze O.", meta: "Investor · $42k volume · 1y", state: "Pending review" },
    { id: "p2", name: "Tunde A.", meta: "Broker · 38 verified · 2y", state: "Director approval" },
  ];
  return queueTable(rows, ["All", "Pending review", "Director approval"]);
}

function queueTable(
  rows: QueueRow[],
  filters: string[],
  actions: { label: string; variant?: "primary" | "ghost" | "danger" }[] = [
    { label: "Approve", variant: "primary" }, { label: "Reject", variant: "danger" }, { label: "View" },
  ],
) {
  return (
    <DataTable
      rows={rows}
      filters={filters}
      cols={[
        { key: "name", label: "Name", render: (r) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={r.name} />
            <div>
              <p className="text-sm font-semibold text-navy">{r.name}</p>
              <p className="text-[11px] text-muted-foreground">{r.meta}</p>
            </div>
          </div>
        )},
        { key: "state", label: "Status", render: (r) => <StatusPill s={r.state} /> },
        { key: "actions", label: "", w: "260px", render: () => <RowActions items={actions} /> },
      ]}
    />
  );
}

/* ----- Audit ----- */
function AuditView() {
  const grouped = useMemo(() => {
    const day = (l: typeof logs[number]) => (l.at.toLowerCase().includes("yesterday") ? "Yesterday" : "Today");
    return logs.reduce<Record<string, typeof logs>>((acc, l) => {
      (acc[day(l)] ??= []).push(l);
      return acc;
    }, {});
  }, []);
  return (
    <div className="space-y-6 max-w-3xl">
      {Object.entries(grouped).map(([d, items]) => (
        <section key={d}>
          <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">{d}</h2>
          <ol className="relative space-y-2 pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {items.map((l, i) => {
              const M = kindMeta[l.kind];
              return (
                <li key={i} className="relative">
                  <span className={`absolute -left-[14px] top-3 h-2.5 w-2.5 rounded-full ${M.tone} ring-2 ring-background`} />
                  <div className="flex items-start gap-3 rounded-2xl bg-card border border-border p-3 shadow-card">
                    <span className={`h-9 w-9 rounded-xl ${M.tone} flex items-center justify-center shrink-0`}>
                      <M.icon size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy">{l.t}</p>
                      <p className="text-[11px] text-muted-foreground">{l.by} · {l.at}</p>
                    </div>
                    <StatusPill s={l.kind === "dispute" ? "Resolved" : l.kind === "system" ? "Active" : "Confirmed"} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _unused = { CheckCircle2, Clock, XCircle, Activity };

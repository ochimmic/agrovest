import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Shield,
  LayoutDashboard,
  FileCheck,
  Gift,
  Users,
  TrendingUp,
  Wallet,
  Building2,
  Monitor,
  RefreshCw,
  ScrollText,
  ExternalLink,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFxRate, NGN_PER_USD } from "@/lib/fx";
import { HouseManager } from "@/components/admin/HouseManager";
import { PaymentsWorkbench } from "@/components/admin/workbench/PaymentsWorkbench";
import { KycWorkbench } from "@/components/admin/workbench/KycWorkbench";
import { DocumentsWorkbench } from "@/components/admin/workbench/DocumentsWorkbench";
import { PayoutsWorkbench } from "@/components/admin/workbench/PayoutsWorkbench";
import { AuditWorkbench } from "@/components/admin/workbench/AuditWorkbench";
const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString()}`;

export const Route = createFileRoute("/_authenticated/_admin/admin/desktop")({
  head: () => ({ meta: [{ title: "Admin console · AgroVest" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { section?: string } => (typeof s.section === "string" ? { section: s.section } : {}),
  component: DesktopAdmin,
});

function useIsDesktop(min = 1024) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const onR = () => setOk(window.innerWidth >= min);
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [min]);
  return ok;
}

/* ---------------- Live data ---------------- */
type Row = Record<string, any>;
type Data = {
  profiles: Row[];
  roles: Row[];
  orders: Row[];
  holdings: Row[];
  kyc: Row[];
  docs: Row[];
  payouts: Row[];
  houses: Row[];
  commissions: Row[];
};
const EMPTY: Data = { profiles: [], roles: [], orders: [], holdings: [], kyc: [], docs: [], payouts: [], houses: [], commissions: [] };

function useLiveData() {
  const [data, setData] = useState<Data>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const q = (t: string) => (supabase.from(t as any) as any).select("*").order("created_at", { ascending: false }).limit(500);
    const [profiles, roles, orders, holdings, kyc, docs, payouts, houses, commissions] = await Promise.all([
      q("profiles"), q("user_roles"), q("pay_orders"),
      (supabase.from("holdings") as any).select("*").order("purchased_at", { ascending: false }).limit(500),
      q("kyc_submissions"), q("investor_documents"), q("payout_requests"), q("properties"), q("broker_commissions"),
    ]);
    const firstErr = [profiles, roles, orders, holdings, kyc, docs, payouts, houses, commissions].find((r: any) => r.error);
    setError(firstErr ? (firstErr as any).error.message : null);
    setData({
      profiles: profiles.data ?? [], roles: roles.data ?? [], orders: orders.data ?? [], holdings: holdings.data ?? [],
      kyc: kyc.data ?? [], docs: docs.data ?? [], payouts: payouts.data ?? [], houses: houses.data ?? [], commissions: commissions.data ?? [],
    });
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-desktop")
      .on("postgres_changes", { event: "*", schema: "public", table: "pay_orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "kyc_submissions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payout_requests" }, load)
      .subscribe();
    const t = setInterval(load, 60_000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [load]);
  return { data, loading, error, reload: load };
}

const OPEN_ORDER = (s: string) => s !== "confirmed" && s !== "rejected";
const usd = (n: number) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const date = (s?: string) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

/* ---------------- Layout ---------------- */
type Section = "overview" | "payments" | "users" | "holdings" | "kyc" | "documents" | "payouts" | "houses" | "audit";
const NAV: { id: Section; label: string; icon: LucideIcon; group: string; page?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Insights" },
  { id: "users", label: "Users", icon: Users, group: "Insights" },
  { id: "holdings", label: "Investments", icon: TrendingUp, group: "Insights" },
  { id: "payments", label: "Payments", icon: Wallet, group: "Queues" },
  { id: "kyc", label: "KYC review", icon: FileCheck, group: "Queues" },
  { id: "documents", label: "Documents", icon: FileText, group: "Queues" },
  { id: "payouts", label: "Broker payouts", icon: Gift, group: "Queues" },
  { id: "houses", label: "Houses (Buy Assets)", icon: Building2, group: "Catalog" },
  { id: "audit", label: "Audit trail", icon: ScrollText, group: "Catalog" },
];

function DesktopAdmin() {
  const isDesktop = useIsDesktop(1024);
  const search = Route.useSearch();
  const [section, setSection] = useState<Section>(() => (NAV.some((n) => n.id === search.section) ? (search.section as Section) : "overview"));
  const live = useLiveData();
  useFxRate();
  const d = live.data;

  const counts: Partial<Record<Section, number>> = {
    payments: d.orders.filter((o) => OPEN_ORDER(o.status) && o.status !== "awaiting_payment").length,
    kyc: d.kyc.filter((k) => k.status === "review").length,
    documents: d.docs.filter((x) => x.status === "pending").length,
    payouts: d.payouts.filter((p) => p.status === "pending").length,
  };

  if (!isDesktop) return <DesktopOnlyNotice />;
  const nav = NAV.find((n) => n.id === section)!;

  return (
    <div className="min-h-screen w-full bg-soft text-graphite flex">
      <aside className="w-64 shrink-0 bg-[oklch(0.16_0.04_265)] text-white flex flex-col border-r border-white/10">
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-white/10">
          <span className="h-9 w-9 rounded-xl bg-violet/40 border border-white/20 flex items-center justify-center">
            <Shield size={16} />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-semibold">AgroVest</p>
            <p className="text-sm font-semibold leading-tight">Admin console</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {["Insights", "Queues", "Catalog"].map((g) => (
            <div key={g}>
              <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-white/55 font-semibold mb-1.5">{g}</p>
              <ul className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map(({ id, label, icon: I }) => {
                  const active = section === id;
                  const c = counts[id] ?? 0;
                  return (
                    <li key={id}>
                      <button
                        onClick={() => setSection(id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-sm font-medium transition ${
                          active ? "bg-white/12 text-white" : "text-white/85 hover:bg-white/8"
                        }`}
                      >
                        <I size={15} className={active ? "text-violet" : "text-white/80"} />
                        <span className="flex-1 text-left">{label}</span>
                        {c > 0 && <span className="rounded-full bg-violet text-white text-[10px] px-1.5 py-0.5 font-semibold">{c}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3 space-y-1">
          <Link to="/home" className="flex items-center gap-2 rounded-xl px-2 h-9 text-xs text-white/80 hover:bg-white/8">
            ← Back to app
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-card border-b border-border flex items-center px-6 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Console · live data</p>
            <h1 className="text-base font-semibold text-navy">{nav.label}</h1>
          </div>
          <span className="ml-auto text-[11px] text-muted-foreground">$1 = ₦{NGN_PER_USD.toLocaleString()}</span>
          {nav.page && (
            <Link to={nav.page as any} className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 h-9">
              Open review & actions <ExternalLink size={13} />
            </Link>
          )}
          <button onClick={live.reload} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center" aria-label="Refresh">
            <RefreshCw size={14} className={live.loading ? "animate-spin" : ""} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {live.error && <p className="rounded-xl bg-destructive/10 text-destructive text-sm p-3">Couldn't load some data: {live.error}</p>}
          {section === "overview" && <Overview d={d} counts={counts} onJump={setSection} />}
          {section === "payments" && <PaymentsWorkbench embedded />}
          {section === "users" && <UsersView d={d} />}
          {section === "holdings" && <HoldingsView d={d} />}
          {section === "kyc" && <KycWorkbench embedded />}
          {section === "documents" && <DocumentsWorkbench embedded />}
          {section === "payouts" && <PayoutsWorkbench embedded />}
          {section === "audit" && <AuditWorkbench embedded />}
          {section === "houses" && <HouseManager wide onChange={live.reload} />}
        </main>
      </div>
    </div>
  );
}

function DesktopOnlyNotice() {
  return (
    <div className="min-h-screen w-full gradient-navy text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center rounded-3xl border border-white/10 bg-white/5 p-8">
        <Monitor size={26} className="mx-auto mb-4" />
        <h1 className="text-xl font-semibold">Open on a desktop screen</h1>
        <p className="mt-2 text-sm text-white/70">The full Admin Console needs a screen 1024px or wider.</p>
        <Link to="/admin" className="inline-flex mt-5 rounded-full bg-white text-navy text-sm font-semibold px-4 h-9 items-center">
          Open mobile admin instead
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function nameOf(d: Data, id?: string) {
  const p = d.profiles.find((x) => x.id === id);
  return p?.full_name || p?.email || "Unknown user";
}
function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card border border-border shadow-card">
      <div className="flex items-center px-4 h-12 border-b border-border">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        <div className="ml-auto">{action}</div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-card">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
function Pill({ s }: { s: string }) {
  const good = ["confirmed", "approved", "issued", "paid", "active", "completed"].includes(s);
  const bad = ["rejected", "cancelled"].includes(s);
  const tone = good ? "bg-agro-soft text-agro" : bad ? "bg-destructive/15 text-destructive" : "bg-warn/15 text-warn";
  return <span className={`rounded-full text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap ${tone}`}>{s.replace(/_/g, " ")}</span>;
}
function Table({ cols, rows, empty }: { cols: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            {cols.map((c) => <th key={c} className="py-2 pr-4 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => <td key={j} className="py-2.5 pr-4 align-top text-foreground">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Views ---------------- */
function Overview({ d, counts, onJump }: { d: Data; counts: Partial<Record<Section, number>>; onJump: (s: Section) => void }) {
  const confirmed = d.orders.filter((o) => o.status === "confirmed");
  const volume = confirmed.reduce((s, o) => s + Number(o.amount_usd), 0);
  const aum = d.holdings.reduce((s, h) => s + Number(h.invested), 0);
  const brokers = d.roles.filter((r) => r.role === "broker").length;
  const commissions = d.commissions.reduce((s, c) => s + Number(c.amount_usd), 0);
  const listed = d.houses.filter((h) => h.status === "active").length;
  const queue: { id: Section; label: string }[] = [
    { id: "payments", label: "Payments awaiting confirmation" },
    { id: "kyc", label: "KYC submissions to review" },
    { id: "documents", label: "Documents to upload" },
    { id: "payouts", label: "Broker payout requests" },
  ];
  return (
    <>
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Users" value={d.profiles.length.toString()} sub={`${brokers} broker${brokers === 1 ? "" : "s"}`} />
        <Kpi label="Confirmed volume" value={usd(volume)} sub={naira(volume * NGN_PER_USD)} />
        <Kpi label="Assets held" value={usd(aum)} sub={`${d.holdings.length} holdings`} />
        <Kpi label="Orders" value={d.orders.length.toString()} sub={`${confirmed.length} confirmed`} />
        <Kpi label="Commissions owed" value={usd(commissions)} sub={`${d.commissions.length} credits`} />
        <Kpi label="Houses listed" value={listed.toString()} sub={`${d.houses.length} total`} />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Panel title="Needs attention">
          <ul className="space-y-2">
            {queue.map((q) => (
              <li key={q.id}>
                <button onClick={() => onJump(q.id)} className="w-full flex items-center rounded-xl bg-secondary px-3 h-11 text-sm hover:bg-muted">
                  <span>{q.label}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${(counts[q.id] ?? 0) > 0 ? "bg-violet text-white" : "bg-background text-muted-foreground"}`}>
                    {counts[q.id] ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Latest orders" action={<button onClick={() => onJump("payments")} className="text-xs text-violet font-semibold">See all</button>}>
          <Table
            cols={["Ticket", "Buyer", "Amount", "Status"]}
            empty="No orders yet. They'll appear here as soon as someone checks out."
            rows={d.orders.slice(0, 6).map((o) => [`#${o.reference}`, nameOf(d, o.user_id), usd(o.amount_usd), <Pill s={o.status} />])}
          />
        </Panel>
        <Panel title="Newest users" action={<button onClick={() => onJump("users")} className="text-xs text-violet font-semibold">See all</button>}>
          <Table
            cols={["Name", "Email", "Joined"]}
            empty="No users yet."
            rows={d.profiles.slice(0, 6).map((p) => [p.full_name || "—", p.email, date(p.created_at)])}
          />
        </Panel>
        <Panel title="Recent investments" action={<button onClick={() => onJump("holdings")} className="text-xs text-violet font-semibold">See all</button>}>
          <Table
            cols={["Asset", "Investor", "Amount"]}
            empty="No confirmed investments yet."
            rows={d.holdings.slice(0, 6).map((h) => [h.name, nameOf(d, h.user_id), usd(h.invested)])}
          />
        </Panel>
      </div>
    </>
  );
}

function PaymentsView({ d }: { d: Data }) {
  return (
    <Panel title={`All orders (${d.orders.length})`}>
      <Table
        cols={["Ticket", "Buyer", "Item", "Method", "Amount", "Receipt", "Status", "Updated"]}
        empty="No payments yet."
        rows={d.orders.map((o) => [
          <span className="font-semibold">#{o.reference}</span>,
          o.payer_name || nameOf(d, o.user_id),
          o.purpose?.assetName ?? "—",
          `${o.rail} · ${o.token}`,
          <span>{usd(o.amount_usd)}<br /><span className="text-[11px] text-muted-foreground">{naira(Number(o.amount_usd) * Number(o.rate || NGN_PER_USD))}</span></span>,
          o.receipt_path ? "Uploaded" : o.tx_hash ? "On-chain" : "—",
          <Pill s={o.status} />,
          date(o.updated_at),
        ])}
      />
    </Panel>
  );
}

function UsersView({ d }: { d: Data }) {
  return (
    <Panel title={`Users (${d.profiles.length})`}>
      <Table
        cols={["Name", "Email", "Phone", "Roles", "KYC", "Referral code", "Joined"]}
        empty="No users yet."
        rows={d.profiles.map((p) => [
          p.full_name || "—", p.email, p.phone || "—",
          d.roles.filter((r) => r.user_id === p.id).map((r) => r.role).join(", ") || "—",
          <Pill s={p.kyc} />, p.referral_code || "—", date(p.created_at),
        ])}
      />
    </Panel>
  );
}

function HoldingsView({ d }: { d: Data }) {
  return (
    <Panel title={`Investments (${d.holdings.length})`}>
      <Table
        cols={["Asset", "Investor", "Category", "Units", "Invested", "Purchased"]}
        empty="No confirmed investments yet."
        rows={d.holdings.map((h) => [h.name, nameOf(d, h.user_id), h.category, `${h.units} ${h.unit}`, usd(h.invested), date(h.purchased_at)])}
      />
    </Panel>
  );
}

function KycView({ d }: { d: Data }) {
  return (
    <Panel title={`KYC submissions (${d.kyc.length})`}>
      <Table
        cols={["User", "ID type", "City", "Status", "Submitted"]}
        empty="No KYC submissions yet."
        rows={d.kyc.map((k) => [nameOf(d, k.user_id), k.id_type, k.city, <Pill s={k.status} />, date(k.created_at)])}
      />
    </Panel>
  );
}

function DocsView({ d }: { d: Data }) {
  return (
    <Panel title={`Ownership documents (${d.docs.length})`}>
      <Table
        cols={["Investor", "Document", "Status", "Due", "Issued"]}
        empty="No documents yet. They're created automatically when a payment is confirmed."
        rows={d.docs.map((x) => [nameOf(d, x.user_id), x.doc_type.replace(/_/g, " "), <Pill s={x.status} />, x.due_note || "—", date(x.issued_at)])}
      />
    </Panel>
  );
}

function PayoutsView({ d }: { d: Data }) {
  return (
    <Panel title={`Payout requests (${d.payouts.length})`}>
      <Table
        cols={["Ticket", "Broker", "Method", "Amount", "Fee", "Net to send", "Status", "Requested"]}
        empty="No payout requests yet."
        rows={d.payouts.map((p) => [
          p.reference, nameOf(d, p.user_id), p.method, usd(p.amount_usd), usd(p.fee_usd),
          <span>{usd(p.net_usd)}<br /><span className="text-[11px] text-muted-foreground">{naira(Number(p.net_usd) * Number(p.rate))}</span></span>,
          <Pill s={p.status} />, date(p.created_at),
        ])}
      />
    </Panel>
  );
}

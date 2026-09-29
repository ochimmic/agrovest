import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck, ArrowRight, Sprout, LineChart, Wallet, GraduationCap,
  AlertTriangle, FileText, Headphones, Sparkles, Lock,
  Activity, ShoppingBag, Building2, Gift, ArrowDownLeft, ArrowUpRight, RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useAppState } from "@/lib/store";
import { farmAssets } from "@/lib/mock-data";
import {
  BscBadge, NonCustodialBadge, CustodyBackedBadge, RiskBadge, AgroBadge,
} from "@/components/ui/agro-badge";

export const Route = createFileRoute("/_authenticated/_authenticated/home")({ component: Home });

function Home() {
  const user = useAppState((s) => s.user);
  const role = useAppState((s) => s.role);
  const kyc = useAppState((s) => s.kyc);
  const holdings = useAppState((s) => s.holdings);
  const wallet = useAppState((s) => s.wallet);
  const txs = useAppState((s) => s.txs);

  const portfolioValue = holdings.reduce((sum, h) => sum + h.invested, 0);
  const first = user?.name?.split(" ")[0] ?? "Investor";

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        {/* Greeting */}
        <section className="animate-in-up">
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold text-navy">Hi, {first}</h1>
        </section>

        {/* Portfolio / role hero */}
        <section className="relative overflow-hidden rounded-3xl gradient-navy p-5 text-white shadow-pop">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet/40 blur-3xl" />
          <div className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-agro/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/60">
                {role === "investor" ? "Portfolio value" : role === "broker" ? "Commission to date" : role === "vendor" ? "Vendor balance" : "Explore AgroVest"}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">
                <ShieldCheck size={12} /> KYC {kyc}
              </span>
            </div>
            <p className="mt-2 text-[34px] font-semibold tracking-tight tabular">
              ${portfolioValue.toLocaleString()}<span className="text-white/40 text-lg">.00</span>
            </p>
            <p className="text-[11px] text-white/70 tabular">≈ ₦{(portfolioValue * 1550).toLocaleString()}</p>

            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-agro/15 px-2 py-0.5 text-agro font-medium">+0.0%</span>
              <span className="text-white/60">Wallet: {wallet ? `${wallet.clyst} $CLYST` : "Not set up"}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <BscBadge size="xs" />
              <NonCustodialBadge size="xs" />
              <CustodyBackedBadge size="xs" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link
                to="/invest/farmvest"
                className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium hover:bg-white/20 transition"
              >
                Invest now <ArrowRight className="inline" size={14} />
              </Link>
              <Link
                to="/vault"
                className="rounded-2xl bg-agro text-white px-4 py-3 text-sm font-medium hover:brightness-110 transition"
              >
                Open Vault
              </Link>
            </div>
          </div>
        </section>

        {/* KYC prompt */}
        {kyc !== "approved" && (
          <Link
            to="/kyc"
            className="flex items-start gap-3 rounded-3xl border border-violet/20 bg-violet-soft/40 p-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet text-white">
              <ShieldCheck size={18} />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-navy text-sm">Verify your identity</p>
              <p className="text-xs text-muted-foreground">
                Required before investment, vendor selling, or broker rewards.
              </p>
            </div>
            <ArrowRight size={16} className="mt-1 text-violet" />
          </Link>
        )}

        {/* Modules */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-navy">Modules</h2>
          <div className="grid grid-cols-2 gap-3">
            <Tile icon={Sprout} label="FarmVest" sub="Palm · Cocoa · Latex" to="/invest/farmvest" tone="agro" />
            <Tile icon={LineChart} label="Buy Assets" sub="Verified vendors" to="/invest/property" tone="violet" />
            <Tile icon={Wallet} label="AssetVault" sub="Non-custodial · BSC" to="/vault" tone="navy" />
            <Tile icon={FileText} label="Documents" sub="Receipts & contracts" to="/documents" tone="soft" />
          </div>
        </section>

        {/* Activity */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-violet" />
              <h2 className="text-sm font-semibold text-navy">Recent activity</h2>
            </div>
            <Link to="/vault" className="text-xs text-violet">See all</Link>
          </div>
          {txs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-5 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                <Activity size={16} />
              </span>
              <p className="mt-2 text-sm font-medium text-navy">No activity yet</p>
              <p className="text-[11px] text-muted-foreground">
                Your purchases, investments and rewards will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {txs.slice(0, 5).map((t) => {
                const meta = activityMeta(t.type, t.meta);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${meta.bg} ${meta.fg}`}>
                      <meta.Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{meta.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t.meta ?? meta.subtitle} · {timeAgo(t.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-navy tabular">
                        ${t.amount.toLocaleString()}
                      </p>
                      <p className={`text-[10px] ${t.status === "confirmed" ? "text-agro" : "text-warn"}`}>
                        {t.status}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Education */}
        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet" />
            <h3 className="text-sm font-semibold text-navy">How AgroVest ownership works</h3>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Every investment is backed by a custody receipt and a contract you can verify, plus on-chain proof in your non-custodial wallet.
          </p>
          <Link to="/explore" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet">
            Learn the basics <ArrowRight size={12} />
          </Link>
        </section>

        {/* Featured assets */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Recommended FarmVest</h2>
            <Link to="/invest/farmvest" className="text-xs text-violet">See all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
            {farmAssets.map((a) => (
              <Link
                key={a.id}
                to="/invest/farmvest/$id"
                params={{ id: a.id }}
                className="min-w-[230px] rounded-3xl border border-border bg-card overflow-hidden shadow-card"
              >
                <div className={`h-28 bg-gradient-to-br ${a.cover} relative bg-cover bg-center`} style={a.image ? { backgroundImage: `url(${a.image})` } : undefined}>
                  <span className="absolute top-2 left-2"><CustodyBackedBadge size="xs" /></span>
                  
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-navy line-clamp-1">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.location}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <AgroBadge tone="agro" size="xs">{a.expectedYield}</AgroBadge>
                    <span className="text-muted-foreground">${a.pricePerPlot}/plot</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Role-specific quick action */}
        {role === "broker" && (
          <Link to="/broker" className="block rounded-3xl gradient-agro p-4 text-white shadow-card">
            <p className="text-xs uppercase tracking-widest text-white/80">Broker</p>
            <p className="mt-1 font-semibold">Open broker dashboard</p>
          </Link>
        )}
        {role === "vendor" && (
          <Link to="/vendor" className="block rounded-3xl gradient-violet p-4 text-white shadow-card">
            <p className="text-xs uppercase tracking-widest text-white/80">Vendor</p>
            <p className="mt-1 font-semibold">Open vendor dashboard</p>
          </Link>
        )}

        {/* Partner */}
        <Link to="/partner" className="flex items-center gap-3 rounded-3xl border border-dashed border-violet/40 bg-violet-soft/30 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
            <Lock size={16} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy">Partner status</p>
            <p className="text-xs text-muted-foreground">Locked — unlocked after verified commitment.</p>
          </div>
          <ArrowRight size={14} className="text-violet" />
        </Link>

        {/* Support */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/support" className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-navy">
            <Headphones size={16} className="text-violet" /> Support
          </Link>
          <Link to="/support/dispute" className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-navy">
            <AlertTriangle size={16} className="text-warn" /> Dispute
          </Link>
        </div>

        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Projected values are estimates. Review the custody receipt and contract before investing.
        </p>
      </div>
    </AppShell>
  );
}

function Tile({
  icon: Icon, label, sub, to, tone,
}: {
  icon: any; label: string; sub: string; to: string;
  tone: "agro" | "violet" | "navy" | "soft";
}) {
  const styles = {
    agro: "from-agro/15 to-agro/5 text-agro",
    violet: "from-violet/15 to-violet/5 text-violet",
    navy: "from-navy/15 to-navy/5 text-navy",
    soft: "from-muted to-secondary text-navy",
  }[tone];
  return (
    <Link
      to={to as any}
      className="group rounded-3xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${styles}`}>
        <Icon size={18} />
      </span>
      <p className="mt-3 text-sm font-semibold text-navy">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </Link>
  );
}

function activityMeta(type: string, meta?: string) {
  const m = (meta ?? "").toLowerCase();
  if (type === "invest" && m.includes("propert")) {
    return { Icon: Building2, title: "Asset purchased", subtitle: "Buy Assets", bg: "bg-violet-soft", fg: "text-violet" };
  }
  if (type === "invest") {
    return { Icon: Sprout, title: "Investment bought", subtitle: "FarmVest", bg: "bg-agro-soft", fg: "text-agro" };
  }
  if (type === "swap") {
    return { Icon: RefreshCw, title: "Token swap", subtitle: "Wallet", bg: "bg-violet-soft", fg: "text-violet" };
  }
  if (type === "receive") {
    return { Icon: ArrowDownLeft, title: "Received", subtitle: "Wallet", bg: "bg-agro-soft", fg: "text-agro" };
  }
  if (type === "send") {
    return { Icon: ArrowUpRight, title: "Sent", subtitle: "Wallet", bg: "bg-secondary", fg: "text-navy" };
  }
  if (type === "reward") {
    return { Icon: Gift, title: "Reward earned", subtitle: "Broker", bg: "bg-violet-soft", fg: "text-violet" };
  }
  return { Icon: ShoppingBag, title: "Product purchased", subtitle: "Order", bg: "bg-secondary", fg: "text-navy" };
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

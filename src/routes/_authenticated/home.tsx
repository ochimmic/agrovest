import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck, ArrowRight, Sprout, LineChart, Wallet, GraduationCap,
  AlertTriangle, FileText, Headphones, Sparkles, Lock,
  Activity, ShoppingBag, Building2, Gift, ArrowDownLeft, ArrowUpRight, RefreshCw, Calculator,
  CalendarClock, MessageCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NGN_PER_USD, useFxRate, fmtUsd } from "@/lib/fx";
import { usePayments } from "@/lib/payments";
import { supabase } from "@/integrations/supabase/client";
import { LAND_NGN_PER_PLOT, MGMT_NGN_PER_PLOT } from "@/lib/pricing";
import { AppShell } from "@/components/shell/AppShell";
import { useAppState } from "@/lib/store";
import { useVault, tokenList } from "@/lib/wallet/store";
import { shortAddr } from "@/lib/wallet/chain";
import { useLivePrices } from "@/lib/clyst-price";
import { farmAssets } from "@/lib/mock-data";
import {
  BscBadge, NonCustodialBadge, CustodyBackedBadge, RiskBadge, AgroBadge,
} from "@/components/ui/agro-badge";

export const Route = createFileRoute("/_authenticated/home")({ component: Home });

function Home() {
  useFxRate();
  const user = useAppState((s) => s.user);
  const role = useAppState((s) => s.role);
  const kyc = useAppState((s) => s.kyc);
  const holdings = useAppState((s) => s.holdings);
  const txs = useAppState((s) => s.txs);
  const orders = usePayments((s) => s.orders);
  const openOrders = orders.filter((o) => o.status !== "confirmed" && o.status !== "rejected").length;
  const pendingOrders = orders.filter((o) => o.status !== "confirmed" && o.status !== "rejected" && o.status !== "awaiting_payment");
  const [commission, setCommission] = useState(0);
  useLivePrices();
  const vaultAddress = useVault((s) => s.address);
  const vaultNetwork = useVault((s) => s.network);
  const vaultCustom = useVault((s) => s.customTokens);
  const vaultBalances = useVault((s) => s.balances);
  const vaultLoading = useVault((s) => s.loading);

  useEffect(() => {
    if (role !== "broker") return;
    void supabase.rpc("my_commission_balance").then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data;
      setCommission(Number(row?.earned ?? 0));
    });
  }, [role]);

  const rwaValue = holdings.reduce((sum, h) => sum + h.invested, 0);
  const houseCount = holdings.filter((h) => (h as { category?: string }).category === "property").length;
  const farmCount = holdings.length - houseCount;
  const pendingCount = pendingOrders.length;
  const pendingUsd = pendingOrders.reduce((s, o) => s + o.amountUsd, 0);
  const cryptoRows = tokenList({ network: vaultNetwork, customTokens: vaultCustom } as Parameters<typeof tokenList>[0])
    .map((t) => ({ symbol: t.symbol, amount: vaultBalances[t.symbol]?.formatted ?? 0, usd: t.usd }))
    .filter((t) => t.amount > 0);
  const cryptoValue = cryptoRows.reduce((s, t) => s + t.amount * t.usd, 0);
  const usd = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const ngn = (v: number) => `₦${Math.round(v * NGN_PER_USD).toLocaleString()}`;
  const first = user?.name?.split(" ")[0] ?? "Investor";

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        {/* Greeting */}
        <section className="animate-in-up">
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold text-navy">Hi, {first}</h1>
        </section>

        {/* Portfolio hero — RWA and AssetVault kept separate */}
        <section className="relative overflow-hidden rounded-3xl gradient-navy p-5 text-white shadow-pop">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet/40 blur-3xl" />
          <div className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-agro/25 blur-3xl" />
          <div className="relative space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/60">My portfolio</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">
                <ShieldCheck size={12} /> KYC {kyc}
              </span>
            </div>

            {role === "broker" && (
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] uppercase tracking-widest text-white/60">Commission to date</p>
                <p className="mt-1 text-2xl font-semibold tabular">{usd(commission)}</p>
                <p className="text-[11px] text-white/70 tabular">≈ {ngn(commission)}</p>
              </div>
            )}

            {/* RWA */}
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/70">
                  <Building2 size={12} /> RWA investments
                </p>
                <CustodyBackedBadge size="xs" />
              </div>
              <p className="mt-1 text-[28px] font-semibold tracking-tight tabular leading-tight">{usd(rwaValue)}</p>
              <p className="text-[11px] text-white/70 tabular">≈ {ngn(rwaValue)}</p>
              <p className="mt-1 text-[11px] text-white/60">
                {farmCount} farm · {houseCount} house holding{holdings.length === 1 ? "" : "s"}
              </p>
              {pendingCount > 0 && (
                <Link to="/orders" className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                  <CalendarClock size={11} /> {pendingCount} pending admin confirmation · {usd(pendingUsd)}
                </Link>
              )}
            </div>

            {/* AssetVault */}
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/70">
                  <Wallet size={12} /> AssetVault crypto
                </p>
                <div className="flex gap-1"><BscBadge size="xs" /><NonCustodialBadge size="xs" /></div>
              </div>
              {vaultAddress ? (
                <>
                  <p className="mt-1 text-[28px] font-semibold tracking-tight tabular leading-tight">
                    {vaultLoading && cryptoValue === 0 ? "…" : usd(cryptoValue)}
                  </p>
                  <p className="text-[11px] text-white/70 tabular">≈ {ngn(cryptoValue)} · {shortAddr(vaultAddress)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cryptoRows.map((t) => (
                      <span key={t.symbol} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] tabular">
                        {t.amount.toLocaleString(undefined, { maximumFractionDigits: t.amount < 1 ? 6 : 2 })} {t.symbol}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-white/70">
                  Not set up on this device.{" "}
                  <Link to="/wallet/intro" className="font-medium text-agro underline">Set up wallet</Link>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/invest/farmvest" className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium hover:bg-white/20 transition">
                Invest now <ArrowRight className="inline" size={14} />
              </Link>
              <Link to="/vault" className="rounded-2xl bg-agro text-white px-4 py-3 text-sm font-medium hover:brightness-110 transition">
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
                Required before investment or broker rewards.
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
            <Tile icon={LineChart} label="Buy Assets" sub="Sold by AgroVest" to="/invest/property" tone="violet" />
            <Tile icon={Wallet} label="AssetVault" sub="Non-custodial · BSC" to="/vault" tone="navy" />
            <Tile icon={FileText} label="Documents" sub="Receipts & contracts" to="/documents" tone="soft" />
            <Tile icon={CalendarClock} label="BuyByBit" sub="Pay small-small · 3/6/12 mo" to="/buybybit" tone="agro" />
            <Tile icon={MessageCircle} label="My orders" sub={openOrders ? `${openOrders} open · chat & receipts` : "Chat & receipts"} to="/orders" tone="violet" />
          </div>
          <Link to="/calculator" className="mt-3 flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-agro-soft text-agro"><Calculator size={18} /></span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy">Land &amp; currency calculator</p>
              <p className="text-[11px] text-muted-foreground">Plots, acres, hectares · price &amp; ROI · ₦ ⇄ $</p>
            </div>
            <ArrowRight size={16} className="text-agro" />
          </Link>
        </section>

        {/* Activity */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-violet" />
              <h2 className="text-sm font-semibold text-navy">Recent activity</h2>
            </div>
            <Link to="/orders" className="text-xs text-violet">See all</Link>
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
                    <span className="text-muted-foreground">₦{((LAND_NGN_PER_PLOT + MGMT_NGN_PER_PLOT) / 1e6).toFixed(2)}M · {fmtUsd((LAND_NGN_PER_PLOT + MGMT_NGN_PER_PLOT) / NGN_PER_USD)}/plot</span>
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

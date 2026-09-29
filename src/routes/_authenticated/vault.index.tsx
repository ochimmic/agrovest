import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft, ArrowUpRight, Copy, Plus, RefreshCw, Settings2, Landmark,
  ExternalLink, ArrowUpRight as Up, ArrowDownRight as Down, Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { AgroButton } from "@/components/ui/agro-button";
import { AgroBadge, BscBadge, NonCustodialBadge } from "@/components/ui/agro-badge";
import { fmtNgn } from "@/lib/fx";
import { NETWORKS, shortAddr, txUrl } from "@/lib/wallet/chain";
import { refreshBalances, tokenList, useVault } from "@/lib/wallet/store";

export const Route = createFileRoute("/_authenticated/vault/")({
  head: () => ({
    meta: [
      { title: "AssetVault — Your BSC wallet | AgroVest" },
      { name: "description", content: "Hold, send and receive BNB, USDT, cUSD and any BEP-20 token in your non-custodial AgroVest AssetVault." },
      { property: "og:title", content: "AssetVault — Your BSC wallet | AgroVest" },
      { property: "og:description", content: "Non-custodial BSC wallet powering every payment inside AgroVest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VaultHome,
});

type Pair = { sym: string; name: string; price: number; change: number; spark: number[] };
const internationalMarkets: Pair[] = [
  { sym: "CLYST", name: "Clyst", price: 0.42, change: 4.8, spark: [4,5,4,6,7,6,8,9,8,10,11,10,12] },
  { sym: "BNB", name: "BNB", price: 612.4, change: -1.2, spark: [10,11,10,9,10,9,8,9,8,7,8,7,8] },
  { sym: "BTC", name: "Bitcoin", price: 71240, change: 2.1, spark: [6,7,7,8,7,8,9,9,10,9,10,11,11] },
  { sym: "ETH", name: "Ethereum", price: 3820, change: 0.6, spark: [8,8,9,8,9,9,10,9,10,10,11,10,11] },
  { sym: "cUSD", name: "Clyst USD", price: 1.0, change: 0.0, spark: [9,9,10,9,10,9,10,10,9,10,9,10,10] },
];
const newListings: Pair[] = [
  { sym: "WKC", name: "Wikicat", price: 0.0008, change: 3.4, spark: [4,5,5,6,5,7,6,8,7,9,8,10,11] },
  { sym: "TKC", name: "The Kingdom Coin", price: 0.027, change: -2.1, spark: [11,10,11,10,9,10,9,8,9,8,9,8,7] },
  { sym: "HKM", name: "Hakrium", price: 0.014, change: 5.6, spark: [3,4,4,5,6,5,7,8,8,9,10,11,12] },
  { sym: "GTAN", name: "Giant Token", price: 0.092, change: 1.8, spark: [6,6,7,7,8,7,8,9,9,10,9,10,11] },
  { sym: "CARDIO", name: "Cardio Coin", price: 0.31, change: -0.9, spark: [10,10,9,10,9,10,9,9,10,9,10,9,9] },
];

function VaultHome() {
  const ready = useVault((s) => s.ready);
  const address = useVault((s) => s.address);
  const network = useVault((s) => s.network);
  const balances = useVault((s) => s.balances);
  const loading = useVault((s) => s.loading);
  const custom = useVault((s) => s.customTokens);
  const txs = useVault((s) => s.txs);
  const [refreshing, setRefreshing] = useState(false);

  const tokens = tokenList({ network, customTokens: custom } as any);
  const total = tokens.reduce((sum, t) => sum + (balances[t.symbol]?.formatted ?? 0) * t.usd, 0);

  if (ready && !address) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <div className="rounded-3xl gradient-navy p-6 text-white shadow-pop">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <WalletIcon size={24} />
            </div>
            <h1 className="mt-4 text-xl font-semibold">AssetVault</h1>
            <p className="mt-1 text-sm text-white/70">
              Your non-custodial BSC wallet. Hold BNB, USDT, cUSD and any BEP-20 token,
              send and receive on-chain, and pay for everything inside AgroVest.
            </p>
            <AgroButton size="lg" variant="agro" className="mt-4" asChild>
              <Link to="/wallet/intro"><Plus size={16} /> Set up wallet</Link>
            </AgroButton>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4 pb-4">
        <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-violet/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-white/60">AssetVault · Balance</span>
              <Link
                to="/vault/settings"
                className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80"
              >
                {NETWORKS[network].label}
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <BscBadge size="xs" />
              <NonCustodialBadge size="xs" />
            </div>
            <p className="mt-3 text-[34px] font-semibold tabular leading-none">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-white/60 tabular">≈ {fmtNgn(total)}</p>

            <div className="mt-4 flex items-center gap-2">
              <code className="text-[11px] text-white/70 truncate">{shortAddr(address)}</code>
              <button
                aria-label="Copy wallet address"
                className="text-white/70"
                onClick={() => { void navigator.clipboard?.writeText(address ?? ""); toast.success("Address copied"); }}
              >
                <Copy size={12} />
              </button>
              <button
                aria-label="Refresh balances"
                className="ml-auto text-white/70"
                onClick={async () => { setRefreshing(true); await refreshBalances(); setRefreshing(false); }}
              >
                <RefreshCw size={13} className={loading || refreshing ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              <Action label="Send" Icon={ArrowUpRight} to="/vault/send" />
              <Action label="Receive" Icon={ArrowDownLeft} to="/vault/receive" />
              <Action label="Fund" Icon={Landmark} to="/prichat" />
              <Action label="Tokens" Icon={Settings2} to="/vault/tokens" />
            </div>
          </div>
        </section>

        {/* Token balances */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Your tokens</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {tokens.map((t) => {
              const bal = balances[t.symbol]?.formatted ?? 0;
              const pending = !t.native && !t.address;
              return (
                <div key={t.symbol} className="flex items-center gap-3 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
                    {t.symbol.slice(0, 3)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.symbol}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {pending ? "Contract address pending" : t.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground tabular">
                      {bal.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular">${(bal * t.usd).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/vault/tokens" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-violet">
            <Plus size={12} /> Add a BEP-20 token
          </Link>
        </section>

        {/* Activity */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">On-chain activity</h2>
          {txs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No transactions yet on {NETWORKS[network].label}.
            </p>
          ) : (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {txs.slice(0, 8).map((t) => (
                <a
                  key={t.hash}
                  href={txUrl(t.network, t.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground">
                    {t.kind === "receive" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {t.kind === "payment" ? "Payment" : t.kind === "send" ? "Sent" : "Received"} {t.amount} {t.token}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {t.note ?? shortAddr(t.to ?? t.from)} · {new Date(t.at).toLocaleString()}
                    </p>
                  </div>
                  <AgroBadge
                    size="xs"
                    tone={t.status === "confirmed" ? "agro" : t.status === "failed" ? "danger" : "warn"}
                  >
                    {t.status}
                  </AgroBadge>
                  <ExternalLink size={12} className="text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </section>

        <MarketRow title="International Markets" chip="Global" tone="violet" items={internationalMarkets} />
        <MarketRow title="New Listing" chip="Fresh" tone="agro" items={newListings} />
      </div>
    </AppShell>
  );
}

function Action({ label, Icon, to }: { label: string; Icon: any; to: string }) {
  return (
    <Link
      to={to as any}
      className="rounded-2xl bg-white/10 px-2 py-2.5 text-white text-[11px] font-medium flex flex-col items-center gap-1 hover:bg-white/15 transition"
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

function MarketRow({ title, chip, tone, items }: { title: string; chip: string; tone: "violet" | "agro"; items: Pair[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone === "violet" ? "bg-violet/15 text-violet" : "bg-agro/15 text-agro"}`}>
            {chip}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Informational</span>
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
        {items.map((m) => <MarketCard key={m.sym} m={m} />)}
      </div>
    </section>
  );
}

function MarketCard({ m }: { m: Pair }) {
  const up = m.change >= 0;
  const max = Math.max(...m.spark), min = Math.min(...m.spark);
  const w = 72, h = 28;
  const pts = m.spark.map((v, i) => {
    const x = (i / (m.spark.length - 1)) * w;
    const y = h - ((v - min) / Math.max(max - min, 1)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div className="min-w-[160px] rounded-2xl bg-card border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">{m.sym}<span className="text-muted-foreground font-normal">/USD</span></p>
          <p className="text-[10px] text-muted-foreground">{m.name}</p>
        </div>
        <svg width={w} height={h} className="overflow-visible">
          <polyline fill="none" stroke={up ? "var(--color-agro)" : "#ef4444"} strokeWidth="1.5" points={pts} />
        </svg>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-sm font-semibold text-foreground tabular">${m.price < 10 ? m.price.toFixed(4) : m.price.toLocaleString()}</p>
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${up ? "text-agro" : "text-red-500"}`}>
          {up ? <Up size={11} /> : <Down size={11} />}
          {up ? "+" : ""}{m.change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

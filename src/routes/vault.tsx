import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownUp, Copy, ShieldCheck, History, Plus, ArrowUpRight, ArrowDownRight, Zap, Settings2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { AgroButton } from "@/components/ui/agro-button";
import { useAppState, setState, addTx } from "@/lib/store";
import { toast } from "sonner";
import { BscBadge, NonCustodialBadge } from "@/components/ui/agro-badge";

export const Route = createFileRoute("/vault")({ component: Vault });

// 1 cUSD = 1 USD. 1 CLYST ≈ $0.42 → 1 cUSD ≈ 2.381 CLYST
const CLYST_USD = 0.42;
const cusdToClyst = (c: number) => c / CLYST_USD;
const clystToCusd = (c: number) => c * CLYST_USD;

type Pair = { sym: string; name: string; price: number; change: number; spark: number[] };
const internationalMarkets: Pair[] = [
  { sym: "CLYST", name: "Clyst", price: 0.42, change: 4.8, spark: [4,5,4,6,7,6,8,9,8,10,11,10,12] },
  { sym: "BNB", name: "BNB", price: 612.4, change: -1.2, spark: [10,11,10,9,10,9,8,9,8,7,8,7,8] },
  { sym: "BTC", name: "Bitcoin", price: 71240, change: 2.1, spark: [6,7,7,8,7,8,9,9,10,9,10,11,11] },
  { sym: "ETH", name: "Ethereum", price: 3820, change: 0.6, spark: [8,8,9,8,9,9,10,9,10,10,11,10,11] },
  { sym: "cUSD", name: "Clyst USD", price: 1.0, change: 0.0, spark: [9,9,10,9,10,9,10,10,9,10,9,10,10] },
];
const africanMarkets: Pair[] = [
  { sym: "WKC", name: "Wikicat", price: 0.0008, change: 3.4, spark: [4,5,5,6,5,7,6,8,7,9,8,10,11] },
  { sym: "TKC", name: "The Kingdom Coin", price: 0.027, change: -2.1, spark: [11,10,11,10,9,10,9,8,9,8,9,8,7] },
  { sym: "HKM", name: "Hakrium", price: 0.014, change: 5.6, spark: [3,4,4,5,6,5,7,8,8,9,10,11,12] },
  { sym: "GTAN", name: "Giant Token", price: 0.092, change: 1.8, spark: [6,6,7,7,8,7,8,9,9,10,9,10,11] },
  { sym: "CARDIO", name: "Cardio Coin", price: 0.31, change: -0.9, spark: [10,10,9,10,9,10,9,9,10,9,10,9,9] },
];

function Vault() {
  const wallet = useAppState((s) => s.wallet);
  const [topUp, setTopUp] = useState(false);
  const [rule, setRule] = useState(false);

  if (!wallet) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <div className="rounded-3xl gradient-navy p-6 text-white shadow-pop">
            <h1 className="text-xl font-semibold">AssetVault</h1>
            <p className="mt-1 text-sm text-white/70">Set up your non-custodial wallet to invest, swap, and store cUSD.</p>
            <AgroButton size="lg" variant="agro" className="mt-4" asChild>
              <Link to="/wallet/intro"><Plus size={16} /> Set up wallet</Link>
            </AgroButton>
          </div>
        </div>
      </AppShell>
    );
  }

  const cusd = wallet.cusd ?? 2500;
  const clyst = wallet.clyst;
  const spendableUsd = clystToCusd(clyst);
  const auto = wallet.autoTopUp ?? { enabled: false, min: 200, refill: 500 };
  const last = wallet.lastConversion ?? null;

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4 pb-4">
        {/* Primary balance: cUSD */}
        <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-violet/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-white/60">AssetVault · Balance</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">Stable · cUSD</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <BscBadge size="xs" />
              <NonCustodialBadge size="xs" />
            </div>
            <p className="mt-3 text-[34px] font-semibold tabular leading-none">
              ${cusd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-white/60 text-base ml-1">cUSD</span>
            </p>

            {/* Spendable chip */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px]">
                <Zap size={11} className="text-amber-300" />
                {clyst.toLocaleString()} $CLYST
                <span className="text-white/50">≈ ${spendableUsd.toFixed(2)}</span>
              </span>
              {auto.enabled && (
                <span className="rounded-full bg-violet/30 px-2 py-1 text-[10px]">Auto top-up on</span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <code className="text-[11px] text-white/70 truncate">{wallet.address}</code>
              <button className="text-white/70" onClick={() => { navigator.clipboard?.writeText(wallet.address); toast.success("Address copied"); }}><Copy size={12} /></button>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              <Action label="Top up" Icon={Plus} onClick={() => setTopUp(true)} />
              <Action label="Swap" Icon={ArrowDownUp} to="/wallet/swap" />
              <Action label="History" Icon={History} to="/wallet/history" />
              <Action label="Safety" Icon={ShieldCheck} to="/wallet/security" />
            </div>

            {last && (
              <p className="mt-3 text-[11px] text-white/60">
                Last conversion · {last.inAmt.toLocaleString()} {last.from} → {last.outAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })} {last.to} · {new Date(last.at).toLocaleString()}
              </p>
            )}
          </div>
        </section>

        {/* Auto top-up rule */}
        <section className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-navy">Auto top-up $CLYST</p>
              <p className="text-[11px] text-muted-foreground">
                {auto.enabled
                  ? `Keep ≥ ${auto.min} $CLYST · refill ${auto.refill} from cUSD`
                  : "Off — top up manually before transactions"}
              </p>
            </div>
            <button
              onClick={() => setRule(true)}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-navy"
            >
              <Settings2 size={12} /> Configure
            </button>
          </div>
        </section>

        {/* International Markets */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">International Markets</h2>
              <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[10px] font-medium text-violet">Global</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Informational</span>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {internationalMarkets.map((m) => (
              <MarketCard key={m.sym} m={m} />
            ))}
          </div>
        </section>

        {/* African Markets */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">New Listing</h2>
              <span className="rounded-full bg-agro/15 px-2 py-0.5 text-[10px] font-medium text-agro">Fresh</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Informational</span>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {africanMarkets.map((m) => (
              <MarketCard key={m.sym} m={m} />
            ))}
          </div>
        </section>

      </div>

      {topUp && (
        <TopUpSheet
          cusd={cusd}
          onClose={() => setTopUp(false)}
        />
      )}
      {rule && (
        <RuleSheet
          current={auto}
          onClose={() => setRule(false)}
        />
      )}
    </AppShell>
  );
}

function Action({ label, Icon, to, onClick }: { label: string; Icon: any; to?: string; onClick?: () => void }) {
  const cls = "rounded-2xl bg-white/10 px-2 py-2.5 text-white text-[11px] font-medium flex flex-col items-center gap-1 hover:bg-white/15 transition";
  if (to) return <Link to={to as any} className={cls}><Icon size={16} />{label}</Link>;
  return <button onClick={onClick} className={cls}><Icon size={16} />{label}</button>;
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
          <p className="text-xs font-semibold text-navy">{m.sym}<span className="text-muted-foreground font-normal">/USD</span></p>
          <p className="text-[10px] text-muted-foreground">{m.name}</p>
        </div>
        <svg width={w} height={h} className="overflow-visible">
          <polyline fill="none" stroke={up ? "var(--color-agro)" : "#ef4444"} strokeWidth="1.5" points={pts} />
        </svg>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-sm font-semibold text-navy tabular">${m.price < 10 ? m.price.toFixed(4) : m.price.toLocaleString()}</p>
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${up ? "text-agro" : "text-red-500"}`}>
          {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {up ? "+" : ""}{m.change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function TopUpSheet({ cusd, onClose }: { cusd: number; onClose: () => void }) {
  const [amt, setAmt] = useState("");
  const value = parseFloat(amt) || 0;
  const out = useMemo(() => cusdToClyst(value), [value]);
  const fee = value * 0.003;
  const insufficient = value > cusd;

  const submit = () => {
    if (!value || insufficient) return;
    setState((s) => ({
      wallet: s.wallet ? {
        ...s.wallet,
        cusd: (s.wallet.cusd ?? 2500) - value,
        clyst: s.wallet.clyst + out,
        lastConversion: { from: "cUSD", to: "CLYST", inAmt: value, outAmt: out, at: new Date().toISOString() },
      } : s.wallet,
    }));
    addTx({ type: "swap", amount: value, token: "CLYST", status: "confirmed", meta: `cUSD → CLYST`, hash: "0x" + Math.random().toString(16).slice(2, 10) });
    toast.success(`Topped up ${out.toFixed(2)} $CLYST`);
    onClose();
  };

  return (
    <Sheet title="Top up $CLYST" onClose={onClose}>
      <p className="text-xs text-muted-foreground">Convert cUSD into spendable $CLYST for in-app transactions.</p>
      <div className="mt-3 rounded-2xl bg-card border border-border p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">From cUSD</p>
          <p className="text-[11px] text-muted-foreground">Bal ${cusd.toFixed(2)}</p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-semibold text-navy outline-none tabular"
          />
          <button onClick={() => setAmt(String(Math.min(cusd, 100)))} className="rounded-full bg-secondary px-2 py-1 text-[10px]">100</button>
          <button onClick={() => setAmt(String(cusd))} className="rounded-full bg-secondary px-2 py-1 text-[10px]">Max</button>
        </div>
      </div>
      <div className="mt-2 rounded-2xl bg-violet-soft/40 p-3 text-xs text-navy space-y-1">
        <Row label="You receive" value={`${out.toFixed(2)} $CLYST`} />
        <Row label="Rate" value={`1 cUSD = ${cusdToClyst(1).toFixed(3)} CLYST`} />
        <Row label="Network fee" value={`~$${fee.toFixed(2)}`} />
      </div>
      {insufficient && <p className="mt-2 text-[11px] text-red-500">Insufficient cUSD balance.</p>}
      <AgroButton size="xl" className="mt-3" onClick={submit}>Confirm top-up</AgroButton>
    </Sheet>
  );
}

function RuleSheet({ current, onClose }: { current: { enabled: boolean; min: number; refill: number }; onClose: () => void }) {
  const [enabled, setEnabled] = useState(current.enabled);
  const [min, setMin] = useState(String(current.min));
  const [refill, setRefill] = useState(String(current.refill));

  const save = () => {
    setState((s) => ({
      wallet: s.wallet ? {
        ...s.wallet,
        autoTopUp: { enabled, min: parseFloat(min) || 0, refill: parseFloat(refill) || 0 },
      } : s.wallet,
    }));
    toast.success("Auto top-up updated");
    onClose();
  };

  return (
    <Sheet title="Auto top-up rule" onClose={onClose}>
      <p className="text-xs text-muted-foreground">Automatically convert cUSD → $CLYST when your spendable balance falls below a threshold.</p>
      <label className="mt-3 flex items-center justify-between rounded-2xl bg-card border border-border p-3">
        <span className="text-sm text-navy font-medium">Enable rule</span>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-violet" />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Min $CLYST" value={min} setValue={setMin} />
        <Field label="Refill amount ($CLYST)" value={refill} setValue={setRefill} />
      </div>
      <AgroButton size="xl" className="mt-3" onClick={save}>Save rule</AgroButton>
    </Sheet>
  );
}

function Field({ label, value, setValue }: { label: string; value: string; setValue: (v: string) => void }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="mt-1 w-full bg-transparent text-lg font-semibold text-navy outline-none tabular" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="tabular">{value}</span></div>;
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-[430px] rounded-t-3xl bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-navy">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

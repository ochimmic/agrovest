import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight, ArrowDownLeft, Plus, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AgroBadge, FarmRemitBadge, NonCustodialBadge } from "@/components/ui/agro-badge";
import { AgroButton } from "@/components/ui/agro-button";
import { useFarmRemit, createOrder, statusLabel, statusTone, type OrderSide } from "@/lib/farmremit";
import { NGN_PER_USD } from "@/lib/fx";
import { toast } from "sonner";

export const Route = createFileRoute("/prichat")({ component: FarmRemit });

function FarmRemit() {
  const nav = useNavigate();
  const orders = useFarmRemit((s) => s.orders);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "buy" | "sell" | "open">("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter === "buy" && o.side !== "buy") return false;
      if (filter === "sell" && o.side !== "sell") return false;
      if (filter === "open" && (o.status === "confirmed" || o.status === "cancelled")) return false;
      if (q && !`${o.id} ${o.peer}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [orders, filter, q]);

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">GoPay</h1>
          <p className="text-sm text-muted-foreground">
            Peer-to-peer Naira on/off ramp for cUSD. Settled manually with AgroVest escrow.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <FarmRemitBadge size="xs" />
            <NonCustodialBadge size="xs" />
            <AgroBadge tone="warn" size="xs">Manual settlement</AgroBadge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setShowNew(true); }}
            className="rounded-2xl bg-agro text-white p-3 text-left shadow-card hover:brightness-110 transition"
          >
            <div className="flex items-center gap-2">
              <ArrowDownLeft size={16} /><span className="text-xs font-semibold uppercase tracking-wide">Buy cUSD</span>
            </div>
            <p className="mt-1 text-[11px] text-white/80">Pay NGN, receive cUSD in your AssetVault</p>
          </button>
          <button
            onClick={() => { setShowNew(true); }}
            className="rounded-2xl gradient-violet text-white p-3 text-left shadow-card hover:brightness-110 transition"
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight size={16} /><span className="text-xs font-semibold uppercase tracking-wide">Sell cUSD</span>
            </div>
            <p className="mt-1 text-[11px] text-white/80">Convert cUSD to NGN paid to your bank</p>
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card h-11 px-3">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search by order ID or peer"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {([
            ["all", "All"],
            ["open", "Open"],
            ["buy", "Buy"],
            ["sell", "Sell"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`shrink-0 h-9 rounded-full px-3.5 text-xs font-medium transition ${
                filter === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to="/prichat/$id"
              params={{ id: o.id }}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3"
            >
              <span className={`h-11 w-11 rounded-full grid place-items-center text-white ${
                o.side === "buy" ? "bg-agro" : "gradient-violet"
              }`}>
                {o.side === "buy" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy">
                    {o.side === "buy" ? "Buy" : "Sell"} ${o.amountUsd.toLocaleString()} cUSD
                  </p>
                  <AgroBadge tone={statusTone[o.status]} size="xs">{statusLabel[o.status]}</AgroBadge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {o.peer} · ₦{(o.amountUsd * o.rate).toLocaleString()} @ ₦{o.rate}/USD
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{o.id.replace("fr_", "#")}</p>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              No orders match. Start a new buy or sell above.
            </p>
          )}
        </ul>

        <div className="rounded-2xl border border-violet/20 bg-violet-soft/40 p-3 text-[11px] text-navy leading-relaxed">
          <ShieldCheck size={12} className="inline mr-1 text-violet" />
          GoPay is a P2P matching service. AgroVest holds cUSD in escrow during settlement and only releases on
          verified payment. Chat in each order is auto-deleted 24h after settlement; transaction records are retained.
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full gradient-violet text-white shadow-glow flex items-center justify-center md:absolute md:right-6"
        >
          <Plus size={22} />
        </button>
      </div>

      {showNew && (
        <NewOrderSheet
          onClose={() => setShowNew(false)}
          onCreate={(side, amount) => {
            const o = createOrder({
              side,
              amountUsd: amount,
              rate: NGN_PER_USD,
              peer: side === "buy" ? "Auto-matched seller" : "Auto-matched buyer",
              bank: side === "buy" ? "GTBank • 0123456789" : "Your saved payout bank",
            });
            setShowNew(false);
            toast.success(`Order ${o.id.replace("fr_", "#")} opened`);
            nav({ to: "/prichat/$id", params: { id: o.id } });
          }}
        />
      )}
    </AppShell>
  );
}

function NewOrderSheet({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (side: OrderSide, amount: number) => void;
}) {
  const [side, setSide] = useState<OrderSide>("buy");
  const [amount, setAmount] = useState(500);
  const ngn = amount * NGN_PER_USD;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-card border-t border-border p-5 space-y-4 animate-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">New GoPay order</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary grid place-items-center">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["buy", "sell"] as OrderSide[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`rounded-2xl py-3 text-sm font-medium capitalize transition ${
                side === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {s} cUSD
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount (USD)</span>
          <input
            type="number"
            value={amount}
            min={20}
            onChange={(e) => setAmount(Math.max(20, Number(e.target.value) || 0))}
            className="mt-1 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-violet"
          />
        </label>

        <div className="rounded-2xl bg-secondary p-3 text-sm text-navy flex items-center justify-between">
          <span className="text-muted-foreground">You {side === "buy" ? "pay" : "receive"}</span>
          <span className="font-semibold tabular">₦{ngn.toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Rate ₦{NGN_PER_USD}/USD · indicative · final rate locked when an order opens.
        </p>

        <AgroButton size="xl" onClick={() => onCreate(side, amount)}>
          Open order
        </AgroButton>
      </div>
    </div>
  );
}

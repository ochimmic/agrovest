import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ArrowDownLeft, Plus, ShieldCheck, X, Building2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AgroBadge, FarmRemitBadge, NonCustodialBadge } from "@/components/ui/agro-badge";
import { AgroButton } from "@/components/ui/agro-button";
import { useFarmRemit, createOrder, statusLabel, statusTone } from "@/lib/farmremit";
import { NGN_PER_USD } from "@/lib/fx";
import { toast } from "sonner";

export const Route = createFileRoute("/prichat/")({ component: GoPay });

function GoPay() {
  const nav = useNavigate();
  const orders = useFarmRemit((s) => s.orders);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "settled">("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter === "open" && (o.status === "confirmed" || o.status === "cancelled")) return false;
      if (filter === "settled" && o.status !== "confirmed") return false;
      if (q && !`${o.id} ${o.reference ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [orders, filter, q]);

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">GoPay</h1>
          <p className="text-sm text-muted-foreground">
            Bank transfer top-up between you and AgroVest. Send NGN, AgroVest admin
            confirms the receipt, and your cUSD is credited to AssetVault.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <FarmRemitBadge size="xs" />
            <NonCustodialBadge size="xs" />
            <AgroBadge tone="warn" size="xs">Manual settlement</AgroBadge>
          </div>
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="w-full rounded-2xl bg-agro text-white p-4 text-left shadow-card hover:brightness-110 transition"
        >
          <div className="flex items-center gap-2">
            <ArrowDownLeft size={18} />
            <span className="text-sm font-semibold uppercase tracking-wide">Buy cUSD</span>
          </div>
          <p className="mt-1 text-xs text-white/85">
            Pay NGN to AgroVest's One-Time Account · receive cUSD after admin confirmation
          </p>
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card h-11 px-3">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search by order ID or reference"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {([
            ["all", "All"],
            ["open", "Open"],
            ["settled", "Settled"],
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
              hash="one-time-account"
              className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3"
            >
              <span className="h-11 w-11 rounded-full grid place-items-center text-white bg-agro">
                <Building2 size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy">
                    Buy ${o.amountUsd.toLocaleString()} cUSD
                  </p>
                  <AgroBadge tone={statusTone[o.status]} size="xs">{statusLabel[o.status]}</AgroBadge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  AgroVest · ₦{(o.amountUsd * o.rate).toLocaleString()} @ ₦{o.rate}/USD
                  {o.purpose && ` · funds ${o.purpose.assetName}`}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{o.reference ?? o.id.replace("fr_", "#")}</p>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              No orders match. Start a new buy above.
            </p>
          )}
        </ul>

        <div className="rounded-2xl border border-violet/20 bg-violet-soft/40 p-3 text-[11px] text-navy leading-relaxed">
          <ShieldCheck size={12} className="inline mr-1 text-violet" />
          GoPay is a direct top-up between you and AgroVest — there are no third-party sellers.
          AgroVest holds cUSD in escrow and only credits your AssetVault after an admin verifies your bank transfer.
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
          onCreate={(amount) => {
            const o = createOrder({ amountUsd: amount, rate: NGN_PER_USD });
            setShowNew(false);
            // Navigate directly to the Order Room's one-time account section.
            void nav({
              to: "/prichat/$id",
              params: { id: o.id },
              hash: "one-time-account",
            }).then(() => {
              toast.success(`Order ${o.reference} opened — use the one-time account below.`);
            });
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
  onCreate: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(500);
  const ngn = amount * NGN_PER_USD;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-card border-t border-border p-5 space-y-4 animate-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">Buy cUSD with bank transfer</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary grid place-items-center">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          You'll pay NGN into AgroVest's One-Time Account. cUSD is credited to your
          AssetVault once an AgroVest admin confirms your receipt.
        </p>

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
          <span className="text-muted-foreground">You pay</span>
          <span className="font-semibold tabular">₦{ngn.toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Rate ₦{NGN_PER_USD}/USD · indicative · final rate locked when the order opens.
        </p>

        <AgroButton size="xl" onClick={() => onCreate(amount)}>
          Open order
        </AgroButton>
      </div>
    </div>
  );
}
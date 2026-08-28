import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Lock, Wallet, Building2 } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { farmAssets, priceFor } from "@/lib/mock-data";
import { Money } from "@/components/ui/money";
import { createOrder } from "@/lib/farmremit";
import { NGN_PER_USD } from "@/lib/fx";
import { toast } from "sonner";
import { UnlockSheet } from "@/components/wallet/UnlockSheet";
import { TREASURY_ADDRESS } from "@/lib/wallet/chain";
import { isUnlocked, refreshBalances, tokenList, useVault } from "@/lib/wallet/store";
import { sendToken } from "@/lib/wallet/send";
import { createPayOrder, markPaidOnChain } from "@/lib/payments";

const search = z.object({
  unit: z.enum(["plot", "acre", "hectare"]).default("plot"),
  qty: z.coerce.number().min(1).default(1),
});

export const Route = createFileRoute("/invest/checkout/$id")({
  validateSearch: search,
  component: Checkout,
});

type Method = "wallet" | "bank";

function Checkout() {
  const { id } = Route.useParams();
  const { unit, qty } = Route.useSearch();
  const nav = useNavigate();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0]!;
  const p = priceFor(unit, qty);
  const [paying, setPaying] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [method, setMethod] = useState<Method>("wallet");

  const network = useVault((s) => s.network);
  const custom = useVault((s) => s.customTokens);
  const balances = useVault((s) => s.balances);
  const address = useVault((s) => s.address);

  const payable = useMemo(
    () => tokenList({ network, customTokens: custom } as any).filter((t) => t.native || t.address),
    [network, custom],
  );
  const [symbol, setSymbol] = useState(payable[0]?.symbol ?? "");
  const token = payable.find((t) => t.symbol === symbol) ?? payable[0];
  const tokenAmount = token && token.usd > 0 ? p.final / token.usd : 0;
  const bal = balances[token?.symbol ?? ""]?.formatted ?? 0;
  const insufficient = tokenAmount > bal;

  async function payFromVault() {
    if (!token) return;
    if (!isUnlocked()) { setUnlock(true); return; }
    setPaying(true);
    const order = createPayOrder({
      amountUsd: p.final,
      rate: NGN_PER_USD,
      token: token.symbol,
      purpose: {
        kind: "investment",
        assetId: asset.id,
        assetName: asset.name,
        category: asset.category,
        unit,
        qty,
      },
    });
    try {
      const hash = await sendToken({
        token,
        to: TREASURY_ADDRESS,
        amount: tokenAmount.toFixed(Math.min(token.decimals, 8)),
        kind: "payment",
        note: `${asset.name} · ${order.reference}`,
      });
      markPaidOnChain(order.id, hash, network);
      await refreshBalances();
      toast.success("Payment sent — awaiting AgroVest confirmation");
      void nav({ to: "/pay/$orderId", params: { orderId: order.id } });
    } catch (e: any) {
      toast.error(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setPaying(false);
    }
  }

  function pay() {
    if (method === "wallet") { void payFromVault(); return; }
    // Bank transfer → fund the wallet through a One-Time Account order.
    const order = createOrder({
      amountUsd: p.final,
      rate: NGN_PER_USD,
      purpose: {
        kind: "investment",
        assetId: asset.id,
        assetName: asset.name,
        category: asset.category,
        unit,
        qty,
      },
    });
    void nav({ to: "/prichat/$id", params: { id: order.id }, hash: "one-time-account" }).then(() => {
      toast.success(`Bank transfer order ${order.reference} opened — use the one-time account number below.`);
    });
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/invest/farmvest/$id" params={{ id }} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Secure checkout</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 space-y-4">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Investing in</p>
          <p className="mt-0.5 font-semibold text-foreground">{asset.name}</p>
          <p className="text-xs text-muted-foreground">{qty} × {unit}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <RowM k="Base" usd={p.base} />
          <RowM k="Platform fee (3%)" usd={p.platformFee} />
          <RowM k="Network fee" usd={p.networkFee} />
          <RowM k="Escrow reserve (20%, held)" usd={p.escrowReserve} muted />
          {p.discount > 0 && <RowM k="Discount" usd={-p.discount} accent />}
          <div className="border-t border-border my-1" />
          <RowM k="Total" usd={p.final} bold />
        </div>

        <div className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Pay with</h2>
          <div className="mt-3 space-y-2">
            <PayOption
              icon={<Wallet size={16} />}
              label="AssetVault balance"
              sub="Deducted on-chain from your BSC wallet"
              active={method === "wallet"}
              onClick={() => setMethod("wallet")}
            />
            <PayOption
              icon={<Building2 size={16} />}
              label="Fund by bank transfer"
              sub="Pay NGN to a One-Time account number · admin confirms, then cUSD lands in your AssetVault"
              active={method === "bank"}
              onClick={() => setMethod("bank")}
            />
          </div>

          {method === "wallet" && (
            <div className="mt-3 rounded-2xl bg-secondary p-3">
              {!address ? (
                <p className="text-xs text-muted-foreground">
                  No AssetVault on this device yet.{" "}
                  <Link to="/wallet/intro" className="font-medium text-violet">Set one up</Link>.
                </p>
              ) : (
                <>
                  <p className="text-[10px] text-muted-foreground">Token</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {payable.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => setSymbol(t.symbol)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          t.symbol === symbol ? "bg-violet text-white" : "bg-card text-foreground border border-border"
                        }`}
                      >
                        {t.symbol}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground tabular">
                    You pay {tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {token?.symbol} ·
                    balance {bal.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </p>
                  {insufficient && (
                    <p className="mt-1 text-[11px] text-destructive">
                      Not enough {token?.symbol}.{" "}
                      <Link to="/prichat" className="font-medium underline">Fund your wallet</Link>.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-violet-soft/40 border border-violet/20 p-3 text-xs text-foreground">
          <Lock size={14} className="mt-0.5 text-violet" />
          <p>
            Your payment goes on-chain immediately, but your holding is only created once an AgroVest
            admin confirms it. You'll receive your Custody Receipt and Contract at that point.
          </p>
        </div>
      </main>

      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton
          size="xl"
          onClick={pay}
          disabled={paying || (method === "wallet" && (!address || insufficient))}
        >
          {paying
            ? "Sending…"
            : method === "wallet"
              ? `Pay $${p.final.toLocaleString()} · ≈ ₦${(p.final * NGN_PER_USD).toLocaleString()}`
              : `Open bank transfer · ₦${(p.final * NGN_PER_USD).toLocaleString()}`}
        </AgroButton>
      </div>

      {unlock && (
        <UnlockSheet onClose={() => setUnlock(false)} onUnlocked={() => { setUnlock(false); void payFromVault(); }} />
      )}
    </MobileFrame>
  );
}

function RowM({ k, usd, bold, accent, muted }: { k: string; usd: number; bold?: boolean; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <Money usd={usd} layout="inline" size={bold ? "md" : "sm"} emphasis={accent ? "agro" : muted ? "muted" : "primary"} />
    </div>
  );
}

function PayOption({
  icon, label, sub, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-2xl border p-3 transition ${
        active ? "border-violet bg-violet-soft/30" : "border-border hover:border-violet/40"
      }`}
    >
      <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${
        active ? "bg-violet text-white" : "bg-secondary text-muted-foreground"
      }`}>
        {active ? <Check size={16} /> : icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}

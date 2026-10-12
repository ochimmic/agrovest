import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Lock, Wallet, Building2, DollarSign } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { AgroBadge } from "@/components/ui/agro-badge";
import { farmAssets, priceFor } from "@/lib/mock-data";
import { Money } from "@/components/ui/money";
import { NGN_PER_USD } from "@/lib/fx";
import { toast } from "sonner";
import { UnlockSheet } from "@/components/wallet/UnlockSheet";
import { PAYABLE_SYMBOLS, TOKENS, TREASURY_ADDRESS } from "@/lib/wallet/chain";
import { USD_ACCOUNT } from "@/lib/company";
import { isUnlocked, refreshBalances, useVault } from "@/lib/wallet/store";
import { sendToken } from "@/lib/wallet/send";
import { createPayOrder, markPaidOnChain, type PayRail } from "@/lib/payments";
import { useAppState } from "@/lib/store";
import { amountDue, attachOrder, installmentLabel, useAssetPay } from "@/lib/assetpay";
import { CalendarClock } from "lucide-react";
import { useHouse, housePrice } from "@/lib/properties";

const search = z.object({
  unit: z.enum(["plot", "acre", "hectare"]).default("plot"),
  qty: z.coerce.number().min(0.5).default(1),
  plan: z.string().optional(),
  inst: z.coerce.number().optional(),
  kind: z.enum(["farm", "property"]).default("farm"),
});

export const Route = createFileRoute("/_authenticated/invest/checkout/$id")({
  head: () => ({
    meta: [
      { title: "Secure checkout | AgroVest" },
      { name: "description", content: "Pay for your AgroVest farmland with crypto from your AssetVault, a naira bank transfer, or a US dollar transfer." },
      { property: "og:title", content: "Secure checkout | AgroVest" },
      { property: "og:description", content: "Three ways to pay: crypto, naira or US dollars — confirmed by an AgroVest admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: search,
  component: Checkout,
});

function Checkout() {
  const { id } = Route.useParams();
  const { unit, qty, plan: planId, inst, kind } = Route.useSearch();
  const isHouse = kind === "property";
  const house = useHouse(isHouse ? id : "__none__");
  const nav = useNavigate();
  const asset = farmAssets.find((a) => a.id === id) ?? farmAssets[0]!;
  const plan = useAssetPay((s) => (planId ? s.plans.find((x) => x.id === planId) : undefined));
  const installment = plan && inst != null ? plan.installments.find((i) => i.index === inst) : undefined;
  const fullPrice = priceFor(unit, qty);
  const hp = house ? housePrice(house) : null;
  const p = installment ? { ...fullPrice, final: amountDue(installment) } : isHouse ? { ...fullPrice, final: hp?.total ?? 0 } : fullPrice;
  const [paying, setPaying] = useState(false);
  const [unlock, setUnlock] = useState(false);
  const [rail, setRail] = useState<PayRail>("crypto");

  const user = useAppState((s) => s.user);
  const network = useVault((s) => s.network);
  const custom = useVault((s) => s.customTokens);
  const balances = useVault((s) => s.balances);
  const address = useVault((s) => s.address);

  const payable = useMemo(
    () =>
      [...TOKENS[network], ...custom].filter(
        (t) => (t.native || t.address) && PAYABLE_SYMBOLS.includes(t.symbol),
      ),
    [network, custom],
  );
  const [symbol, setSymbol] = useState(payable[0]?.symbol ?? "");
  const token = payable.find((t) => t.symbol === symbol) ?? payable[0];
  const tokenAmount = token && token.usd > 0 ? p.final / token.usd : 0;
  const bal = balances[token?.symbol ?? ""]?.formatted ?? 0;
  const insufficient = tokenAmount > bal;

  const purpose = {
    kind: "investment" as const,
    assetId: isHouse ? id : asset.id,
    assetName: isHouse ? house?.title ?? "House" : asset.name,
    category: isHouse ? ("property" as const) : asset.category,
    unit: isHouse ? ("house" as const) : unit,
    qty: isHouse ? 1 : qty,
    ...(installment && plan ? { planId: plan.id, installment: installment.index } : {}),
  };
  const link = (orderId: string) => { if (installment && plan) attachOrder(plan.id, installment.index, orderId); };

  async function payFromVault() {
    if (!token) return;
    if (!isUnlocked()) { setUnlock(true); return; }
    setPaying(true);
    const order = createPayOrder({
      amountUsd: p.final,
      rate: NGN_PER_USD,
      token: token.symbol,
      rail: "crypto",
      payerName: user?.name ?? "AgroVest user",
      purpose,
    });
    try {
      const hash = await sendToken({
        token,
        to: TREASURY_ADDRESS,
        amount: tokenAmount.toFixed(Math.min(token.decimals, 8)),
        kind: "payment",
        note: `${purpose.assetName} · ${order.reference}`,
      });
      markPaidOnChain(order.id, hash, network);
      link(order.id);
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
    if (rail === "crypto") { void payFromVault(); return; }
    const order = createPayOrder({
      amountUsd: p.final,
      rate: NGN_PER_USD,
      token: rail === "ngn" ? "NGN" : "USD",
      rail,
      payerName: user?.name ?? "AgroVest user",
      purpose,
    });
    link(order.id);
    void nav({ to: "/pay/$orderId", params: { orderId: order.id } }).then(() => {
      toast.success(`Ticket ${order.reference} created — use it as your transfer description.`);
    });
  }

  const usdBlocked = rail === "usd" && !USD_ACCOUNT.available;
  const ctaLabel = paying
    ? "Sending…"
    : rail === "crypto"
      ? `Pay $${p.final.toLocaleString()} · ≈ ₦${Math.round(p.final * NGN_PER_USD).toLocaleString()}`
      : rail === "ngn"
        ? `Get transfer details · ₦${Math.round(p.final * NGN_PER_USD).toLocaleString()}`
        : `Get transfer details · $${p.final.toLocaleString()}`;

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to={isHouse ? "/invest/property/$id" : "/invest/farmvest/$id"} params={{ id }} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Secure checkout</h1>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 space-y-4">
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Investing in</p>
          <p className="mt-0.5 font-semibold text-foreground">{purpose.assetName}</p>
          <p className="text-xs text-muted-foreground">{isHouse ? `${house?.location ?? ""} · AgroVest Direct` : `${qty} × ${unit}`}</p>
        </div>

        {installment ? (
          <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
            <p className="text-xs font-medium text-violet">Buy By Bit · {installmentLabel(installment.index)}</p>
            <RowM k="Installment" usd={installment.amountUsd} />
            {amountDue(installment) > installment.amountUsd && <RowM k="Late fee (5%)" usd={amountDue(installment) - installment.amountUsd} />}
            <div className="border-t border-border my-1" />
            <RowM k="Pay now" usd={p.final} bold />
          </div>
        ) : isHouse ? (
          <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
            {hp ? (<>
              <RowM k="Actual market price" usd={hp.actual} muted />
              <RowM k="AgroVest price (1% less)" usd={hp.agrovest} />
              <RowM k="Escrow (3%)" usd={hp.escrow} />
              <div className="border-t border-border my-1" />
              <RowM k="Total" usd={hp.total} bold />
            </>) : <p className="text-xs text-muted-foreground">Loading price…</p>}
          </div>
        ) : (
        <div className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <RowM k={`Land · ${fullPrice.plots} plot${fullPrice.plots === 1 ? "" : "s"}`} usd={fullPrice.base} />
          {fullPrice.discount > 0 && <RowM k={`Size discount (${fullPrice.discountPct}%)`} usd={-fullPrice.discount} accent />}
          <RowM k="Management fee (non-refundable)" usd={fullPrice.managementFee} />
          <div className="border-t border-border my-1" />
          <RowM k="Total" usd={p.final} bold />
        </div>
        )}

        {!installment && !isHouse && (
          <Link
            to="/assetpay/new/$id"
            params={{ id }}
            search={{ unit, qty }}
            className="flex items-center gap-3 rounded-3xl border border-violet/30 bg-violet-soft/30 p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet text-white"><CalendarClock size={16} /></span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">Can't pay at once? Use Buy By Bit</span>
              <span className="block text-[11px] text-muted-foreground">From 10% down, balance over 3, 6 or 12 months</span>
            </span>
          </Link>
        )}

        <div className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Pay with</h2>
          <div className="mt-3 space-y-2">
            <PayOption
              icon={<Wallet size={16} />}
              label="Crypto — AssetVault"
              sub="USDT, BNB or $CLYST sent to the AgroVest treasury"
              active={rail === "crypto"}
              onClick={() => setRail("crypto")}
            />
            <PayOption
              icon={<Building2 size={16} />}
              label="Naira bank transfer"
              sub="Transfer to AgroVest's Fidelity Bank account"
              active={rail === "ngn"}
              onClick={() => setRail("ngn")}
            />
            <PayOption
              icon={<DollarSign size={16} />}
              label="US dollar transfer"
              sub="Direct transfer to the AgroVest domiciliary account"
              active={rail === "usd"}
              onClick={() => setRail("usd")}
              badge={!USD_ACCOUNT.available ? "Coming soon" : undefined}
            />
          </div>

          {rail === "crypto" && (
            <div className="mt-3 rounded-2xl bg-secondary p-3">
              {!address ? (
                <p className="text-xs text-muted-foreground">
                  No AssetVault on this device yet.{" "}
                  <Link to="/wallet/intro" className="font-medium text-violet">Set one up</Link>.
                </p>
              ) : payable.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No payable token on {network}. Switch network in{" "}
                  <Link to="/vault/settings" className="font-medium text-violet">AssetVault settings</Link>.
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
                      Not enough {token?.symbol}. Choose another token or pay by bank transfer.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {rail !== "crypto" && (
            <div className="mt-3 rounded-2xl bg-secondary p-3 text-[11px] text-muted-foreground">
              {usdBlocked
                ? "The AgroVest dollar domiciliary account is being finalised. Pay in naira or crypto for now."
                : "You'll get the account details and a unique ticket ID on the next screen. Use the ticket ID as your transfer description."}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-violet-soft/40 border border-violet/20 p-3 text-xs text-foreground">
          <Lock size={14} className="mt-0.5 text-violet" />
          <p>
            Your holding is only created once an AgroVest admin confirms the payment. You'll receive your
            Custody Receipt and Contract at that point.
          </p>
        </div>
      </main>

      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton
          size="xl"
          onClick={pay}
          disabled={
            paying ||
            usdBlocked ||
            (isHouse && (!hp || house?.status !== "active")) ||
            (rail === "crypto" && (!address || !token || insufficient))
          }
        >
          {ctaLabel}
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
  icon, label, sub, active, onClick, badge,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
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
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {badge && <AgroBadge size="xs" tone="warn">{badge}</AgroBadge>}
        </div>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </button>
  );
}

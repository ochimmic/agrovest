import { LocalTime } from "@/components/ui/local-time";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, MessageSquare, Phone, Upload } from "lucide-react";
import { ACCEPT, uploadPrivate } from "@/lib/uploads";
import { toast } from "sonner";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroBadge } from "@/components/ui/agro-badge";
import { AgroButton } from "@/components/ui/agro-button";
import { Money } from "@/components/ui/money";
import { txUrl, type NetworkId } from "@/lib/wallet/chain";
import { NGN_ACCOUNT, USD_ACCOUNT, SUPPORT_PHONE } from "@/lib/company";
import { NGN_PER_USD } from "@/lib/fx";
import { markTransferNotified, payStatusLabel, payStatusTone, usePayments } from "@/lib/payments";

export const Route = createFileRoute("/_authenticated/pay/$orderId")({
  head: () => ({
    meta: [
      { title: "Payment status | AgroVest" },
      { name: "description", content: "Track your AgroVest payment from transfer through manual admin confirmation." },
      { property: "og:title", content: "Payment status | AgroVest" },
      { property: "og:description", content: "Follow every step of your AgroVest payment confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PayStatus,
});

function PayStatus() {
  const { orderId } = Route.useParams();
  const order = usePayments((s) => s.orders.find((o) => o.id === orderId));
  const account = order?.rail === "usd" ? USD_ACCOUNT : NGN_ACCOUNT;
  const isBank = order?.rail === "ngn" || order?.rail === "usd";
  const canNotify = order?.status === "awaiting_payment" || order?.status === "admin_review";
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function notify() {
    if (!order) return;
    setBusy(true);
    try {
      const path = receipt ? await uploadPrivate("payment-receipts", receipt, order.reference) : undefined;
      await markTransferNotified(order.id, path);
      toast.success("AgroVest has been notified — an admin will confirm shortly.");
      setReceipt(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to={order?.purpose.planId ? "/assetpay" : "/home"} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Payment status</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {!order ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            This payment isn't on this device.
          </p>
        ) : (
          <>
            <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-white/60">Ticket ID</span>
                <AgroBadge size="xs" tone={payStatusTone[order.status]}>{payStatusLabel[order.status]}</AgroBadge>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-semibold tracking-wide">{order.reference}</p>
                <CopyBtn value={order.reference} light />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular">${order.amountUsd.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-white/70">
                {order.purpose.qty} × {order.purpose.unit} · {order.purpose.assetName}
              </p>
              {order.purpose.planId && (
                <p className="mt-0.5 text-[11px] text-white/70">
                  Buy By Bit {order.purpose.installment === 0 ? "deposit" : `installment ${order.purpose.installment}`}
                </p>
              )}
              <p className="mt-2 text-[11px] text-white/60">
                {order.rail === "crypto"
                  ? `Paid in ${order.token}`
                  : order.rail === "ngn"
                    ? `≈ ₦${Math.round(order.amountUsd * NGN_PER_USD).toLocaleString()} by bank transfer`
                    : "US dollar transfer"}
              </p>
            </section>

            {isBank && (
              <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {order.rail === "ngn" ? "Transfer to AgroVest" : "AgroVest dollar account"}
                </h2>
                {!account.available ? (
                  <p className="rounded-2xl bg-secondary p-3 text-xs text-muted-foreground">
                    The dollar domiciliary account is being finalised. Please contact the AgroVest
                    team below, or pay in naira or crypto instead.
                  </p>
                ) : (
                  <>
                    <AcctRow k="Bank" v={account.bankName} />
                    <AcctRow k="Account name" v={account.accountName} />
                    <AcctRow k="Account number" v={account.accountNumber} copy />
                    {account.swift && <AcctRow k="SWIFT / BIC" v={account.swift} copy />}
                    <AcctRow
                      k="Amount"
                      v={order.rail === "ngn"
                        ? `₦${Math.round(order.amountUsd * NGN_PER_USD).toLocaleString()}`
                        : `$${order.amountUsd.toLocaleString()}`}
                    />
                    <div className="rounded-2xl bg-violet-soft/40 border border-violet/20 p-3 text-[11px] text-foreground">
                      Very important: enter <span className="font-semibold">{order.reference}</span> as the
                      transfer description or narration so AgroVest can match your payment.
                    </div>
                    {canNotify && (
                      <>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-violet/40 p-3">
                          <Upload size={16} className="text-violet" />
                          <span className="flex-1 text-xs text-foreground line-clamp-1">
                            {receipt ? receipt.name : "Attach transfer receipt (recommended)"}
                          </span>
                          <input type="file" accept={ACCEPT} className="hidden"
                            onChange={(e) => { setReceipt(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                        </label>
                        <AgroButton size="lg" onClick={notify} disabled={busy}>
                          {busy ? "Sending…" : "I have made the transfer"}
                        </AgroButton>
                      </>
                    )}
                    {order.receiptPath && (
                      <p className="flex items-center gap-1.5 text-[11px] text-agro"><Check size={12} /> Receipt received</p>
                    )}
                  </>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
              <Row k="Amount">
                <Money usd={order.amountUsd} layout="inline" size="sm" />
              </Row>
              <Row k="Status">
                <span className="text-foreground">{payStatusLabel[order.status]}</span>
              </Row>
              {order.txHash && (
                <Row k="On-chain">
                  <a
                    href={txUrl((order.network ?? "bsc-mainnet") as NetworkId, order.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-violet"
                  >
                    {order.txHash.slice(0, 10)}… <ExternalLink size={11} />
                  </a>
                </Row>
              )}
              {order.reason && <p className="text-[11px] text-destructive">{order.reason}</p>}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Timeline</h2>
              <ol className="space-y-3">
                {order.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet" />
                    <div>
                      <p className="text-xs text-foreground">{t.t}</p>
                      <p className="text-[10px] text-muted-foreground"><LocalTime at={t.at} /></p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${SUPPORT_PHONE}`} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs font-medium text-foreground">
                <Phone size={14} /> Call admin
              </a>
              <Link to="/support" className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs font-medium text-foreground">
                <MessageSquare size={14} /> Chat admin
              </Link>
            </div>
          </>
        )}
      </div>
    </MobileFrame>
  );
}

function CopyBtn({ value, light }: { value: string; light?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setDone(true);
        toast.success("Copied");
        setTimeout(() => setDone(false), 1500);
      }}
      className={`rounded-full p-1.5 ${light ? "bg-white/15 text-white" : "bg-secondary text-foreground"}`}
      aria-label="Copy"
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function AcctRow({ k, v, copy }: { k: string; v: string; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="flex items-center gap-2 text-sm font-medium text-foreground tabular">
        {v}
        {copy && <CopyBtn value={v} />}
      </span>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs">{k}</span>
      {children}
    </div>
  );
}

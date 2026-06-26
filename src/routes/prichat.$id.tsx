import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Send, Lock, Flag, Upload, CheckCircle2, AlertTriangle, Copy, Phone, MessageCircle, Clock, TimerReset } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { AgroBadge } from "@/components/ui/agro-badge";
import {
  useFarmRemit, advance, uploadReceipt, sendMessage,
  statusLabel, statusTone,
} from "@/lib/farmremit";
import { toast } from "sonner";

export const Route = createFileRoute("/prichat/$id")({ component: OrderRoom });



const trackerSteps = [
  {
    key: "init",
    title: "Bank Transfer via GoPay",
    desc: "Order opened with AgroVest. Escrow initialized.",
  },
  {
    key: "account",
    title: "One-time account issued",
    desc: "Unique AgroVest Bank NUBAN generated for this order.",
  },
  {
    key: "paid",
    title: "I've made the transfer",
    desc: "You confirm payment was sent from your bank app.",
  },
  {
    key: "confirmed",
    title: "Admin confirms receipt",
    desc: "AgroVest verifies funds and credits cUSD to your AssetVault.",
  },
] as const;

function trackerIndex(status: string): number {
  if (status === "confirmed") return 4;
  if (status === "admin_review" || status === "receipt_uploaded") return 3;
  if (status === "awaiting_payment") return 2;
  return 1;
}

function OrderRoom() {
  const { id } = Route.useParams();
  const order = useFarmRemit((s) => s.orders.find((o) => o.id === id));
  const [msg, setMsg] = useState("");

  if (!order) {
    return (
      <MobileFrame>
        <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-6">
          Order not found.
        </div>
      </MobileFrame>
    );
  }

  const ngn = order.amountUsd * order.rate;

  function send() {
    if (!msg.trim()) return;
    sendMessage(order!.id, msg);
    setMsg("");
  }

  return (
    <MobileFrame>
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-border">
        <Link to="/prichat" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy truncate">
            Buy ${order.amountUsd.toLocaleString()} cUSD
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Lock size={10} /> AgroVest · {order.reference ?? order.id.replace("fr_", "#")}
          </p>
        </div>
        <AgroBadge tone={statusTone[order.status]} size="xs">{statusLabel[order.status]}</AgroBadge>
        <a
          href="tel:+2348000000000"
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-agro"
          aria-label="Call AgroVest admin"
        >
          <Phone size={14} />
        </a>
        <button
          onClick={() => { advance(order.id, "disputed", "User opened a dispute."); toast.warning("Dispute opened. AgroVest review queued."); }}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-warn"
          aria-label="Open dispute"
        >
          <Flag size={14} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {/* Step-by-step tracker */}
        <ol className="rounded-3xl border border-border bg-card p-4">
          {trackerSteps.map((step, i) => {
            const reached = trackerIndex(order.status) > i;
            const active = trackerIndex(order.status) === i + 1 && order.status !== "confirmed";
            const isLast = i === trackerSteps.length - 1;
            return (
              <li key={step.key} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ring-4 ${
                      reached
                        ? "bg-agro text-white ring-agro/15"
                        : active
                          ? "bg-violet text-white ring-violet/20"
                          : "bg-secondary text-muted-foreground ring-transparent"
                    }`}
                  >
                    {reached ? <CheckCircle2 size={15} /> : i + 1}
                  </span>
                  {!isLast && (
                    <span
                      className={`w-0.5 flex-1 my-1 ${reached ? "bg-agro" : "bg-border"}`}
                    />
                  )}
                </div>
                <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
                  <p className={`text-sm font-semibold ${active || reached ? "text-navy" : "text-muted-foreground"}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.desc}</p>
                  {active && (
                    <AgroBadge tone="violet" size="xs" className="mt-1.5">In progress</AgroBadge>
                  )}
                </div>
              </li>
            );
          })}
        </ol>




        {/* Settlement card */}
        <section className="rounded-3xl border border-border bg-card p-4 space-y-2 text-sm">
          <Row k="Amount" v={`$${order.amountUsd.toLocaleString()} cUSD`} bold />
          <Row k="In Naira" v={`₦${ngn.toLocaleString()}`} />
          <Row k="Rate" v={`₦${order.rate}/USD`} />
          {order.reference && <Row k="Reference" v={order.reference} copy />}
          {order.purpose && <Row k="Funds" v={order.purpose.assetName} />}
        </section>

        {/* One-time AgroVest Bank account */}
        {order.virtualAccount && (
          <ExpiringAccountCard
            ngn={ngn}
            account={order.virtualAccount}
            settled={order.status === "confirmed" || order.status === "admin_review" || order.status === "receipt_uploaded"}
          />
        )}

        {/* Action by status */}
        {order.status === "awaiting_payment" && (
          <section className="rounded-3xl border border-violet/20 bg-violet-soft/40 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-navy">Done with the transfer?</h3>
            <p className="text-xs text-muted-foreground">
              After sending <b>₦{ngn.toLocaleString()}</b> to the one-time AgroVest Bank
              account above, tap below. AgroVest admin will verify the receipt and credit
              cUSD to your AssetVault.
            </p>
            <button
              onClick={() => {
                uploadReceipt(order.id, "mock://receipt.pdf");
                toast.success("Marked as paid — awaiting AgroVest admin confirmation");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet text-white py-3 text-sm font-semibold"
            >
              <CheckCircle2 size={16} /> I've made the transfer
            </button>
            <button
              onClick={() => {
                uploadReceipt(order.id, "mock://receipt.pdf");
                toast.success("Receipt uploaded — awaiting AgroVest confirmation");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-violet/30 bg-card py-2.5 text-xs font-medium text-navy"
            >
              <Upload size={13} /> Upload payment receipt (optional)
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:+2348000000000"
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary py-2.5 text-xs font-medium text-navy"
              >
                <Phone size={13} /> Call admin
              </a>
              <button
                onClick={() => document.getElementById("gopay-chat-input")?.focus()}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-secondary py-2.5 text-xs font-medium text-navy"
              >
                <MessageCircle size={13} /> Chat admin
              </button>
            </div>
          </section>
        )}

        {order.status === "admin_review" && (
          <section className="rounded-3xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-navy">AgroVest is verifying your receipt</h3>
            <p className="text-xs text-muted-foreground">
              Typical confirmation takes 5–30 minutes during banking hours. You'll get a notification
              the moment cUSD is credited to your AssetVault.
            </p>
            <AgroButton
              size="md"
              onClick={() => {
                advance(
                  order.id,
                  "confirmed",
                  `Receipt confirmed by AgroVest · ${order.amountUsd} cUSD credited to your AssetVault${order.purpose ? ` and applied to ${order.purpose.assetName}` : ""}.`,
                );
                toast.success("Receipt confirmed");
              }}
            >
              Simulate admin confirmation
            </AgroButton>
          </section>
        )}

        {order.status === "confirmed" && (
          <section className="rounded-3xl border border-agro/20 bg-agro-soft/40 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <CheckCircle2 size={14} className="text-agro" /> Settled
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {order.amountUsd} cUSD credited to your AssetVault
              {order.purpose ? ` and applied to ${order.purpose.assetName}.` : "."}
            </p>
          </section>
        )}

        {order.status === "disputed" && (
          <section className="rounded-3xl border border-destructive/30 bg-destructive/10 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <AlertTriangle size={14} className="text-destructive" /> Dispute under review
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              AgroVest support will reach out in this thread. Funds remain in escrow until resolved.
            </p>
          </section>
        )}

        {/* Chat */}
        <section>
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Conversation with AgroVest</h3>
          <div className="space-y-2">
            {order.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.who === "me"
                    ? "ml-auto gradient-violet text-white rounded-br-md"
                    : m.who === "system"
                      ? "mx-auto bg-violet-soft text-navy text-xs text-center"
                      : "bg-card border border-border text-navy rounded-bl-md"
                }`}
              >
                {m.t}
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2">
        <input
          id="gopay-chat-input"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={order.status === "confirmed" ? "Order closed — message AgroVest" : "Message AgroVest support"}
          className="flex-1 h-11 rounded-full border border-input bg-card px-4 text-sm outline-none focus:border-violet"
        />
        <button onClick={send} className="h-11 w-11 rounded-full gradient-violet text-white flex items-center justify-center shadow-glow">
          <Send size={16} />
        </button>
      </div>
    </MobileFrame>
  );
}

function Row({ k, v, bold, copy }: { k: string; v: string; bold?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{k}</span>
      <div className="flex items-center gap-1.5">
        <span className={`tabular text-right ${bold ? "font-semibold text-navy" : "text-navy text-sm"}`}>{v}</span>
        {copy && (
          <button
            onClick={() => { navigator.clipboard?.writeText(v); toast.success("Copied"); }}
            className="text-muted-foreground hover:text-violet"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

type VAccount = { bank: string; accountNumber: string; accountName: string; expiresAt: number };

function ExpiringAccountCard({ ngn, account, settled }: { ngn: number; account: VAccount; settled: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalMs = Math.max(0, account.expiresAt - now);
  const expired = totalMs <= 0 && !settled;
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const mmss = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const urgent = totalMs > 0 && totalMs < 5 * 60_000;

  const tone = settled ? "agro" : expired ? "danger" : urgent ? "amber" : "violet";
  const expiresLabel = new Date(account.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section
      className={`rounded-3xl border bg-card p-4 space-y-3 ${
        expired ? "border-destructive/40" : urgent ? "border-warn/40" : "border-violet/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy">One-time account number</h3>
        <AgroBadge tone={tone as never} size="xs">
          {settled ? "Used" : expired ? "Expired" : "Single use"}
        </AgroBadge>
      </div>

      {/* Countdown */}
      <div
        className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${
          settled
            ? "bg-agro-soft/40"
            : expired
              ? "bg-destructive/10"
              : urgent
                ? "bg-warn/10"
                : "bg-violet-soft/40"
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-navy">
          <Clock size={14} className={expired ? "text-destructive" : urgent ? "text-warn" : "text-violet"} />
          <span className="font-medium">
            {settled ? "Account closed — payment received" : expired ? "Account expired" : "Expires in"}
          </span>
        </div>
        {!settled && !expired && (
          <span className={`tabular text-base font-bold ${urgent ? "text-warn" : "text-violet"}`}>
            {mmss}
          </span>
        )}
        {expired && (
          <span className="text-[11px] font-semibold text-destructive">at {expiresLabel}</span>
        )}
      </div>

      {expired ? (
        <p className="text-[11px] text-destructive">
          This one-time account is no longer valid. Don't send funds to it. Generate a new account to
          continue — your order stays open.
        </p>
      ) : settled ? (
        <p className="text-[11px] text-muted-foreground">
          AgroVest has detected the transfer. The account is now closed; no further deposits will be accepted.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Transfer <b>₦{ngn.toLocaleString()}</b> to this AgroVest Bank account before it auto-expires
          at <b>{expiresLabel}</b>. It's unique to this order and closes after settlement or expiry.
        </p>
      )}

      <div className={`rounded-2xl bg-secondary p-3 space-y-2 ${expired ? "opacity-60" : ""}`}>
        <Row k="Bank" v={account.bank} />
        <Row k="Account number" v={account.accountNumber} bold copy />
        <Row k="Account name" v={account.accountName} />
        <Row k="Expires" v={expiresLabel} />
      </div>

      {expired && (
        <button
          onClick={() => toast.success("Requested a fresh one-time account. AgroVest is generating it now.")}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet text-white py-2.5 text-xs font-semibold"
        >
          <TimerReset size={14} /> Request new account
        </button>
      )}
    </section>
  );
}

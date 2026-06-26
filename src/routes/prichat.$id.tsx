import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Send, Lock, Flag, Upload, CheckCircle2, AlertTriangle, Copy, Phone, MessageCircle } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { AgroBadge } from "@/components/ui/agro-badge";
import {
  useFarmRemit, advance, uploadReceipt, sendMessage,
  statusLabel, statusTone,
} from "@/lib/farmremit";
import { toast } from "sonner";

export const Route = createFileRoute("/prichat/$id")({ component: OrderRoom });

const stages = ["awaiting_payment", "receipt_uploaded", "admin_review", "confirmed"] as const;

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

  const stepIdx = Math.max(0, stages.indexOf(order.status as typeof stages[number]));
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
        <button
          onClick={() => { advance(order.id, "disputed", "User opened a dispute."); toast.warning("Dispute opened. AgroVest review queued."); }}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-warn"
        >
          <Flag size={14} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {/* Stepper */}
        <ol className="rounded-3xl border border-border bg-card p-3">
          {stages.map((st, i) => {
            const done = i < stepIdx || order.status === "confirmed";
            const active = i === stepIdx && order.status !== "confirmed";
            return (
              <li key={st} className="flex items-center gap-3 py-1.5">
                <span className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold ${
                  done ? "bg-agro text-white" : active ? "bg-violet text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 size={14} /> : i + 1}
                </span>
                <span className={`text-sm ${active ? "text-navy font-semibold" : "text-muted-foreground"}`}>
                  {statusLabel[st]}
                </span>
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
          <section className="rounded-3xl border border-violet/30 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">One-time account number</h3>
              <AgroBadge tone="violet" size="xs">Single use</AgroBadge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Transfer <b>₦{ngn.toLocaleString()}</b> to this AgroVest Bank account.
              It's unique to this order and closes after settlement or expiry.
            </p>
            <div className="rounded-2xl bg-secondary p-3 space-y-2">
              <Row k="Bank" v={order.virtualAccount.bank} />
              <Row k="Account number" v={order.virtualAccount.accountNumber} bold copy />
              <Row k="Account name" v={order.virtualAccount.accountName} />
              <Row
                k="Expires"
                v={new Date(order.virtualAccount.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              />
            </div>
          </section>
        )}

        {/* Action by status */}
        {order.status === "awaiting_payment" && (
          <section className="rounded-3xl border border-violet/20 bg-violet-soft/40 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-navy">Confirm your transfer</h3>
            <p className="text-xs text-muted-foreground">
              Send <b>₦{ngn.toLocaleString()}</b> to AgroVest with reference <b>{order.reference}</b>.
              Upload your receipt below — AgroVest admin verifies it before crediting cUSD to your AssetVault.
            </p>
            <button
              onClick={() => {
                uploadReceipt(order.id, "mock://receipt.pdf");
                toast.success("Receipt uploaded — awaiting AgroVest confirmation");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet text-white py-3 text-sm font-medium"
            >
              <Upload size={14} /> Upload payment receipt
            </button>
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

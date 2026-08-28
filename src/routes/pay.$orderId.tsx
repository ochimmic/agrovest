import { LocalTime } from "@/components/ui/local-time";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, MessageSquare, Phone } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroBadge } from "@/components/ui/agro-badge";
import { Money } from "@/components/ui/money";
import { txUrl, type NetworkId } from "@/lib/wallet/chain";
import { payStatusLabel, payStatusTone, usePayments } from "@/lib/payments";

export const Route = createFileRoute("/pay/$orderId")({
  head: () => ({
    meta: [
      { title: "Payment status | AgroVest" },
      { name: "description", content: "Track your AgroVest payment from on-chain transfer through manual admin confirmation." },
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

  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
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
                <span className="text-xs uppercase tracking-widest text-white/60">{order.reference}</span>
                <AgroBadge size="xs" tone={payStatusTone[order.status]}>{payStatusLabel[order.status]}</AgroBadge>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular">${order.amountUsd.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-white/70">
                {order.purpose.qty} × {order.purpose.unit} · {order.purpose.assetName}
              </p>
              <p className="mt-2 text-[11px] text-white/60">Paid in {order.token}</p>
            </section>

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
                    href={txUrl((order.network ?? "bsc-testnet") as NetworkId, order.txHash)}
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
              <a href="tel:+2348000000000" className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs font-medium text-foreground">
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

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs">{k}</span>
      {children}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MessageCircle, Receipt } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { usePayments, payStatusLabel } from "@/lib/payments";
import { fmtNgn, useFxRate } from "@/lib/fx";
import { LocalTime } from "@/components/ui/local-time";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My orders & payment chat — AgroVest" }] }),
  component: Orders,
});

function Orders() {
  useFxRate();
  const orders = usePayments((s) => s.orders);
  const loaded = usePayments((s) => s.loaded);
  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <section>
          <h1 className="text-2xl font-semibold text-navy">My orders</h1>
          <p className="text-xs text-muted-foreground">Open any order to send a receipt or chat with AgroVest about it.</p>
        </section>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center">
            <Receipt className="mx-auto text-violet" size={20} />
            <p className="mt-2 text-sm font-medium text-navy">No orders yet</p>
            <p className="text-[11px] text-muted-foreground">When you buy a farm plot or house, its payment ticket shows here.</p>
            <Link to="/invest/farmvest" className="mt-3 inline-block text-xs font-medium text-violet">Explore FarmVest</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link to="/pay/$orderId" params={{ orderId: o.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-soft text-violet"><MessageCircle size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{o.purpose.assetName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{o.reference} · <LocalTime at={o.createdAt} /></p>
                    <p className="text-[10px] text-violet">{payStatusLabel[o.status]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy tabular">${o.amountUsd.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground tabular">{fmtNgn(o.amountUsd)}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

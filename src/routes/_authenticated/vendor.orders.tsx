import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/_authenticated/_authenticated/vendor/orders")({ component: Orders });
function Orders() {
  const orders = [
    { id: "o1", buyer: "Jane M.", item: "Lekki Residence", total: 145000, status: "Processing" },
    { id: "o2", buyer: "Olu K.", item: "Toyota Camry 2022", total: 28500, status: "Pending payment" },
  ];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vendor" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Orders</h1>
      </header>
      <div className="p-4 space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-card border border-border p-3">
            <div className="flex justify-between">
              <p className="text-sm font-medium text-navy">{o.item}</p>
              <span className="text-xs text-violet">{o.status}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{o.buyer} · ${o.total.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

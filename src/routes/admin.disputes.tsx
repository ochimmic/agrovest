import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/admin/disputes")({ component: Page });
function Page() {
  const items = [
    { name: "Order #o1 — Lekki Residence", meta: "Buyer escalated", state: "Open" },
    { name: "Order #o5 — Camry 2022", meta: "Refund requested", state: "Resolved" },
  ];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/admin" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Disputes</h1>
      </header>
      <div className="p-4 space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-3 flex justify-between">
            <div>
              <p className="text-sm font-medium text-navy">{it.name}</p>
              <p className="text-[11px] text-muted-foreground">{it.meta}</p>
            </div>
            <span className="rounded-full bg-warn/15 text-warn text-[10px] px-2 py-0.5 h-fit">{it.state}</span>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

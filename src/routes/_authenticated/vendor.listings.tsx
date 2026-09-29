import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { properties } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/_authenticated/vendor/listings")({ component: Listings });
function Listings() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vendor" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">My listings</h1>
      </header>
      <div className="p-4 space-y-2">
        {properties.map((p) => (
          <div key={p.id} className="rounded-2xl bg-card border border-border p-3 flex justify-between">
            <div>
              <p className="text-sm font-medium text-navy">{p.title}</p>
              <p className="text-[11px] text-muted-foreground">${p.price.toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-agro-soft px-2 py-0.5 text-[10px] text-agro h-fit">Active</span>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

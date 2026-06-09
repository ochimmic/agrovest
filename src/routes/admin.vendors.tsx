import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

function adminList(items: { name: string; meta: string; state: string }[], title: string) {
  return function Page() {
    return (
      <MobileFrame>
        <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link to="/admin" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
          <h1 className="font-semibold text-navy">{title}</h1>
        </header>
        <div className="p-4 space-y-2">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-3 flex justify-between">
              <div>
                <p className="text-sm font-medium text-navy">{it.name}</p>
                <p className="text-[11px] text-muted-foreground">{it.meta}</p>
              </div>
              <span className="rounded-full bg-violet-soft text-violet text-[10px] px-2 py-0.5 h-fit">{it.state}</span>
            </div>
          ))}
        </div>
      </MobileFrame>
    );
  };
}

export const Route = createFileRoute("/admin/vendors")({
  component: adminList(
    [
      { name: "GoldHaven Realty", meta: "Real estate", state: "Under review" },
      { name: "PrimeAuto", meta: "Automobile", state: "Approved" },
      { name: "Aurum Living", meta: "Household", state: "More info" },
    ],
    "Vendor approvals"
  ),
});

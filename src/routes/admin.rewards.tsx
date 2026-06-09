import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/admin/rewards")({ component: Page });
function Page() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/admin" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Broker reward approvals</h1>
      </header>
      <div className="p-4 space-y-2">
        {[{ b: "Broker BR-7421", t: "Land milestone", s: "Pending director" },
          { b: "Broker BR-9012", t: "Silver tier", s: "Issued" }].map((x, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-3 flex justify-between">
            <div>
              <p className="text-sm font-medium text-navy">{x.b}</p>
              <p className="text-[11px] text-muted-foreground">{x.t}</p>
            </div>
            <span className="rounded-full bg-violet-soft text-violet text-[10px] px-2 py-0.5 h-fit">{x.s}</span>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

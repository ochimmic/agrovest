import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/admin/partners")({ component: Page });
function Page() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/admin" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Partner approvals</h1>
      </header>
      <div className="p-4 space-y-2">
        {[{ n: "Adaeze O.", m: "Investor · $42k volume", s: "Pending review" },
          { n: "Tunde A.", m: "Broker · 38 verified", s: "Director approval" }].map((x, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-3 flex justify-between">
            <div>
              <p className="text-sm font-medium text-navy">{x.n}</p>
              <p className="text-[11px] text-muted-foreground">{x.m}</p>
            </div>
            <span className="rounded-full bg-violet-soft text-violet text-[10px] px-2 py-0.5 h-fit">{x.s}</span>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

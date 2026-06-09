import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/explore")({ component: Explore });
function Explore() {
  const lessons = [
    { t: "How AgroVest ownership works", s: "Custody receipts, contracts & on-chain proof" },
    { t: "Understanding $CLYST on BSC", s: "Non-custodial wallets, swaps, fees" },
    { t: "FarmVest yield & appreciation", s: "Reading projections responsibly" },
    { t: "Privacy with PriChat", s: "What stays, what auto-deletes" },
  ];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/home" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Learn</h1>
      </header>
      <div className="p-4 space-y-2">
        {lessons.map((l) => (
          <div key={l.t} className="flex gap-3 rounded-2xl bg-card border border-border p-4">
            <span className="h-10 w-10 rounded-xl bg-violet-soft text-violet flex items-center justify-center"><GraduationCap size={16} /></span>
            <div>
              <p className="text-sm font-semibold text-navy">{l.t}</p>
              <p className="text-[11px] text-muted-foreground">{l.s}</p>
            </div>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

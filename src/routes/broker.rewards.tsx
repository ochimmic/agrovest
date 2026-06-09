import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/broker/rewards")({ component: Rewards });
function Rewards() {
  const tiers = [
    { t: "Bronze", req: "5 verified leads", done: true },
    { t: "Silver", req: "15 verified · $5k volume", done: true },
    { t: "Gold", req: "40 verified · $25k", done: false },
    { t: "Land Reward", req: "100 verified · $100k", done: false },
    { t: "Car Reward", req: "Director approval", done: false },
  ];
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/broker" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Reward progress</h1>
      </header>
      <div className="p-4 space-y-2">
        {tiers.map((x) => (
          <div key={x.t} className={`rounded-2xl border p-4 ${x.done ? "border-agro/30 bg-agro-soft/40" : "border-border bg-card"}`}>
            <div className="flex justify-between">
              <p className="font-semibold text-navy">{x.t}</p>
              <span className={`text-xs ${x.done ? "text-agro" : "text-muted-foreground"}`}>{x.done ? "Unlocked" : "Locked"}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{x.req}</p>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { BROKER_TIERS, EMERGENCY_WITHDRAWAL_FEE_PCT } from "@/lib/broker-tiers";
import { BROKER_PROPERTY_COMMISSION_PCT } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/broker/rewards")({
  head: () => ({
    meta: [
      { title: "Broker tiers & rewards | AgroVest" },
      { name: "description", content: "Bronze to Platinum broker tiers, commissions and withdrawal rules." },
      { property: "og:title", content: "Broker tiers & rewards | AgroVest" },
      { property: "og:description", content: "Earn 5% plus land, cars and partnership as an AgroVest broker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/broker" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-foreground">Tiers & rewards</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {BROKER_TIERS.map((x) => (
          <div key={x.name} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between gap-2">
              <p className="font-semibold text-foreground">{x.name}</p>
              <span className="text-xs text-muted-foreground text-right">{x.range}</span>
            </div>
            <p className="text-[12px] text-agro mt-1">{x.reward}</p>
          </div>
        ))}
        <div className="rounded-2xl bg-secondary p-3 text-[11px] text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Withdrawal rules</p>
          <p>• Free withdrawal once your tier milestone is reached: 11.5 plots, 11.5 acres, 23.5 hectares or 100 hectares.</p>
          <p>• Before the milestone it counts as an emergency withdrawal and {EMERGENCY_WITHDRAWAL_FEE_PCT}% of the current reward is deducted.</p>
          <p>• Paid within 24 hours to your bank account or BEP-20 wallet.</p>
          <p>• Buy Assets referrals earn {BROKER_PROPERTY_COMMISSION_PCT}% of the property price.</p>
        </div>
      </div>
    </MobileFrame>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/apply")({ component: Apply });

function Apply() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vendor" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Vendor application</h1>
      </header>
      <div className="flex-1 p-5 space-y-3">
        {["Business name", "Category", "Country", "Proof of ownership (file)", "Payout wallet"].map((l) => (
          <label key={l} className="block">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</span>
            <input className="mt-1 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet" />
          </label>
        ))}
        <label className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
          <input type="checkbox" className="mt-0.5 accent-violet" /> I accept the Vendor Terms, Dispute & Refund Policy.
        </label>
      </div>
      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" onClick={() => toast.success("Application submitted")}>Submit application</AgroButton>
      </div>
    </MobileFrame>
  );
}

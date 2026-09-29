import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { AgroButton } from "@/components/ui/agro-button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/support/dispute")({ component: Dispute });
function Dispute() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/support" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Open a dispute</h1>
      </header>
      <div className="flex-1 p-5 space-y-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Order / asset reference</span>
          <input className="mt-1 h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm outline-none focus:border-violet" placeholder="Order #" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Describe the issue</span>
          <textarea rows={5} className="mt-1 w-full rounded-2xl border border-input bg-card p-3 text-sm outline-none focus:border-violet" />
        </label>
      </div>
      <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AgroButton size="xl" onClick={() => toast.success("Dispute submitted")}>Submit dispute</AgroButton>
      </div>
    </MobileFrame>
  );
}

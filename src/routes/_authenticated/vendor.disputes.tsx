import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/shell/MobileFrame";

export const Route = createFileRoute("/_authenticated/vendor/disputes")({ component: Disputes });
function Disputes() {
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vendor" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">←</Link>
        <h1 className="font-semibold text-navy">Disputes & refunds</h1>
      </header>
      <div className="p-6 text-center text-sm text-muted-foreground">
        No open disputes. All clear.
      </div>
    </MobileFrame>
  );
}

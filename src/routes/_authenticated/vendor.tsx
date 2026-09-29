import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Package, AlertTriangle, Wallet } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/_authenticated/_authenticated/vendor")({ component: Vendor });

function Vendor() {
  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <section className="rounded-3xl gradient-violet p-5 text-white shadow-pop">
          <p className="text-xs uppercase tracking-widest text-white/80">Vendor</p>
          <p className="mt-2 text-lg font-semibold">Verification: Pending review</p>
          <Link to="/vendor/apply" className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs">
            Complete application →
          </Link>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Tile to="/vendor/listings" icon={Package} label="Listings" sub="3 active" />
          <Tile to="/vendor/orders" icon={Plus} label="Orders" sub="2 new" />
          <Tile to="/vendor/disputes" icon={AlertTriangle} label="Disputes" sub="0 open" />
          <Tile to="/vault" icon={Wallet} label="Payouts" sub="$1,240" />
        </div>
      </div>
    </AppShell>
  );
}
function Tile({ to, icon: I, label, sub }: any) {
  return (
    <Link to={to} className="rounded-3xl bg-card border border-border p-4 shadow-card">
      <I size={18} className="text-violet" />
      <p className="mt-2 text-sm font-semibold text-navy">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </Link>
  );
}

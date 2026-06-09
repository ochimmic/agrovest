import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone, Send, Store } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/services")({ component: Services });

function Services() {
  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <h1 className="text-2xl font-semibold text-navy">Services</h1>
        <Link to="/services/mp" className="block rounded-3xl gradient-navy p-5 text-white shadow-pop">
          <Megaphone size={20} />
          <p className="mt-2 text-lg font-semibold">M&P Consult</p>
          <p className="text-xs text-white/70">Marketing & Promotion experts, certified by AgroVest.</p>
        </Link>
        <div className="rounded-3xl border border-border bg-card p-5">
          <Send size={18} className="text-violet" />
          <p className="mt-2 font-semibold text-navy">FarmRemit</p>
          <p className="text-xs text-muted-foreground">Cross-border remittance for agribusiness — coming soon.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 opacity-75">
          <Store size={18} className="text-agro" />
          <p className="mt-2 font-semibold text-navy">Marketplace</p>
          <p className="text-xs text-muted-foreground">A later phase. AgroVest stays focused on real-world assets.</p>
        </div>
      </div>
    </AppShell>
  );
}

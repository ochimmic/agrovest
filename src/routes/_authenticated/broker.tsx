import { createFileRoute, Link } from "@tanstack/react-router";
import { Share2, Copy, TrendingUp, Award } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useAppState } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_authenticated/broker")({ component: Broker });

const tag: Record<string, string> = {
  invited: "bg-secondary text-secondary-foreground",
  kyc: "bg-violet-soft text-violet",
  verified: "bg-agro-soft text-agro",
  pending: "bg-warn/15 text-warn",
  completed: "bg-primary text-primary-foreground",
};

function Broker() {
  const leads = useAppState((s) => s.leads);
  const code = "AGRO-BR-7421";
  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <section className="rounded-3xl gradient-agro p-5 text-white shadow-pop">
          <p className="text-xs uppercase tracking-widest text-white/80">Broker rewards</p>
          <p className="mt-2 text-3xl font-semibold tabular">$1,840</p>
          <p className="text-xs text-white/80">Commission this quarter</p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-2">
            <code className="flex-1 text-xs">{code}</code>
            <button onClick={() => { navigator.clipboard?.writeText(code); toast.success("Code copied"); }} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Copy size={14} /></button>
            <button className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Share2 size={14} /></button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-3">
            <TrendingUp size={14} className="text-violet" />
            <p className="mt-1 text-xs text-muted-foreground">Leads</p>
            <p className="text-lg font-semibold text-navy">{leads.length}</p>
          </div>
          <Link to="/broker/rewards" className="rounded-2xl bg-card border border-border p-3">
            <Award size={14} className="text-agro" />
            <p className="mt-1 text-xs text-muted-foreground">Reward tier</p>
            <p className="text-lg font-semibold text-navy">Silver</p>
          </Link>
        </div>

        <section>
          <h2 className="text-sm font-semibold text-navy mb-2">Lead activity</h2>
          <ul className="space-y-2">
            {leads.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-2xl bg-card border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-navy">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground">Lead · {l.id}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tag[l.status]}`}>{l.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <Link to="/broker/rewards" className="block rounded-3xl gradient-navy p-4 text-white">
          <p className="text-xs uppercase tracking-widest text-white/60">Reward progress</p>
          <p className="mt-1 font-semibold">Land/Car program</p>
          <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full gradient-agro" style={{ width: "42%" }} />
          </div>
          <p className="mt-1 text-[10px] text-white/70">42% to next milestone · Director approval pending</p>
        </Link>
      </div>
    </AppShell>
  );
}

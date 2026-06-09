import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownUp, Copy, ShieldCheck, History, ArrowRight, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { AgroButton } from "@/components/ui/agro-button";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/vault")({ component: Vault });

function Vault() {
  const wallet = useAppState((s) => s.wallet);
  const txs = useAppState((s) => s.txs);

  if (!wallet) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <div className="rounded-3xl gradient-navy p-6 text-white shadow-pop">
            <h1 className="text-xl font-semibold">AssetVault</h1>
            <p className="mt-1 text-sm text-white/70">Set up your non-custodial wallet to invest, swap, and store $CLYST.</p>
            <AgroButton size="lg" variant="agro" className="mt-4" asChild>
              <Link to="/wallet/intro"><Plus size={16} /> Set up wallet</Link>
            </AgroButton>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-3 space-y-4">
        <section className="rounded-3xl gradient-navy p-5 text-white shadow-pop relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-violet/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-white/60">AssetVault</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">Binance Smart Chain</span>
            </div>
            <p className="mt-3 text-[34px] font-semibold tabular">{wallet.clyst.toLocaleString()} <span className="text-white/60 text-base">$CLYST</span></p>
            <p className="text-xs text-white/60">≈ ${(wallet.clyst * 0.42).toFixed(2)}</p>
            <div className="mt-4 flex items-center gap-2">
              <code className="text-[11px] text-white/70 truncate">{wallet.address}</code>
              <button className="text-white/70"><Copy size={12} /></button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Action label="Swap" Icon={ArrowDownUp} to="/wallet/swap" />
              <Action label="History" Icon={History} to="/wallet/history" />
              <Action label="Safety" Icon={ShieldCheck} to="/wallet/security" />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-navy">Recent activity</h2>
            <Link to="/wallet/history" className="text-xs text-violet">All</Link>
          </div>
          {txs.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-6 text-center text-xs text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <ul className="space-y-2">
              {txs.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
                  <span className="h-9 w-9 rounded-xl bg-violet-soft text-violet flex items-center justify-center text-xs font-bold">
                    {t.type[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy capitalize">{t.type} {t.meta && `· ${t.meta}`}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(t.date).toLocaleString()}</p>
                  </div>
                  <span className="tabular text-sm font-semibold text-navy">${t.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Action({ label, Icon, to }: { label: string; Icon: any; to: string }) {
  return (
    <Link to={to as any} className="rounded-2xl bg-white/10 px-3 py-2.5 text-white text-xs font-medium flex flex-col items-center gap-1 hover:bg-white/15 transition">
      <Icon size={16} />
      {label}
    </Link>
  );
}

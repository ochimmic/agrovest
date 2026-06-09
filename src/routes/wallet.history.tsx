import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MobileFrame } from "@/components/shell/MobileFrame";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/wallet/history")({ component: History });

function History() {
  const txs = useAppState((s) => s.txs);
  return (
    <MobileFrame>
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link to="/vault" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-semibold text-navy">Transactions</h1>
      </header>
      <div className="p-4">
        {txs.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {txs.map((t) => (
              <li key={t.id} className="rounded-2xl bg-card border border-border p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy capitalize">{t.type}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(t.date).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy tabular">${t.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-agro">{t.status}</p>
                  </div>
                </div>
                {t.hash && <p className="mt-1 text-[10px] text-muted-foreground truncate">tx: {t.hash}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileFrame>
  );
}
